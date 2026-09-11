"use client";

import { useEffect, useState } from "react";
import { getCourseSummary, saveCourseSummary } from "@/lib/supabase/queries/summaries";
import s from "./summaries.module.css";

function formatDate(value: string) {
  return new Date(value).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default function CourseSummaryEditor({ courseId }: { courseId: string }) {
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getCourseSummary(courseId).then((summary) => {
      if (summary) {
        setText(summary.text);
        setUpdatedAt(summary.updatedAt);
      } else {
        setEditing(true);
      }
      setLoading(false);
    });
  }, [courseId]);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const summary = await saveCourseSummary(courseId, { title: "Zusammenfassung", text });
      setUpdatedAt(summary.updatedAt);
      setEditing(false);
    } catch {
      setError("Die Zusammenfassung konnte nicht gespeichert werden.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return null;

  return (
    <div className={s.editor}>
      {updatedAt && (
        <div className={s.meta}>
          <span>Zuletzt bearbeitet: {formatDate(updatedAt)}</span>
          {!editing && (
            <button type="button" className={s.secondaryButton} onClick={() => setEditing(true)}>
              Bearbeiten
            </button>
          )}
        </div>
      )}

      {editing ? (
        <>
          <label className={s.field}>
            <textarea
              value={text}
              onChange={(event) => setText(event.target.value)}
              placeholder="Schreib hier deine Zusammenfassung für diesen Kurs …"
              disabled={saving}
            />
          </label>
          <div className={s.actions}>
            <button
              type="button"
              className={s.primaryButton}
              onClick={handleSave}
              disabled={saving || !text.trim()}
            >
              {saving ? "Wird gespeichert …" : "Speichern"}
            </button>
            {updatedAt && (
              <button
                type="button"
                className={s.secondaryButton}
                onClick={() => setEditing(false)}
                disabled={saving}
              >
                Abbrechen
              </button>
            )}
            {error && (
              <span className={s.status} data-tone="error">
                {error}
              </span>
            )}
          </div>
        </>
      ) : (
        <p className={s.readOnlyText}>{text}</p>
      )}
    </div>
  );
}
