"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getCourse, type Course } from "@/lib/supabase/queries/courses";
import {
  deleteCourseFile,
  getCourseFileDownloadUrl,
  listCourseFiles,
  type CourseFile,
} from "@/lib/supabase/queries/files";
import {
  indexDocumentStatusesByFile,
  listCourseDocumentStatuses,
  type CourseDocumentStatus,
} from "@/lib/supabase/queries/documents";
import { listCourseDecks, type FlashcardDeckSummary } from "@/lib/supabase/queries/flashcards";
import { describeIndexingProgress, type IndexingTone } from "./documentIndexing";
import DocumentCourseChat from "./DocumentCourseChat";
import DocumentAiActions from "./DocumentAiActions";
import DocumentFlashcardGenerator from "./DocumentFlashcardGenerator";
import styles from "@/components/documents/documents.module.css";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}

const EXTENSION_LABELS: Record<string, string> = {
  "application/pdf": "PDF",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": "PPTX",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "DOCX",
  "text/plain": "TXT",
};

// The browser can render PDF and plain text inline via <iframe>; Office
// formats have no native inline viewer and fall back to download/open-in-tab.
const INLINE_VIEWABLE_TYPES = new Set(["application/pdf", "text/plain"]);

const TONE_MAP: Record<IndexingTone, "ready" | "processing" | "queued" | "failed"> = {
  ready: "ready",
  active: "processing",
  pending: "queued",
  failed: "failed",
};

const TONE_LABELS: Record<IndexingTone, string> = {
  ready: "Bereit",
  active: "Wird analysiert",
  pending: "Warteschlange",
  failed: "Fehlgeschlagen",
};

type Tab = "content" | "chat" | "actions" | "flashcards" | "quizzes" | "details";

export default function CourseDocumentDetail({ courseId, fileId }: { courseId: string; fileId: string }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [file, setFile] = useState<CourseFile | null | undefined>(undefined);
  const [documentStatuses, setDocumentStatuses] = useState<CourseDocumentStatus[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>("content");
  const [viewUrl, setViewUrl] = useState<string | null>(null);
  const [viewUrlError, setViewUrlError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const [decks, setDecks] = useState<FlashcardDeckSummary[] | undefined>(undefined);

  useEffect(() => {
    if (tab === "flashcards" && decks === undefined) {
      listCourseDecks(courseId).then(setDecks).catch(() => setDecks([]));
    }
  }, [tab, courseId, decks]);

  function refreshDecks() {
    listCourseDecks(courseId).then(setDecks).catch(() => {});
  }

  useEffect(() => {
    let active = true;
    Promise.all([getCourse(courseId), listCourseFiles(courseId), listCourseDocumentStatuses(courseId)])
      .then(([nextCourse, files, nextStatuses]) => {
        if (!active) return;
        setCourse(nextCourse);
        setFile(files.find((entry) => entry.id === fileId) ?? null);
        setDocumentStatuses(nextStatuses);
      })
      .catch(() => {
        if (!active) return;
        setLoadError("Das Dokument konnte nicht geladen werden. Bitte versuche es erneut.");
        setCourse(null);
        setFile(null);
      });
    return () => { active = false; };
  }, [courseId, fileId]);

  const statusByFile = useMemo(() => indexDocumentStatusesByFile(documentStatuses), [documentStatuses]);
  const progress = useMemo(
    () => (file ? describeIndexingProgress(file.status, statusByFile.get(file.id) ?? null) : null),
    [file, statusByFile]
  );

  const canView = file?.status === "ready" && progress?.tone === "ready";
  const inlineViewable = file ? INLINE_VIEWABLE_TYPES.has(file.type) : false;

  useEffect(() => {
    if (!file || !canView) return;
    let active = true;
    getCourseFileDownloadUrl(file.id, false)
      .then((url) => { if (active) setViewUrl(url); })
      .catch(() => { if (active) setViewUrlError("Die Vorschau konnte nicht geladen werden."); });
    return () => { active = false; };
  }, [file, canView]);

  async function handleOpen(download: boolean) {
    if (!file) return;
    setActionError(null);
    try {
      const url = await getCourseFileDownloadUrl(file.id, download);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setActionError("Die Datei konnte nicht geöffnet werden.");
    }
  }

  async function confirmDelete() {
    if (!file) return;
    setDeleting(true);
    setActionError(null);
    try {
      await deleteCourseFile(file.id);
      router.push(`/courses/${courseId}/documents`);
    } catch {
      setActionError("Das Dokument konnte nicht gelöscht werden.");
      setDeleting(false);
    }
  }

  if (course === undefined || file === undefined) {
    return <div className={styles.page}><p className={styles.loading} aria-live="polite">Dokument wird geladen …</p></div>;
  }

  if (course === null || file === null) {
    return (
      <div className={styles.page}>
        <div className={styles.empty} role="alert">
          <h2>Dokument nicht verfügbar</h2>
          <p>{loadError ?? "Dieses Dokument existiert nicht oder du hast keinen Zugriff darauf."}</p>
          <Link href={`/courses/${courseId}/documents`} className={styles.uploadButton}>Zurück zu Unterlagen</Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <Link href={`/courses/${courseId}/documents`} className={styles.backLink}>
        <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="m11 5-6 7 6 7M5 12h14" /></svg>
        Zurück zu Unterlagen
      </Link>

      <header className={styles.header}>
        <div>
          <h1>{file.name}</h1>
          <p className={styles.subhead}>{course.title}</p>
        </div>
        {canView && (
          <button type="button" className={styles.uploadButton} onClick={() => void handleOpen(true)}>
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 16V5M7 12l5 5 5-5" /><path d="M4 19h16" /></svg>
            Herunterladen
          </button>
        )}
      </header>
      {actionError && <p className={styles.errorHint} role="alert">{actionError}</p>}

      <div className={styles.tabs} role="tablist">
        <button type="button" role="tab" aria-selected={tab === "content"} className={styles.tab} data-active={tab === "content"} onClick={() => setTab("content")}>Inhalt</button>
        <button type="button" role="tab" aria-selected={tab === "chat"} className={styles.tab} data-active={tab === "chat"} onClick={() => setTab("chat")}>Chat</button>
        <button type="button" role="tab" aria-selected={tab === "actions"} className={styles.tab} data-active={tab === "actions"} onClick={() => setTab("actions")}>KI-Aktionen</button>
        <button type="button" role="tab" aria-selected={tab === "flashcards"} className={styles.tab} data-active={tab === "flashcards"} onClick={() => setTab("flashcards")}>Karteikarten</button>
        <button type="button" role="tab" aria-selected={tab === "quizzes"} className={styles.tab} data-active={tab === "quizzes"} onClick={() => setTab("quizzes")}>Tests</button>
        <button type="button" role="tab" aria-selected={tab === "details"} className={styles.tab} data-active={tab === "details"} onClick={() => setTab("details")}>Details</button>
      </div>

      {tab === "content" && (
        <section className={styles.viewerCard}>
          <div className={styles.viewerHeader}>
            <span>Dokumentvorschau</span>
            {canView && (
              <button type="button" className={styles.viewerLink} onClick={() => void handleOpen(false)}>
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M14 4h6v6" /><path d="M10 14 20 4" /><path d="M18 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></svg>
                In neuem Tab öffnen
              </button>
            )}
          </div>
          <div className={styles.viewerFrameWrap}>
            {!canView ? (
              <div className={styles.viewerEmpty}>
                <p><strong>{TONE_LABELS[progress!.tone]}</strong></p>
                <p>{progress!.detail ?? "Dieses Dokument ist noch nicht zur Vorschau bereit."}</p>
              </div>
            ) : !inlineViewable ? (
              <div className={styles.viewerEmpty}>
                <p><strong>Keine Inline-Vorschau für {EXTENSION_LABELS[file.type] ?? "diesen Dateityp"}.</strong></p>
                <p>Öffne die Datei zum Ansehen in einem neuen Tab oder lade sie herunter.</p>
              </div>
            ) : viewUrlError ? (
              <div className={styles.viewerEmpty}><p>{viewUrlError}</p></div>
            ) : viewUrl ? (
              <iframe title={file.name} src={viewUrl} className={styles.viewerFrame} />
            ) : (
              <div className={styles.viewerSkeleton} aria-hidden="true" />
            )}
          </div>
        </section>
      )}

      {tab === "chat" && (
        <section className={styles.viewerCard}>
          <DocumentCourseChat courseId={courseId} courseTitle={course.title} />
        </section>
      )}

      {tab === "actions" && (
        <section className={styles.viewerCard}>
          <DocumentAiActions courseId={courseId} courseTitle={course.title} fileName={file.name} />
        </section>
      )}

      {tab === "flashcards" && (
        <section className={styles.viewerCard}>
          {decks === undefined ? (
            <p className={styles.loading}>Karteikarten werden geladen …</p>
          ) : decks.length > 0 ? (
            <>
              <ul className={styles.deckList}>
                {decks.map((deck) => (
                  <li key={deck.materialId}>
                    <Link href={`/courses/${courseId}/flashcards/${deck.materialId}`}>
                      <span>{deck.title}</span>
                      <span className={styles.deckCount}>{deck.cardCount} Karten</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className={styles.deckListFooter}>
                <DocumentFlashcardGenerator courseId={courseId} fileName={file.name} onSaved={refreshDecks} compact />
              </div>
            </>
          ) : (
            <DocumentFlashcardGenerator courseId={courseId} fileName={file.name} onSaved={refreshDecks} />
          )}
        </section>
      )}

      {tab === "quizzes" && (
        <section className={styles.viewerCard}>
          <div className={styles.panelEmpty}>
            <span className={styles.panelIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.7.3-1.4.9-1.4 1.7" /><path d="M12 17h.01" /></svg>
            </span>
            <h3>Tests sind noch nicht verfügbar</h3>
            <p>Automatisch generierte Tests aus deinen Unterlagen sind für Lernapp geplant, aber noch nicht umgesetzt.</p>
          </div>
        </section>
      )}

      {tab === "details" && (
        <section className={styles.viewerCard}>
          <dl className={styles.detailList}>
            <div><dt>Dateityp</dt><dd>{EXTENSION_LABELS[file.type] ?? file.type}</dd></div>
            <div><dt>Größe</dt><dd>{formatSize(file.size)}</dd></div>
            <div><dt>Hochgeladen am</dt><dd>{formatDate(file.createdAt)}</dd></div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className={styles.badge} data-tone={TONE_MAP[progress!.tone]}>
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
                  {TONE_LABELS[progress!.tone]}
                </span>
              </dd>
            </div>
          </dl>
          {progress?.detail && <p className={styles.badgeDetail}>{progress.detail}</p>}

          <div className={styles.dangerZoneInline}>
            <button type="button" className={styles.dangerLink} onClick={() => setConfirmingDelete(true)}>Dokument löschen</button>
          </div>
        </section>
      )}

      {confirmingDelete && (
        <div className={styles.backdrop} onClick={(event) => { if (event.target === event.currentTarget && !deleting) setConfirmingDelete(false); }}>
          <div className={styles.confirmDialog} role="alertdialog" aria-modal="true" aria-labelledby="delete-document-heading">
            <span className={styles.confirmIcon} aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 7h14M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0-.9 12.1a2 2 0 0 1-2 1.9H8.9a2 2 0 0 1-2-1.9L6 7Z" /><path d="M10 11v6M14 11v6" /></svg>
            </span>
            <h2 id="delete-document-heading">Dokument löschen?</h2>
            <p>„{file.name}&quot; wird endgültig entfernt. Das kann nicht rückgängig gemacht werden.</p>
            <div className={styles.dialogFooter}>
              <button type="button" className={styles.cancelButton} onClick={() => setConfirmingDelete(false)} disabled={deleting}>Abbrechen</button>
              <button type="button" className={styles.dangerButton} onClick={() => void confirmDelete()} disabled={deleting}>
                {deleting ? "Wird gelöscht …" : "Löschen"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
