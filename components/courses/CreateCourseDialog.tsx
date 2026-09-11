"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import styles from "./courses.module.css";

export default function CreateCourseDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { title: string; description: string }) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    titleInputRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!title.trim()) return;
    onCreate({ title: title.trim(), description: description.trim() });
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
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="course-description">Beschreibung</label>
            <textarea
              id="course-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Kurzer Kontext zum Kurs"
            />
            <p className={styles.hint}>
              Wird später als Kontext für den KI-Assistenten genutzt.
            </p>
          </div>
          <button type="submit" className={styles.submitButton}>
            Kurs erstellen
          </button>
        </form>
      </div>
    </div>
  );
}
