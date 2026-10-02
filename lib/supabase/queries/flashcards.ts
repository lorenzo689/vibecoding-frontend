import { createClient } from "@/lib/supabase/browser";
import type { ChatSource } from "@/lib/chatProtocol";

export type Flashcard = {
  id: string;
  question: string;
  answer: string;
};

export type FlashcardDeck = {
  materialId: string;
  deckId: string;
  title: string;
  description: string;
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
    source_material_id: string | null;
    flashcards: { count: number }[];
  } | null;
};

export const DECKS_PAGE_SIZE = 50;

export async function listCourseDecks(courseId: string, sourceMaterialId?: string, offset = 0): Promise<FlashcardDeckSummary[]> {
  let query = createClient()
    .from("materials")
    .select("id, title, created_at, flashcard_decks!material_id!inner(id, source_material_id, flashcards(count))")
    .eq("course_id", courseId)
    .eq("type", "flashcard_deck")
    .order("created_at", { ascending: true })
    .order("id", { ascending: true })
    .range(offset, offset + DECKS_PAGE_SIZE - 1);
  if (sourceMaterialId) query = query.eq("flashcard_decks.source_material_id", sourceMaterialId);
  const { data, error } = await query;

  if (error) throw error;
  return (data as MaterialWithDeckRow[])
    .filter((row) => row.flashcard_decks)
    .map((row) => ({
      materialId: row.id,
      deckId: row.flashcard_decks!.id,
      title: row.title,
      cardCount: row.flashcard_decks!.flashcards[0]?.count ?? 0,
      createdAt: row.created_at,
    }));
}

/** The server inserts the material, deck, cards and source snapshots in one transaction. */
export async function createGeneratedDeck(courseId: string, materialId: string, title: string,
  cards: { question: string; answer: string }[], sources: ChatSource[], creationKey: string): Promise<void> {
  const { error } = await createClient().rpc("create_learning_deck", {
    p_course: courseId, p_source_material: materialId, p_title: title,
    p_cards: cards, p_creation_key: creationKey,
    p_sources: sources.filter((source) => source.chunk_id).map((source) => ({ chunk_id: source.chunk_id })),
  });
  if (error) throw error;
}

export async function getDeck(materialId: string): Promise<FlashcardDeck | null> {
  const { data, error } = await createClient()
    .from("materials")
    .select("id, title, flashcard_decks!material_id(id, description, flashcards(id, question, answer))")
    .eq("id", materialId)
    .eq("type", "flashcard_deck")
    .maybeSingle();

  if (error) throw error;
  const row = data as unknown as { id: string; title: string; flashcard_decks: { id: string; description: string | null; flashcards: Flashcard[] } | null } | null;
  if (!row || !row.flashcard_decks) return null;

  return {
    materialId: row.id,
    deckId: row.flashcard_decks.id,
    title: row.title,
    description: row.flashcard_decks.description ?? "",
    cards: row.flashcard_decks.flashcards,
  };
}

export async function createDeck(
  courseId: string,
  title: string,
  creationKey = crypto.randomUUID()
): Promise<{ materialId: string; deckId: string; title: string }> {
  const { data, error } = await createClient().rpc("create_manual_deck", {
    p_course: courseId, p_title: title, p_creation_key: creationKey,
  });
  if (error) throw error;
  return data as { materialId: string; deckId: string; title: string };
}

export async function updateDeck(materialId: string, title: string, description: string): Promise<void> {
  const { error } = await createClient().rpc("update_learning_deck", { p_material: materialId, p_title: title, p_description: description });
  if (error) throw error;
}

export async function updateFlashcard(id: string, input: { question: string; answer: string }): Promise<Flashcard> {
  const { data, error } = await createClient().from("flashcards")
    .update({ question: input.question, answer: input.answer }).eq("id", id)
    .select("id, question, answer").single();
  if (error) throw error;
  return data;
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
