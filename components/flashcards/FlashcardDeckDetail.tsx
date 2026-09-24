"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  addFlashcard,
  deleteDeck,
  deleteFlashcard,
  getDeck,
  type FlashcardDeck,
} from "@/lib/supabase/queries/flashcards";
import { getDeckProgress, markCardKnown, markCardReviewed, toggleCardStarred } from "@/lib/flashcardProgress";
import styles from "@/components/documents/documents.module.css";

export default function FlashcardDeckDetail({
  courseId,
  materialId,
}: {
  courseId: string;
  materialId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [deck, setDeck] = useState<FlashcardDeck | null | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const [manageOpen, setManageOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deletingSet, setDeletingSet] = useState(false);
  const [, forceUpdate] = useState(0);

  useEffect(() => {
    let active = true;
    getDeck(materialId)
      .then((nextDeck) => { if (active) setDeck(nextDeck); })
      .catch(() => { if (active) setLoadError("Das Deck konnte nicht geladen werden."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [materialId]);

  const card = deck?.cards[index];

  useEffect(() => {
    if (card) markCardReviewed(materialId, card.id);
  }, [materialId, card]);

  function go(delta: number) {
    setRevealed(false);
    setIndex((current) => Math.min((deck?.cards.length ?? 1) - 1, Math.max(0, current + delta)));
  }

  function toggleStar() {
    if (!card) return;
    toggleCardStarred(materialId, card.id);
    forceUpdate((current) => current + 1);
  }

  function rate(known: boolean) {
    if (!card) return;
    markCardKnown(materialId, card.id, known);
    if (index === (deck?.cards.length ?? 1) - 1) return;
    go(1);
  }

  async function handleAdd(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!deck || !question.trim() || !answer.trim()) return;
    setSaving(true);
    setError(null);
    try {
      const newCard = await addFlashcard(deck.deckId, { question: question.trim(), answer: answer.trim() });
      setDeck((current) => current && { ...current, cards: [...current.cards, newCard] });
      setQuestion("");
      setAnswer("");
    } catch {
      setError("Die Karteikarte konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  async function handleRemoveCard(id: string) {
    setRemovingId(id);
    setError(null);
    try {
      await deleteFlashcard(id);
      setDeck((current) => current && { ...current, cards: current.cards.filter((entry) => entry.id !== id) });
      setIndex((current) => Math.max(0, Math.min(current, (deck?.cards.length ?? 1) - 2)));
    } catch {
      setError("Die Karteikarte konnte nicht gelöscht werden.");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleDeleteSet() {
    setDeletingSet(true);
    try {
      await deleteDeck(materialId);
      router.push(`/courses/${courseId}/flashcards`);
    } catch {
      setError("Das Set konnte nicht gelöscht werden.");
      setDeletingSet(false);
    }
  }

  if (loading) return <div className={styles.page}><p className={styles.loading} aria-live="polite">Deck wird geladen …</p></div>;

  if (loadError || !deck) {
    return (
      <div className={styles.page}>
        <div className={styles.empty} role={loadError ? "alert" : undefined}>
          <h2>{loadError ? "Nicht verfügbar" : "Deck nicht gefunden"}</h2>
          <p>{loadError ?? "Dieses Deck existiert nicht oder wurde bereits gelöscht."}</p>
          <Link href={`/courses/${courseId}/flashcards`} className={styles.uploadButton}>Zurück zu den Sets</Link>
        </div>
      </div>
    );
  }

  const progress = getDeckProgress(materialId);

  return (
    <div className={styles.page}>
      <Link href={`/courses/${courseId}/flashcards`} className={styles.backLink}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m11 5-6 7 6 7M5 12h14" /></svg>
        Zurück zu den Sets
      </Link>

      <header className={styles.header}>
        <div>
          <h1>{deck.title}</h1>
          <p className={styles.subhead}>{deck.cards.length} {deck.cards.length === 1 ? "Karte" : "Karten"}</p>
        </div>
        <button type="button" className={styles.dangerButtonSolid} onClick={() => setConfirmingDelete(true)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.9 12.1a2 2 0 0 1-2 1.9H8.9a2 2 0 0 1-2-1.9L6 7Z" /></svg>
          Set löschen
        </button>
      </header>

      {error && <p className={styles.errorHint} role="alert">{error}</p>}

      {deck.cards.length === 0 ? (
        <div className={styles.empty}>
          <h2>Noch keine Karteikarten</h2>
          <p>Füg die erste Karteikarte für dieses Deck hinzu.</p>
        </div>
      ) : (
        card && (
          <div className={styles.studyPanel}>
            <div
              className={styles.studyCard}
              data-revealed={revealed}
              onClick={() => setRevealed((current) => !current)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setRevealed((current) => !current); } }}
            >
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

            <div className={styles.rateRow}>
              <button type="button" className={styles.rateAgain} onClick={() => rate(false)}>Nochmal üben</button>
              <button type="button" className={styles.rateKnown} onClick={() => rate(true)}>Ich wusste es</button>
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
            <p className={styles.uploadHint}>{progress.known.size} von {progress.reviewed.size} gesehenen Karten als gewusst markiert.</p>

            <div className={styles.manageSection}>
              <button type="button" className={styles.manageToggle} data-open={manageOpen} onClick={() => setManageOpen((current) => !current)}>
                {manageOpen ? "Kartenverwaltung ausblenden" : `Karten verwalten (${deck.cards.length})`}
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
              </button>
              {manageOpen && (
                <div className={styles.managePanel}>
                  <div className={styles.managePanelHead}>
                    <span className={styles.managePanelIcon} aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="13" height="15" rx="2.4" /><path d="M9 10h4M9 14h4" /></svg>
                    </span>
                    <div>
                      <h3>Karten in diesem Set</h3>
                      <p>Neue Karte hinzufügen oder bestehende entfernen.</p>
                    </div>
                  </div>
                  <form className={styles.manageForm} onSubmit={handleAdd}>
                    <div className={styles.field}>
                      <label htmlFor="card-question">Frage</label>
                      <input id="card-question" value={question} placeholder="z. B. Was ist Phishing?"
                        onChange={(event) => setQuestion(event.target.value)} disabled={saving} />
                    </div>
                    <div className={styles.field}>
                      <label htmlFor="card-answer">Antwort</label>
                      <input id="card-answer" value={answer} placeholder="Kurze, prägnante Antwort"
                        onChange={(event) => setAnswer(event.target.value)} disabled={saving} />
                    </div>
                    <button type="submit" className={styles.uploadButton} disabled={saving || !question.trim() || !answer.trim()}>
                      <span aria-hidden="true">+</span> {saving ? "Wird gespeichert …" : "Karte hinzufügen"}
                    </button>
                  </form>
                  <ul className={styles.cardList}>
                    {deck.cards.map((entry, entryIndex) => (
                      <li key={entry.id} className={styles.cardListRow}>
                        <span className={styles.cardListIndex} aria-hidden="true">{entryIndex + 1}</span>
                        <span>{entry.question}</span>
                        <button type="button" className={styles.cardListRemove} aria-label={`„${entry.question}“ löschen`}
                          onClick={() => void handleRemoveCard(entry.id)} disabled={removingId === entry.id}>
                          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.9 12.1a2 2 0 0 1-2 1.9H8.9a2 2 0 0 1-2-1.9L6 7Z" /></svg>
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      )}

      {confirmingDelete && (
        <div className={styles.backdrop} onClick={(event) => { if (event.target === event.currentTarget && !deletingSet) setConfirmingDelete(false); }}>
          <div className={styles.confirmDialog} role="alertdialog" aria-modal="true" aria-labelledby="delete-set-heading">
            <span className={styles.confirmIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.9 12.1a2 2 0 0 1-2 1.9H8.9a2 2 0 0 1-2-1.9L6 7Z" /><path d="M10 11v6M14 11v6" /></svg>
            </span>
            <h2 id="delete-set-heading">Set löschen?</h2>
            <p>„{deck.title}&quot; wird endgültig entfernt. Das kann nicht rückgängig gemacht werden.</p>
            <div className={styles.dialogFooter}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirmingDelete(false)} disabled={deletingSet}>Abbrechen</button>
              <button type="button" className={styles.dangerButton} onClick={() => void handleDeleteSet()} disabled={deletingSet}>
                {deletingSet ? "Wird gelöscht …" : "Löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
