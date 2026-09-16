"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createDeck,
  deleteDeck,
  listCourseDecks,
  type FlashcardDeckSummary,
} from "@/lib/supabase/queries/flashcards";
import { deriveCourseBadge } from "@/lib/courseBadge";
import dashboardStyles from "@/components/dashboard.module.css";
import CreateDeckDialog from "./CreateDeckDialog";
import s from "./flashcards.module.css";

function FolderIcon() {
  return (
    <svg viewBox="0 0 24 20" className={s.folderIcon} aria-hidden="true">
      <path
        fill="currentColor"
        d="M2 5.6C2 4.4 3 3.4 4.2 3.4h5C9.8 3.4 10.4 3.7 10.8 4.2l1 1.3c.4.5 1 .8 1.6.8H19.8C21 6.3 22 7.3 22 8.5V15.8C22 17 21 18 19.8 18H4.2C3 18 2 17 2 15.8Z"
      />
    </svg>
  );
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
    setDecks((current) => [...current, { ...deck, cardCount: 0 }]);
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
    <div className={s.manager}>
      <div className={s.topRow}>
        <Link href={`/courses/${courseId}`} className={s.backLink}>
          ← Zurück zum Kurs
        </Link>
      </div>

      <section className={dashboardStyles.intro}>
        <div>
          <p className={dashboardStyles.eyebrow}>DEIN WISSEN, KARTE FÜR KARTE</p>
          <h1>Deine Karteikarten-Decks.</h1>
          <p>Organisiere deine Karteikarten in Decks für diesen Kurs.</p>
        </div>
        <button type="button" className={s.headerButton} onClick={() => setDialogOpen(true)}>
          + Neues Deck
        </button>
      </section>

      {error && <p className={s.status} role="alert">{error}</p>}

      {loading && <p className={s.status} aria-live="polite">Decks werden geladen …</p>}

      {!loading && loadError && (
        <div className={s.empty} role="alert">
          <h3>Nicht verfügbar</h3>
          <p>{loadError} Bitte lade die Seite erneut.</p>
        </div>
      )}

      {!loading && !loadError && (
        decks.length === 0 ? (
          <div className={s.empty}>
            <h3>Noch keine Karteikarten-Decks</h3>
            <p>Leg dein erstes Deck für diesen Kurs an.</p>
          </div>
        ) : (
          <ul className={s.deckGrid}>
            {decks.map((deck) => {
              const badge = deriveCourseBadge(deck.title);
              return (
                <li key={deck.materialId} className={s.deckTile}>
                  <button
                    type="button"
                    className={s.deckRemove}
                    aria-label={`${deck.title} löschen`}
                    onClick={() => handleRemove(deck.materialId)}
                    disabled={removingId === deck.materialId}
                  >
                    ✕
                  </button>
                  <Link
                    href={`/courses/${courseId}/flashcards/${deck.materialId}`}
                    className={s.deckLink}
                  >
                    <span className={s.deckColor} data-color={badge.color}>
                      <FolderIcon />
                    </span>
                    <span className={s.deckLabel}>{deck.title}</span>
                    <span className={s.deckCount}>
                      {deck.cardCount} {deck.cardCount === 1 ? "Karte" : "Karten"}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )
      )}

      {dialogOpen && (
        <CreateDeckDialog onClose={() => setDialogOpen(false)} onCreate={handleCreate} />
      )}
    </div>
  );
}
