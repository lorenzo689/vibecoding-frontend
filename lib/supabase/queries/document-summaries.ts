import { createClient } from "@/lib/supabase/browser";
import type { ChatSource } from "@/lib/chatProtocol";

export type DocumentSummary = { id: string; title: string; content: string; updatedAt: string };

export async function getDocumentSummary(materialId: string): Promise<DocumentSummary | null> {
  const { data, error } = await createClient().from("document_summaries")
    .select("id,title,content,updated_at").eq("source_material_id", materialId).maybeSingle();
  if (error) throw error;
  return data ? { id: data.id, title: data.title, content: data.content, updatedAt: data.updated_at } : null;
}

export async function saveDocumentSummary(materialId: string, title: string, content: string, sources: ChatSource[]): Promise<string> {
  const { data, error } = await createClient().rpc("save_document_summary", {
    p_source_material: materialId, p_title: title, p_content: content,
    p_sources: sources.filter((source) => source.chunk_id).map((source) => ({ chunk_id: source.chunk_id })),
  });
  if (error) throw error;
  return data;
}
