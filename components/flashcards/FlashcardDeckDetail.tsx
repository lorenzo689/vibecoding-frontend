"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import {
  addFlashcard,
  deleteFlashcard,
  getDeck,
  type FlashcardDeck,
} from "@/lib/supabase/queries/flashcards";
import FlashcardStudyModal from "./FlashcardStudyModal";
import s from "./flashcards.module.css";

function CardIcon() {
  return (
    <svg viewBox="0 0 24 24" className={s.cardIcon} aria-hidden="true">
      <path
        d="M6 2.5h8l4 4V21a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3.5a1 1 0 0 1 1-1z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M14 2.5v4h4" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.3" />
      <line x1="8" y1="16.5" x2="16" y2="16.5" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export default function FlashcardDeckDetail({
  courseId,
  materialId,
}: {
  courseId: string;
  materialId: string;
}) {
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<FlashcardDeck | null | undefined>(undefined);
  const [studyIndex, setStudyIndex] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getDeck(materialId)
      .then((nextDeck) => { if (active) setDeck(nextDeck); })
      .catch(() => { if (active) setLoadError("Das Deck konnte nicht geladen werden."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [materialId]);

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deck || !question.trim() || !answer.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const card = await addFlashcard(deck.deckId, {
        question: question.trim(),
        answer: answer.trim(),
      });
      setDeck((current) => current && { ...current, cards: [...current.cards, card] });
      setQuestion("");
      setAnswer("");
    } catch {
      setError("Die Karteikarte konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id: string) {
    setRemovingId(id);
    setError(null);
    try {
      await deleteFlashcard(id);
      setDeck((current) => current && { ...current, cards: current.cards.filter((card) => card.id !== id) });
    } catch {
      setError("Die Karteikarte konnte nicht gelöscht werden.");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) return <p className={s.status} aria-live="polite">Deck wird geladen …</p>;

  if (loadError) return <div className={s.empty} role="alert"><h3>Nicht verfügbar</h3><p>{loadError} Bitte lade die Seite erneut.</p></div>;

  if (!deck) {
    return (
      <div className={s.empty}>
        <h3>Deck nicht gefunden</h3>
        <p>Dieses Deck existiert nicht oder wurde bereits gelöscht.</p>
        <Link href={`/courses/${courseId}/flashcards`} className={s.backLink}>
          ← Zurück zu den Decks
        </Link>
      </div>
    );
  }

  return (
    <div className={s.manager}>
      <div className={s.deckHeader}>
        <Link href={`/courses/${courseId}/flashcards`} className={s.backLink}>
          ← Zurück zu den Decks
        </Link>
        <h2>{deck.title}</h2>
      </div>

      <form className={s.addForm} onSubmit={handleAdd}>
        <div>
          <label htmlFor="card-question">Frage</label>
          <input
            id="card-question"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            disabled={saving}
          />
        </div>
        <div>
          <label htmlFor="card-answer">Antwort</label>
          <textarea
            id="card-answer"
            rows={1}
            value={answer}
            onChange={(event) => setAnswer(event.target.value)}
            disabled={saving}
          />
        </div>
        <button type="submit" className={s.submitButton} disabled={saving}>
          {saving ? "Wird gespeichert …" : "+ Karteikarte hinzufügen"}
        </button>
        {error && <span className={s.status} role="alert">{error}</span>}
      </form>

      {deck.cards.length === 0 ? (
        <div className={s.empty}>
          <h3>Noch keine Karteikarten</h3>
          <p>Füg die erste Karteikarte für dieses Deck hinzu.</p>
        </div>
      ) : (
        <ul className={s.cardList}>
          {deck.cards.map((card, cardIndex) => (
            <li key={card.id}>
              <article className={s.card} onClick={() => setStudyIndex(cardIndex)}>
                <CardIcon />
                <span className={s.question}>{card.question}</span>
                <button
                  type="button"
                  className={s.removeButton}
                  aria-label="Karteikarte löschen"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleRemove(card.id);
                  }}
                  disabled={removingId === card.id}
                >
                  ✕
                </button>
              </article>
            </li>
          ))}
        </ul>
      )}

      {studyIndex !== null && (
        <FlashcardStudyModal
          cards={deck.cards}
          initialIndex={studyIndex}
          onClose={() => setStudyIndex(null)}
        />
      )}
    </div>
  );
}
