"use client";

import { useState } from "react";
import shared from "@/components/dashboard.module.css";
import s from "./documents.module.css";

// Fixed presentation fixtures, not persisted records or an API contract.
const statusLabels = {
  ready: "Bereit",
  processing: "Wird analysiert",
  queued: "In Warteschlange",
  failed: "Fehlgeschlagen",
} as const;

type ExampleDocument = {
  id: string;
  title: string;
  course: string;
  lecture: string;
  pages: number;
  date: string;
  status: keyof typeof statusLabels;
  detail: string;
};

const documents: ExampleDocument[] = [
  {
    id: "vibe", title: "Vibe Coding Setup.pdf", course: "Neue Konzepte",
    lecture: "Lecture 03 · Vibe Coding Setup", pages: 18, date: "2026-10-05",
    status: "ready", detail: "Zuletzt Folie 8 · 3 offene Notizen",
  },
  {
    id: "network", title: "Network Security.pdf", course: "IT Security",
    lecture: "Lecture 08 · Network Security", pages: 24, date: "2026-10-12",
    status: "processing", detail: "8 von 24 Seiten verarbeitet · Beispielstand",
  },
  {
    id: "threat", title: "Threat Modeling Lab.pdf", course: "Advanced Practical IT Security",
    lecture: "Lab 04 · Threat Modeling", pages: 12, date: "2026-10-12",
    status: "queued", detail: "Analyse wird vorbereitet · Beispielstand",
  },
  {
    id: "protocols", title: "Security Protocols.pdf", course: "IT Security",
    lecture: "Lecture 07 · Security Protocols", pages: 20, date: "2026-10-08",
    status: "failed", detail: "Analyse konnte nicht abgeschlossen werden. Lernmaterialien sind noch nicht verfügbar.",
  },
  {
    id: "foundations", title: "Software Foundations.pdf", course: "Neue Konzepte",
    lecture: "Lecture 02 · Software Foundations", pages: 16, date: "2026-10-02",
    status: "ready", detail: "Zuletzt Folie 16 · Keine offenen Notizen",
  },
];

const filters = [
  { value: "all", label: "Alle Unterlagen" },
  { value: "ready", label: "Bereit" },
  { value: "processing", label: "In Verarbeitung" },
  { value: "failed", label: "Aufmerksamkeit nötig" },
] as const;
type Filter = (typeof filters)[number]["value"];

function matchesStatus(document: ExampleDocument, filter: Filter) {
  return filter === "all" || document.status === filter || (filter === "processing" && document.status === "queued");
}

export default function DocumentList() {
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const matchingCourseAndQuery = documents.filter((document) =>
    (!course || document.course === course) &&
    `${document.title} ${document.course} ${document.lecture}`.toLocaleLowerCase("de-DE").includes(query.trim().toLocaleLowerCase("de-DE")),
  );
  const visible = matchingCourseAndQuery.filter((document) => matchesStatus(document, filter));

  function resetFilters() {
    setQuery("");
    setCourse("");
    setFilter("all");
  }

  return (
    <section className={s.library} aria-labelledby="library-heading">
      <div className={shared.sectionHeader}>
        <h2 id="library-heading">Dein Vorlesungsmaterial <small>{String(documents.length).padStart(2, "0")}</small></h2>
        <small>BEISPIELBIBLIOTHEK</small>
      </div>
      <div className={s.searchRow}>
        <div>
          <label htmlFor="document-search">Unterlagen durchsuchen</label>
          <input id="document-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titel, Kurs oder Vorlesung suchen …" aria-controls="document-results" />
        </div>
        <div>
          <label htmlFor="document-course">Nach Kurs filtern</label>
          <select id="document-course" value={course} onChange={(event) => setCourse(event.target.value)} aria-controls="document-results">
            <option value="">Alle Kurse</option>
            {[...new Set(documents.map((document) => document.course))].map((name) => <option key={name} value={name}>{name}</option>)}
          </select>
        </div>
      </div>
      <div className={s.filters} role="group" aria-label="Nach Verarbeitungsstatus filtern">
        {filters.map((item) => (
          <button key={item.value} type="button" aria-pressed={filter === item.value} aria-controls="document-results" onClick={() => setFilter(item.value)}>
            {item.label} <span>{matchingCourseAndQuery.filter((document) => matchesStatus(document, item.value)).length}</span>
          </button>
        ))}
      </div>
      <p className={s.resultCount} role="status">{visible.length} von {documents.length} Beispielunterlagen · Suche und Filter werden nicht gespeichert.</p>
      <ul id="document-results" className={s.documentList}>
        {visible.map((document) => (
          <li key={document.id}>
            <article className={s.documentRow} aria-labelledby={`document-${document.id}`}>
              <div className={s.fileIcon} aria-hidden="true">PDF</div>
              <div className={s.documentInfo}>
                <p className={s.course}>{document.course}</p>
                <h3 id={`document-${document.id}`}>{document.title}</h3>
                <p className={s.lecture}>{document.lecture}</p>
                <p className={s.fileMeta}>PDF · {document.pages} Seiten · <time dateTime={document.date}>{document.date.split("-").reverse().join(".")}</time></p>
              </div>
              <div className={s.processingInfo}>
                <span className={s.status} data-status={document.status}>
                  <span aria-hidden="true">{document.status === "ready" ? "✓" : document.status === "failed" ? "!" : document.status === "queued" ? "…" : "◷"}</span>
                  {statusLabels[document.status]}
                </span>
                <p>{document.detail}</p>
                {document.status === "processing" && <progress className={s.analysisProgress} max={24} value={8} aria-label={`Beispielanalyse ${document.title}: 8 von 24 Seiten`} />}
                {document.status === "failed" && <>
                  <button type="button" className={s.retry} disabled aria-describedby="retry-note">Erneut versuchen</button>
                  <small id="retry-note">In der Vorschau nicht verfügbar.</small>
                </>}
              </div>
            </article>
          </li>
        ))}
      </ul>
      {visible.length === 0 && <div className={s.empty}>
        <h3>Hier ist noch Platz für einen Treffer.</h3>
        <p>Keine Beispielunterlagen passen zu dieser Kombination. Ändere die Suche oder setze die Filter zurück.</p>
        <button type="button" onClick={resetFilters}>Suche und Filter zurücksetzen</button>
      </div>}
    </section>
  );
}
