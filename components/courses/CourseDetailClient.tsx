"use client";

import { useEffect, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCourse, getCourse, type Course } from "@/lib/supabase/queries/courses";
import {
  addCourseFile,
  deleteCourseFile,
  deleteLocalBlob,
  getCourseFileBlob,
  listCourseFiles,
  type CourseFile,
} from "@/lib/supabase/queries/files";
import { deriveCourseBadge } from "@/lib/courseBadge";
import dashboardStyles from "@/components/dashboard.module.css";
import styles from "./courses.module.css";

const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];
const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".gif",
  ".webp",
];

function isAllowedFile(file: File): boolean {
  if (file.type.startsWith("image/")) return true;
  if (ALLOWED_MIME_TYPES.includes(file.type)) return true;
  const lower = file.name.toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CourseDetailClient({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [downloadError, setDownloadError] = useState<string | null>(null);

  useEffect(() => {
    getCourse(courseId).then(setCourse);
    listCourseFiles(courseId).then(setFiles);
  }, [courseId]);

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (selected.length === 0) return;

    const allowed = selected.filter(isAllowedFile);
    if (allowed.length < selected.length) {
      setFileError("Nur PDF, Word, Excel und Bilddateien werden unterstützt.");
    } else {
      setFileError(null);
    }
    const uploaded = await Promise.all(allowed.map((file) => addCourseFile(courseId, file)));
    setFiles((prev) => [...prev, ...uploaded]);
  }

  async function handleDownload(file: CourseFile) {
    const blob = await getCourseFileBlob(file.id);
    if (!blob) {
      setDownloadError(
        `„${file.name}" ist nur auf dem Gerät verfügbar, auf dem sie hochgeladen wurde.`
      );
      return;
    }
    setDownloadError(null);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  async function handleRemoveFile(id: string) {
    await deleteCourseFile(id);
    setFiles((prev) => prev.filter((file) => file.id !== id));
  }

  async function handleDeleteCourse() {
    if (!window.confirm("Diesen Kurs wirklich löschen? Das kann nicht rückgängig gemacht werden.")) {
      return;
    }
    const currentFiles = await listCourseFiles(courseId);
    await deleteCourse(courseId);
    await Promise.all(currentFiles.map((file) => deleteLocalBlob(file.id)));
    router.push("/courses");
  }

  if (course === undefined) return null;

  if (course === null) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h2>Kurs nicht gefunden</h2>
          <p>Dieser Kurs existiert nicht oder du hast keinen Zugriff darauf.</p>
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
      <span
        className={`${dashboardStyles.badge} ${styles.badge}`}
        data-color={badge.color}
      >
        {badge.code}
      </span>
      <h1 style={{ marginTop: 16 }}>{course.title}</h1>
      <p>{course.description || "Keine Beschreibung hinterlegt."}</p>

      <div className={styles.uploadSection}>
        <h2>
          Vorlesungsfolien & Übungen <small>{files.length}</small>
        </h2>
        <label className={styles.uploadLabel}>
          + Datei hochladen
          <input
            type="file"
            multiple
            accept=".pdf,.doc,.docx,.xls,.xlsx,image/*"
            onChange={handleFileChange}
          />
        </label>
        <p className={styles.uploadHint}>
          PDF, Word, Excel oder Bilder. Metadaten werden gespeichert, der
          Dateiinhalt bleibt aktuell nur auf diesem Gerät (noch kein
          Datei-Speicher im Backend).
        </p>
        {fileError && <p className={styles.uploadHint}>{fileError}</p>}
        {downloadError && <p className={styles.uploadHint}>{downloadError}</p>}

        {files.length > 0 && (
          <ul className={styles.fileList}>
            {files.map((file) => (
              <li key={file.id} className={styles.fileRow}>
                <button
                  type="button"
                  className={styles.fileName}
                  onClick={() => handleDownload(file)}
                  title="Herunterladen"
                >
                  {file.name}
                </button>
                <small>{formatSize(file.size)}</small>
                <button
                  type="button"
                  className={styles.fileRemove}
                  aria-label={`${file.name} entfernen`}
                  onClick={() => handleRemoveFile(file.id)}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        )}
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
