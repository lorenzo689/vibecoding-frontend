"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { cards, decks, formatDate, statusLabels, type DeckStatus } from "./examples";
import { boundedIndex, rateCard, ratingCounts, type Rating, type Ratings } from "./session";
import shared from "@/components/dashboard.module.css";
import s from "./flashcards.module.css";

type Filter = "all" | "ready" | "processing" | "attention";
const filters: { value: Filter; label: string }[] = [
  { value: "all", label: "Alle" }, { value: "ready", label: "Bereit" },
  { value: "processing", label: "In Verarbeitung" }, { value: "attention", label: "Aufmerksamkeit nötig" },
];
function matches(status: DeckStatus, filter: Filter) {
  return filter === "all" || status === filter || (filter === "processing" && status === "queued") || (filter === "attention" && status === "failed");
}

export default function FlashcardWorkspace() {
  const [query, setQuery] = useState(""); const [course, setCourse] = useState(""); const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState("vibe-coding"); const [index, setIndex] = useState(0); const [revealed, setRevealed] = useState(false); const [ratings, setRatings] = useState<Ratings>({});
  const studyRef = useRef<HTMLElement>(null); const selected = decks.find((deck) => deck.id === selectedId)!; const card = cards[index]; const counts = ratingCounts(ratings);
  const matchingContext = decks.filter((deck) => (!course || deck.course === course) && `${deck.title} ${deck.course} ${deck.lecture} ${deck.source}`.toLocaleLowerCase("de-DE").includes(query.trim().toLocaleLowerCase("de-DE")));
  const visible = matchingContext.filter((deck) => matches(deck.status, filter));
  function resetFilters() { setQuery(""); setCourse(""); setFilter("all"); }
  function resetSession() { setIndex(0); setRevealed(false); setRatings({}); }
  function move(delta: number) { setIndex((current) => boundedIndex(current, delta, cards.length)); setRevealed(false); }
  function chooseDeck(id: string) { setSelectedId(id); resetSession(); requestAnimationFrame(() => studyRef.current?.focus()); }
  function rate(rating: Rating) { if (revealed) setRatings((current) => rateCard(current, card.id, rating)); }

  return <>
    <section className={s.featured} aria-labelledby="recent-deck-heading"><div className={s.stackMark} aria-hidden="true"><i /><i /><span>24</span></div><div className={s.featuredCopy}><div className={s.featuredMeta}><span>ZULETZT GELERNT · BEISPIEL</span><span className={s.readyBadge}>Bereit</span></div><h2 id="recent-deck-heading">Vibe Coding Setup</h2><p className={s.contextTrail}>Neue Konzepte <span>→</span> Lecture 03 <span>→</span> Vibe Coding Setup.pdf <span>→</span> Zusammenfassung <span>→</span> 24 Karten</p><p className={s.featuredDescription}>9 von 24 Karten zuletzt angesehen · Illustrativer Lernstand vom 12.10.2026.</p><button type="button" onClick={() => chooseDeck("vibe-coding")}>Lernsession starten <span aria-hidden="true">↓</span></button></div></section>
    <div className={s.workspace}>
      <aside className={s.library} aria-labelledby="deck-library-heading">
        <div className={shared.sectionHeader}><h2 id="deck-library-heading">Kartensätze <small>{String(decks.length).padStart(2, "0")}</small></h2><small>BEISPIELE</small></div>
        <div className={s.searchFields}><label htmlFor="deck-search">Kartensätze durchsuchen</label><input id="deck-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Titel, Kurs oder Dokument …" aria-controls="deck-results" /><label htmlFor="deck-course">Nach Kurs filtern</label><select id="deck-course" value={course} onChange={(event) => setCourse(event.target.value)} aria-controls="deck-results"><option value="">Alle Kurse</option>{[...new Set(decks.map((deck) => deck.course))].map((name) => <option key={name}>{name}</option>)}</select></div>
        <div className={s.filters} role="group" aria-label="Nach Verarbeitungsstatus filtern">{filters.map((item) => <button type="button" key={item.value} aria-pressed={filter === item.value} onClick={() => setFilter(item.value)}>{item.label}<span>{matchingContext.filter((deck) => matches(deck.status, item.value)).length}</span></button>)}</div>
        <p className={s.resultCount} role="status">{visible.length} von {decks.length} Beispielen · Filter werden nicht gespeichert.</p>
        <ul id="deck-results" className={s.deckList}>{visible.map((deck) => <li key={deck.id} data-selected={deck.id === selectedId}><article aria-labelledby={`deck-${deck.id}`}><div className={s.listHeader}><span className={s.status} data-status={deck.status}><span aria-hidden="true">{deck.status === "ready" ? "✓" : deck.status === "failed" ? "!" : deck.status === "queued" ? "…" : "▷"}</span>{statusLabels[deck.status]}</span><time dateTime={deck.updated}>{formatDate(deck.updated)}</time></div><h3 id={`deck-${deck.id}`}>{deck.title}</h3><p>{deck.course} · {deck.lecture}</p><small>{deck.source} · {deck.basis}</small><p className={s.deckMeta}>{deck.cards} Karten{deck.learned !== undefined ? ` · ${deck.learned} zuletzt angesehen` : ""}</p><p className={s.statusDetail}>{deck.statusDetail}</p>{deck.status === "processing" && <progress max={deck.totalPages} value={deck.processed} aria-label={`${deck.title}: ${deck.processed} von ${deck.totalPages} Seiten im Beispiel verarbeitet`} />}{deck.status === "ready" && <button type="button" className={s.selectButton} aria-pressed={deck.id === selectedId} onClick={() => chooseDeck(deck.id)}>{deck.id === selectedId ? "Ausgewählt" : "Lernen"}</button>}{deck.status === "failed" && <><button type="button" className={s.retry} disabled aria-describedby="retry-deck-note">Erneut versuchen</button><span id="retry-deck-note" className={s.unavailable}>In der Vorschau nicht verfügbar.</span></>}</article></li>)}</ul>
        {visible.length === 0 && <div className={s.empty}><h3>Kein passender Kartensatz.</h3><p>Ändere deine Suche oder setze die Filter zurück.</p><button type="button" onClick={resetFilters}>Filter zurücksetzen</button></div>}
      </aside>
      <div className={s.studyColumn}>
        <section ref={studyRef} tabIndex={-1} className={s.study} aria-labelledby="study-heading">
          <header className={s.studyHeader}><div><p className={shared.eyebrow}>LOKALE LERNVORSCHAU</p><h2 id="study-heading">{selected.title}</h2><p>{selected.course} · {selected.lecture}</p></div><span>Vorschaufortschritt · wird nicht gespeichert</span></header>
          <div className={s.progressRow}><p>Karte {index + 1} von {cards.length} Vorschaukarten</p><div aria-hidden="true">{cards.map((item, cardIndex) => <i key={item.id} data-current={cardIndex === index} data-rated={ratings[item.id] ?? ""} />)}</div></div>
          <article className={s.card} aria-labelledby="card-question"><div className={s.cardTop}><span>FRAGE {String(index + 1).padStart(2, "0")}</span><span>{card.section}</span></div><h3 id="card-question">{card.question}</h3>{!revealed ? <div className={s.hiddenAnswer}><p>Die Antwort bleibt zunächst verdeckt.</p><button type="button" onClick={() => setRevealed(true)}>Antwort zeigen</button></div> : <div className={s.answer}><p className={shared.eyebrow}>ANTWORT · KI-BEISPIEL</p><p>{card.answer}</p></div>}<details className={s.sourceDetails}><summary>Quelle und Beispielauszug <span aria-hidden="true">⌄</span></summary><div><strong>{card.source}</strong><blockquote>„{card.excerpt}“</blockquote><small>Illustrativer Quellenauszug · kein echtes Vorlesungsmaterial</small></div></details></article>
          <div className={s.rating}><p>Wie sicher fühlst du dich?</p><div><button type="button" disabled={!revealed} aria-pressed={ratings[card.id] === "unsure"} onClick={() => rate("unsure")}>Noch unsicher</button><button type="button" disabled={!revealed} aria-pressed={ratings[card.id] === "understood"} onClick={() => rate("understood")}>Verstanden</button></div><small>{revealed ? "Bewertung gilt nur für diese Vorschau." : "Zeige zuerst die Antwort."}</small></div>
          <nav className={s.cardNavigation} aria-label="Zwischen Vorschaukarten wechseln"><button type="button" disabled={index === 0} onClick={() => move(-1)}>← Vorherige Karte</button><button type="button" disabled={index === cards.length - 1} onClick={() => move(1)}>Nächste Karte →</button></nav>
          <p className={s.live} aria-live="polite" aria-atomic="true">Karte {index + 1}: {revealed ? "Antwort sichtbar" : "Antwort verdeckt"}{ratings[card.id] ? ` · ${ratings[card.id] === "unsure" ? "Noch unsicher" : "Verstanden"}` : ""}</p>
          <div className={s.sessionSummary}><div><p className={shared.eyebrow}>DEINE SITZUNG · LOKAL</p><h3>{Object.keys(ratings).length === cards.length ? "Vorschau abgeschlossen." : "Ein ruhiger Schritt nach dem anderen."}</h3></div><dl><div><dt>Noch unsicher</dt><dd>{counts.unsure}</dd></div><div><dt>Verstanden</dt><dd>{counts.understood}</dd></div><div><dt>Noch offen</dt><dd>{cards.length - counts.unsure - counts.understood}</dd></div></dl><button type="button" onClick={resetSession}>Sitzung neu starten</button></div>
        </section>
        <section className={s.generator} aria-labelledby="generator-heading"><div><p className={shared.eyebrow}>NEUE KARTEIKARTEN</p><h2 id="generator-heading">Aus Material wird Wiederholung.</h2></div><div className={s.generatorFields}><label htmlFor="generator-course">Kurs<select id="generator-course" disabled defaultValue="nk"><option value="nk">Neue Konzepte</option></select></label><label htmlFor="generator-source">Zusammenfassung oder Dokument<select id="generator-source" disabled defaultValue="vibe"><option value="vibe">Vibe Coding Setup · Zusammenfassung</option></select></label><label htmlFor="generator-count">Kartenanzahl<select id="generator-count" disabled defaultValue="24"><option value="24">24 Karten</option></select></label></div><button type="button" disabled aria-describedby="generator-note">Karteikarten erstellen</button><p id="generator-note">Vorschau · Es wird keine Generierung gestartet oder gespeichert.</p></section>
        <nav className={s.workflowLinks} aria-label="Verbundener Lernworkflow"><div><p className={shared.eyebrow}>DEIN LERNWEG</p><h3>Vom Material bis zur Prüfung.</h3></div><Link href="/documents">Zu den Unterlagen <span aria-hidden="true">→</span></Link><Link href="/summaries">Zu den Zusammenfassungen <span aria-hidden="true">→</span></Link><Link href="/calendar">Zum Kalender <span aria-hidden="true">→</span></Link></nav>
      </div>
    </div>
  </>;
}
