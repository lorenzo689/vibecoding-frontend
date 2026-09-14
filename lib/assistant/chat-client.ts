import { createClient } from "@/lib/supabase/browser";
import { getSupabaseConfig } from "@/lib/supabase/config";

export type ChatStreamSource = {
  chunkId: string | null;
  fileId: string;
  rank: number;
  similarity: number;
  quotedExcerpt: string;
  pageNumber: number | null;
};

export type ChatStreamHandlers = {
  onReady?: (ids: { userMessageId: string; assistantMessageId: string }) => void;
  onDelta?: (text: string) => void;
  onSources?: (sources: ChatStreamSource[]) => void;
  onDone?: (usage: { messageId: string; inputTokens: number; outputTokens: number }) => void;
  onError?: (code: string) => void;
};

export class ChatRequestError extends Error {
  code: string;
  constructor(code: string) {
    super(code);
    this.code = code;
  }
}

type ReadyPayload = { userMessageId: string; assistantMessageId: string };
type DeltaPayload = { text: string };
type SourcesPayload = {
  sources: Array<{
    chunk_id: string | null;
    file_id: string;
    rank: number;
    similarity: number;
    quoted_excerpt: string;
    page_number: number | null;
  }>;
};
type DonePayload = { message_id: string; input_tokens: number; output_tokens: number };
type ErrorPayload = { code: string };

function dispatchEvent(type: string, data: string, handlers: ChatStreamHandlers) {
  if (!data) return;
  let parsed: unknown;
  try {
    parsed = JSON.parse(data);
  } catch {
    return;
  }
  if (type === "ready") {
    const payload = parsed as ReadyPayload;
    handlers.onReady?.(payload);
  } else if (type === "delta") {
    handlers.onDelta?.((parsed as DeltaPayload).text);
  } else if (type === "sources") {
    const payload = parsed as SourcesPayload;
    handlers.onSources?.(
      payload.sources.map((source) => ({
        chunkId: source.chunk_id,
        fileId: source.file_id,
        rank: source.rank,
        similarity: source.similarity,
        quotedExcerpt: source.quoted_excerpt,
        pageNumber: source.page_number,
      }))
    );
  } else if (type === "done") {
    const payload = parsed as DonePayload;
    handlers.onDone?.({
      messageId: payload.message_id,
      inputTokens: payload.input_tokens,
      outputTokens: payload.output_tokens,
    });
  } else if (type === "error") {
    handlers.onError?.((parsed as ErrorPayload).code);
  }
}

function parseSseBlock(block: string): { type: string; data: string } {
  let type = "message";
  const dataLines: string[] = [];
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) type = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  return { type, data: dataLines.join("\n") };
}

/**
 * Streams a question to the assistant-chat Edge Function and reports Server-Sent
 * Events through `handlers`. Throws ChatRequestError for failures that occur
 * before the stream starts (auth, validation, rate limiting at admission).
 */
export async function streamAssistantChat(
  input: { conversationId: string; courseId: string; message: string },
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  if (!accessToken) throw new ChatRequestError("UNAUTHENTICATED");

  const { url, publicKey } = getSupabaseConfig();
  let response: Response;
  try {
    response = await fetch(`${url}/functions/v1/assistant-chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
        apikey: publicKey,
      },
      body: JSON.stringify({
        conversation_id: input.conversationId,
        course_id: input.courseId,
        message: input.message,
      }),
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ChatRequestError("SERVICE_UNAVAILABLE");
  }

  if (!response.ok || !response.body) {
    let code = "SERVICE_UNAVAILABLE";
    try {
      const body = (await response.json()) as { error?: { code?: string } };
      if (body?.error?.code) code = body.error.code;
    } catch {
      // Keep the fallback code; the body was not JSON.
    }
    throw new ChatRequestError(code);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let separatorIndex = buffer.indexOf("\n\n");
    while (separatorIndex !== -1) {
      const block = buffer.slice(0, separatorIndex);
      buffer = buffer.slice(separatorIndex + 2);
      const { type, data } = parseSseBlock(block);
      dispatchEvent(type, data, handlers);
      separatorIndex = buffer.indexOf("\n\n");
    }
  }
}
