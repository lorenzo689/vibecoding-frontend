"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createCourse, listCourses, type Course } from "@/lib/supabase/queries/courses";
import { deriveCourseBadge } from "@/lib/courseBadge";
import CreateCourseDialog from "@/components/courses/CreateCourseDialog";
import styles from "@/components/courses/courses.module.css";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function fetchCourses() {
    return listCourses()
      .then((nextCourses) => {
        setCourses(nextCourses);
      })
      .catch(() => {
        setError("Deine Kurse konnten nicht geladen werden. Bitte versuche es erneut.");
      })
      .finally(() => {
        setLoading(false);
      });
  }

  function loadCourses() {
    setLoading(true);
    setError(null);
    fetchCourses();
  }

  useEffect(() => {
    fetchCourses();
  }, []);

  async function handleCreate(input: { title: string; description: string }) {
    setError(null);
    try {
      const course = await createCourse(input);
      setCourses((prev) => [...prev, course]);
      setDialogOpen(false);
    } catch {
      setError("Der Kurs konnte nicht erstellt werden.");
      throw new Error("create-course-failed");
    }
  }

  if (loading) return <div className={styles.page} aria-live="polite">Kurse werden geladen …</div>;

  if (error && courses.length === 0) {
    return (
      <div className={styles.page}>
        <div className={styles.empty} role="alert">
          <h2>Kurse nicht verfügbar</h2>
          <p>{error}</p>
          <button type="button" className={styles.createButton} onClick={loadCourses}>Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.catalog} data-full-bleed>
      <header className={styles.catalogHeader}>
        <p className={styles.micro}>03 / KURSINDEX</p>
        <h1>Kurse.</h1>
        <p className={styles.subhead}>Material, Notizen und Termine bleiben pro Kurs an einem Ort statt über Ordner und Apps verstreut.</p>
      </header>

      <div className={styles.toolbar}>
        <span className={styles.count}><strong>{String(courses.length).padStart(2, "0")}</strong>Kurse angelegt</span>
        <button type="button" className={styles.createButton} onClick={() => setDialogOpen(true)}>+ Kurs anlegen</button>
      </div>

      {error && <p className={styles.uploadHint} role="alert">{error}</p>}
      {courses.length === 0 ? (
        <div className={styles.empty}><h2>Dein erster Kurs wartet.</h2><p>Leg einen Kurs an, um Vorlesungsmaterial, Notizen und Termine daran zu verknüpfen.</p><button type="button" className={styles.createButton} onClick={() => setDialogOpen(true)}>+ Kurs anlegen</button></div>
      ) : <ol className={styles.grid}>
        {courses.map((course, index) => <li key={course.id}><Link href={`/courses/${course.id}`} className={styles.card}>
          <div className={styles.cardHead}>
            <span className={styles.courseNumber}>{String(index + 1).padStart(2, "0")}</span>
            <span className={styles.courseCode}>{deriveCourseBadge(course.title).code} / KURS</span>
          </div>
          <h3>{course.title}</h3>
          <p>{course.description || "Keine Beschreibung hinterlegt."}</p>
          <span className={styles.courseArrow} aria-hidden="true">→</span>
        </Link></li>)}
      </ol>}
      <p className={styles.catalogFoot}>Sortiert nach zuletzt angelegt.</p>

      {dialogOpen && <CreateCourseDialog onClose={() => setDialogOpen(false)} onCreate={handleCreate} />}
    </div>
  );
}
