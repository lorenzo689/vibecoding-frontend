"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./courses.module.css";

export default function CreateCourseDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { title: string; description: string }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
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
    if (!title.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onCreate({ title: title.trim(), description: description.trim() });
    } catch {
      setError("Der Kurs konnte nicht erstellt werden. Bitte versuche es erneut.");
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
        aria-labelledby="create-course-heading"
      >
        <div className={styles.dialogHeader}>
          <h2 id="create-course-heading">Kurs anlegen</h2>
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
            <label htmlFor="course-title">Name</label>
            <input
              id="course-title"
              ref={titleInputRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="z. B. Neue Konzepte"
              required
              disabled={saving}
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="course-description">Beschreibung</label>
            <textarea
              id="course-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Kurzer Kontext zum Kurs"
              disabled={saving}
            />
            <p className={styles.hint}>
              Wird später als Kontext für den KI-Assistenten genutzt.
            </p>
          </div>
          {error && <p className={styles.hint} role="alert">{error}</p>}
          <button type="submit" className={styles.submitButton} disabled={saving}>
            {saving ? "Wird erstellt …" : "Kurs erstellen"}
          </button>
        </form>
      </div>
    </div>
  );
}
