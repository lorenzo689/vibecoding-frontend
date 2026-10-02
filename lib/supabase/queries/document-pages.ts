import { createClient } from "@/lib/supabase/browser";

export type DocumentPage = { page: number; text: string };

/**
 * Extracted text per page. Plain-text documents have no page structure and come back as one page.
 * Returns null while the document has no extracted text (not processed yet or failed).
 */
export async function getDocumentPages(materialId: string): Promise<DocumentPage[] | null> {
  const { data, error } = await createClient().from("source_documents")
    .select("pages, extracted_text").eq("material_id", materialId).maybeSingle();
  if (error) throw error;
  if (Array.isArray(data?.pages)) {
    return (data.pages as unknown[]).flatMap((entry) => {
      const item = entry as { page?: unknown; text?: unknown };
      return typeof item?.page === "number" && typeof item.text === "string" ? [{ page: item.page, text: item.text }] : [];
    });
  }
  return data?.extracted_text ? [{ page: 1, text: data.extracted_text }] : null;
}
