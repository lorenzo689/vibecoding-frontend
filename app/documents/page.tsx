import type { Metadata } from "next";
import s from "@/components/documents/documents.module.css";

export const metadata: Metadata = {
  title: "Unterlagen | UniVerse",
  description: "Vorlesungsmaterial, persönliche Notizen und Lernfortschritt im Kurskontext.",
};

// Fixed presentation fixtures, not persisted records or an API contract.
const statusLabels = { ready: "Bereit", processing: "Wird analysiert", queued: "Warteschlange", failed: "Fehlgeschlagen" } as const;

const documents = [
  { id: "vibe", title: "Vibe Coding Setup.pdf", size: "8.8 KB", flashcards: 3, status: "ready", uploaded: "vor 4 Minuten" },
  { id: "network", title: "Network Security.pdf", size: "100.9 KB", flashcards: 5, status: "processing", uploaded: "vor 1 Tag" },
  { id: "threat", title: "Threat Modeling Lab.pdf", size: "106.9 KB", flashcards: 0, status: "queued", uploaded: "vor 1 Tag" },
  { id: "protocols", title: "Security Protocols.pdf", size: "113.1 KB", flashcards: 2, status: "failed", uploaded: "vor 2 Tagen" },
  { id: "foundations", title: "Software Foundations.pdf", size: "95.4 KB", flashcards: 4, status: "ready", uploaded: "vor 3 Tagen" },
] as const;

export default function DocumentsPage() {
  return (
    <div className={s.page}>
      <div className={s.preview}>
        PRODUKTVORSCHAU <span>Unterlagen und Lernstände sind illustrative Beispieldaten. Es werden keine Dateien hochgeladen oder verarbeitet.</span>
      </div>

      <header className={s.header}>
        <div>
          <h1>Unterlagen</h1>
          <p className={s.subhead}>Verwalte und organisiere deine Lernmaterialien.</p>
        </div>
        <button type="button" className={s.uploadButton} disabled aria-describedby="upload-note">
          <span aria-hidden="true">+</span> Hochladen
        </button>
      </header>
      <p id="upload-note" className={s.uploadNote}>Datei-Upload ist in dieser Vorschau noch nicht verfügbar.</p>

      <div className={s.grid}>
        {documents.map((document) => (
          <article key={document.id} className={s.card}>
            <span className={s.icon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M13.6 3.6V8h4.3M9 12.5h6M9 16h6" /></svg>
            </span>
            <h2 className={s.title}>{document.title}</h2>
            <p className={s.size}>{document.size}</p>
            <div className={s.badges}>
              <span className={s.badge} data-tone="purple">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="13" height="15" rx="2.4" /><path d="M9 10h4M9 14h4" /></svg>
                {document.flashcards} Karteikarten
              </span>
              <span className={s.badge} data-tone={document.status}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
                {statusLabels[document.status]}
              </span>
            </div>
            <p className={s.uploaded}>
              <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
              Hochgeladen {document.uploaded}
            </p>
          </article>
        ))}
      </div>
    </div>
  );
}
