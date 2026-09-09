"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import {
  createCourse,
  getCoursesServerSnapshot,
  getCoursesSnapshot,
  subscribe,
  type Course,
} from "@/lib/courses";
import CreateCourseDialog from "@/components/courses/CreateCourseDialog";
import dashboardStyles from "@/components/dashboard.module.css";
import styles from "@/components/courses/courses.module.css";

export default function CoursesPage() {
  const courses = useSyncExternalStore(
    subscribe,
    getCoursesSnapshot,
    getCoursesServerSnapshot
  );
  const [dialogOpen, setDialogOpen] = useState(false);

  function handleCreate(input: Omit<Course, "id" | "createdAt">) {
    createCourse(input);
    setDialogOpen(false);
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
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.id}`}
              className={styles.courseLink}
            >
              <article className={dashboardStyles.course}>
                <div className={dashboardStyles.courseTop}>
                  <span
                    className={`${dashboardStyles.badge} ${styles.badge}`}
                    data-color={course.color}
                  >
                    {course.code}
                  </span>
                  <small>KURS</small>
                </div>
                <h3>{course.name}</h3>
                <p>{course.description || "Keine Beschreibung hinterlegt."}</p>
              </article>
            </Link>
          ))}
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
