"use client";

import { useState, type FormEvent } from "react";
import { createClient } from "@/lib/supabase/browser";
import { createConversation, sendChat } from "@/lib/chat";
import { ChatError, withMaterialScope } from "@/lib/chatProtocol";
import { cleanProse } from "@/lib/aiOutput";
import { saveCourseSummary } from "@/lib/supabase/queries/summaries";
import styles from "@/components/documents/documents.module.css";

function asChatError(error: unknown): ChatError {
  return error instanceof ChatError ? error : new ChatError("LOAD_FAILED");
}

// UniVerse has no dedicated "summarize" or "explain" AI endpoint. Both actions
// below ask the same real course RAG chat (lib/chat.ts) a crafted one-off
// question, scoped to the open document via `material_ids`, and show the
// answer — a real AI action, not a canned response.
async function askOnce(courseId: string, materialId: string, question: string): Promise<string> {
  const client = createClient();
  const conversation = await createConversation(client, courseId);
  const exchange = await sendChat(client, withMaterialScope({ conversation_id: conversation.id, request_id: crypto.randomUUID(), question }, materialId));
  const answer = exchange.messages.find((message) => message.role === "assistant");
  if (!answer) throw new ChatError("INVALID_ANSWER_RESPONSE");
  // Free prose stays free; only citation markers are removed and an empty answer is an error.
  const text = cleanProse(answer.content);
  if (!text) throw new ChatError("UNUSABLE_AI_OUTPUT");
  return text;
}

export default function DocumentAiActions({ courseId, courseTitle, fileName, materialId }: { courseId: string; courseTitle: string; fileName: string; materialId: string }) {
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryResult, setSummaryResult] = useState<string | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [savingSummary, setSavingSummary] = useState(false);
  const [summarySaved, setSummarySaved] = useState(false);

  const [topic, setTopic] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);
  const [explainResult, setExplainResult] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);

  async function handleSummarize() {
    setSummaryLoading(true);
    setSummaryError(null);
    setSummarySaved(false);
    try {
      const answer = await askOnce(courseId, materialId, `Fasse den Inhalt der Kursunterlagen kurz und verständlich zusammen. Achte besonders auf "${fileName}", falls dort relevanter Text indexiert ist.`);
      setSummaryResult(answer);
    } catch (error) {
      setSummaryError(asChatError(error).message);
    } finally {
      setSummaryLoading(false);
    }
  }

  async function handleSaveSummary() {
    if (!summaryResult) return;
    setSavingSummary(true);
    try {
      await saveCourseSummary(courseId, { title: courseTitle, text: summaryResult });
      setSummarySaved(true);
    } catch {
      setSummaryError("Die Zusammenfassung konnte nicht gespeichert werden.");
    } finally {
      setSavingSummary(false);
    }
  }

  async function handleExplain(event: FormEvent) {
    event.preventDefault();
    const trimmed = topic.trim();
    if (!trimmed || explainLoading) return;
    setExplainLoading(true);
    setExplainError(null);
    try {
      const answer = await askOnce(courseId, materialId, `Erkläre das Konzept "${trimmed}" verständlich anhand der Kursunterlagen. Nutze wenn möglich ein Beispiel.`);
      setExplainResult(answer);
    } catch (error) {
      setExplainError(asChatError(error).message);
    } finally {
      setExplainLoading(false);
    }
  }

  return (
    <div className={styles.aiActions}>
      <div className={styles.aiHeader}>
        <span className={styles.aiHeaderIcon} aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v3M12 18v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M3 12h3M18 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /><circle cx="12" cy="12" r="3.2" /></svg>
        </span>
        <div>
          <h2>KI-Aktionen</h2>
          <p>Angetrieben von der Dokumentensuche dieses Kurses.</p>
        </div>
      </div>

      <div className={styles.actionCard}>
        <div className={styles.actionCardHead}>
          <span className={styles.actionIconBadge} data-tone="blue" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M6 4h9l3 3v13a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" /><path d="M8 9h8M8 13h8M8 17h5" /></svg>
          </span>
          <div>
            <h3>Zusammenfassung erstellen</h3>
            <p>Lass dir den Inhalt der Kursunterlagen in wenigen Sätzen zusammenfassen.</p>
          </div>
          <button type="button" className={styles.runButton} onClick={() => void handleSummarize()} disabled={summaryLoading}>
            {summaryLoading ? "Wird erstellt …" : "Zusammenfassen"}
          </button>
        </div>
        {summaryError && <p className={styles.errorHint} role="alert">{summaryError}</p>}
        {summaryResult && (
          <div className={styles.actionResult}>
            <p>{summaryResult}</p>
            <button type="button" className={styles.viewerLink} onClick={() => void handleSaveSummary()} disabled={savingSummary || summarySaved}>
              {summarySaved ? "Als Kurs-Zusammenfassung gespeichert ✓" : savingSummary ? "Wird gespeichert …" : "Als Kurs-Zusammenfassung übernehmen"}
            </button>
          </div>
        )}
      </div>

      <div className={styles.actionCard}>
        <div className={styles.actionCardHead}>
          <span className={styles.actionIconBadge} data-tone="amber" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 21h4" /><path d="M12 3a6 6 0 0 0-3.5 10.9c.6.4.9 1 .9 1.6v.5h5.2v-.5c0-.6.3-1.2.9-1.6A6 6 0 0 0 12 3Z" /></svg>
          </span>
          <div>
            <h3>Konzept erklären</h3>
            <p>Gib ein Thema oder einen Begriff aus den Unterlagen ein, um eine ausführliche Erklärung zu erhalten.</p>
          </div>
        </div>
        <form className={styles.actionInputRow} onSubmit={handleExplain}>
          <input value={topic} onChange={(event) => setTopic(event.target.value)} placeholder="z. B. „Man-in-the-Middle-Angriff“" disabled={explainLoading} />
          <button type="submit" className={styles.runButton} disabled={explainLoading || !topic.trim()}>
            {explainLoading ? "Wird erklärt …" : "Erklären"}
          </button>
        </form>
        {explainError && <p className={styles.errorHint} role="alert">{explainError}</p>}
        {explainResult && <div className={styles.actionResult}><p>{explainResult}</p></div>}
      </div>
    </div>
  );
}
