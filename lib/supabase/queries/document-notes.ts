import { createClient } from "@/lib/supabase/browser";

export type NoteKind = "note" | "highlight";
export type NoteStatus = "open" | "resolved";

export type DocumentNote = {
  id: string;
  materialId: string;
  pageNumber: number;
  kind: NoteKind;
  body: string;
  quote: string | null;
  status: NoteStatus;
  createdAt: string;
};

export type OpenNote = DocumentNote & { materialTitle: string; courseId: string; fileId: string | null };

type NoteRow = {
  id: string; material_id: string; page_number: number; kind: string; body: string;
  quote: string | null; status: string; created_at: string;
};

const COLUMNS = "id, material_id, page_number, kind, body, quote, status, created_at";

function mapNote(row: NoteRow): DocumentNote {
  return {
    id: row.id, materialId: row.material_id, pageNumber: row.page_number, kind: row.kind as NoteKind,
    body: row.body, quote: row.quote, status: row.status as NoteStatus, createdAt: row.created_at,
  };
}

export async function listNotes(materialId: string): Promise<DocumentNote[]> {
  const { data, error } = await createClient().from("document_notes").select(COLUMNS)
    .eq("material_id", materialId).order("page_number", { ascending: true }).order("created_at", { ascending: true });
  if (error) throw error;
  return data.map(mapNote);
}

export async function createNote(input: {
  materialId: string; pageNumber: number; kind: NoteKind; body: string; quote?: string | null;
}): Promise<DocumentNote> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Nicht angemeldet.");
  const { data, error } = await supabase.from("document_notes").insert({
    user_id: userData.user.id, material_id: input.materialId, page_number: input.pageNumber,
    kind: input.kind, body: input.body.trim(), quote: input.quote?.trim() || null,
  }).select(COLUMNS).single();
  if (error) throw error;
  return mapNote(data);
}

export async function updateNote(id: string, input: { body?: string; status?: NoteStatus }): Promise<DocumentNote> {
  const { data, error } = await createClient().from("document_notes")
    .update({ ...(input.body !== undefined && { body: input.body.trim() }), ...(input.status && { status: input.status }) })
    .eq("id", id).select(COLUMNS).single();
  if (error) throw error;
  return mapNote(data);
}

export async function deleteNote(id: string): Promise<void> {
  const { error } = await createClient().from("document_notes").delete().eq("id", id);
  if (error) throw error;
}

/** Open (unresolved) notes across all documents, newest first, with the document they belong to. */
export async function listOpenNotes(limit = 20): Promise<OpenNote[]> {
  const { data, error } = await createClient().from("document_notes")
    .select(`${COLUMNS}, materials!inner(title, course_id, file_id)`)
    .eq("kind", "note").eq("status", "open").order("created_at", { ascending: false }).limit(limit);
  if (error) throw error;
  return (data as unknown as (NoteRow & { materials: { title: string; course_id: string; file_id: string | null } })[]).map((row) => ({
    ...mapNote(row), materialTitle: row.materials.title, courseId: row.materials.course_id, fileId: row.materials.file_id,
  }));
}
