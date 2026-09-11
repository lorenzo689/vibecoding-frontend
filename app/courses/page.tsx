"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createCourse, listCourses, type Course } from "@/lib/supabase/queries/courses";
import { deriveCourseBadge } from "@/lib/courseBadge";
import CreateCourseDialog from "@/components/courses/CreateCourseDialog";
import dashboardStyles from "@/components/dashboard.module.css";
import styles from "@/components/courses/courses.module.css";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadCourses() {
    setLoading(true);
    setError(null);
    try {
      setCourses(await listCourses());
    } catch {
      setError("Deine Kurse konnten nicht geladen werden. Bitte versuche es erneut.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;

    listCourses()
      .then((nextCourses) => {
        if (active) setCourses(nextCourses);
      })
      .catch(() => {
        if (active) {
          setError("Deine Kurse konnten nicht geladen werden. Bitte versuche es erneut.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
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
    <div className={styles.page}>
      <div className={styles.header}>
        <h1>Kurse</h1>
        {courses.length > 0 && (
          <button
            type="button"
            className={styles.createButton}
            onClick={() => setDialogOpen(true)}
          >
            + Kurs anlegen
          </button>
        )}
      </div>
      {error && <p className={styles.uploadHint} role="alert">{error}</p>}

      {courses.length === 0 ? (
        <div className={styles.empty}>
          <h2>Noch kein Kurs angelegt</h2>
          <p>
            Leg deinen ersten Kurs an, um Vorlesungsmaterial, Notizen und
            Termine daran zu verknüpfen.
          </p>
          <button
            type="button"
            className={styles.createButton}
            onClick={() => setDialogOpen(true)}
          >
            + Kurs anlegen
          </button>
        </div>
      ) : (
        <div className={dashboardStyles.courseGrid}>
          {courses.map((course) => {
            const badge = deriveCourseBadge(course.title);
            return (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className={styles.courseLink}
              >
                <article className={dashboardStyles.course}>
                  <div className={dashboardStyles.courseTop}>
                    <span
                      className={`${dashboardStyles.badge} ${styles.badge}`}
                      data-color={badge.color}
                    >
                      {badge.code}
                    </span>
                    <small>KURS</small>
                  </div>
                  <h3>{course.title}</h3>
                  <p>{course.description || "Keine Beschreibung hinterlegt."}</p>
                </article>
              </Link>
            );
          })}
        </div>
      )}

      {dialogOpen && (
        <CreateCourseDialog
          onClose={() => setDialogOpen(false)}
          onCreate={handleCreate}
        />
      )}
    </div>
  );
}
