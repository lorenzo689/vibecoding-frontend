import { createClient } from "@/lib/supabase/browser";
import type { Tables } from "@/lib/supabase/database.types";

export type Conversation = {
  id: string;
  courseId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageStatus = "pending" | "streaming" | "completed" | "failed" | "cancelled";

export type MessageSource = {
  id: string;
  chunkId: string | null;
  rank: number;
  similarity: number;
  quotedExcerpt: string;
  pageNumber: number | null;
};

export type ChatMessageRecord = {
  id: string;
  role: "user" | "assistant";
  content: string;
  status: MessageStatus;
  errorCode: string | null;
  createdAt: string;
  sources: MessageSource[];
};

type ConversationRow = Pick<
  Tables<"chat_conversations">,
  "id" | "course_id" | "title" | "created_at" | "updated_at"
>;

function mapConversation(row: ConversationRow): Conversation {
  return {
    id: row.id,
    courseId: row.course_id,
    title: row.title,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listConversations(courseId: string): Promise<Conversation[]> {
  const { data, error } = await createClient()
    .from("chat_conversations")
    .select("id, course_id, title, created_at, updated_at")
    .eq("course_id", courseId)
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data.map(mapConversation);
}

export async function createConversation(
  courseId: string,
  title = "Neuer Chat"
): Promise<Conversation> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Nicht angemeldet.");

  const { data, error } = await supabase
    .from("chat_conversations")
    .insert({ owner_id: userData.user.id, course_id: courseId, title })
    .select("id, course_id, title, created_at, updated_at")
    .single();

  if (error) throw error;
  return mapConversation(data);
}

export async function renameConversation(id: string, title: string): Promise<void> {
  const { error } = await createClient()
    .from("chat_conversations")
    .update({ title })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteConversation(id: string): Promise<void> {
  const { error } = await createClient().from("chat_conversations").delete().eq("id", id);
  if (error) throw error;
}

type MessageRow = Pick<
  Tables<"chat_messages">,
  "id" | "role" | "content" | "status" | "error_code" | "created_at"
> & {
  chat_message_sources: Pick<
    Tables<"chat_message_sources">,
    "id" | "chunk_id" | "rank" | "similarity" | "quoted_excerpt" | "page_number"
  >[];
};

function mapMessage(row: MessageRow): ChatMessageRecord {
  return {
    id: row.id,
    role: row.role === "assistant" ? "assistant" : "user",
    content: row.content,
    status: row.status as MessageStatus,
    errorCode: row.error_code,
    createdAt: row.created_at,
    sources: [...row.chat_message_sources]
      .sort((a, b) => a.rank - b.rank)
      .map((source) => ({
        id: source.id,
        chunkId: source.chunk_id,
        rank: source.rank,
        similarity: source.similarity,
        quotedExcerpt: source.quoted_excerpt,
        pageNumber: source.page_number,
      })),
  };
}

export async function loadMessages(conversationId: string): Promise<ChatMessageRecord[]> {
  const { data, error } = await createClient()
    .from("chat_messages")
    .select(
      "id, role, content, status, error_code, created_at, " +
        "chat_message_sources!chat_message_sources_message_id_assistant_role_fkey(id, chunk_id, rank, similarity, quoted_excerpt, page_number)"
    )
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as unknown as MessageRow[]).map(mapMessage);
}
