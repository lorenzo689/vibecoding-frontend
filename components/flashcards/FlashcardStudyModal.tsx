"use client";

import { useEffect, useState } from "react";
import type { Flashcard } from "@/lib/supabase/queries/flashcards";
import s from "./flashcards.module.css";

export default function FlashcardStudyModal({
  cards,
  initialIndex,
  onClose,
}: {
  cards: Flashcard[];
  initialIndex: number;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(initialIndex);
  const [flipped, setFlipped] = useState(false);
  const card = cards[index];

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") goNext();
      if (event.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  function goPrev() {
    setFlipped(false);
    setIndex((current) => Math.max(0, current - 1));
  }

  function goNext() {
    setFlipped(false);
    setIndex((current) => Math.min(cards.length - 1, current + 1));
  }

  if (!card) return null;

  return (
    <div
      className={s.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className={s.studyDialog} role="dialog" aria-modal="true">
        <div className={s.studyHeader}>
          <span className={s.studyCount}>{index + 1} / {cards.length}</span>
          <button type="button" className={s.closeButton} aria-label="Schließen" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={s.studyRow}>
          <button
            type="button"
            className={s.studyArrow}
            aria-label="Vorherige Karteikarte"
            onClick={goPrev}
            disabled={index === 0}
          >
            ←
          </button>

          <div
            className={s.flipCard}
            data-flipped={flipped}
            onClick={() => setFlipped((current) => !current)}
          >
            <div className={s.flipCardInner}>
              <div className={s.flipCardFace}>
                <span className={s.flipCardLabel}>FRAGE</span>
                <p>{card.question}</p>
              </div>
              <div className={`${s.flipCardFace} ${s.flipCardBack}`}>
                <span className={s.flipCardLabel}>ANTWORT</span>
                <p>{card.answer}</p>
              </div>
            </div>
          </div>

          <button
            type="button"
            className={s.studyArrow}
            aria-label="Nächste Karteikarte"
            onClick={goNext}
            disabled={index === cards.length - 1}
          >
            →
          </button>
        </div>

        <p className={s.studyHint}>Klick auf die Karte zum Umdrehen</p>
      </div>
    </div>
  );
}
