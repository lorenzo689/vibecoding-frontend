import { createClient } from "@/lib/supabase/browser";
import type { PlanCard, PlanExam } from "@/lib/studyPlan";

type ProgressRow = {
  due_at: string | null;
  known: boolean | null;
  flashcards: { flashcard_decks: { materials: { course_id: string } } };
};

/** The user's own review state of every reviewed card, with the course each card belongs to. */
export async function listPlanCards(): Promise<PlanCard[]> {
  const cards: PlanCard[] = [];
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await createClient().from("flashcard_progress")
      .select("due_at, known, flashcards!inner(flashcard_decks!inner(materials!flashcard_decks_material_id_fkey!inner(course_id)))")
      .not("reviewed_at", "is", null)
      .order("card_id", { ascending: true })
      .range(offset, offset + 999);
    if (error) throw error;
    for (const row of data as unknown as ProgressRow[]) {
      cards.push({ courseId: row.flashcards.flashcard_decks.materials.course_id, dueAt: row.due_at, known: row.known });
    }
    if (data.length < 1000) return cards;
  }
}

/** Upcoming exam events (including today), used to pace the review. */
export async function listUpcomingExams(): Promise<PlanExam[]> {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await createClient().from("calendar_events")
    .select("course_id, title, starts_at").eq("kind", "exam").gte("starts_at", since)
    .order("starts_at", { ascending: true }).limit(200);
  if (error) throw error;
  return data.map((row) => ({ courseId: row.course_id, title: row.title, startsAt: row.starts_at }));
}
