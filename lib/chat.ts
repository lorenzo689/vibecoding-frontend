import { FunctionsHttpError, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";
import { ChatError, type ChatCourse, type ChatExchange, type ChatMessage, type ChatRequest, type Conversation } from "./chatProtocol";

export async function loadCourses(client: SupabaseClient<Database>): Promise<ChatCourse[]> {
  const { data, error } = await client.from("courses").select("id, title").order("title");
  if (error) throw new ChatError("LOAD_FAILED");
  return data ?? [];
}

export async function loadConversations(client: SupabaseClient<Database>, courseId: string): Promise<Conversation[]> {
  const { data, error } = await client.from("chat_conversations")
    .select("id, course_id, title, updated_at").eq("course_id", courseId)
    .order("updated_at", { ascending: false });
  if (error) throw new ChatError("LOAD_FAILED");
  return data ?? [];
}

export async function hasIndexedMaterial(client: SupabaseClient<Database>, courseId: string): Promise<boolean> {
  const { data, error } = await client.from("source_documents")
    .select("id, materials!source_documents_material_id_fkey!inner(course_id)")
    .eq("materials.course_id", courseId).eq("indexing_status", "ready").limit(1);
  if (error) throw new ChatError("LOAD_FAILED");
  return Boolean(data?.length);
}

export async function createConversation(client: SupabaseClient<Database>, courseId: string): Promise<Conversation> {
  const { data, error } = await client.from("chat_conversations").insert({ course_id: courseId })
    .select("id, course_id, title, updated_at").single();
  if (error || !data) throw new ChatError("LOAD_FAILED");
  return data;
}

export async function loadHistory(client: SupabaseClient<Database>, conversationId: string): Promise<ChatMessage[]> {
  const messages: ChatMessage[] = [];
  // Explicit pagination avoids silently dropping history beyond the API row limit.
  for (let offset = 0; ; offset += 100) {
    const { data, error } = await client.from("chat_messages")
      .select("id, seq, role, content, request_id, chat_message_sources(citation_no, material_title, page_number, excerpt)")
      .eq("conversation_id", conversationId).order("seq").range(offset, offset + 99);
    if (error) throw new ChatError("LOAD_FAILED");
    messages.push(...(data ?? []) as ChatMessage[]);
    if (!data || data.length < 100) return messages;
  }
}

export async function sendChat(client: SupabaseClient<Database>, request: ChatRequest): Promise<ChatExchange> {
  // Use the signed-in user's JWT, never the public project key as Bearer token.
  const { data: { session }, error: sessionError } = await client.auth.getSession();
  if (sessionError || !session) throw new ChatError("UNAUTHENTICATED");
  let result;
  try {
    result = await client.functions.invoke<ChatExchange>("chat", {
      body: request,
      headers: { Authorization: `Bearer ${session.access_token}` },
      timeout: 150_000,
    });
  } catch {
    throw new ChatError("NETWORK_ERROR");
  }
  if (result.error instanceof FunctionsHttpError) {
    const response = result.error.context as Response;
    let failure;
    try { failure = await response.json(); } catch { /* Preserve unknown outcomes for retry. */ }
    throw new ChatError(
      failure?.error?.code ?? (response.status === 401 ? "UNAUTHENTICATED" : "CHAT_UNAVAILABLE"),
      failure?.error?.retry_after_seconds,
    );
  }
  if (result.error) throw new ChatError("NETWORK_ERROR");
  const exchange = result.data;
  if (!exchange || exchange.request_id !== request.request_id || exchange.conversation_id !== request.conversation_id
    || !Array.isArray(exchange.messages) || exchange.messages.length !== 2
    || exchange.messages[0].role !== "user" || exchange.messages[1].role !== "assistant"
    || !exchange.messages.every((message) => typeof message.id === "string" && typeof message.content === "string" && Number.isInteger(message.seq))
    || !Array.isArray(exchange.sources)
    || !exchange.sources.every((source) => source && Number.isInteger(source.citation_no)
      && typeof source.material_title === "string" && typeof source.excerpt === "string"
      && (source.page_number === null || Number.isInteger(source.page_number)))) throw new ChatError("INVALID_ANSWER_RESPONSE");
  return exchange;
}
