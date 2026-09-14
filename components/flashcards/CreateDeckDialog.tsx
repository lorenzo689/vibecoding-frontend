"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import s from "./flashcards.module.css";

export default function CreateDeckDialog({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (title: string) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
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
      await onCreate(title.trim());
    } catch {
      setError("Das Deck konnte nicht erstellt werden. Bitte versuche es erneut.");
      setSaving(false);
    }
  }

  return (
    <div
      className={s.backdrop}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className={s.dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-deck-heading"
      >
        <div className={s.dialogHeader}>
          <h2 id="create-deck-heading">Deck anlegen</h2>
          <button
            type="button"
            className={s.closeButton}
            aria-label="Schließen"
            onClick={onClose}
          >
            ✕
          </button>
        </div>
        <form onSubmit={submit}>
          <div className={s.field}>
            <label htmlFor="deck-title">Titel</label>
            <input
              id="deck-title"
              ref={titleInputRef}
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="z. B. Woche 1 – Grundlagen"
              required
              disabled={saving}
            />
          </div>
          {error && <p className={s.hint} role="alert">{error}</p>}
          <button type="submit" className={s.submitButton} disabled={saving || !title.trim()}>
            {saving ? "Wird erstellt …" : "+ Deck erstellen"}
          </button>
        </form>
      </div>
    </div>
  );
}
