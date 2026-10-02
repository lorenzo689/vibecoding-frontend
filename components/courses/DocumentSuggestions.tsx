"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { runTemporaryChat } from "@/lib/chat";
import { ChatError } from "@/lib/chatProtocol";
import { SUGGESTIONS_PROMPT, parseSuggestions } from "@/lib/suggestionsParse";
import {
  acceptSuggestion,
  listSuggestions,
  reviewSuggestion,
  saveSuggestions,
  type DocumentSuggestion,
} from "@/lib/supabase/queries/document-suggestions";
import type { CalendarEventKind } from "@/lib/supabase/queries/calendar-map";
import styles from "./reader.module.css";

const EVENT_KIND_LABELS: Record<CalendarEventKind, string> = {
  lecture: "Vorlesung", exercise: "Übung", study: "Lernzeit", presentation: "Präsentation", exam: "Prüfung", deadline: "Abgabe/Frist", other: "Sonstiges",
};

export function guessEventKind(title: string): CalendarEventKind {
  if (/klausur|prüfung|pruefung|exam|test/i.test(title)) return "exam";
  if (/abgabe|frist|deadline|anmeldung/i.test(title)) return "deadline";
  if (/präsentation|praesentation|vortrag|referat/i.test(title)) return "presentation";
  if (/übung|uebung/i.test(title)) return "exercise";
  return "other";
}

function pad(value: number): string { return String(value).padStart(2, "0"); }

function toInputs(suggestion: DocumentSuggestion): { date: string; time: string } {
  const start = new Date(suggestion.startsAt ?? Date.now());
  if (suggestion.allDay) return { date: start.toISOString().slice(0, 10), time: "" };
  return { date: `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`, time: `${pad(start.getHours())}:${pad(start.getMinutes())}` };
}

function DateReview({ suggestion, busy, onConfirm, onCancel }: {
  suggestion: DocumentSuggestion; busy: boolean; onConfirm: (correction: { title: string; startsAt: string; allDay: boolean; eventKind: CalendarEventKind }) => void; onCancel: () => void;
}) {
  const initial = toInputs(suggestion);
  const [title, setTitle] = useState(suggestion.title);
  const [date, setDate] = useState(initial.date);
  const [time, setTime] = useState(initial.time);
  const [kind, setKind] = useState<CalendarEventKind>(guessEventKind(suggestion.title));
  const valid = title.trim() !== "" && date !== "";

  function confirm() {
    if (!valid) return;
    const allDay = time === "";
    onConfirm({ title: title.trim(), allDay, eventKind: kind, startsAt: allDay ? `${date}T12:00:00.000Z` : new Date(`${date}T${time}`).toISOString() });
  }

  return (
    <div className={styles.review} role="group" aria-label={`Termin „${suggestion.title}“ prüfen`}>
      <label>Titel<input value={title} maxLength={200} onChange={(event) => setTitle(event.target.value)} /></label>
      <label>Datum<input type="date" value={date} onChange={(event) => setDate(event.target.value)} /></label>
      <label>Uhrzeit (leer = ganztägig)<input type="time" value={time} onChange={(event) => setTime(event.target.value)} /></label>
      <label>Art
        <select value={kind} onChange={(event) => setKind(event.target.value as CalendarEventKind)}>
          {Object.entries(EVENT_KIND_LABELS).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
      </label>
      <span className={styles.rowActions}>
        <button type="button" disabled={busy || !valid} onClick={confirm}>In Kalender übernehmen</button>
        <button type="button" disabled={busy} onClick={onCancel}>Abbrechen</button>
      </span>
    </div>
  );
}

export default function DocumentSuggestions({ courseId, materialId }: { courseId: string; materialId: string }) {
  const [items, setItems] = useState<DocumentSuggestion[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listSuggestions(materialId)
      .then((rows) => { if (active) setItems(rows); })
      .catch(() => { if (active) { setItems([]); setError("Vorschläge konnten nicht geladen werden."); } });
    return () => { active = false; };
  }, [materialId]);

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    setNotice(null);
    try {
      const exchange = await runTemporaryChat(createClient(), courseId, materialId, SUGGESTIONS_PROMPT);
      const answer = exchange.messages.find((message) => message.role === "assistant")?.content ?? "";
      const parsed = parseSuggestions(answer);
      if (parsed.suggestions.length === 0) throw new ChatError("UNUSABLE_AI_OUTPUT");
      const added = await saveSuggestions(materialId, parsed.suggestions);
      setItems(await listSuggestions(materialId));
      setNotice(added === 0 ? "Keine neuen Vorschläge – alles Erkannte war schon vorhanden."
        : `${added} neue Vorschläge${parsed.discarded > 0 ? `, ${parsed.discarded} unbrauchbare Zeilen verworfen` : ""}.`);
    } catch (failure) {
      setError(failure instanceof ChatError ? failure.message : "Die Analyse ist fehlgeschlagen.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function change(id: string, action: () => Promise<DocumentSuggestion["status"]>, failure: string) {
    setBusy(true);
    setError(null);
    try {
      const status = await action();
      setItems((rows) => (rows ?? []).map((row) => row.id === id ? { ...row, status } : row));
      setReviewingId(null);
    } catch {
      setError(failure);
    } finally {
      setBusy(false);
    }
  }

  if (items === null) return <p className={styles.muted} aria-live="polite">Vorschläge werden geladen …</p>;

  const groups: { kind: DocumentSuggestion["kind"]; title: string }[] = [
    { kind: "date", title: "Termine" }, { kind: "definition", title: "Definitionen" }, { kind: "topic", title: "Themen" },
  ];

  return (
    <div className={styles.reader}>
      <p className={styles.muted}>Die KI schlägt Themen, Definitionen und Termine aus dem Dokumenttext vor. Nichts davon gilt als bestätigt und nichts landet ohne dein Okay im Kalender.</p>
      <div className={styles.toolbar}>
        <button type="button" onClick={() => void analyze()} disabled={analyzing}>{analyzing ? "Dokument wird analysiert …" : items.length > 0 ? "Erneut analysieren" : "Dokument analysieren"}</button>
      </div>
      {notice && <p className={styles.muted} role="status">{notice}</p>}
      {error && <p className={styles.error} role="alert">{error}</p>}
      {groups.map(({ kind, title }) => {
        const rows = items.filter((item) => item.kind === kind);
        if (rows.length === 0) return null;
        return (
          <section key={kind} className={styles.group}>
            <h3>{title}</h3>
            <ul className={styles.notes}>
              {rows.map((row) => (
                <li key={row.id} data-status={row.status}>
                  <span className={styles.label}>
                    {row.status === "accepted" ? "BESTÄTIGT" : row.status === "rejected" ? "ABGELEHNT" : "VORGESCHLAGEN · NICHT BESTÄTIGT"}
                  </span>
                  <strong>{row.title}</strong>
                  {row.kind === "date" && row.startsAt && (
                    <p>{row.allDay
                      ? new Date(row.startsAt).toLocaleDateString("de-DE", { dateStyle: "long", timeZone: "UTC" })
                      : new Date(row.startsAt).toLocaleString("de-DE", { dateStyle: "long", timeStyle: "short" })}</p>
                  )}
                  {row.detail && <p>{row.detail}</p>}
                  {row.quote && <blockquote>{row.quote}</blockquote>}
                  <p className={styles.source}>Quelle: {row.pageNumber ? `Seite ${row.pageNumber}` : "Dokument"}</p>
                  {reviewingId === row.id && row.kind === "date" ? (
                    <DateReview suggestion={row} busy={busy} onCancel={() => setReviewingId(null)}
                      onConfirm={(correction) => void change(row.id, async () => { await acceptSuggestion(row.id, correction); return "accepted"; }, "Der Termin konnte nicht übernommen werden.")} />
                  ) : (
                    <span className={styles.rowActions}>
                      {row.status === "pending" && (
                        <>
                          {row.kind === "date"
                            ? <button type="button" disabled={busy} onClick={() => setReviewingId(row.id)}>Prüfen und übernehmen</button>
                            : <button type="button" disabled={busy} onClick={() => void change(row.id, async () => { await acceptSuggestion(row.id); return "accepted"; }, "Das konnte nicht bestätigt werden.")}>Bestätigen</button>}
                          <button type="button" disabled={busy} onClick={() => void change(row.id, async () => { await reviewSuggestion(row.id, "rejected"); return "rejected"; }, "Das konnte nicht abgelehnt werden.")}>Ablehnen</button>
                        </>
                      )}
                      {row.status === "rejected" && <button type="button" disabled={busy} onClick={() => void change(row.id, async () => { await reviewSuggestion(row.id, "pending"); return "pending"; }, "Das konnte nicht zurückgenommen werden.")}>Wieder öffnen</button>}
                      {row.status === "accepted" && row.kind === "date" && <Link href="/calendar">Im Kalender ansehen</Link>}
                      {row.status === "accepted" && row.kind !== "date" && <button type="button" disabled={busy} onClick={() => void change(row.id, async () => { await reviewSuggestion(row.id, "pending"); return "pending"; }, "Das konnte nicht zurückgenommen werden.")}>Zurücknehmen</button>}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
