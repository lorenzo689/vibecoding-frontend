"use client";

import { useState } from "react";
import shared from "@/components/dashboard.module.css";
import s from "./calendar.module.css";

// Illustrative UI fixtures only, not a backend data contract.
const exampleToday = "2026-10-12";
const kinds = { lecture: "Vorlesung", exercise: "Übung", study: "Lernsession", presentation: "Präsentation", exam: "Prüfung", deadline: "Abgabe" } as const;
type PreviewEvent = { date: string; time: string; title: string; course: string; kind: keyof typeof kinds; context: string; highlight?: boolean };
const events: PreviewEvent[] = [
  { date: "2026-10-05", time: "10:00", title: "Vibe Coding Setup", course: "Neue Konzepte", kind: "lecture", context: "Lecture 03 · Einführung und Werkzeuge" },
  { date: "2026-10-08", time: "13:00", title: "Threat Modeling", course: "Advanced Practical IT Security", kind: "exercise", context: "Lab 04 · Praktische Übung" },
  { date: "2026-10-12", time: "09:00", title: "Network Security", course: "IT Security", kind: "lecture", context: "Lecture 08 · Netzwerke verstehen" },
  { date: "2026-10-14", time: "14:00", title: "Lecture Review", course: "Neue Konzepte", kind: "study", context: "Lecture 03 · Notizen und offene Lernpunkte", highlight: true },
  { date: "2026-10-18", time: "10:00", title: "Vibe Coding", course: "Neue Konzepte", kind: "presentation", context: "Präsentation · Projekt und Ergebnisse", highlight: true },
  { date: "2026-10-22", time: "11:00", title: "Prüfungsfragen wiederholen", course: "IT Security", kind: "study", context: "Lecture 08 · Karteikarten und Zusammenfassung" },
  { date: "2026-10-22", time: "14:00", title: "Threat Modeling", course: "Advanced Practical IT Security", kind: "exercise", context: "Lab 04 · Ergebnisse besprechen" },
  { date: "2026-10-22", time: "16:00", title: "Offene Fragen klären", course: "IT Security", kind: "study", context: "Lecture 08 · Persönliche Notizen" },
  { date: "2026-10-24", time: "09:00", title: "Network Security", course: "IT Security", kind: "exam", context: "Prüfung · Vorlesungen 01–08", highlight: true },
  { date: "2026-10-28", time: "18:00", title: "Laborbericht", course: "Advanced Practical IT Security", kind: "deadline", context: "Lab 04 · Ausarbeitung abgeben", highlight: true },
];
function dateFromKey(key: string) { return new Date(`${key}T12:00:00Z`); }
function formatDate(key: string, options: Intl.DateTimeFormatOptions) { return dateFromKey(key).toLocaleDateString("de-DE", { ...options, timeZone: "UTC" }); }
function dateKey(date: Date) { return date.toISOString().slice(0, 10); }

function EventList({ items }: { items: PreviewEvent[] }) {
  return <ol className={s.eventList}>{items.map((event) => (
    <li key={`${event.date}-${event.time}`}>
      <time className={s.eventTime} dateTime={`${event.date}T${event.time}`}>{event.time}</time>
      <div><span className={s.kind} data-kind={event.kind}>{kinds[event.kind]}</span><h3>{event.title}</h3><p>{event.course}</p><small>{event.context}</small></div>
    </li>
  ))}</ol>;
}

export default function CalendarPreview() {
  const [month, setMonth] = useState("2026-10-01");
  const [selected, setSelected] = useState(exampleToday);
  const first = dateFromKey(month);
  const offset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const days = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index) => dateKey(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), index - offset + 1))));
  const monthEvents = events.filter((event) => event.date.startsWith(month.slice(0, 7)));
  const selectedEvents = events.filter((event) => event.date === selected);
  const upcoming = events.filter((event) => event.date >= exampleToday && event.highlight);
  const monthLabel = formatDate(month, { month: "long", year: "numeric" });
  function changeMonth(delta: number) {
    const next = dateKey(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + delta, 1)));
    setMonth(next);
    setSelected(next);
  }

  return (
    <div className={`${shared.dashboard} ${s.page}`}>
      <section className={shared.intro}>
        <div><p className={shared.eyebrow}>DEIN SEMESTER, TAG FÜR TAG</p><h1>Dein Kalender.</h1><p>Vorlesungen, Lernzeit und wichtige Termine. Alles im Zusammenhang.</p></div>
        <div className={shared.semester}><small>BEISPIELSEMESTER</small><strong>Wintersemester 2026/27</strong><span>Raum zum Lernen. Zeit zum Verstehen.</span></div>
      </section>
      <p className={shared.notice}>Produktvorschau · Alle Termine und Quellen sind illustrative Beispieldaten. „Heute“ entspricht hier dem 12. Oktober 2026.</p>
      <div className={s.layout}>
        <div className={s.calendarColumn}>
          <section className={s.calendar} aria-labelledby="calendar-month">
            <header className={s.toolbar}>
              <div><p className={shared.eyebrow}>DEIN MONAT</p><h2 id="calendar-month" aria-live="polite" aria-atomic="true">{monthLabel}</h2></div>
              <div className={s.navigation}>
                <button type="button" onClick={() => { setMonth("2026-10-01"); setSelected(exampleToday); }}>Beispielmonat</button>
                <button type="button" aria-label="Vorheriger Monat" onClick={() => changeMonth(-1)}><span aria-hidden="true">‹</span></button>
                <button type="button" aria-label="Nächster Monat" onClick={() => changeMonth(1)}><span aria-hidden="true">›</span></button>
              </div>
            </header>
            <div className={s.desktopCalendar}>
              <table className={s.monthTable} aria-labelledby="calendar-month">
                <thead><tr>{["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"].map((day) => <th scope="col" key={day}><abbr title={day}>{day.slice(0, 2)}</abbr></th>)}</tr></thead>
                <tbody>{Array.from({ length: days.length / 7 }, (_, week) => (
                  <tr key={week}>{days.slice(week * 7, week * 7 + 7).map((day) => {
                    const dayEvents = events.filter((event) => event.date === day);
                    return <td key={day} data-outside={!day.startsWith(month.slice(0, 7))} data-selected={selected === day}>
                      <button type="button" className={s.dayButton} aria-pressed={selected === day} aria-controls="calendar-day-details" aria-label={`${formatDate(day, { dateStyle: "full" })}${day === exampleToday ? ", Heute im Beispiel" : ""}, ${dayEvents.length} Termine`} onClick={() => setSelected(day)}>
                        <span className={s.dayNumber} data-today={day === exampleToday}>{Number(day.slice(-2))}</span>
                        {dayEvents.slice(0, 2).map((event) => <span className={s.calendarEvent} data-kind={event.kind} key={event.time}><span>{event.time} · {kinds[event.kind]}</span><strong>{event.title}</strong></span>)}
                        {dayEvents.length > 2 && <span className={s.more}>+{dayEvents.length - 2} weiterer Termin</span>}
                      </button>
                    </td>;
                  })}</tr>
                ))}</tbody>
              </table>
              <div className={s.calendarFoot}><span><i aria-hidden="true" /> Heute im Beispiel · 12.10.</span><span>Tag auswählen für Details</span></div>
            </div>
            <div className={s.agenda}>
              <p className={s.agendaLabel}>MONATSAGENDA · BEISPIELTERMINE</p>
              {[...new Set(monthEvents.map((event) => event.date))].map((day) => <section key={day} className={s.agendaDay}>
                <h3><time dateTime={day}>{formatDate(day, { weekday: "long", day: "numeric", month: "long" })}</time>{day === exampleToday && <span>Heute im Beispiel</span>}</h3>
                <EventList items={monthEvents.filter((event) => event.date === day)} />
              </section>)}
            </div>
            {monthEvents.length === 0 && <p className={s.empty}>Für {monthLabel} sind keine Beispieltermine hinterlegt. Über „Beispielmonat“ gelangst du zurück zur gefüllten Vorschau.</p>}
          </section>
          <section id="calendar-day-details" className={s.dayDetails} aria-labelledby="selected-day-heading">
            <div className={shared.sectionHeader}><h2 id="selected-day-heading" aria-live="polite">{formatDate(selected, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h2><small>AUSGEWÄHLTER TAG</small></div>
            {selectedEvents.length ? <EventList items={selectedEvents} /> : <p className={s.empty}>Für diesen Tag sind keine Beispieltermine hinterlegt.</p>}
          </section>
          <section className={s.suggestions} aria-labelledby="suggestions-heading">
            <div className={s.suggestionHeading}>
              <span className={s.sourceIcon} aria-hidden="true">↳</span>
              <div><p className={shared.eyebrow}>AUS DEINEN UNTERLAGEN</p><h2 id="suggestions-heading">Ein Termin braucht deinen Blick.</h2></div>
              <span className={s.pending}>Noch nicht bestätigt</span>
            </div>
            <p className={s.suggestionIntro}>Erkannte Termine sind Vorschläge. Erst nach deiner Prüfung gehören sie in den Kalender.</p>
            <article className={s.suggestion}>
              <div className={s.suggestionBody}><span className={s.kind} data-kind="deadline">Erkannt · Abgabe</span><h3>Projektdokumentation Vibe Coding</h3><p>Neue Konzepte · <time dateTime="2026-10-30T23:59">30. Oktober 2026, 23:59 Uhr</time></p><p className={s.source}>Quelle: Lecture 03 · Vibe Coding Setup.pdf · Folie 12</p></div>
              <details className={s.sourceDetails}>
                <summary>Quelle prüfen <span aria-hidden="true">↗</span></summary>
                <div><small>ILLUSTRATIVER QUELLENAUSZUG</small><blockquote>„Bitte reicht eure Projektdokumentation bis zum 30. Oktober 2026 um 23:59 Uhr ein.“</blockquote><p>Vorschau: Diese Quelle ist ein Beispiel. Eine Bestätigung und Übernahme in den Kalender ist noch nicht verfügbar.</p></div>
              </details>
              <div className={s.suggestionActions}><button type="button" disabled aria-describedby="suggestion-preview-note">Bestätigen</button><button type="button" disabled aria-describedby="suggestion-preview-note">Verwerfen</button><p id="suggestion-preview-note">In dieser Vorschau nicht verfügbar · Es wird nichts gespeichert.</p></div>
            </article>
          </section>
        </div>
        <aside className={s.upcoming} aria-labelledby="upcoming-heading">
          <div className={shared.sectionHeader}><h2 id="upcoming-heading">Als Nächstes</h2><small>{String(upcoming.length).padStart(2, "0")} TERMINE</small></div>
          <p className={s.asideIntro}>Ab dem 12. Oktober · Beispielauswahl</p>
          <ol className={s.upcomingList}>{upcoming.map((event) => <li key={event.date}>
            <time className={s.dateBadge} dateTime={event.date}><strong>{Number(event.date.slice(-2))}</strong><span>OKT</span></time>
            <div><span className={s.kind} data-kind={event.kind}>{kinds[event.kind]}</span><h3>{event.title}</h3><p>{event.course}</p><time dateTime={`${event.date}T${event.time}`}>{event.time} Uhr</time></div>
          </li>)}</ol>
          <div className={s.learningNote}><p className={shared.eyebrow}>ZEIT FÜR DEIN WISSEN</p><h3>Gut vorbereitet beginnt mit etwas Freiraum.</h3><p>Plane zwischen Vorlesung und Prüfung auch Zeit zum Wiederholen ein. Ein kleiner Schritt zählt.</p><div className={s.noteRule} aria-hidden="true"><span /><span /><span /><span /><span /></div><small>Dein Semester. In deinem Rhythmus.</small></div>
          <p className={s.contextNote}>Kurs und Vorlesung bleiben verbunden – vom ersten Termin bis zur letzten Prüfung.</p>
        </aside>
      </div>
      <footer className={shared.dashboardFooter}><span>Lernapp · Dein Semester, verbunden.</span><span>Kalendervorschau mit Beispieldaten</span></footer>
    </div>
  );
}
