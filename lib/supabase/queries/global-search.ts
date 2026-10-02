import { createClient } from "@/lib/supabase/browser";

export type SearchResult = { id: string; label: string; kind: string; href: string };

export async function searchGlobal(query: string): Promise<SearchResult[]> {
  const value = query.trim().slice(0, 100);
  if (value.length < 2) return [];
  const client = createClient();
  const pattern = `%${value.replace(/[\\%_]/g, (character) => `\\${character}`)}%`;
  const [courses, materials, events] = await Promise.all([
    client.from("courses").select("id,title").ilike("title", pattern).limit(8),
    client.from("materials").select("id,title,type,course_id,file_id")
      .in("type", ["source_document", "flashcard_deck", "summary"]).ilike("title", pattern).limit(12),
    client.from("calendar_events").select("id,title").ilike("title", pattern).limit(8),
  ]);
  if (courses.error || materials.error || events.error) throw courses.error ?? materials.error ?? events.error;
  return [
    ...courses.data.map((row) => ({ id: `course:${row.id}`, label: row.title, kind: "Kurs", href: `/courses/${row.id}` })),
    ...materials.data.flatMap((row) => {
      const href = row.type === "source_document" && row.file_id
        ? `/courses/${row.course_id}/documents/${row.file_id}`
        : row.type === "flashcard_deck" ? `/courses/${row.course_id}/flashcards/${row.id}`
        : row.type === "summary" ? `/courses/${row.course_id}/summaries` : null;
      return href ? [{ id: `material:${row.id}`, label: row.title,
        kind: row.type === "source_document" ? "Unterlage" : row.type === "flashcard_deck" ? "Karteikarten" : "Zusammenfassung", href }] : [];
    }),
    ...events.data.map((row) => ({ id: `event:${row.id}`, label: row.title, kind: "Termin", href: "/calendar" })),
  ];
}
