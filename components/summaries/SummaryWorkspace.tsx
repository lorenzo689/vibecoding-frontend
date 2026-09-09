"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDate, statusLabels, summaries, type SummaryStatus } from "./examples";
import shared from "@/components/dashboard.module.css";
import s from "./summaries.module.css";

type Filter = "all" | "ready" | "processing" | "failed";

function matchesFilter(status: SummaryStatus, filter: Filter) {
  return filter === "all" || status === filter || (filter === "processing" && status === "queued");
}

const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Alle" },
  { value: "ready", label: "Bereit" },
  { value: "processing", label: "In Verarbeitung" },
  { value: "failed", label: "Aufmerksamkeit nötig" },
];

export default function SummaryWorkspace() {
  const [query, setQuery] = useState("");
  const [course, setCourse] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState("vibe-coding");
  const selected = summaries.find((summary) => summary.id === selectedId)!;
  const matchingContext = summaries.filter((summary) => {
    const haystack = `${summary.title} ${summary.course} ${summary.lecture} ${summary.document}`
      .toLocaleLowerCase("de-DE");
    return (!course || summary.course === course) &&
      haystack.includes(query.trim().toLocaleLowerCase("de-DE"));
  });
  const visible = matchingContext.filter((summary) => matchesFilter(summary.status, filter));

  function resetFilters() {
    setQuery("");
    setCourse("");
    setFilter("all");
  }

  return (
    <>
      <section className={s.featured} aria-labelledby="recent-summary-heading">
        <div className={s.featuredMark} aria-hidden="true"><span>03</span><i /><i /><i /></div>
        <div className={s.featuredCopy}>
          <div className={s.featuredMeta}>
            <span>KI-GENERIERTER BEISPIELINHALT</span>
            <span className={s.readyBadge}>Bereit</span>
          </div>
          <h2 id="recent-summary-heading">Vibe Coding Setup</h2>
          <p className={s.contextTrail}>Neue Konzepte <span>→</span> Lecture 03 <span>→</span> Vibe Coding Setup.pdf <span>→</span> 18 Folien</p>
          <p className={s.featuredDescription}>Zuletzt angesehen am 12.10.2026 · Verbunden mit 3 offenen Notizen und 24 Beispielkarteikarten.</p>
          <a href="#summary-reader" onClick={() => setSelectedId("vibe-coding")}>Zusammenfassung weiterlesen <span aria-hidden="true">↓</span></a>
        </div>
      </section>

      <div className={s.workspace}>
        <aside className={s.library} aria-labelledby="summary-library-heading">
          <div className={shared.sectionHeader}>
            <h2 id="summary-library-heading">Bibliothek <small>{String(summaries.length).padStart(2, "0")}</small></h2>
            <small>BEISPIELE</small>
          </div>
          <div className={s.searchFields}>
            <label htmlFor="summary-search">Zusammenfassungen durchsuchen</label>
            <input id="summary-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titel, Kurs oder Dokument …" aria-controls="summary-results" />
            <label htmlFor="summary-course">Nach Kurs filtern</label>
            <select id="summary-course" value={course} onChange={(event) => setCourse(event.target.value)} aria-controls="summary-results">
              <option value="">Alle Kurse</option>
              {[...new Set(summaries.map((summary) => summary.course))].map((name) => <option key={name}>{name}</option>)}
            </select>
          </div>
          <div className={s.filters} role="group" aria-label="Nach Verarbeitungsstatus filtern">
            {filters.map((item) => (
              <button type="button" key={item.value} aria-pressed={filter === item.value} aria-controls="summary-results" onClick={() => setFilter(item.value)}>
                {item.label}<span>{matchingContext.filter((summary) => matchesFilter(summary.status, item.value)).length}</span>
              </button>
            ))}
          </div>
          <p className={s.resultCount} role="status">{visible.length} von {summaries.length} Beispielen · Filter werden nicht gespeichert.</p>
          <ul id="summary-results" className={s.summaryList}>
            {visible.map((summary) => (
              <li key={summary.id} data-selected={summary.id === selectedId}>
                <article aria-labelledby={`summary-${summary.id}`}>
                  <div className={s.listHeader}>
                    <span className={s.status} data-status={summary.status}><span aria-hidden="true">{summary.status === "ready" ? "✓" : summary.status === "failed" ? "!" : summary.status === "queued" ? "…" : "◷"}</span>{statusLabels[summary.status]}</span>
                    <time dateTime={summary.updated}>{formatDate(summary.updated)}</time>
                  </div>
                  <h3 id={`summary-${summary.id}`}>{summary.title}</h3>
                  <p>{summary.course} · {summary.lecture}</p>
                  <small>{summary.document} · {summary.pages} {summary.unit}</small>
                  <p className={s.statusDetail}>{summary.statusDetail}</p>
                  {summary.status === "processing" && <progress max={summary.pages} value={summary.processed} aria-label={`${summary.title}: ${summary.processed} von ${summary.pages} Seiten im Beispiel verarbeitet`} />}
                  {summary.status === "ready" && <button type="button" className={s.selectButton} aria-pressed={summary.id === selectedId} onClick={() => setSelectedId(summary.id)}>{summary.id === selectedId ? "Wird angezeigt" : "Lesen"}</button>}
                  {summary.status === "failed" && <><button type="button" className={s.retry} disabled aria-describedby="retry-summary-note">Erneut versuchen</button><span id="retry-summary-note" className={s.unavailable}>In der Vorschau nicht verfügbar.</span></>}
                </article>
              </li>
            ))}
          </ul>
          {visible.length === 0 && <div className={s.empty}><h3>Keine passende Zusammenfassung.</h3><p>Ändere deine Suche oder setze die Filter zurück.</p><button type="button" onClick={resetFilters}>Filter zurücksetzen</button></div>}

          <section className={s.generator} aria-labelledby="generator-heading">
            <p className={shared.eyebrow}>NEUE ZUSAMMENFASSUNG</p>
            <h2 id="generator-heading">Aus Material wird Überblick.</h2>
            <label htmlFor="generator-course">Kurs</label>
            <select id="generator-course" disabled defaultValue="it"><option value="it">IT Security</option></select>
            <label htmlFor="generator-document">Vorlesung und Dokument</label>
            <select id="generator-document" disabled defaultValue="network"><option value="network">Lecture 08 · Network Security.pdf</option></select>
            <label htmlFor="generator-depth">Umfang</label>
            <select id="generator-depth" disabled defaultValue="compact"><option value="compact">Kompakt</option><option>Ausführlich</option></select>
            <button type="button" disabled aria-describedby="generator-note">Zusammenfassung erstellen</button>
            <p id="generator-note">Vorschau · Es wird keine Generierung gestartet oder gespeichert.</p>
          </section>
        </aside>

        <section id="summary-reader" className={s.reader} tabIndex={-1} aria-labelledby="reader-heading">
          <header className={s.readerHeader}>
            <div><p className={shared.eyebrow}>AUS DEINEM VORLESUNGSMATERIAL</p><h2 id="reader-heading">{selected.title}</h2></div>
            <span>KI-generierter Beispielinhalt</span>
          </header>
          <p className={s.readerContext}>{selected.course} <span>·</span> {selected.lecture} <span>·</span> {selected.document} <span>·</span> {selected.pages} {selected.unit}</p>
          <div className={s.reviewNote}><span aria-hidden="true">!</span><p><strong>Bitte mit den Originalunterlagen abgleichen.</strong> Generierte Inhalte können unvollständig oder ungenau sein.</p></div>
          <article className={s.summaryContent}>
            <section><div className={s.sectionNumber}>01</div><div><h3>Überblick</h3><p>Vibe Coding beschreibt eine Arbeitsweise, bei der eine Person Software über natürliche Sprache und kurze Feedbackschleifen mit einem Coding-Assistenten entwickelt. Entscheidend bleibt, Ziele, Kontext und Qualitätsanforderungen klar zu formulieren.</p><SourceChip>Folien 3–4</SourceChip></div></section>
            <section><div className={s.sectionNumber}>02</div><div><h3>Zentrale Konzepte</h3><ul><li><strong>Kontext geben:</strong> Der Assistent benötigt Projektstruktur, Einschränkungen und ein überprüfbares Ziel. <SourceChip>Folie 6</SourceChip></li><li><strong>In kleinen Schritten arbeiten:</strong> Änderungen lassen sich leichter prüfen, wenn Aufgaben begrenzt und Ergebnisse direkt validiert werden. <SourceChip>Folien 7–8</SourceChip></li><li><strong>Verantwortung behalten:</strong> Generierter Code wird vor der Übernahme gelesen, getestet und auf Sicherheitsfolgen geprüft. <SourceChip>Folie 12</SourceChip></li></ul></div></section>
            <section><div className={s.sectionNumber}>03</div><div><h3>Wichtige Begriffe</h3><dl className={s.definitions}><div><dt>Prompt</dt><dd>Eine konkrete Arbeitsanweisung mit Ziel, Kontext und gewünschten Prüfkriterien.</dd></div><div><dt>Feedbackschleife</dt><dd>Die wiederholte Abfolge aus Änderung, Prüfung und gezielter Korrektur.</dd></div></dl><SourceChip>Folien 5–8</SourceChip></div></section>
            <section className={s.examSection}><div className={s.sectionNumber}>04</div><div><p className={s.examLabel}>FÜR DIE PRÜFUNG MERKEN · BEISPIEL</p><h3>Qualität entsteht durch überprüfbare Schritte.</h3><p>Werkzeugausgaben ersetzen weder fachliches Verständnis noch Reviews. Erkläre im Beispiel, wie Kontext, kleine Änderungen und Tests zusammenwirken.</p><SourceChip>Folien 8 und 12</SourceChip></div></section>
            <section><div className={s.sectionNumber}>05</div><div><h3>Offene Punkte</h3><p>Drei persönliche Notizen sind im Beispiel noch nicht aufgelöst. Besonders offen bleibt, welche Informationen vor einer Änderung als Projektkontext bereitgestellt werden sollten.</p><span className={s.openBadge}>3 offene Notizen · Beispiel</span></div></section>
          </article>
          <details className={s.sources}>
            <summary>Verwendete Quellen und Beispielauszüge <span aria-hidden="true">⌄</span></summary>
            <div><p><strong>Vibe Coding Setup.pdf · Folien 3–12</strong></p><blockquote>„Kleine, überprüfbare Schritte halten Ziel, Änderung und Ergebnis nachvollziehbar.“</blockquote><small>Illustrativer Quellenauszug · kein echtes Vorlesungsmaterial</small></div>
          </details>
          <div className={s.workflowLinks}>
            <div><p className={shared.eyebrow}>VON HIER AUS WEITER</p><h3>Das Wissen bleibt verbunden.</h3></div>
            <Link href="/documents">Zu den Unterlagen <span aria-hidden="true">→</span></Link>
            <Link href="/flashcards">Zu den Karteikarten <small>24 · Beispiel</small> <span aria-hidden="true">→</span></Link>
          </div>
        </section>
      </div>
    </>
  );
}

function SourceChip({ children }: { children: React.ReactNode }) {
  return <span className={s.sourceChip}>{children}</span>;
}
