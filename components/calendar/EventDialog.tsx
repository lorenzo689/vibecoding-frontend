"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Course } from "@/lib/supabase/queries/courses";
import type { CalendarEvent, CalendarEventInput, CalendarEventKind } from "@/lib/supabase/queries/calendar";
import styles from "@/components/courses/courses.module.css";

export const KIND_LABELS: Record<CalendarEventKind, string> = {
  lecture: "Vorlesung",
  exercise: "Übung",
  study: "Lernsession",
  presentation: "Präsentation",
  exam: "Prüfung",
  deadline: "Abgabe",
  other: "Sonstiges",
};

function toDateInput(iso: string): string {
  return iso.slice(0, 10);
}
function toTimeInput(iso: string): string {
  return new Date(iso).toTimeString().slice(0, 5);
}

export default function EventDialog({
  courses,
  initial,
  onClose,
  onSave,
}: {
  courses: Course[];
  initial?: CalendarEvent;
  onClose: () => void;
  onSave: (input: CalendarEventInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const [date, setDate] = useState(initial ? toDateInput(initial.startsAt) : "");
  const [time, setTime] = useState(initial ? toTimeInput(initial.startsAt) : "09:00");
  const [courseId, setCourseId] = useState<string>(initial?.courseId ?? "");
  const [kind, setKind] = useState<CalendarEventKind>(initial?.kind ?? "lecture");
  const [description, setDescription] = useState(initial?.description ?? "");
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim() || !date || !time) return;
    setSaving(true);
    setError(null);
    try {
      await onSave({
        courseId: courseId || null,
        title: title.trim(),
        description: description.trim(),
        kind,
        startsAt: new Date(`${date}T${time}:00`).toISOString(),
        endsAt: null,
      });
    } catch {
      setError("Der Termin konnte nicht gespeichert werden. Bitte versuche es erneut.");
      setSaving(false);
    }
  }

  return (
    <div
      className={styles.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={styles.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="event-dialog-heading"
      >
        <div className={styles.dialogHeader}>
          <h2 id="event-dialog-heading">{initial ? "Termin bearbeiten" : "Termin anlegen"}</h2>
          <button
            type="button"
            className={styles.closeButton}
            aria-label="Schließen"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <form onSubmit={submit}>
          <div className={styles.field}>
            <label htmlFor="event-title">Titel</label>
            <input
              id="event-title"
              ref={titleInputRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="z. B. Vorlesung Netzwerksicherheit"
              required
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="event-date">Datum</label>
            <input
              id="event-date"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="event-time">Uhrzeit</label>
            <input
              id="event-time"
              type="time"
              value={time}
              onChange={(event) => setTime(event.target.value)}
              required
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="event-kind">Art</label>
            <select
              id="event-kind"
              value={kind}
              onChange={(event) => setKind(event.target.value as CalendarEventKind)}
              disabled={saving}
            >
              {Object.entries(KIND_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="event-course">Kurs</label>
            <select
              id="event-course"
              value={courseId}
              onChange={(event) => setCourseId(event.target.value)}
              disabled={saving}
            >
              <option value="">Kein Kurs</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </div>
          <div className={styles.field}>
            <label htmlFor="event-description">Beschreibung</label>
            <textarea
              id="event-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optionaler Kontext zum Termin"
              disabled={saving}
            />
          </div>
          {error && <p className={styles.hint} role="alert">{error}</p>}
          <button type="submit" className={styles.submitButton} disabled={saving}>
            {saving ? "Wird gespeichert …" : initial ? "Änderungen speichern" : "Termin erstellen"}
          </button>
        </form>
      </div>
    </div>
  );
}
