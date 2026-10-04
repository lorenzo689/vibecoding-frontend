import { createClient } from "@/lib/supabase/browser";

// Lernfortschritt für Karteikarten (Backend-Migration 20261003140000).
//
// Ersetzt die frühere Ablage in der Browser-Sitzung, die nur den geöffneten Tab
// überlebt hat. Den Wiederholungsrhythmus bestimmt ausschließlich der Server: ein richtiger
// Review startet bei einem Tag und verdoppelt das Intervall bis maximal 365 Tage, ein
// falscher setzt es zurück. Das Frontend rechnet hier nichts selbst aus.

export type CardProgress = {
  cardId: string;
  /** `null`, solange die Karte nie beantwortet wurde. */
  known: boolean | null;
  starred: boolean;
  intervalDays: number;
  repetitionCount: number;
  reviewedAt: string | null;
  dueAt: string | null;
};

export type DeckProgressCounts = {
  materialId: string;
  total: number;
  /** Karten ohne Review, einschließlich nur markierter. Getrennt von `due`. */
  new: number;
  reviewed: number;
  known: number;
  /** Fällige Wiederholungen; kann sich mit `known` überschneiden. */
  due: number;
};

type ProgressRow = {
  card_id: string;
  known: boolean | null;
  starred: boolean;
  interval_days: number;
  repetition_count: number;
  reviewed_at: string | null;
  due_at: string | null;
};

function mapProgress(row: ProgressRow): CardProgress {
  return {
    cardId: row.card_id,
    known: row.known,
    starred: row.starred,
    intervalDays: row.interval_days,
    repetitionCount: row.repetition_count,
    reviewedAt: row.reviewed_at,
    dueAt: row.due_at,
  };
}

const COLUMNS = "card_id, known, starred, interval_days, repetition_count, reviewed_at, due_at";

/** Fortschritt zu bestimmten Karten. RLS liefert nur die Zeilen des angemeldeten Nutzers. */
export async function listCardProgress(cardIds: string[]): Promise<Map<string, CardProgress>> {
  if (cardIds.length === 0) return new Map();
  const { data, error } = await createClient()
    .from("flashcard_progress")
    .select(COLUMNS)
    .in("card_id", cardIds);

  if (error) throw error;
  return new Map((data as ProgressRow[]).map((row) => [row.card_id, mapProgress(row)]));
}

/**
 * Speichert eine Antwort. `requestId` bleibt über Wiederholungen desselben Klicks gleich —
 * ein Retry zählt dann nicht als zweiter Review.
 */
export async function recordFlashcardReview(
  cardId: string,
  known: boolean,
  requestId: string
): Promise<CardProgress | null> {
  const { data, error } = await createClient().rpc("record_flashcard_review", {
    p_card: cardId,
    p_known: known,
    p_request_id: requestId,
  });

  if (error) throw error;
  const row = data as ProgressRow | null;
  return row && typeof row.card_id === "string" ? mapProgress(row) : null;
}

/**
 * Markiert eine Karte oder nimmt die Markierung zurück.
 *
 * Clients dürfen auf `flashcard_progress` nur `starred` schreiben; Termine und der
 * Bekannt-Status gehören dem Review-RPC. Deshalb ein Upsert auf genau dieser Spalte.
 */
export async function setCardStarred(cardId: string, starred: boolean): Promise<void> {
  const supabase = createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) throw userError ?? new Error("Nicht angemeldet.");

  const { error } = await supabase
    .from("flashcard_progress")
    .upsert({ user_id: userData.user.id, card_id: cardId, starred }, { onConflict: "user_id,card_id" });

  if (error) throw error;
}

/** Zählerstände je Deck, serverseitig berechnet. Fremde Decks liefert das Backend nicht. */
export async function listDeckProgressCounts(materialIds: string[]): Promise<Map<string, DeckProgressCounts>> {
  if (materialIds.length === 0) return new Map();
  const { data, error } = await createClient().rpc("learning_deck_progress_counts", {
    p_material_ids: materialIds,
  });

  if (error) throw error;
  return new Map(
    (data ?? []).map((row) => [
      row.material_id,
      {
        materialId: row.material_id,
        total: row.total,
        new: row.new,
        reviewed: row.reviewed,
        known: row.known,
        due: row.due,
      },
    ])
  );
}
