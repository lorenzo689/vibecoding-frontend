// Per-card review progress for a study session, kept in sessionStorage.
// There is no backend table for this yet, so nothing here is durable beyond
// the current browser tab/session — it resets on a fresh session by design.
const prefix = "lernapp.flashcards.progress:";

type StoredProgress = { reviewed: string[]; known: string[]; starred: string[] };
export type DeckProgress = { reviewed: Set<string>; known: Set<string>; starred: Set<string> };

function read(deckId: string): StoredProgress {
  try {
    const raw = sessionStorage.getItem(`${prefix}${deckId}`);
    const parsed = raw ? JSON.parse(raw) : null;
    if (parsed && Array.isArray(parsed.reviewed) && Array.isArray(parsed.known)) {
      return { reviewed: parsed.reviewed, known: parsed.known, starred: Array.isArray(parsed.starred) ? parsed.starred : [] };
    }
  } catch { /* Session storage may be unavailable; progress simply won't persist. */ }
  return { reviewed: [], known: [], starred: [] };
}

function write(deckId: string, progress: StoredProgress) {
  try {
    sessionStorage.setItem(`${prefix}${deckId}`, JSON.stringify(progress));
  } catch { /* Optional, best-effort persistence. */ }
}

export function getDeckProgress(deckId: string): DeckProgress {
  const stored = read(deckId);
  return { reviewed: new Set(stored.reviewed), known: new Set(stored.known), starred: new Set(stored.starred) };
}

export function markCardReviewed(deckId: string, cardId: string) {
  const stored = read(deckId);
  if (!stored.reviewed.includes(cardId)) stored.reviewed.push(cardId);
  write(deckId, stored);
}

export function markCardKnown(deckId: string, cardId: string, known: boolean) {
  const stored = read(deckId);
  if (!stored.reviewed.includes(cardId)) stored.reviewed.push(cardId);
  stored.known = stored.known.filter((id) => id !== cardId);
  if (known) stored.known.push(cardId);
  write(deckId, stored);
}

export function toggleCardStarred(deckId: string, cardId: string): boolean {
  const stored = read(deckId);
  const isStarred = stored.starred.includes(cardId);
  stored.starred = isStarred ? stored.starred.filter((id) => id !== cardId) : [...stored.starred, cardId];
  write(deckId, stored);
  return !isStarred;
}
