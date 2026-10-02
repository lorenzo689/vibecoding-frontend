"use client";

import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { runTemporaryChat } from "@/lib/chat";
import { ChatError } from "@/lib/chatProtocol";
import { cleanProse } from "@/lib/aiOutput";
import { getDocumentPages, type DocumentPage } from "@/lib/supabase/queries/document-pages";
import { createNote, deleteNote, listNotes, updateNote, type DocumentNote } from "@/lib/supabase/queries/document-notes";
import styles from "./reader.module.css";

type Segment = { text: string; highlighted: boolean };

/** Marks the first occurrence of every highlight quote; overlapping quotes are skipped, never merged. */
export function segmentPage(text: string, quotes: string[]): Segment[] {
  const ranges: [number, number][] = [];
  for (const quote of quotes) {
    const start = text.indexOf(quote);
    if (start < 0 || ranges.some(([from, to]) => start < to && start + quote.length > from)) continue;
    ranges.push([start, start + quote.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const segments: Segment[] = [];
  let cursor = 0;
  for (const [from, to] of ranges) {
    if (from > cursor) segments.push({ text: text.slice(cursor, from), highlighted: false });
    segments.push({ text: text.slice(from, to), highlighted: true });
    cursor = to;
  }
  if (cursor < text.length) segments.push({ text: text.slice(cursor), highlighted: false });
  return segments;
}

export default function DocumentReader({ courseId, materialId, fileId, fileName }: {
  courseId: string; materialId: string; fileId: string; fileName: string;
}) {
  const [pages, setPages] = useState<DocumentPage[] | null | undefined>(undefined);
  const [notes, setNotes] = useState<DocumentNote[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState("");
  const [quote, setQuote] = useState("");
  const [busy, setBusy] = useState(false);
  const [explanation, setExplanation] = useState<{ page: number; text: string } | null>(null);
  const [explaining, setExplaining] = useState(false);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getDocumentPages(materialId), listNotes(materialId)])
      .then(([nextPages, nextNotes]) => { if (active) { setPages(nextPages); setNotes(nextNotes); } })
      .catch(() => { if (active) { setPages(null); setLoadError("Seiten und Notizen konnten nicht geladen werden."); } });
    return () => { active = false; };
  }, [materialId]);

  const current = pages?.[index] ?? null;
  const pageNotes = useMemo(() => notes.filter((note) => note.pageNumber === current?.page), [notes, current]);
  const segments = useMemo(
    () => current ? segmentPage(current.text, pageNotes.filter((note) => note.quote).map((note) => note.quote!)) : [],
    [current, pageNotes],
  );
  const openByPage = useMemo(() => {
    const counts = new Map<number, number>();
    for (const note of notes) if (note.kind === "note" && note.status === "open") counts.set(note.pageNumber, (counts.get(note.pageNumber) ?? 0) + 1);
    return counts;
  }, [notes]);

  function captureSelection() {
    const selection = window.getSelection();
    const text = selection?.toString().trim() ?? "";
    if (!text || !textRef.current || !selection?.anchorNode || !textRef.current.contains(selection.anchorNode)) return;
    setQuote(text.slice(0, 2000));
  }

  async function run(action: () => Promise<void>, failure: string) {
    setBusy(true);
    setActionError(null);
    try { await action(); } catch { setActionError(failure); } finally { setBusy(false); }
  }

  function addNote(event: FormEvent) {
    event.preventDefault();
    if (!current || !draft.trim()) return;
    void run(async () => {
      const created = await createNote({ materialId, pageNumber: current.page, kind: "note", body: draft, quote: quote || null });
      setNotes((list) => [...list, created]);
      setDraft(""); setQuote("");
    }, "Die Notiz konnte nicht gespeichert werden.");
  }

  function addHighlight() {
    if (!current || !quote) return;
    void run(async () => {
      const created = await createNote({ materialId, pageNumber: current.page, kind: "highlight", body: "", quote });
      setNotes((list) => [...list, created]);
      setQuote("");
    }, "Die Markierung konnte nicht gespeichert werden.");
  }

  function toggleStatus(note: DocumentNote) {
    void run(async () => {
      const saved = await updateNote(note.id, { status: note.status === "open" ? "resolved" : "open" });
      setNotes((list) => list.map((item) => item.id === saved.id ? saved : item));
    }, "Der Status konnte nicht gespeichert werden.");
  }

  function remove(note: DocumentNote) {
    void run(async () => {
      await deleteNote(note.id);
      setNotes((list) => list.filter((item) => item.id !== note.id));
    }, "Der Eintrag konnte nicht gelöscht werden.");
  }

  async function explainPage() {
    if (!current || explaining) return;
    setExplaining(true);
    setActionError(null);
    try {
      const excerpt = current.text.slice(0, 1000);
      const exchange = await runTemporaryChat(createClient(), courseId, materialId,
        `Erkläre den folgenden Ausschnitt von Seite ${current.page} aus "${fileName}" verständlich in wenigen Sätzen und gib ein kurzes Beispiel:\n${excerpt}`);
      const answer = exchange.messages.find((message) => message.role === "assistant")?.content ?? "";
      const text = cleanProse(answer);
      if (!text) throw new ChatError("UNUSABLE_AI_OUTPUT");
      setExplanation({ page: current.page, text });
    } catch (failure) {
      setActionError(failure instanceof ChatError ? failure.message : "Die Erklärung konnte nicht erstellt werden.");
    } finally {
      setExplaining(false);
    }
  }

  if (pages === undefined) return <p className={styles.muted} aria-live="polite">Seiten werden geladen …</p>;
  if (loadError) return <p className={styles.error} role="alert">{loadError}</p>;
  if (!pages || pages.length === 0 || !current) {
    return <p className={styles.muted}>Für dieses Dokument liegt noch kein extrahierter Text vor. Die seitenweise Ansicht erscheint, sobald die Verarbeitung abgeschlossen ist.</p>;
  }

  const unresolved = notes.filter((note) => note.kind === "note" && note.status === "open");

  return (
    <div className={styles.reader}>
      <div className={styles.pager}>
        <button type="button" onClick={() => { setIndex((value) => Math.max(0, value - 1)); setQuote(""); }} disabled={index === 0} aria-label="Vorherige Seite">←</button>
        <label className={styles.pageSelect}>
          Seite
          <select value={index} onChange={(event) => { setIndex(Number(event.target.value)); setQuote(""); }}>
            {pages.map((page, pageIndex) => (
              <option key={page.page} value={pageIndex}>{page.page}{openByPage.get(page.page) ? ` · ${openByPage.get(page.page)} offen` : ""}</option>
            ))}
          </select>
          <span>von {pages.length}</span>
        </label>
        <button type="button" onClick={() => { setIndex((value) => Math.min(pages.length - 1, value + 1)); setQuote(""); }} disabled={index === pages.length - 1} aria-label="Nächste Seite">→</button>
      </div>

      <div ref={textRef} className={styles.pageText} onMouseUp={captureSelection} onKeyUp={captureSelection} tabIndex={0} aria-label={`Text von Seite ${current.page}`}>
        {current.text.trim()
          ? segments.map((segment, position) => segment.highlighted ? <mark key={position}>{segment.text}</mark> : <span key={position}>{segment.text}</span>)
          : <em>Auf dieser Seite wurde kein Text erkannt (z. B. ein Bild oder Scan; OCR wird nicht unterstützt).</em>}
      </div>

      <div className={styles.toolbar}>
        <button type="button" onClick={addHighlight} disabled={busy || !quote}>Auswahl markieren</button>
        <button type="button" onClick={() => void explainPage()} disabled={explaining || !current.text.trim()}>{explaining ? "Wird erklärt …" : "Seite erklären"}</button>
      </div>
      {quote && <p className={styles.quote}>Ausgewählt: „{quote.length > 160 ? `${quote.slice(0, 160)} …` : quote}“</p>}

      {explanation && explanation.page === current.page && (
        <aside className={styles.explanation} aria-label="Erklärung">
          <span className={styles.label}>KI-ERKLÄRUNG · nicht gespeichert</span>
          <p>{explanation.text}</p>
        </aside>
      )}

      <form className={styles.noteForm} onSubmit={addNote}>
        <label htmlFor="page-note">Notiz zu Seite {current.page}{quote ? " (mit Auswahl)" : ""}</label>
        <textarea id="page-note" value={draft} maxLength={4000} onChange={(event) => setDraft(event.target.value)} disabled={busy} />
        <button type="submit" disabled={busy || !draft.trim()}>Notiz speichern</button>
      </form>
      {actionError && <p className={styles.error} role="alert">{actionError}</p>}

      <ul className={styles.notes} aria-label={`Notizen und Markierungen auf Seite ${current.page}`}>
        {pageNotes.map((note) => (
          <li key={note.id} data-status={note.status}>
            <span className={styles.label}>{note.kind === "highlight" ? "MARKIERUNG" : note.status === "open" ? "OFFENE NOTIZ" : "ERLEDIGT"}</span>
            {note.quote && <blockquote>{note.quote}</blockquote>}
            {note.body && <p>{note.body}</p>}
            <span className={styles.rowActions}>
              {note.kind === "note" && <button type="button" disabled={busy} onClick={() => toggleStatus(note)}>{note.status === "open" ? "Als erledigt markieren" : "Wieder öffnen"}</button>}
              <button type="button" disabled={busy} onClick={() => remove(note)}>Löschen</button>
            </span>
          </li>
        ))}
      </ul>

      {unresolved.length > 0 && (
        <section className={styles.unresolved} aria-label="Offene Notizen in diesem Dokument">
          <h3>Offene Notizen ({unresolved.length})</h3>
          <ul>
            {unresolved.map((note) => (
              <li key={note.id}>
                <button type="button" onClick={() => setIndex(Math.max(0, pages.findIndex((page) => page.page === note.pageNumber)))}>
                  Seite {note.pageNumber}: {note.body.length > 70 ? `${note.body.slice(0, 70)} …` : note.body}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
      <Link className={styles.pdfLink} href={`/courses/${courseId}/documents/${fileId}?page=${current.page}`}>Diese Seite im Original öffnen</Link>
    </div>
  );
}
