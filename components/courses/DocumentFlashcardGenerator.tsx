"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";
import { createConversation, sendChat } from "@/lib/chat";
import { ChatError, withMaterialScope } from "@/lib/chatProtocol";
import { addFlashcard, createDeck } from "@/lib/supabase/queries/flashcards";
import styles from "@/components/documents/documents.module.css";

function asChatError(error: unknown): ChatError {
  return error instanceof ChatError ? error : new ChatError("LOAD_FAILED");
}

type Candidate = { question: string; answer: string; keep: boolean };

// UniVerse has no dedicated flashcard-generation endpoint. This asks the real
// course RAG chat (lib/chat.ts) for cards in a strict, parseable format, then
// lets the user review before anything is actually saved as a deck.
function parseCandidates(text: string): Candidate[] {
  const questions = new Map<number, string>();
  const answers = new Map<number, string>();
  for (const line of text.split("\n")) {
    const q = line.match(/^\s*F(\d+)\s*:\s*(.+)$/);
    if (q) { questions.set(Number(q[1]), q[2].trim()); continue; }
    const a = line.match(/^\s*A(\d+)\s*:\s*(.+)$/);
    if (a) answers.set(Number(a[1]), a[2].trim());
  }
  const cards: Candidate[] = [];
  for (const [n, question] of [...questions.entries()].sort((a, b) => a[0] - b[0])) {
    const answer = answers.get(n);
    if (question && answer) cards.push({ question, answer, keep: true });
  }
  return cards;
}

export default function DocumentFlashcardGenerator({
  courseId,
  materialId,
  fileName,
  onSaved,
  compact = false,
}: {
  courseId: string;
  materialId: string;
  fileName: string;
  onSaved: () => void;
  compact?: boolean;
}) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [candidates, setCandidates] = useState<Candidate[] | null>(null);
  const [rawAnswer, setRawAnswer] = useState<string | null>(null);
  const [deckTitle, setDeckTitle] = useState(`Karten: ${fileName}`);
  const [saving, setSaving] = useState(false);

  const keptCount = candidates?.filter((card) => card.keep).length ?? 0;

  async function handleGenerate() {
    setGenerating(true);
    setError(null);
    setCandidates(null);
    setRawAnswer(null);
    try {
      const client = createClient();
      const conversation = await createConversation(client, courseId);
      const exchange = await sendChat(client, withMaterialScope({
        conversation_id: conversation.id,
        request_id: crypto.randomUUID(),
        question: `Erstelle 8 Lernkarteikarten (Frage und Antwort) aus den Kursunterlagen, mit Schwerpunkt auf "${fileName}" falls dort relevanter Text indexiert ist. Antworte ausschließlich in diesem Format, eine Zeile pro Eintrag, ohne zusätzlichen Text:\nF1: <Frage>\nA1: <Antwort>\nF2: <Frage>\nA2: <Antwort>\n(und so weiter bis F8/A8)`,
      }, materialId));
      const answer = exchange.messages.find((message) => message.role === "assistant")?.content ?? "";
      const parsed = parseCandidates(answer);
      if (parsed.length === 0) {
        setRawAnswer(answer);
        setError("Die Antwort konnte nicht als Karteikarten erkannt werden. Du kannst es erneut versuchen.");
      } else {
        setCandidates(parsed);
      }
    } catch (failure) {
      setError(asChatError(failure).message);
    } finally {
      setGenerating(false);
    }
  }

  function toggleCard(index: number) {
    setCandidates((current) => current?.map((card, i) => (i === index ? { ...card, keep: !card.keep } : card)) ?? null);
  }

  async function handleSave() {
    if (!candidates) return;
    const selected = candidates.filter((card) => card.keep);
    if (selected.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const deck = await createDeck(courseId, deckTitle.trim() || fileName);
      for (const card of selected) {
        await addFlashcard(deck.deckId, { question: card.question, answer: card.answer });
      }
      setCandidates(null);
      onSaved();
    } catch {
      setError("Die Karten konnten nicht gespeichert werden. Bitte versuche es erneut.");
    } finally {
      setSaving(false);
    }
  }

  if (candidates) {
    return (
      <div className={styles.generatorReview}>
        <div className={styles.field}>
          <label htmlFor="deck-title">Deck-Name</label>
          <input id="deck-title" value={deckTitle} onChange={(event) => setDeckTitle(event.target.value)} disabled={saving} />
        </div>
        <ul className={styles.candidateList}>
          {candidates.map((card, index) => (
            <li key={index} className={styles.candidateCard} data-kept={card.keep}>
              <label className={styles.candidateCheck}>
                <input type="checkbox" checked={card.keep} onChange={() => toggleCard(index)} disabled={saving} />
              </label>
              <div>
                <p className={styles.candidateQ}>{card.question}</p>
                <p className={styles.candidateA}>{card.answer}</p>
              </div>
            </li>
          ))}
        </ul>
        {error && <p className={styles.errorHint} role="alert">{error}</p>}
        <div className={styles.dialogFooter}>
          <button type="button" className={styles.cancelButton} onClick={() => setCandidates(null)} disabled={saving}>Verwerfen</button>
          <button type="button" className={styles.submitButton} onClick={() => void handleSave()} disabled={saving || keptCount === 0}>
            {saving ? "Wird gespeichert …" : `${keptCount} Karte${keptCount === 1 ? "" : "n"} speichern`}
          </button>
        </div>
      </div>
    );
  }

  if (compact) {
    return (
      <div className={styles.generatorCompact}>
        {error && <p className={styles.errorHint} role="alert">{error}</p>}
        <button type="button" className={styles.runButton} onClick={() => void handleGenerate()} disabled={generating}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          {generating ? "Wird generiert …" : "Neues Set generieren"}
        </button>
      </div>
    );
  }

  return (
    <div className={styles.panelEmpty}>
      <span className={styles.panelIcon} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4.9 1 .9 1.6v.5h5.2v-.5c0-.6.3-1.2.9-1.6A6 6 0 0 0 12 3Z" /></svg>
      </span>
      <h3>Noch keine Karteikarten</h3>
      <p>Erstelle Karteikarten aus den Kursunterlagen, um dein Wissen zu festigen und zu wiederholen.</p>
      {error && <p className={styles.errorHint} role="alert">{error}</p>}
      {rawAnswer && <p className={styles.badgeDetail}>Antwort: „{rawAnswer.slice(0, 200)}{rawAnswer.length > 200 ? "…" : ""}“</p>}
      <button type="button" className={styles.runButton} onClick={() => void handleGenerate()} disabled={generating}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /><circle cx="12" cy="12" r="3.2" /></svg>
        {generating ? "Wird generiert …" : "Karteikarten generieren"}
      </button>
    </div>
  );
}
