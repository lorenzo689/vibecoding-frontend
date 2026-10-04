// Reine Regeln für gespeicherte Tests — ohne Supabase-Client, damit sie testbar bleiben.
// Sie spiegeln die Grenzen aus Backend-Migration 20261003142000.

export type QuizQuestion = {
  question: string;
  options: string[];
  correctIndex: number;
};

export const QUIZ_MIN_QUESTIONS = 1;
export const QUIZ_MAX_QUESTIONS = 10;
export const QUIZ_TITLE_MAX = 200;
export const QUIZ_QUESTION_MAX = 1000;
export const QUIZ_OPTION_MAX = 2000;

export type QuizValidation = { ok: true } | { ok: false; message: string };

export function validateQuiz(title: string, questions: QuizQuestion[]): QuizValidation {
  const name = title.trim();
  if (name.length === 0) return { ok: false, message: "Gib dem Test einen Namen." };
  if (name.length > QUIZ_TITLE_MAX) {
    return { ok: false, message: `Der Name darf höchstens ${QUIZ_TITLE_MAX} Zeichen haben.` };
  }
  if (questions.length < QUIZ_MIN_QUESTIONS || questions.length > QUIZ_MAX_QUESTIONS) {
    return { ok: false, message: `Ein Test braucht ${QUIZ_MIN_QUESTIONS}–${QUIZ_MAX_QUESTIONS} Fragen.` };
  }
  for (const question of questions) {
    const text = question.question.trim();
    if (text.length === 0 || text.length > QUIZ_QUESTION_MAX) {
      return { ok: false, message: "Jede Frage braucht einen Text." };
    }
    if (question.options.length !== 4 || question.options.some((option) => option.trim().length === 0)) {
      return { ok: false, message: "Jede Frage braucht genau vier ausgefüllte Antworten." };
    }
    if (question.options.some((option) => option.trim().length > QUIZ_OPTION_MAX)) {
      return { ok: false, message: `Eine Antwort darf höchstens ${QUIZ_OPTION_MAX} Zeichen haben.` };
    }
    if (
      !Number.isInteger(question.correctIndex) ||
      question.correctIndex < 0 ||
      question.correctIndex > 3
    ) {
      return { ok: false, message: "Bei jeder Frage muss genau eine richtige Antwort markiert sein." };
    }
  }
  return { ok: true };
}

/**
 * Ein Versuch ist abgabebereit, wenn jede Frage beantwortet ist — das verlangt das
 * Backend bei `submit`, und ein vorher abgeschickter Versuch würde abgelehnt.
 */
export function isAttemptComplete(answers: (number | null)[], questionCount: number): boolean {
  return answers.length === questionCount && answers.every((answer) => answer !== null);
}
