"use client";

import { useState } from "react";
import { courseSummary, formatGrade, type CourseStatus } from "./calculations";
import { courses, formatDate, statusLabels } from "./examples";
import shared from "@/components/dashboard.module.css";
import s from "./grades.module.css";

export default function CourseGrades() {
  const [filter, setFilter] = useState<CourseStatus | "all">("all");
  const visible = courses.filter((course) => filter === "all" || courseSummary(course.assessments).status === filter);
  return (
    <section aria-labelledby="courses-heading">
      <div className={shared.sectionHeader}>
        <h2 id="courses-heading">Deine Kursleistungen</h2>
        <small>BEISPIELÜBERSICHT</small>
      </div>
      <div className={s.filters} role="group" aria-label="Kurse nach Bewertungsstatus filtern">
        {(["all", "complete", "partial", "ungraded"] as const).map((value) => (
          <button type="button" key={value} aria-pressed={filter === value} aria-controls="grade-courses" onClick={() => setFilter(value)}>
            {value === "all" ? "Alle Kurse" : statusLabels[value]}
          </button>
        ))}
      </div>
      <p role="status" className={s.resultCount}>{visible.length} von {courses.length} Beispielkursen</p>
      <div id="grade-courses" className={s.courses}>
        {visible.map((course) => {
          const summary = courseSummary(course.assessments);
          return (
            <article key={course.id} className={s.course} aria-labelledby={`course-${course.id}`}>
              <div className={s.courseHeader}>
                <span className={s.courseCode} aria-hidden="true">{course.id.toUpperCase()}</span>
                <div><span className={s.status} data-status={summary.status}>{statusLabels[summary.status]}</span><h3 id={`course-${course.id}`}>{course.name}</h3></div>
              </div>
              <div className={s.gradeSummary}>
                <div>
                  <p className={s.gradeValue}>{summary.average === null ? "—" : `≈ ${formatGrade(summary.average)}`}</p>
                  <p>{summary.status === "complete" ? "Kursendnote · Beispielmodell" : summary.status === "partial" ? "Zwischenstand der bewerteten Leistungen" : "Noch keine bewerteten Leistungen"}</p>
                </div>
                <div className={s.weight}>
                  <span>{summary.gradedWeight} % bewertet</span>
                  <progress max={100} value={summary.gradedWeight} aria-label={`${course.name}: ${summary.gradedWeight} Prozent des Leistungsgewichts bewertet`} />
                </div>
              </div>
              <details className={s.details}>
                <summary>Leistungsdetails <span>{course.assessments.length} Leistungen <span className={s.chevron} aria-hidden="true">⌄</span></span></summary>
                <ul className={s.assessments}>
                  {course.assessments.map((item) => (
                    <li key={item.name}>
                      <div><h4>{item.name}</h4><p>{item.state === "planned" ? "Geplant" : item.state === "submitted" ? "Eingereicht" : "Bewertet"} · <time dateTime={item.date}>{formatDate(item.date)}</time></p><small>{item.state === "planned" ? "Leistung noch zu erbringen" : item.state === "submitted" ? "Leistung erbracht, Bewertung ausstehend" : "Bewertung liegt vor"}</small></div>
                      <div className={s.assessmentGrade}><strong>{item.grade === null ? "Ausstehend" : formatGrade(item.grade)}</strong><span>{item.weight} % Gewichtung</span></div>
                    </li>
                  ))}
                </ul>
              </details>
            </article>
          );
        })}
      </div>
      <p className={s.methodNote}>≈ Auf zwei Nachkommastellen gerundete Anzeige. Offene Leistungen fließen nicht in den Zwischenstand ein.</p>
    </section>
  );
}
