"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { listCourses, type Course } from "@/lib/supabase/queries/courses";
import { deriveCourseBadge } from "@/lib/courseBadge";
import CourseAssessments from "./CourseAssessments";
import shared from "@/components/dashboard.module.css";
import s from "./grades.module.css";

export default function GradesWorkspace() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);

  function fetchCourses() {
    return listCourses()
      .then((nextCourses) => {
        setCourses(nextCourses);
        setSelectedCourseId((current) => current ?? nextCourses[0]?.id ?? null);
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

  const selectedCourse = courses.find((course) => course.id === selectedCourseId) ?? null;

  if (loading) {
    return <div className={`${shared.dashboard} ${s.page}`} aria-live="polite">Deine Kurse werden geladen …</div>;
  }

  if (error && courses.length === 0) {
    return (
      <div className={`${shared.dashboard} ${s.page}`}>
        <section className={shared.intro}>
          <div><p className={shared.eyebrow}>DEIN FORTSCHRITT, IM BLICK</p><h1>Deine Noten.</h1></div>
        </section>
        <div className={s.empty} role="alert">
          <h2>Noten nicht verfügbar</h2>
          <p>{error}</p>
          <button type="button" className={s.createButton} onClick={loadCourses}>Erneut versuchen</button>
        </div>
      </div>
    );
  }

  return (
    <div className={`${shared.dashboard} ${s.page}`}>
      <section className={shared.intro}>
        <div>
          <p className={shared.eyebrow}>DEIN FORTSCHRITT, IM BLICK</p>
          <h1>Deine Noten.</h1>
          <p>Was du geschafft hast. Was noch offen ist. Und wohin du möchtest.</p>
        </div>
      </section>

      {courses.length === 0 ? (
        <div className={s.empty}>
          <h2>Noch kein Kurs angelegt</h2>
          <p>Leg zuerst einen Kurs an, um Prüfungsleistungen und Noten zu verwalten.</p>
          <Link href="/courses" className={s.createButton}>+ Kurs anlegen</Link>
        </div>
      ) : (
        <>
          <div className={s.courseSwitcher}>
            <label htmlFor="grades-course-select">Kurs</label>
            <select
              id="grades-course-select"
              value={selectedCourseId ?? ""}
              onChange={(event) => setSelectedCourseId(event.target.value)}
            >
              {courses.map((course) => (
                <option key={course.id} value={course.id}>{course.title}</option>
              ))}
            </select>
            {selectedCourse && (
              <span className={s.courseBadge} data-color={deriveCourseBadge(selectedCourse.title).color} aria-hidden="true">
                {deriveCourseBadge(selectedCourse.title).code}
              </span>
            )}
          </div>

          {selectedCourse && <CourseAssessments key={selectedCourse.id} courseId={selectedCourse.id} courseName={selectedCourse.title} />}
        </>
      )}

      <footer className={shared.dashboardFooter}><span>Lernapp · Dein Semester, verbunden.</span></footer>
    </div>
  );
}
