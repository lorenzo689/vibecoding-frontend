import { createClient } from "@/lib/supabase/browser";

export type DeckProgress = { reviewed: Set<string>; known: Set<string>; starred: Set<string>; due: Set<string> };
const cache = new Map<string, DeckProgress>();
const empty = (): DeckProgress => ({ reviewed: new Set(), known: new Set(), starred: new Set(), due: new Set() });

export type DeckProgressCounts = { reviewed: number; known: number; due: number };

export async function loadDeckProgressCounts(materialIds: string[]): Promise<Map<string, DeckProgressCounts>> {
  if (!materialIds.length) return new Map();
  const { data, error } = await createClient().rpc("learning_deck_progress_counts", { p_material_ids: materialIds });
  if (error) throw error;
  return new Map(data.map((row) => [row.material_id, { reviewed: row.reviewed, known: row.known, due: row.due }]));
}

export function getDeckProgress(deckId: string): DeckProgress {
  return cache.get(deckId) ?? empty();
}

export async function loadDeckProgress(deckId: string, cardIds: string[]): Promise<DeckProgress> {
  if (!cardIds.length) { cache.set(deckId, empty()); return getDeckProgress(deckId); }
  const { data, error } = await createClient().from("flashcard_progress")
    .select("card_id,reviewed_at,known,starred,due_at").in("card_id", cardIds);
  if (error) throw error;
  const progress = empty();
  for (const row of data) {
    if (row.reviewed_at) progress.reviewed.add(row.card_id);
    if (row.known) progress.known.add(row.card_id);
    if (row.starred) progress.starred.add(row.card_id);
    if (row.due_at && new Date(row.due_at).getTime() <= Date.now()) progress.due.add(row.card_id);
  }
  cache.set(deckId, progress);
  return progress;
}

export async function markCardKnown(deckId: string, cardId: string, known: boolean): Promise<void> {
  const { error } = await createClient().rpc("record_flashcard_review", { p_card: cardId, p_known: known });
  if (error) throw error;
  const progress = getDeckProgress(deckId);
  progress.reviewed.add(cardId);
  if (known) progress.known.add(cardId); else progress.known.delete(cardId);
  progress.due.delete(cardId);
  cache.set(deckId, progress);
}

export async function toggleCardStarred(deckId: string, cardId: string): Promise<boolean> {
  const client = createClient();
  const { data: user, error: authError } = await client.auth.getUser();
  if (authError || !user.user) throw authError ?? new Error("Nicht angemeldet");
  const progress = getDeckProgress(deckId);
  const next = !progress.starred.has(cardId);
  const { data: updated, error: updateError } = await client.from("flashcard_progress")
    .update({ starred: next }).eq("user_id", user.user.id).eq("card_id", cardId)
    .select("card_id");
  if (updateError) throw updateError;
  if (!updated.length) {
    const { error: insertError } = await client.from("flashcard_progress")
      .insert({ user_id: user.user.id, card_id: cardId, starred: next });
    if (insertError) throw insertError;
  }
  if (next) progress.starred.add(cardId); else progress.starred.delete(cardId);
  cache.set(deckId, progress);
  return next;
}
