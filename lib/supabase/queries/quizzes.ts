import { createClient } from "@/lib/supabase/browser";
import type { Json } from "@/lib/supabase/database.types";
import type { ParsedQuizQuestion } from "@/lib/aiOutput";
import type { ChatSource } from "@/lib/chatProtocol";

export type SavedQuiz = {
  id: string;
  title: string;
  questions: ParsedQuizQuestion[];
  createdAt: string;
  answers: (number | null)[];
  submitted: boolean;
  attemptId: string | null;
  history: { id: string; createdAt: string; answers: (number | null)[]; submitted: boolean }[];
};

export async function listDocumentQuizzes(materialId: string): Promise<SavedQuiz[]> {
  const client = createClient();
  const { data: quizzes, error } = await client.from("learning_quizzes")
    .select("id,title,questions,created_at").eq("source_material_id", materialId)
    .order("created_at", { ascending: false }).limit(100);
  if (error) throw error;
  if (!quizzes.length) return [];
  const { data: attempts, error: attemptError } = await client.from("learning_quiz_attempts")
    .select("id,quiz_id,answers,submitted_at,created_at").in("quiz_id", quizzes.map((quiz) => quiz.id))
    .order("created_at", { ascending: false });
  if (attemptError) throw attemptError;
  const latest = new Map<string, (typeof attempts)[number]>();
  for (const attempt of attempts) if (!latest.has(attempt.quiz_id)) latest.set(attempt.quiz_id, attempt);
  return quizzes.map((row) => {
    const questions = row.questions as ParsedQuizQuestion[];
    const attempt = latest.get(row.id);
    const savedAnswers = Array.isArray(attempt?.answers) ? attempt.answers : [];
    return {
      id: row.id, title: row.title, questions, createdAt: row.created_at,
      answers: questions.map((_, index) => typeof savedAnswers[index] === "number" ? savedAnswers[index] as number : null),
      submitted: Boolean(attempt?.submitted_at), attemptId: attempt?.id ?? null,
      history: attempts.filter((entry) => entry.quiz_id === row.id).map((entry) => ({
        id: entry.id, createdAt: entry.created_at, submitted: Boolean(entry.submitted_at),
        answers: questions.map((_, index) => {
          const value = Array.isArray(entry.answers) ? entry.answers[index] : null;
          return typeof value === "number" ? value : null;
        }),
      })),
    };
  });
}

export async function saveDocumentQuiz(courseId: string, materialId: string, title: string,
  questions: ParsedQuizQuestion[], sources: ChatSource[]): Promise<string> {
  const { data, error } = await createClient().rpc("save_learning_quiz", {
    p_course: courseId, p_source_material: materialId, p_title: title,
    p_questions: questions as Json,
    p_sources: sources.filter((source) => source.chunk_id).map((source) => ({ chunk_id: source.chunk_id })),
  });
  if (error) throw error;
  return data;
}

export async function startQuizAttempt(quizId: string): Promise<string> {
  const client = createClient();
  const { data: user, error: authError } = await client.auth.getUser();
  if (authError || !user.user) throw authError ?? new Error("Nicht angemeldet");
  const { data, error } = await client.from("learning_quiz_attempts")
    .insert({ quiz_id: quizId, user_id: user.user.id, answers: [] }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function saveQuizAnswers(attemptId: string, answers: (number | null)[], submit: boolean): Promise<void> {
  const { data, error } = await createClient().from("learning_quiz_attempts")
    .update({ answers, ...(submit ? { submitted_at: new Date().toISOString() } : {}) })
    .eq("id", attemptId).is("submitted_at", null).select("id").single();
  if (error || !data) throw error ?? new Error("Der Versuch ist nicht mehr bearbeitbar.");
}
