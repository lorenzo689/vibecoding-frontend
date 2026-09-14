"use client";

import { useEffect, useState } from "react";
import shared from "@/components/dashboard.module.css";
import s from "./calendar.module.css";
import { listCourses, type Course } from "@/lib/supabase/queries/courses";
import {
  createEvent,
  deleteEvent,
  listEvents,
  updateEvent,
  type CalendarEvent,
  type CalendarEventInput,
} from "@/lib/supabase/queries/calendar";
import { deriveCourseBadge } from "@/lib/courseBadge";
import EventDialog, { KIND_LABELS } from "./EventDialog";

const exampleToday = new Date().toISOString().slice(0, 10);

function dateFromKey(key: string) { return new Date(`${key}T12:00:00Z`); }
function formatDate(key: string, options: Intl.DateTimeFormatOptions) { return dateFromKey(key).toLocaleDateString("de-DE", { ...options, timeZone: "UTC" }); }
function dateKey(date: Date) { return date.toISOString().slice(0, 10); }
function eventDateKey(event: CalendarEvent) { return event.startsAt.slice(0, 10); }
function eventTime(event: CalendarEvent) { return new Date(event.startsAt).toTimeString().slice(0, 5); }

function EventList({
  items,
  courseById,
  onEdit,
  onDelete,
}: {
  items: CalendarEvent[];
  courseById: Map<string, Course>;
  onEdit: (event: CalendarEvent) => void;
  onDelete: (event: CalendarEvent) => void;
}) {
  return <ol className={s.eventList}>{items.map((event) => {
    const course = event.courseId ? courseById.get(event.courseId) : undefined;
    const badge = course ? deriveCourseBadge(course.title) : null;
    return (
      <li key={event.id}>
        <time className={s.eventTime} dateTime={event.startsAt}>{eventTime(event)}</time>
        <div>
          <span className={s.kind} data-kind={event.kind}>{KIND_LABELS[event.kind]}</span>
          <h3>{event.title}</h3>
          <p>
            {badge && <span className={s.courseDot} data-color={badge.color} aria-hidden="true" />}
            {course ? course.title : "Ohne Kurs"}
          </p>
          {event.description && <small>{event.description}</small>}
        </div>
        <div className={s.eventActions}>
          <button type="button" onClick={() => onEdit(event)}>Bearbeiten</button>
          <button type="button" onClick={() => onDelete(event)}>Löschen</button>
        </div>
      </li>
    );
  })}</ol>;
}

export default function CalendarPreview() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | undefined>(undefined);

  const [month, setMonth] = useState(() => `${exampleToday.slice(0, 7)}-01`);
  const [selected, setSelected] = useState(exampleToday);

  function fetchData() {
    return Promise.all([listEvents(), listCourses()])
      .then(([nextEvents, nextCourses]) => {
        setEvents(nextEvents);
        setCourses(nextCourses);
      })
      .catch(() => {
        setLoadError("Dein Kalender konnte nicht geladen werden. Bitte versuche es erneut.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function loadData() {
    setLoading(true);
    setLoadError(null);
    fetchData();
  }

  useEffect(() => {
    fetchData();
  }, []);

  const courseById = new Map(courses.map((course) => [course.id, course]));

  const first = dateFromKey(month);
  const offset = (first.getUTCDay() + 6) % 7;
  const daysInMonth = new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + 1, 0)).getUTCDate();
  const days = Array.from({ length: Math.ceil((offset + daysInMonth) / 7) * 7 }, (_, index) => dateKey(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth(), index - offset + 1))));
  const monthEvents = events.filter((event) => eventDateKey(event).startsWith(month.slice(0, 7)));
  const selectedEvents = events.filter((event) => eventDateKey(event) === selected);
  const upcoming = events.filter((event) => eventDateKey(event) >= exampleToday).slice(0, 4);
  const monthLabel = formatDate(month, { month: "long", year: "numeric" });

  function changeMonth(delta: number) {
    const next = dateKey(new Date(Date.UTC(first.getUTCFullYear(), first.getUTCMonth() + delta, 1)));
    setMonth(next);
    setSelected(next);
  }

  async function handleCreate(input: CalendarEventInput) {
    setActionError(null);
    try {
      const created = await createEvent(input);
      setEvents((prev) => [...prev, created]);
      setDialogOpen(false);
    } catch {
      setActionError("Der Termin konnte nicht angelegt werden.");
      throw new Error("create-event-failed");
    }
  }

  async function handleUpdate(input: CalendarEventInput) {
    if (!editingEvent) return;
    setActionError(null);
    try {
      const updated = await updateEvent(editingEvent.id, input);
      setEvents((prev) => prev.map((event) => (event.id === updated.id ? updated : event)));
      setEditingEvent(undefined);
    } catch {
      setActionError("Der Termin konnte nicht gespeichert werden.");
      throw new Error("update-event-failed");
    }
  }

  async function handleDelete(event: CalendarEvent) {
    if (!window.confirm(`"${event.title}" wirklich löschen?`)) return;
    setActionError(null);
    try {
      await deleteEvent(event.id);
      setEvents((prev) => prev.filter((item) => item.id !== event.id));
    } catch {
      setActionError("Der Termin konnte nicht gelöscht werden.");
    }
  }

  if (loading) {
    return <div className={`${shared.dashboard} ${s.page}`} aria-live="polite">Dein Kalender wird geladen …</div>;
  }

  if (loadError && events.length === 0) {
    return (
      <div className={`${shared.dashboard} ${s.page}`}>
        <div className={s.empty} role="alert">
          <h2>Kalender nicht verfügbar</h2>
          <p>{loadError}</p>
          <button type="button" onClick={loadData}>Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${shared.dashboard} ${s.page}`}>
      <section className={shared.intro}>
        <div><p className={shared.eyebrow}>DEIN SEMESTER, TAG FÜR TAG</p><h1>Dein Kalender.</h1><p>Vorlesungen, Lernzeit und wichtige Termine. Alles im Zusammenhang.</p></div>
        <button type="button" className={s.createButton} onClick={() => setDialogOpen(true)}>+ Termin</button>
      </section>
      {actionError && <p className={shared.notice} role="alert">{actionError}</p>}
      <div className={s.layout}>
        <div className={s.calendarColumn}>
          <section className={s.calendar} aria-labelledby="calendar-month">
            <header className={s.toolbar}>
              <div><p className={shared.eyebrow}>DEIN MONAT</p><h2 id="calendar-month" aria-live="polite" aria-atomic="true">{monthLabel}</h2></div>
              <div className={s.navigation}>
                <button type="button" onClick={() => { setMonth(`${exampleToday.slice(0, 7)}-01`); setSelected(exampleToday); }}>Heute</button>
                <button type="button" aria-label="Vorheriger Monat" onClick={() => changeMonth(-1)}><span aria-hidden="true">‹</span></button>
                <button type="button" aria-label="Nächster Monat" onClick={() => changeMonth(1)}><span aria-hidden="true">›</span></button>
              </div>
            </header>
            <div className={s.desktopCalendar}>
              <table className={s.monthTable} aria-labelledby="calendar-month">
                <thead><tr>{["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"].map((day) => <th scope="col" key={day}><abbr title={day}>{day.slice(0, 2)}</abbr></th>)}</tr></thead>
                <tbody>{Array.from({ length: days.length / 7 }, (_, week) => (
                  <tr key={week}>{days.slice(week * 7, week * 7 + 7).map((day) => {
                    const dayEvents = events.filter((event) => eventDateKey(event) === day);
                    return <td key={day} data-outside={!day.startsWith(month.slice(0, 7))} data-selected={selected === day}>
                      <button type="button" className={s.dayButton} aria-pressed={selected === day} aria-controls="calendar-day-details" aria-label={`${formatDate(day, { dateStyle: "full" })}${day === exampleToday ? ", Heute" : ""}, ${dayEvents.length} Termine`} onClick={() => setSelected(day)}>
                        <span className={s.dayNumber} data-today={day === exampleToday}>{Number(day.slice(-2))}</span>
                        {dayEvents.slice(0, 2).map((event) => <span className={s.calendarEvent} data-kind={event.kind} key={event.id}><span>{eventTime(event)} · {KIND_LABELS[event.kind]}</span><strong>{event.title}</strong></span>)}
                        {dayEvents.length > 2 && <span className={s.more}>+{dayEvents.length - 2} weiterer Termin</span>}
                      </button>
                    </td>;
                  })}</tr>
                ))}</tbody>
              </table>
              <div className={s.calendarFoot}><span><i aria-hidden="true" /> Heute · {formatDate(exampleToday, { day: "numeric", month: "numeric" })}</span><span>Tag auswählen für Details</span></div>
            </div>
            <div className={s.agenda}>
              <p className={s.agendaLabel}>MONATSAGENDA</p>
              {[...new Set(monthEvents.map(eventDateKey))].map((day) => <section key={day} className={s.agendaDay}>
                <h3><time dateTime={day}>{formatDate(day, { weekday: "long", day: "numeric", month: "long" })}</time>{day === exampleToday && <span>Heute</span>}</h3>
                <EventList items={monthEvents.filter((event) => eventDateKey(event) === day)} courseById={courseById} onEdit={(event) => setEditingEvent(event)} onDelete={handleDelete} />
              </section>)}
            </div>
            {monthEvents.length === 0 && <p className={s.empty}>Für {monthLabel} sind keine Termine eingetragen.</p>}
          </section>
          <section id="calendar-day-details" className={s.dayDetails} aria-labelledby="selected-day-heading">
            <div className={shared.sectionHeader}><h2 id="selected-day-heading" aria-live="polite">{formatDate(selected, { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</h2><small>AUSGEWÄHLTER TAG</small></div>
            {selectedEvents.length ? <EventList items={selectedEvents} courseById={courseById} onEdit={(event) => setEditingEvent(event)} onDelete={handleDelete} /> : <p className={s.empty}>Für diesen Tag sind keine Termine eingetragen.</p>}
          </section>
          <section className={s.suggestions} aria-labelledby="suggestions-heading">
            <div className={s.suggestionHeading}>
              <span className={s.sourceIcon} aria-hidden="true">↳</span>
              <div><p className={shared.eyebrow}>AUS DEINEN UNTERLAGEN</p><h2 id="suggestions-heading">Ein Termin braucht deinen Blick.</h2></div>
              <span className={s.pending}>Noch nicht verfügbar</span>
            </div>
            <p className={s.suggestionIntro}>Erkannte Termine aus deinen Unterlagen sind noch nicht verfügbar. Dafür braucht es eine automatische Texterkennung, die es aktuell noch nicht gibt.</p>
            <article className={s.suggestion}>
              <div className={s.suggestionBody}><span className={s.kind} data-kind="deadline">Beispiel · Abgabe</span><h3>Projektdokumentation Vibe Coding</h3><p>Neue Konzepte · <time dateTime="2026-10-30T23:59">30. Oktober 2026, 23:59 Uhr</time></p><p className={s.source}>Quelle: Lecture 03 · Vibe Coding Setup.pdf · Folie 12</p></div>
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
          <ol className={s.upcomingList}>{upcoming.map((event) => <li key={event.id}>
            <time className={s.dateBadge} dateTime={eventDateKey(event)}><strong>{Number(eventDateKey(event).slice(-2))}</strong><span>{formatDate(eventDateKey(event), { month: "short" })}</span></time>
            <div><span className={s.kind} data-kind={event.kind}>{KIND_LABELS[event.kind]}</span><h3>{event.title}</h3><p>{event.courseId ? courseById.get(event.courseId)?.title : "Ohne Kurs"}</p><time dateTime={event.startsAt}>{eventTime(event)} Uhr</time></div>
          </li>)}</ol>
          {upcoming.length === 0 && <p className={s.empty}>Keine anstehenden Termine.</p>}
        </aside>
      </div>
      <footer className={shared.dashboardFooter}><span>Lernapp · Dein Semester, verbunden.</span></footer>

      {dialogOpen && (
        <EventDialog courses={courses} onClose={() => setDialogOpen(false)} onSave={handleCreate} />
      )}
      {editingEvent && (
        <EventDialog courses={courses} initial={editingEvent} onClose={() => setEditingEvent(undefined)} onSave={handleUpdate} />
      )}
    </div>
  );
}
