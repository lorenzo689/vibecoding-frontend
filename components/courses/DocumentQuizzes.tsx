"use client";

import { useEffect, useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";
import { runTemporaryChat } from "@/lib/chat";
import { ChatError } from "@/lib/chatProtocol";
import { discardedNotice, parseQuiz } from "@/lib/aiOutput";
import {
  isAttemptComplete,
  listQuizzes,
  QUIZ_MAX_QUESTIONS,
  QUIZ_MIN_QUESTIONS,
  saveAttempt,
  saveQuiz,
  startAttempt,
  validateQuiz,
  type QuizAttempt,
  type SavedQuiz,
} from "@/lib/supabase/queries/learningQuizzes";
import styles from "@/components/documents/documents.module.css";

function asChatError(error: unknown): ChatError {
  return error instanceof ChatError ? error : new ChatError("LOAD_FAILED");
}

function formatShortDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(date).toUpperCase();
}

// Die Fragen entstehen weiter über den echten Kurs-Chat (lib/chat.ts, geparst in
// lib/aiOutput.ts) — eine KI-Quizgenerierung ist ausdrücklich nicht Teil der
// Backend-Erweiterung. Neu ist, dass ein Quiz gespeichert wird: Versuche, Antworten und
// Punktzahl liegen seit Migration 20261003142000 in der Datenbank statt im Komponenten-
// zustand. Der Server normalisiert jede Frage auf Frage, vier Optionen und richtige
// Antwort; die vom Modell gelieferte Erklärung wird dabei verworfen und deshalb hier
// nicht mehr angezeigt.

function QuizTaking({
  quiz,
  answers,
  onAnswer,
  onFinish,
  busy,
}: {
  quiz: SavedQuiz;
  answers: (number | null)[];
  onAnswer: (questionIndex: number, optionIndex: number) => void;
  onFinish: () => void;
  busy: boolean;
}) {
  const [index, setIndex] = useState(0);
  const question = quiz.questions[index];
  const answered = answers.filter((answer) => answer !== null).length;
  const isLast = index === quiz.questions.length - 1;

  if (!question) return null;

  return (
    <div className={styles.quizTaking}>
      <div className={styles.quizProgressRow}>
        <span>Frage {index + 1} von {quiz.questions.length}</span>
        <span>{answered} beantwortet</span>
      </div>
      <div className={styles.quizProgressTrack}>
        <div className={styles.quizProgressFill} style={{ width: `${((index + 1) / quiz.questions.length) * 100}%` }} />
      </div>

      <div className={styles.quizQuestionCard}>
        <span className={styles.quizQuestionTag}><span aria-hidden="true" />Frage {index + 1}</span>
        <p className={styles.quizQuestionText}>{question.question}</p>
        <div className={styles.quizOptions} role="radiogroup" aria-label={question.question}>
          {question.options.map((option, optionIndex) => (
            <button type="button" key={optionIndex} role="radio" aria-checked={answers[index] === optionIndex}
              className={styles.quizOption} data-selected={answers[index] === optionIndex}
              onClick={() => onAnswer(index, optionIndex)} disabled={busy}>
              <span className={styles.quizOptionDot} aria-hidden="true" />
              {option}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.quizNav}>
        <button type="button" onClick={() => setIndex((current) => Math.max(0, current - 1))} disabled={index === 0}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5-7 7 7 7" /></svg>
          Zurück
        </button>
        <div className={styles.quizDots}>
          {quiz.questions.map((_unused, dotIndex) => (
            <button type="button" key={dotIndex} className={styles.quizDot} data-current={dotIndex === index} data-answered={answers[dotIndex] !== null}
              aria-label={`Zu Frage ${dotIndex + 1}`} onClick={() => setIndex(dotIndex)}>
              {dotIndex + 1}
            </button>
          ))}
        </div>
        {/* Das Backend lehnt eine Abgabe mit offenen Fragen ab — dieselbe Regel hier. */}
        {isLast ? (
          <button type="button" className={styles.quizNavPrimary} onClick={onFinish}
            disabled={busy || !isAttemptComplete(answers, quiz.questions.length)}>
            {busy ? "Wird ausgewertet …" : "Auswerten"}
          </button>
        ) : (
          <button type="button" className={styles.quizNavPrimary} onClick={() => setIndex((current) => Math.min(quiz.questions.length - 1, current + 1))}>
            Weiter
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg>
          </button>
        )}
      </div>
    </div>
  );
}

function QuizResults({ quiz, attempt, onBack }: { quiz: SavedQuiz; attempt: QuizAttempt; onBack: () => void }) {
  // Die Punktzahl kommt vom Server; hier wird nichts nachgerechnet.
  const correctCount = attempt.score ?? 0;
  const score = quiz.questions.length > 0 ? Math.round((correctCount / quiz.questions.length) * 100) : 0;

  return (
    <div className={styles.quizResults}>
      <div className={styles.quizScoreCard}>
        <span className={styles.quizScoreIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" /></svg>
        </span>
        <p className={styles.quizScoreLabel}>DEINE PUNKTZAHL</p>
        <p className={styles.quizScoreValue} data-tone={score >= 70 ? "good" : score >= 40 ? "mid" : "low"}>{score}%</p>
        <p className={styles.quizScoreNote}>{score >= 70 ? "Stark!" : score >= 40 ? "Auf dem richtigen Weg." : "Weiter üben!"}</p>
        <p className={styles.quizScoreStats}>{correctCount} von {quiz.questions.length} richtig</p>
      </div>

      <ul className={styles.quizReviewList}>
        {quiz.questions.map((question, index) => {
          const given = attempt.answers[index];
          const right = given === question.correctIndex;
          return (
            <li key={index} className={styles.quizReviewItem} data-correct={right || undefined}>
              <p className={styles.quizReviewQuestion}>{index + 1}. {question.question}</p>
              <p className={styles.quizReviewAnswer}>
                Deine Antwort: {given === null ? "keine" : question.options[given]}
              </p>
              {!right && (
                <p className={styles.quizReviewAnswer} data-tone="correct">
                  Richtig: {question.options[question.correctIndex]}
                </p>
              )}
            </li>
          );
        })}
      </ul>

      <button type="button" className={styles.uploadButton} onClick={onBack}>Zurück zur Übersicht</button>
    </div>
  );
}

export default function DocumentQuizzes({ courseId, materialId, fileName }: { courseId: string; materialId: string; fileName: string }) {
  const [quizzes, setQuizzes] = useState<SavedQuiz[] | undefined>(undefined);
  const [active, setActive] = useState<{ quiz: SavedQuiz; attempt: QuizAttempt } | null>(null);
  const [results, setResults] = useState<{ quiz: SavedQuiz; attempt: QuizAttempt } | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    let active2 = true;
    listQuizzes(materialId)
      .then((loaded) => { if (active2) setQuizzes(loaded); })
      .catch(() => {
        if (!active2) return;
        setQuizzes([]);
        setError("Gespeicherte Tests konnten nicht geladen werden.");
      });
    return () => { active2 = false; };
  }, [materialId]);

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setGenerating(true);
    setError(null);
    setNotice(null);
    try {
      const client = createClient();
      const exchange = await runTemporaryChat(client, courseId, materialId, `Erstelle einen Multiple-Choice-Test mit ${count} Fragen (je 4 Antwortoptionen, genau eine richtig) aus den Kursunterlagen, mit Schwerpunkt auf "${fileName}" falls dort relevanter Text indexiert ist. Antworte ausschließlich in diesem Format, eine Zeile pro Eintrag, ohne zusätzlichen Text:\nF1: <Frage>\nO1A: <Option A>\nO1B: <Option B>\nO1C: <Option C>\nO1D: <Option D>\nK1: <Buchstabe der richtigen Option, z. B. B>\nE1: <kurze Erklärung mit Bezug zum Text>\n(und so weiter bis F${count})`);
      const answer = exchange.messages.find((message) => message.role === "assistant")?.content ?? "";
      const parsed = parseQuiz(answer);
      if (!parsed.ok) {
        setError(new ChatError("UNUSABLE_AI_OUTPUT").message);
        return;
      }

      const title = `${fileName.replace(/\.[^.]+$/, "")} – Test`;
      // Die Erklärung des Modells speichert das Backend nicht, deshalb hier nicht mitsenden.
      const questions = parsed.questions.map((question) => ({
        question: question.question,
        options: [...question.options],
        correctIndex: question.correctIndex,
      }));

      const check = validateQuiz(title, questions);
      if (!check.ok) {
        setError(check.message);
        return;
      }

      await saveQuiz({ materialId, title, questions, requestId: crypto.randomUUID() });
      setQuizzes(await listQuizzes(materialId));
      setNotice(discardedNotice(parsed.discarded));
      setDialogOpen(false);
    } catch (failure) {
      setError(asChatError(failure).message);
    } finally {
      setGenerating(false);
    }
  }

  async function handleStart(quiz: SavedQuiz) {
    setBusy(true);
    setError(null);
    try {
      const attempt = await startAttempt(quiz.id, quiz.questions.length, crypto.randomUUID());
      setActive({ quiz, attempt });
    } catch {
      setError("Der Versuch konnte nicht gestartet werden.");
    } finally {
      setBusy(false);
    }
  }

  function handleAnswer(questionIndex: number, optionIndex: number) {
    setActive((current) => {
      if (!current) return current;
      const answers = current.attempt.answers.map((value, index) => (index === questionIndex ? optionIndex : value));
      return { ...current, attempt: { ...current.attempt, answers } };
    });
  }

  async function handleFinish() {
    if (!active) return;
    setBusy(true);
    setError(null);
    try {
      const submitted = await saveAttempt({
        attemptId: active.attempt.id,
        answers: active.attempt.answers,
        expectedRevision: active.attempt.revision,
        submit: true,
      });
      setResults({ quiz: active.quiz, attempt: submitted });
      setActive(null);
    } catch {
      setError("Der Versuch konnte nicht ausgewertet werden. Lade die Seite neu und versuche es erneut.");
    } finally {
      setBusy(false);
    }
  }

  if (active) {
    return (
      <>
        {error && <p className={styles.errorHint} role="alert">{error}</p>}
        <QuizTaking
          quiz={active.quiz}
          answers={active.attempt.answers}
          onAnswer={handleAnswer}
          onFinish={() => void handleFinish()}
          busy={busy}
        />
      </>
    );
  }

  if (results) {
    return <QuizResults quiz={results.quiz} attempt={results.attempt} onBack={() => setResults(null)} />;
  }

  if (quizzes === undefined) {
    return <p className={styles.loading} aria-live="polite">Tests werden geladen …</p>;
  }

  return (
    <div className={styles.quizPanel}>
      <div className={styles.sectionHead}>
        <div>
          <h2>Tests</h2>
          <p>
            {quizzes.length === 0
              ? "Lass dir einen Multiple-Choice-Test aus dieser Unterlage erstellen."
              : `${quizzes.length} ${quizzes.length === 1 ? "Test" : "Tests"} gespeichert`}
          </p>
        </div>
        <button type="button" className={styles.uploadButton} onClick={() => setDialogOpen(true)} disabled={generating}>
          Test erstellen
        </button>
      </div>

      {notice && <p className={styles.errorHint} data-tone="info">{notice}</p>}
      {error && <p className={styles.errorHint} role="alert">{error}</p>}

      {dialogOpen && (
        <form className={styles.quizSetup} onSubmit={handleGenerate}>
          <label>
            <span>Anzahl Fragen</span>
            <input
              type="number"
              min={QUIZ_MIN_QUESTIONS}
              max={QUIZ_MAX_QUESTIONS}
              value={count}
              onChange={(event) => setCount(Number.parseInt(event.target.value, 10) || QUIZ_MIN_QUESTIONS)}
              disabled={generating}
            />
          </label>
          <div className={styles.quizSetupActions}>
            <button type="button" className={styles.viewerLink} onClick={() => setDialogOpen(false)} disabled={generating}>
              Abbrechen
            </button>
            <button type="submit" className={styles.uploadButton} disabled={generating}>
              {generating ? "Wird erstellt …" : "Erstellen"}
            </button>
          </div>
          <p className={styles.quizSetupHint}>
            Automatisch erzeugt und nicht geprüft. Die Fragen stammen aus dem indexierten Text
            dieser Unterlage.
          </p>
        </form>
      )}

      {quizzes.length > 0 && (
        <ul className={styles.quizList}>
          {quizzes.map((quiz) => (
            <li key={quiz.id}>
              <div>
                <strong>{quiz.title}</strong>
                <small>
                  {quiz.questions.length} {quiz.questions.length === 1 ? "Frage" : "Fragen"}
                  {quiz.revision > 1 && ` · Fassung ${quiz.revision}`} · {formatShortDate(quiz.createdAt)}
                </small>
              </div>
              <button type="button" className={styles.uploadButton} onClick={() => void handleStart(quiz)} disabled={busy}>
                Starten
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
