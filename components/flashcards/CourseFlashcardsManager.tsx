"use client";

import { useEffect, useState, type FormEvent } from "react";
import {
  addFlashcard,
  deleteFlashcard,
  getCourseDeck,
  type Flashcard,
} from "@/lib/supabase/queries/flashcards";
import s from "./flashcards.module.css";

export default function CourseFlashcardsManager({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(true);
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    getCourseDeck(courseId)
      .then((deck) => { if (active) setCards(deck?.cards ?? []); })
      .catch(() => { if (active) setLoadError("Die Karteikarten konnten nicht geladen werden."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [courseId]);

  function toggleReveal(id: string) {
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim() || !answer.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const card = await addFlashcard(courseId, {
        question: question.trim(),
        answer: answer.trim(),
      });
      setCards((current) => [...current, card]);
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
      setCards((current) => current.filter((card) => card.id !== id));
    } catch {
      setError("Die Karteikarte konnte nicht gelöscht werden.");
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) return <p className={s.status} aria-live="polite">Karteikarten werden geladen …</p>;

  if (loadError) return <div className={s.empty} role="alert"><h3>Nicht verfügbar</h3><p>{loadError} Bitte lade die Seite erneut.</p></div>;

  return (
    <div className={s.manager}>
      {cards.length === 0 ? (
        <div className={s.empty}>
          <h3>Noch keine Karteikarten</h3>
          <p>Füg deine erste Karteikarte für diesen Kurs hinzu.</p>
        </div>
      ) : (
        <ul className={s.cardList}>
          {cards.map((card) => {
            const isRevealed = revealed.has(card.id);
            return (
              <li key={card.id}>
                <article className={s.card} onClick={() => toggleReveal(card.id)}>
                  <div className={s.cardTop}>
                    <p className={s.question}>{card.question}</p>
                    <span className={s.hint}>{isRevealed ? "ANTWORT" : "AUFDECKEN"}</span>
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
                  </div>
                  {isRevealed && <p className={s.answer}>{card.answer}</p>}
                </article>
              </li>
            );
          })}
        </ul>
      )}

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
    </div>
  );
}
