"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { deleteCourse, getCourse, type Course } from "@/lib/supabase/queries/courses";
import {
  deleteCourseFile,
  listCourseFiles,
  type CourseFile,
} from "@/lib/supabase/queries/files";
import { deriveCourseBadge } from "@/lib/courseBadge";
import dashboardStyles from "@/components/dashboard.module.css";
import styles from "./courses.module.css";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function CourseDetailClient({ courseId }: { courseId: string }) {
  const router = useRouter();
  const [course, setCourse] = useState<Course | null | undefined>(undefined);
  const [files, setFiles] = useState<CourseFile[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getCourse(courseId), listCourseFiles(courseId)])
      .then(([nextCourse, nextFiles]) => {
        if (!active) return;
        setCourse(nextCourse);
        setFiles(nextFiles);
      })
      .catch(() => {
        if (!active) return;
        setLoadError("Der Kurs konnte nicht geladen werden. Bitte versuche es erneut.");
        setCourse(null);
      });
    return () => { active = false; };
  }, [courseId]);

  async function handleRemoveFile(id: string) {
    setActionError(null);
    try {
      await deleteCourseFile(id);
      setFiles((prev) => prev.filter((file) => file.id !== id));
    } catch {
      setActionError("Der Dateieintrag konnte nicht entfernt werden.");
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
        <button type="button" className={styles.uploadLabel} disabled>
          + Datei hochladen
        </button>
        <p className={styles.uploadHint}>
          Noch nicht verfügbar: Das Backend besitzt Dateimetadaten, aber noch
          keinen freigegebenen Storage-Bucket für Datei-Inhalte.
        </p>
        {actionError && <p className={styles.uploadHint} role="alert">{actionError}</p>}

        {files.length > 0 && (
          <ul className={styles.fileList}>
            {files.map((file) => (
              <li key={file.id} className={styles.fileRow}>
                <span className={styles.fileName}>{file.name}</span>
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
