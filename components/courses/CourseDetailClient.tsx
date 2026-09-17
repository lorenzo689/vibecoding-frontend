"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCourse, getCourse, type Course } from "@/lib/supabase/queries/courses";
import {
  deleteCourseFile,
  getCourseFileDownloadUrl,
  listCourseFiles,
  uploadCourseFile,
  type CourseFile,
} from "@/lib/supabase/queries/files";
import {
  indexDocumentStatusesByFile,
  listCourseDocumentStatuses,
  type CourseDocumentStatus,
} from "@/lib/supabase/queries/documents";
import { deriveCourseBadge } from "@/lib/courseBadge";
import DocumentIndexingStatus from "./DocumentIndexingStatus";
import { describeIndexingProgress } from "./documentIndexing";
import dashboardStyles from "@/components/dashboard.module.css";
import styles from "./courses.module.css";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const UPLOAD_ERROR_MESSAGES: Record<string, string> = {
  INVALID_FILE: "Nur PDF, PPTX, DOCX und TXT werden unterstützt.",
  FILE_TOO_LARGE: "Die Datei ist größer als 50 MiB.",
  COURSE_NOT_FOUND: "Dieser Kurs wurde nicht gefunden. Bitte lade die Seite neu.",
  UPLOAD_KEY_CONFLICT: "Der Upload-Vorgang steht in Konflikt. Bitte versuche es erneut.",
  UPLOAD_DELETED: "Dieser Upload wurde bereits gelöscht. Bitte versuche es erneut.",
  UNAUTHENTICATED: "Deine Sitzung ist abgelaufen. Bitte melde dich erneut an.",
};

function uploadErrorMessage(error: unknown): string {
  const code = error instanceof Error ? error.message : "";
  return UPLOAD_ERROR_MESSAGES[code] ?? "Die Datei konnte nicht hochgeladen werden.";
}

// The backend publishes no realtime channel for document processing
// (../lernapp_backend/docs/documents.md), so unfinished documents are polled.
// The regular cron worker runs once a minute; the cap keeps a document that
// never reaches a final state from polling for the whole session.
const STATUS_POLL_INTERVAL_MS = 5000;
const STATUS_POLL_MAX_ATTEMPTS = 120;

export default function CourseDetailClient({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [documentStatuses, setDocumentStatuses] = useState<CourseDocumentStatus[]>([]);
  const pollAttemptsRef = useRef(0);

  useEffect(() => {
    let active = true;
    Promise.all([getCourse(courseId), listCourseFiles(courseId), listCourseDocumentStatuses(courseId)])
      .then(([nextCourse, nextFiles, nextStatuses]) => {
        if (!active) return;
        setCourse(nextCourse);
        setFiles(nextFiles);
        setDocumentStatuses(nextStatuses);
      })
      .catch(() => {
        if (!active) return;
        setLoadError("Der Kurs konnte nicht geladen werden. Bitte versuche es erneut.");
        setCourse(null);
      });
    return () => { active = false; };
  }, [courseId]);

  const statusByFile = useMemo(
    () => indexDocumentStatusesByFile(documentStatuses),
    [documentStatuses]
  );

  const fileProgress = useMemo(
    () =>
      files.map((file) => ({
        file,
        progress: describeIndexingProgress(file.status, statusByFile.get(file.id) ?? null),
      })),
    [files, statusByFile]
  );

  const hasUnfinishedDocuments = fileProgress.some((entry) => entry.progress.inProgress);

  const refreshStatuses = useCallback(async () => {
    const [nextFiles, nextStatuses] = await Promise.all([
      listCourseFiles(courseId),
      listCourseDocumentStatuses(courseId),
    ]);
    return { nextFiles, nextStatuses };
  }, [courseId]);

  // Poll while at least one document is still being verified, extracted or
  // indexed. Navigating away or reaching a final state stops the interval.
  useEffect(() => {
    if (!hasUnfinishedDocuments) {
      pollAttemptsRef.current = 0;
      return;
    }
    let active = true;
    const timer = setInterval(() => {
      if (pollAttemptsRef.current >= STATUS_POLL_MAX_ATTEMPTS) {
        clearInterval(timer);
        return;
      }
      pollAttemptsRef.current += 1;
      refreshStatuses()
        .then(({ nextFiles, nextStatuses }) => {
          if (!active) return;
          setFiles(nextFiles);
          setDocumentStatuses(nextStatuses);
        })
        .catch(() => {
          // A transient status request failure is not worth an error banner;
          // the next tick retries.
        });
    }, STATUS_POLL_INTERVAL_MS);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [hasUnfinishedDocuments, refreshStatuses]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    setActionError(null);
    setUploading(true);
    try {
      for (const file of selected) {
        const uploaded = await uploadCourseFile(courseId, file);
        setFiles((prev) => [uploaded, ...prev]);
      }
      // A fresh upload starts its own pipeline run; allow the full poll budget.
      pollAttemptsRef.current = 0;
      const { nextStatuses } = await refreshStatuses();
      setDocumentStatuses(nextStatuses);
    } catch (error) {
      setActionError(uploadErrorMessage(error));
    } finally {
      setUploading(false);
    }
  }

  async function handleDownload(file: CourseFile) {
    setActionError(null);
    try {
      const url = await getCourseFileDownloadUrl(file.id, true);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      setActionError(
        file.status === "ready"
          ? "Der Download konnte nicht gestartet werden."
          : "Diese Datei ist noch nicht zum Download bereit."
      );
    }
  }

  async function handleRemoveFile(id: string) {
    setActionError(null);
    setRemovingId(id);
    try {
      await deleteCourseFile(id);
      setFiles((prev) => prev.filter((file) => file.id !== id));
      setDocumentStatuses((prev) => prev.filter((status) => status.fileId !== id));
    } catch {
      setActionError("Der Dateieintrag konnte nicht entfernt werden.");
    } finally {
      setRemovingId(null);
    }
  }

  async function handleDeleteCourse() {
    if (!window.confirm("Diesen Kurs wirklich löschen? Das kann nicht rückgängig gemacht werden.")) {
      return;
    }
    setActionError(null);
    try {
      await deleteCourse(courseId);
      router.push("/courses");
    } catch {
      setActionError("Der Kurs konnte nicht gelöscht werden.");
    }
  }

  if (course === undefined) return null;

  if (course === null) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h2>{loadError ? "Kurs nicht verfügbar" : "Kurs nicht gefunden"}</h2>
          <p>{loadError ?? "Dieser Kurs existiert nicht oder du hast keinen Zugriff darauf."}</p>
          <Link href="/courses" className={styles.createButton}>
            Zurück zur Kursübersicht
          </Link>
        </div>
      </div>
    );
  }

  const badge = deriveCourseBadge(course.title);

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <Link href="/courses" className={styles.backLink}>
          ← Zurück zur Kursübersicht
        </Link>
      </div>
      <div className={styles.courseHeaderRow}>
        <div className={styles.courseIdentity}>
          <span
            className={`${dashboardStyles.badge} ${styles.badge}`}
            data-color={badge.color}
          >
            {badge.code}
          </span>
          <h1 style={{ marginTop: 16 }}>{course.title}</h1>
          <p>{course.description || "Keine Beschreibung hinterlegt."}</p>
        </div>

        <div className={styles.toolGrid}>
          <Link href={`/courses/${courseId}/flashcards`} className={styles.courseLink}>
            <article className={styles.toolCard}>
              <span className={styles.toolIcon} data-tool="flashcards">KK</span>
              <div className={styles.toolBody}>
                <h3>Karteikarten</h3>
                <p>Aus deinem Vorlesungsmaterial lernen.</p>
              </div>
              <span className={styles.toolArrow} aria-hidden="true">→</span>
            </article>
          </Link>
          <Link href={`/courses/${courseId}/summaries`} className={styles.courseLink}>
            <article className={styles.toolCard}>
              <span className={styles.toolIcon} data-tool="summary">ZF</span>
              <div className={styles.toolBody}>
                <h3>Zusammenfassung</h3>
                <p>Das Wesentliche aus deinen Vorlesungen.</p>
              </div>
              <span className={styles.toolArrow} aria-hidden="true">→</span>
            </article>
          </Link>
        </div>
      </div>

      <div className={styles.uploadSection}>
        <h2>
          Vorlesungsfolien & Übungen <small>{files.length}</small>
        </h2>
        <label className={styles.uploadLabel} aria-disabled={uploading}>
          {uploading ? "Wird hochgeladen …" : "+ Datei hochladen"}
          <input
            type="file"
            multiple
            accept=".pdf,.pptx,.docx,.txt"
            onChange={handleFileChange}
            disabled={uploading}
          />
        </label>
        <p className={styles.uploadHint}>
          PDF, PowerPoint (.pptx), Word (.docx) oder Text (.txt), max. 50 MiB.
        </p>
        {actionError && <p className={styles.uploadHint} role="alert">{actionError}</p>}

        {files.length > 0 && (
          <ul className={styles.fileList}>
            {fileProgress.map(({ file, progress }) => (
              <li key={file.id} className={styles.fileRow}>
                {file.status === "ready" ? (
                  <button
                    type="button"
                    className={styles.fileName}
                    onClick={() => handleDownload(file)}
                    title="Herunterladen"
                  >
                    {file.name}
                  </button>
                ) : (
                  <span className={styles.fileName}>{file.name}</span>
                )}
                <DocumentIndexingStatus fileName={file.name} progress={progress} />
                <small>{formatSize(file.size)}</small>
                <button
                  type="button"
                  className={styles.fileRemove}
                  aria-label={`${file.name} entfernen`}
                  onClick={() => handleRemoveFile(file.id)}
                  disabled={removingId === file.id}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className={styles.dangerZone}>
        <button
          type="button"
          className={styles.dangerButton}
          onClick={handleDeleteCourse}
        >
          Kurs löschen
        </button>
      </div>
    </div>
  );
}
