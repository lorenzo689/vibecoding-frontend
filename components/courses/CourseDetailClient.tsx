"use client";

import { useEffect, useState, useSyncExternalStore, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCourse, getCourse, subscribe } from "@/lib/courses";
import {
  addCourseFile,
  deleteCourseFile,
  deleteCourseFiles,
  getCourseFiles,
  type CourseFile,
} from "@/lib/courseFiles";
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
  const course = useSyncExternalStore(
    subscribe,
    () => getCourse(courseId) ?? null,
    () => undefined
  );
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);

  useEffect(() => {
    getCourseFiles(courseId).then(setFiles);
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
    await Promise.all(allowed.map((file) => addCourseFile(courseId, file)));
    setFiles(await getCourseFiles(courseId));
  }

  function handleDownload(file: CourseFile) {
    const url = URL.createObjectURL(file.blob);
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
    setFiles(await getCourseFiles(courseId));
  }

  async function handleDeleteCourse() {
    if (!window.confirm("Diesen Kurs wirklich löschen? Das kann nicht rückgängig gemacht werden.")) {
      return;
    }
    await deleteCourseFiles(courseId);
    deleteCourse(courseId);
    router.push("/courses");
  }

  if (course === undefined) return null;

  if (course === null) {
    return (
      <div className={styles.page}>
        <div className={styles.empty}>
          <h2>Kurs nicht gefunden</h2>
          <p>
            Dieser Kurs existiert nicht in diesem Browser — lokale
            Kurs-Daten werden nicht geräteübergreifend synchronisiert.
          </p>
          <Link href="/courses" className={styles.createButton}>
            Zurück zur Kursübersicht
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      <div className={styles.topRow}>
        <Link href="/courses" className={styles.backLink}>
          ← Zurück zur Kursübersicht
        </Link>
      </div>
      <span
        className={`${dashboardStyles.badge} ${styles.badge}`}
        data-color={course.color}
      >
        {course.code}
      </span>
      <h1 style={{ marginTop: 16 }}>{course.name}</h1>
      <p>{course.description || "Keine Beschreibung hinterlegt."}</p>

      <div className={styles.uploadSection}>
        <h2>Vorlesungsfolien & Übungen</h2>
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
          PDF, Word, Excel oder Bilder. Nur lokal in diesem Browser
          gespeichert, solange es noch keinen Datei-Speicher im Backend gibt.
        </p>
        {fileError && <p className={styles.uploadHint}>{fileError}</p>}

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
