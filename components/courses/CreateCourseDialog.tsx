"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import type { Course } from "@/lib/courses";
import styles from "./courses.module.css";

const SWATCHES: { id: string; hex: string; label: string }[] = [
  { id: "green", hex: "#6b9a4f", label: "Grün" },
  { id: "amber", hex: "#c99a3e", label: "Amber" },
  { id: "sage", hex: "#4f9a72", label: "Salbei" },
  { id: "blue", hex: "#4f76b8", label: "Blau" },
  { id: "rose", hex: "#c25f5f", label: "Rosé" },
  { id: "violet", hex: "#7c5fae", label: "Violett" },
  { id: "teal", hex: "#3f9a8a", label: "Türkis" },
  { id: "coral", hex: "#d17a3a", label: "Koralle" },
  { id: "indigo", hex: "#5560c2", label: "Indigo" },
];

export default function CreateCourseDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: Omit<Course, "id" | "createdAt">) => void;
}) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [color, setColor] = useState(SWATCHES[0].id);
  const [description, setDescription] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    nameInputRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim() || !code.trim()) return;
    onCreate({
      name: name.trim(),
      code: code.trim().slice(0, 4).toUpperCase(),
      color,
      description: description.trim(),
    });
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
            <label htmlFor="course-name">Name</label>
            <input
              id="course-name"
              ref={nameInputRef}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="z. B. Neue Konzepte"
              required
            />
          </div>
          <div className={styles.field}>
            <label htmlFor="course-code">Kürzel</label>
            <input
              id="course-code"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              placeholder="z. B. NK"
              maxLength={4}
              required
            />
          </div>
          <div className={styles.field}>
            <label>Farbe</label>
            <div className={styles.swatchRow}>
              {SWATCHES.map((swatch) => (
                <button
                  key={swatch.id}
                  type="button"
                  className={styles.swatch}
                  style={{ background: swatch.hex }}
                  aria-label={swatch.label}
                  aria-pressed={color === swatch.id}
                  onClick={() => setColor(swatch.id)}
                />
              ))}
            </div>
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
