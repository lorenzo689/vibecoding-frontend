"use client";

import { useEffect, useState } from "react";
import { deleteDeck, getDeck, listCourseDecks, type Flashcard, type FlashcardDeck, type FlashcardDeckSummary } from "@/lib/supabase/queries/flashcards";
import { getDeckProgress, markCardReviewed, toggleCardStarred } from "@/lib/flashcardProgress";
import DocumentFlashcardGenerator from "./DocumentFlashcardGenerator";
import styles from "@/components/documents/documents.module.css";

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4.9 1 .9 1.6v.5h5.2v-.5c0-.6.3-1.2.9-1.6A6 6 0 0 0 12 3Z" />
    </svg>
  );
}

const GENERATION_UNAVAILABLE = "Neue Karteikarten kann die KI erst erstellen, wenn dieses Dokument fertig indexiert ist.";

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso)).toUpperCase();
}

// Studying a set happens in place; there is no separate route for it.
function DeckStudy({ deck, onBack }: { deck: FlashcardDeck; onBack: () => void }) {
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [, forceUpdate] = useState(0);
  const card: Flashcard | undefined = deck.cards[index];

  useEffect(() => {
    if (card) markCardReviewed(deck.materialId, card.id);
  }, [deck.materialId, card]);

  if (!card) return null;
  const progress = getDeckProgress(deck.materialId);

  function go(delta: number) {
    setRevealed(false);
    setIndex((current) => Math.min(deck.cards.length - 1, Math.max(0, current + delta)));
  }

  function toggleStar() {
    if (!card) return;
    toggleCardStarred(deck.materialId, card.id);
    forceUpdate((current) => current + 1);
  }

  return (
    <div className={styles.studyPanel}>
      <button type="button" className={styles.viewerLink} onClick={onBack}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m11 5-6 7 6 7M5 12h14" /></svg>
        Zurück zu den Sets
      </button>

      <div className={styles.studyCard} data-revealed={revealed} onClick={() => setRevealed((current) => !current)} role="button" tabIndex={0}
        onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setRevealed((current) => !current); } }}>
        <div className={styles.studyBadgeRow}>
          <span className={styles.studyStatusTag} data-tone={progress.known.has(card.id) ? "known" : undefined}>
            {progress.known.has(card.id) ? "Gewusst" : progress.reviewed.has(card.id) ? "Gesehen" : "Neu"}
          </span>
          <button type="button" className={styles.studyStarButton} data-active={progress.starred.has(card.id)}
            aria-label={progress.starred.has(card.id) ? "Aus Favoriten entfernen" : "Als Favorit markieren"}
            onClick={(event) => { event.stopPropagation(); toggleStar(); }}>
            <svg viewBox="0 0 24 24" fill={progress.starred.has(card.id) ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3 2.6 5.6 6.1.7-4.5 4.2 1.2 6-5.4-3-5.4 3 1.2-6-4.5-4.2 6.1-.7Z" /></svg>
          </button>
        </div>
        <p className={styles.studyQuestion}>{revealed ? card.answer : card.question}</p>
        <span className={styles.studyHint}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 1 3 6.7" /><path d="M3 17v-5h5" /></svg>
          {revealed ? "Klicken für die Frage" : "Klicken zum Anzeigen der Antwort"}
        </span>
      </div>

      <div className={styles.studyNav}>
        <button type="button" onClick={() => go(-1)} disabled={index === 0}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5-7 7 7 7" /></svg>
          Zurück
        </button>
        <span>{index + 1} / {deck.cards.length}</span>
        <button type="button" onClick={() => go(1)} disabled={index === deck.cards.length - 1}>
          Weiter
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg>
        </button>
      </div>
    </div>
  );
}

// Existing decks are course content and always stay visible. Only generating new cards
// needs the open document's material for its AI scope; without it (document not indexed
// yet) generation is unavailable rather than falling back to the whole course.
export default function DocumentFlashcards({ courseId, materialId, fileName }: { courseId: string; materialId: string | null; fileName: string }) {
  const [decks, setDecks] = useState<FlashcardDeckSummary[] | undefined>(undefined);
  const [openDeck, setOpenDeck] = useState<FlashcardDeck | null>(null);
  const [openError, setOpenError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  function refreshDecks() {
    listCourseDecks(courseId).then(setDecks).catch(() => setDecks([]));
  }

  useEffect(() => {
    listCourseDecks(courseId).then(setDecks).catch(() => setDecks([]));
  }, [courseId]);

  async function openStudy(materialId: string) {
    setOpenError(null);
    try {
      const deck = await getDeck(materialId);
      if (!deck) { setOpenError("Dieses Set wurde nicht gefunden."); return; }
      setOpenDeck(deck);
    } catch {
      setOpenError("Das Set konnte nicht geladen werden.");
    }
  }

  async function handleDelete(materialId: string) {
    setRemovingId(materialId);
    try {
      await deleteDeck(materialId);
      setDecks((current) => current?.filter((deck) => deck.materialId !== materialId) ?? current);
    } catch {
      setOpenError("Das Set konnte nicht gelöscht werden.");
    } finally {
      setRemovingId(null);
    }
  }

  if (openDeck) {
    return <DeckStudy deck={openDeck} onBack={() => { setOpenDeck(null); refreshDecks(); }} />;
  }

  if (decks === undefined) {
    return <p className={styles.loading}>Karteikarten werden geladen …</p>;
  }

  if (decks.length === 0) {
    if (!materialId) {
      return (
        <div className={styles.panelEmpty}>
          <h3>Karteikarten erstellen</h3>
          <p>{GENERATION_UNAVAILABLE}</p>
        </div>
      );
    }
    return <DocumentFlashcardGenerator courseId={courseId} materialId={materialId} fileName={fileName} onSaved={refreshDecks} />;
  }

  return (
    <div className={styles.deckPanel}>
      <div className={styles.deckToolbar}>
        <div>
          <h2>Deine Karteikarten-Sets</h2>
          <p>{decks.length} {decks.length === 1 ? "Set verfügbar" : "Sets verfügbar"}</p>
        </div>
        {materialId
          ? <DocumentFlashcardGenerator courseId={courseId} materialId={materialId} fileName={fileName} onSaved={refreshDecks} compact />
          : <div><p>{GENERATION_UNAVAILABLE}</p></div>}
      </div>
      {openError && <p className={styles.errorHint} role="alert">{openError}</p>}
      <ul className={styles.deckGrid}>
        {decks.map((deck) => (
          <li key={deck.materialId}>
            <article className={styles.deckCard}>
              <button type="button" className={styles.deckCardDelete} aria-label={`„${deck.title}“ löschen`}
                onClick={() => void handleDelete(deck.materialId)} disabled={removingId === deck.materialId}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.9 12.1a2 2 0 0 1-2 1.9H8.9a2 2 0 0 1-2-1.9L6 7Z" /></svg>
              </button>
              <button type="button" className={styles.deckCardBody} onClick={() => void openStudy(deck.materialId)}>
                <span className={styles.deckCardIcon} aria-hidden="true"><CardIcon /></span>
                <span className={styles.deckCardTitle}>{deck.title}</span>
                <span className={styles.deckCardDate}>ERSTELLT {formatShortDate(deck.createdAt)}</span>
                <span className={styles.deckCardCount}>{deck.cardCount} {deck.cardCount === 1 ? "Karte" : "Karten"}</span>
              </button>
            </article>
          </li>
        ))}
      </ul>
    </div>
  );
}
