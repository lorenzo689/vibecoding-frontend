"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";
import { createConversation, sendChat } from "@/lib/chat";
import { ChatError, withMaterialScope } from "@/lib/chatProtocol";
import styles from "@/components/documents/documents.module.css";

function asChatError(error: unknown): ChatError {
  return error instanceof ChatError ? error : new ChatError("LOAD_FAILED");
}

type QuizQuestion = { question: string; options: string[]; correctIndex: number; explanation: string };
type Quiz = {
  id: string;
  title: string;
  questions: QuizQuestion[];
  createdAt: string;
  answers: (number | null)[];
  submitted: boolean;
};

const LETTERS = ["A", "B", "C", "D"] as const;

// There is no quiz/question/score table in the backend yet, so a generated
// quiz only lives in this component's state — real AI content from the
// existing course chat, but nothing is written to the database.
function parseQuiz(text: string): QuizQuestion[] {
  const questions = new Map<number, string>();
  const options = new Map<number, Map<string, string>>();
  const correct = new Map<number, string>();
  const explanations = new Map<number, string>();
  for (const line of text.split("\n")) {
    const q = line.match(/^\s*F(\d+)\s*:\s*(.+)$/);
    if (q) { questions.set(Number(q[1]), q[2].trim()); continue; }
    const o = line.match(/^\s*O(\d+)([A-D])\s*:\s*(.+)$/);
    if (o) {
      const n = Number(o[1]);
      if (!options.has(n)) options.set(n, new Map());
      options.get(n)!.set(o[2], o[3].trim());
      continue;
    }
    const k = line.match(/^\s*K(\d+)\s*:\s*([A-D])/);
    if (k) { correct.set(Number(k[1]), k[2]); continue; }
    const e = line.match(/^\s*E(\d+)\s*:\s*(.+)$/);
    if (e) explanations.set(Number(e[1]), e[2].trim());
  }
  const result: QuizQuestion[] = [];
  for (const [n, question] of [...questions.entries()].sort((a, b) => a[0] - b[0])) {
    const optionMap = options.get(n);
    const correctLetter = correct.get(n);
    const explanation = explanations.get(n);
    if (!optionMap || !correctLetter || !explanation) continue;
    const opts = LETTERS.map((letter) => optionMap.get(letter)).filter((value): value is string => Boolean(value));
    const correctIndex = LETTERS.indexOf(correctLetter as (typeof LETTERS)[number]);
    if (opts.length < 2 || correctIndex < 0 || correctIndex >= opts.length) continue;
    result.push({ question, options: opts, correctIndex, explanation });
  }
  return result;
}

function QuizTaking({ quiz, onAnswer, onFinish }: { quiz: Quiz; onAnswer: (questionIndex: number, optionIndex: number) => void; onFinish: () => void }) {
  const [index, setIndex] = useState(0);
  const question = quiz.questions[index];
  const answered = quiz.answers.filter((answer) => answer !== null).length;
  const isLast = index === quiz.questions.length - 1;

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
            <button type="button" key={optionIndex} role="radio" aria-checked={quiz.answers[index] === optionIndex}
              className={styles.quizOption} data-selected={quiz.answers[index] === optionIndex}
              onClick={() => onAnswer(index, optionIndex)}>
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
          {quiz.questions.map((_, dotIndex) => (
            <button type="button" key={dotIndex} className={styles.quizDot} data-current={dotIndex === index} data-answered={quiz.answers[dotIndex] !== null}
              aria-label={`Zu Frage ${dotIndex + 1}`} onClick={() => setIndex(dotIndex)}>
              {dotIndex + 1}
            </button>
          ))}
        </div>
        {isLast ? (
          <button type="button" className={styles.quizNavPrimary} onClick={onFinish} disabled={answered < quiz.questions.length}>
            Auswerten
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

function QuizResults({ quiz, onBack }: { quiz: Quiz; onBack: () => void }) {
  const correctCount = quiz.questions.filter((question, index) => quiz.answers[index] === question.correctIndex).length;
  const score = Math.round((correctCount / quiz.questions.length) * 100);

  return (
    <div className={styles.quizResults}>
      <div className={styles.quizScoreCard}>
        <span className={styles.quizScoreIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" /><path d="M7 5H4a3 3 0 0 0 3 5M17 5h3a3 3 0 0 1-3 5" /></svg>
        </span>
        <p className={styles.quizScoreLabel}>DEINE PUNKTZAHL</p>
        <p className={styles.quizScoreValue} data-tone={score >= 70 ? "good" : score >= 40 ? "mid" : "low"}>{score}%</p>
        <p className={styles.quizScoreNote}>{score >= 70 ? "Stark!" : score >= 40 ? "Auf dem richtigen Weg." : "Weiter üben!"}</p>
        <div className={styles.quizScoreStats}>
          <span>{quiz.questions.length} gesamt</span>
          <span className={styles.quizStatGood}>{correctCount} richtig</span>
          <span className={styles.quizStatBad}>{quiz.questions.length - correctCount} falsch</span>
        </div>
      </div>

      <h3 className={styles.quizReviewHeading}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H12v18H6.5A2.5 2.5 0 0 1 4 18.5v-13Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H12v18h5.5a2.5 2.5 0 0 0 2.5-2.5v-13Z" /></svg>
        Detaillierte Auswertung
      </h3>
      <ul className={styles.quizReviewList}>
        {quiz.questions.map((question, index) => {
          const given = quiz.answers[index];
          const correct = given === question.correctIndex;
          return (
            <li key={index} className={styles.quizReviewItem}>
              <div className={styles.quizReviewHead}>
                <span className={styles.quizQuestionTag}><span aria-hidden="true" />Frage {index + 1}</span>
                <span className={styles.quizReviewVerdict} data-correct={correct} aria-label={correct ? "Richtig beantwortet" : "Falsch beantwortet"}>
                  {correct
                    ? <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m5 13 4 4L19 7" /></svg>
                    : <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>}
                </span>
              </div>
              <p className={styles.quizQuestionText}>{question.question}</p>
              <div className={styles.quizOptions}>
                {question.options.map((option, optionIndex) => (
                  <div key={optionIndex} className={styles.quizReviewOption}
                    data-tone={optionIndex === question.correctIndex ? "correct" : optionIndex === given ? "wrong" : "neutral"}>
                    {option}
                    {optionIndex === given && <span className={styles.quizReviewFlag} data-tone="wrong">{correct ? "✓ Deine Antwort" : "✕ Deine Antwort"}</span>}
                    {optionIndex === question.correctIndex && optionIndex !== given && <span className={styles.quizReviewFlag} data-tone="correct">✓ Richtig</span>}
                  </div>
                ))}
              </div>
              <div className={styles.quizExplanation}>
                <span>ERKLÄRUNG</span>
                <p>{question.explanation}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <button type="button" className={styles.quizNavPrimary} onClick={onBack}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m11 5-6 7 6 7M5 12h14" /></svg>
        Zurück zu den Tests
      </button>
    </div>
  );
}

export default function DocumentQuizzes({ courseId, materialId, fileName }: { courseId: string; materialId: string; fileName: string }) {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);
  const [showResultsId, setShowResultsId] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [count, setCount] = useState(5);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openQuiz = quizzes.find((quiz) => quiz.id === openId) ?? null;
  const resultsQuiz = quizzes.find((quiz) => quiz.id === showResultsId) ?? null;

  async function handleGenerate(event: FormEvent) {
    event.preventDefault();
    setGenerating(true);
    setError(null);
    try {
      const client = createClient();
      const conversation = await createConversation(client, courseId);
      const exchange = await sendChat(client, withMaterialScope({
        conversation_id: conversation.id,
        request_id: crypto.randomUUID(),
        question: `Erstelle einen Multiple-Choice-Test mit ${count} Fragen (je 4 Antwortoptionen, genau eine richtig) aus den Kursunterlagen, mit Schwerpunkt auf "${fileName}" falls dort relevanter Text indexiert ist. Antworte ausschließlich in diesem Format, eine Zeile pro Eintrag, ohne zusätzlichen Text:\nF1: <Frage>\nO1A: <Option A>\nO1B: <Option B>\nO1C: <Option C>\nO1D: <Option D>\nK1: <Buchstabe der richtigen Option, z. B. B>\nE1: <kurze Erklärung mit Bezug zum Text>\n(und so weiter bis F${count})`,
      }, materialId));
      const answer = exchange.messages.find((message) => message.role === "assistant")?.content ?? "";
      const questions = parseQuiz(answer);
      if (questions.length === 0) {
        setError("Die Antwort konnte nicht als Test erkannt werden. Du kannst es erneut versuchen.");
        return;
      }
      const quiz: Quiz = {
        id: crypto.randomUUID(),
        title: `${fileName.replace(/\.[^.]+$/, "")} – Test`,
        questions,
        createdAt: new Date().toISOString(),
        answers: questions.map(() => null),
        submitted: false,
      };
      setQuizzes((current) => [quiz, ...current]);
      setDialogOpen(false);
      setOpenId(quiz.id);
    } catch (failure) {
      setError(asChatError(failure).message);
    } finally {
      setGenerating(false);
    }
  }

  function handleAnswer(quizId: string, questionIndex: number, optionIndex: number) {
    setQuizzes((current) => current.map((quiz) => quiz.id !== quizId ? quiz : {
      ...quiz,
      answers: quiz.answers.map((answer, index) => index === questionIndex ? optionIndex : answer),
    }));
  }

  function handleFinish(quizId: string) {
    setQuizzes((current) => current.map((quiz) => quiz.id !== quizId ? quiz : { ...quiz, submitted: true }));
    setOpenId(null);
    setShowResultsId(quizId);
  }

  if (openQuiz) {
    return <QuizTaking quiz={openQuiz} onAnswer={(q, o) => handleAnswer(openQuiz.id, q, o)} onFinish={() => handleFinish(openQuiz.id)} />;
  }
  if (resultsQuiz) {
    return <QuizResults quiz={resultsQuiz} onBack={() => setShowResultsId(null)} />;
  }

  return (
    <div className={styles.deckPanel}>
      <div className={styles.preview}>
        VORSCHAU
        <span>Tests werden mit dem echten Kurs-Chat generiert, sind aber noch nicht mit einer Datenbank verbunden. Ergebnisse gehen beim Neuladen der Seite verloren.</span>
      </div>

      <div className={styles.deckToolbar}>
        <div>
          <h2>Tests zu diesem Dokument</h2>
          <p>{quizzes.length === 0 ? "Noch kein Test erstellt" : `${quizzes.length} ${quizzes.length === 1 ? "Test" : "Tests"} verfügbar`}</p>
        </div>
        <button type="button" className={styles.runButton} onClick={() => setDialogOpen(true)}>
          <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14" /></svg>
          Test generieren
        </button>
      </div>

      {error && <p className={styles.errorHint} role="alert">{error}</p>}

      {quizzes.length === 0 ? (
        <div className={styles.panelEmpty}>
          <span className={styles.panelIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1.4.9-1.4 1.7" /><path d="M12 17h.01" /></svg>
          </span>
          <h3>Noch keine Tests</h3>
          <p>Erstelle einen Test aus den Kursunterlagen, um dein Wissen zu prüfen.</p>
        </div>
      ) : (
        <ul className={styles.deckGrid}>
          {quizzes.map((quiz) => {
            const correctCount = quiz.questions.filter((question, index) => quiz.answers[index] === question.correctIndex).length;
            const score = quiz.submitted ? Math.round((correctCount / quiz.questions.length) * 100) : null;
            return (
              <li key={quiz.id}>
                <article className={styles.deckCard}>
                  <span className={styles.quizScoreBadge}>
                    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M8 21h8M12 17v4M7 4h10v4a5 5 0 0 1-10 0V4Z" /></svg>
                    {score === null ? "Nicht gestartet" : `${score}%`}
                  </span>
                  <span className={styles.deckCardTitle}>{quiz.title}</span>
                  <span className={styles.deckCardDate}>ERSTELLT {formatShortDate(quiz.createdAt)}</span>
                  <span className={styles.deckCardCount}>{quiz.questions.length} Fragen</span>
                  {quiz.submitted ? (
                    <button type="button" className={styles.deckCardAction} onClick={() => setShowResultsId(quiz.id)}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V10M12 19V4M20 19v-7" /></svg>
                      Ergebnisse ansehen
                    </button>
                  ) : (
                    <button type="button" className={`${styles.deckCardAction} ${styles.deckCardActionPrimary}`} onClick={() => setOpenId(quiz.id)}>
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M8 5v14l11-7Z" /></svg>
                      Test starten
                    </button>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      )}

      {dialogOpen && (
        <div className={styles.backdrop} onClick={(event) => { if (event.target === event.currentTarget && !generating) setDialogOpen(false); }}>
          <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="generate-quiz-heading">
            <div className={styles.dialogHeader}>
              <h2 id="generate-quiz-heading">Neuen Test generieren</h2>
              <button type="button" className={styles.closeButton} aria-label="Schließen" onClick={() => setDialogOpen(false)} disabled={generating}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 6l12 12M18 6 6 18" /></svg>
              </button>
            </div>
            <form onSubmit={handleGenerate}>
              <div className={styles.field}>
                <label htmlFor="quiz-count">Anzahl der Fragen</label>
                <input id="quiz-count" type="number" min={3} max={10} value={count}
                  onChange={(event) => setCount(Math.min(10, Math.max(3, Number(event.target.value) || 5)))} disabled={generating} />
              </div>
              {error && <p className={styles.errorHint} role="alert">{error}</p>}
              <div className={styles.dialogFooter}>
                <button type="button" className={styles.cancelButton} onClick={() => setDialogOpen(false)} disabled={generating}>Abbrechen</button>
                <button type="submit" className={styles.submitButton} disabled={generating}>
                  {generating ? "Wird generiert …" : "Generieren"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function formatShortDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso)).toUpperCase();
}
