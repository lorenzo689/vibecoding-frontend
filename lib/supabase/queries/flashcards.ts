import { createClient } from "@/lib/supabase/browser";

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
};

export type FlashcardDeck = {
  materialId: string;
  deckId: string;
  title: string;
  cards: Flashcard[];
};

type MaterialWithDeckRow = {
  id: string;
  title: string;
  flashcard_decks: {
    id: string;
    flashcards: { id: string; question: string; answer: string }[];
  } | null;
};

export async function getCourseDeck(courseId: string): Promise<FlashcardDeck | null> {
  // .limit(1) instead of .maybeSingle(): a partial failure between the two
  // inserts in ensureDeck() could in theory leave more than one deck material
  // for this course. Take the first rather than throwing on that edge case.
  const { data, error } = await createClient()
    .from("materials")
    .select("id, title, flashcard_decks!material_id(id, flashcards(id, question, answer))")
    .eq("course_id", courseId)
    .eq("type", "flashcard_deck")
    .order("created_at", { ascending: true })
    .limit(1);

  if (error) throw error;
  const row = (data as MaterialWithDeckRow[])[0] ?? null;
  if (!row || !row.flashcard_decks) return null;

  return {
    materialId: row.id,
    deckId: row.flashcard_decks.id,
    title: row.title,
    cards: row.flashcard_decks.flashcards,
  };
}

async function ensureDeck(courseId: string, title: string): Promise<{ materialId: string; deckId: string }> {
  const existing = await getCourseDeck(courseId);
  if (existing) return existing;

  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Nicht angemeldet.");

  const { data: material, error: materialError } = await supabase
    .from("materials")
    .insert({
      course_id: courseId,
      created_by: userData.user.id,
      type: "flashcard_deck",
      title,
    })
    .select("id")
    .single();
  if (materialError) throw materialError;

  const { data: deck, error: deckError } = await supabase
    .from("flashcard_decks")
    .insert({ material_id: material.id, title })
    .select("id")
    .single();
  if (deckError) {
    await supabase.from("materials").delete().eq("id", material.id);
    throw deckError;
  }

  return { materialId: material.id, deckId: deck.id };
}

export async function addFlashcard(
  courseId: string,
  input: { question: string; answer: string }
): Promise<Flashcard> {
  const { deckId } = await ensureDeck(courseId, "Karteikarten");

  const { data, error } = await createClient()
    .from("flashcards")
    .insert({ deck_id: deckId, question: input.question, answer: input.answer })
    .select("id, question, answer")
    .single();

  if (error) throw error;
  return data as Flashcard;
}

export async function updateFlashcard(
  id: string,
  input: { question: string; answer: string }
): Promise<void> {
  const { error } = await createClient()
    .from("flashcards")
    .update({ question: input.question, answer: input.answer })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteFlashcard(id: string): Promise<void> {
  const { error } = await createClient().from("flashcards").delete().eq("id", id);
  if (error) throw error;
}
