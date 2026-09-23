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

export type FlashcardDeckSummary = {
  materialId: string;
  deckId: string;
  title: string;
  cardCount: number;
  createdAt: string;
};

type MaterialWithDeckRow = {
  id: string;
  title: string;
  created_at: string;
  flashcard_decks: {
    id: string;
    flashcards: { id: string; question: string; answer: string }[];
  } | null;
};

export async function listCourseDecks(courseId: string): Promise<FlashcardDeckSummary[]> {
  const { data, error } = await createClient()
    .from("materials")
    .select("id, title, created_at, flashcard_decks!material_id(id, flashcards(id, question, answer))")
    .eq("course_id", courseId)
    .eq("type", "flashcard_deck")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as MaterialWithDeckRow[])
    .filter((row) => row.flashcard_decks)
    .map((row) => ({
      materialId: row.id,
      deckId: row.flashcard_decks!.id,
      title: row.title,
      cardCount: row.flashcard_decks!.flashcards.length,
      createdAt: row.created_at,
    }));
}

export async function getDeck(materialId: string): Promise<FlashcardDeck | null> {
  const { data, error } = await createClient()
    .from("materials")
    .select("id, title, flashcard_decks!material_id(id, flashcards(id, question, answer))")
    .eq("id", materialId)
    .eq("type", "flashcard_deck")
    .maybeSingle();

  if (error) throw error;
  const row = data as MaterialWithDeckRow | null;
  if (!row || !row.flashcard_decks) return null;

  return {
    materialId: row.id,
    deckId: row.flashcard_decks.id,
    title: row.title,
    cards: row.flashcard_decks.flashcards,
  };
}

export async function createDeck(
  courseId: string,
  title: string
): Promise<{ materialId: string; deckId: string; title: string }> {
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

  return { materialId: material.id, deckId: deck.id, title };
}

export async function deleteDeck(materialId: string): Promise<void> {
  const { error } = await createClient().from("materials").delete().eq("id", materialId);
  if (error) throw error;
}

export async function addFlashcard(
  deckId: string,
  input: { question: string; answer: string }
): Promise<Flashcard> {
  const { data, error } = await createClient()
    .from("flashcards")
    .insert({ deck_id: deckId, question: input.question, answer: input.answer })
    .select("id, question, answer")
    .single();

  if (error) throw error;
  return data as Flashcard;
}

export async function deleteFlashcard(id: string): Promise<void> {
  const { error } = await createClient().from("flashcards").delete().eq("id", id);
  if (error) throw error;
}
