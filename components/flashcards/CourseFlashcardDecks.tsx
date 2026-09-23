"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createDeck,
  deleteDeck,
  listCourseDecks,
  type FlashcardDeckSummary,
} from "@/lib/supabase/queries/flashcards";
import CreateDeckDialog from "./CreateDeckDialog";
import styles from "@/components/documents/documents.module.css";

function DeckIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="13" height="15" rx="2.4" /><path d="M9 10h4M9 14h4" />
    </svg>
  );
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso)).toUpperCase();
}

export default function CourseFlashcardDecks({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(true);
  const [decks, setDecks] = useState<FlashcardDeckSummary[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listCourseDecks(courseId)
      .then((nextDecks) => { if (active) setDecks(nextDecks); })
      .catch(() => { if (active) setLoadError("Die Karteikarten-Decks konnten nicht geladen werden."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId]);

  async function handleCreate(title: string) {
    const deck = await createDeck(courseId, title);
    setDecks((current) => [...current, { ...deck, cardCount: 0, createdAt: new Date().toISOString() }]);
    setDialogOpen(false);
  }

  async function handleRemove(materialId: string) {
    setRemovingId(materialId);
    setError(null);
    try {
      await deleteDeck(materialId);
      setDecks((current) => current.filter((deck) => deck.materialId !== materialId));
    } catch {
      setError("Das Deck konnte nicht gelöscht werden.");
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className={styles.page}>
      <Link href={`/courses/${courseId}`} className={styles.backLink}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m11 5-6 7 6 7M5 12h14" /></svg>
        Zurück zum Kurs
      </Link>

      <header className={styles.header}>
        <div>
          <h1>Karteikarten</h1>
          <p className={styles.subhead}>Alle Decks in diesem Kurs, aus deinem Vorlesungsmaterial.</p>
        </div>
        <button type="button" className={styles.uploadButton} onClick={() => setDialogOpen(true)}>
          <span aria-hidden="true">+</span> Neues Deck
        </button>
      </header>

      {error && <p className={styles.errorHint} role="alert">{error}</p>}

      {loading && <p className={styles.loading} aria-live="polite">Decks werden geladen …</p>}

      {!loading && loadError && (
        <div className={styles.empty} role="alert">
          <h2>Nicht verfügbar</h2>
          <p>{loadError} Bitte lade die Seite erneut.</p>
        </div>
      )}

      {!loading && !loadError && (
        decks.length === 0 ? (
          <div className={styles.empty}>
            <h2>Noch keine Karteikarten-Decks</h2>
            <p>Leg dein erstes Deck für diesen Kurs an.</p>
            <button type="button" className={styles.uploadButton} onClick={() => setDialogOpen(true)}>
              <span aria-hidden="true">+</span> Neues Deck
            </button>
          </div>
        ) : (
          <ul className={styles.deckGrid}>
            {decks.map((deck) => (
              <li key={deck.materialId}>
                <article className={styles.deckCard}>
                  <button type="button" className={styles.deckCardDelete} aria-label={`„${deck.title}“ löschen`}
                    onClick={() => void handleRemove(deck.materialId)} disabled={removingId === deck.materialId}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.9 12.1a2 2 0 0 1-2 1.9H8.9a2 2 0 0 1-2-1.9L6 7Z" /></svg>
                  </button>
                  <span className={styles.deckCardIcon} aria-hidden="true"><DeckIcon /></span>
                  <span className={styles.deckCardTitle}>{deck.title}</span>
                  <span className={styles.deckCardDate}>ERSTELLT {formatShortDate(deck.createdAt)}</span>
                  <span className={styles.deckCardCount}>{deck.cardCount} {deck.cardCount === 1 ? "Karte" : "Karten"}</span>
                  <Link href={`/courses/${courseId}/flashcards/${deck.materialId}`} className={`${styles.deckCardAction} ${styles.deckCardActionPrimary}`}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 5v14l11-7Z" /></svg>
                    Jetzt lernen
                  </Link>
                </article>
              </li>
            ))}
          </ul>
        )
      )}

      {dialogOpen && (
        <CreateDeckDialog onClose={() => setDialogOpen(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
