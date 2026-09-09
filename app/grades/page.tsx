import type { Metadata } from "next";
import Link from "next/link";
import CourseGrades from "@/components/grades/CourseGrades";
import TargetCalculator from "@/components/grades/TargetCalculator";
import { formatGrade, semesterSummary } from "@/components/grades/calculations";
import { courses, formatDate } from "@/components/grades/examples";
import shared from "@/components/dashboard.module.css";
import s from "@/components/grades/grades.module.css";

export const metadata: Metadata = {
  title: "Noten | Lernapp",
  description: "Kursleistungen, offene Bewertungen und Zielnoten im Überblick.",
};

export default function GradesPage() {
  const semester = semesterSummary(courses);
  const open = courses.flatMap((course) => course.assessments
    .filter((item) => item.grade === null)
    .map((item) => ({ ...item, course: course.name })))
    .sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className={`${shared.dashboard} ${s.page}`}>
      <section className={shared.intro}>
        <div>
          <p className={shared.eyebrow}>DEIN FORTSCHRITT, IM BLICK</p>
          <h1>Deine Noten.</h1>
          <p>Was du geschafft hast. Was noch offen ist. Und wohin du möchtest.</p>
        </div>
        <div className={shared.semester}><small>BEISPIELSEMESTER</small><strong>Wintersemester 2026/27</strong><span>Schritt für Schritt durchs Studium.</span></div>
      </section>
      <p className={shared.notice}>Produktvorschau · Illustrative Bewertungen und Termine, Beispielstand Januar 2027. Keine echten Leistungsnachweise.</p>

      <section className={s.overview} aria-label="Semesterübersicht der Beispielkurse">
        <dl>
          <div><dt>VOLLSTÄNDIG BEWERTET</dt><dd>{semester.complete} <span>von {courses.length} Kursen</span></dd></div>
          <div><dt>MIT OFFENEN LEISTUNGEN</dt><dd>{semester.open} <span>Kurse</span></dd></div>
          <div><dt>DURCHSCHNITT · BEISPIEL</dt><dd>{semester.average === null ? "—" : `≈ ${formatGrade(semester.average)}`}</dd></div>
        </dl>
        <p>Ungewichteter Durchschnitt vollständig bewerteter Beispielkurse. Kein offizieller Studiengangsdurchschnitt.</p>
      </section>

      <div className={s.layout}>
        <div>
          <CourseGrades />
          <section className={s.pending} aria-labelledby="pending-heading">
            <div className={shared.sectionHeader}><h2 id="pending-heading">Das steht noch aus</h2><Link href="/calendar">Zum Kalender <span aria-hidden="true">↗</span></Link></div>
            <ul>
              {open.map((item) => (
                <li key={`${item.course}-${item.name}`}>
                  <span className={s.pendingMark} aria-hidden="true">{item.state === "submitted" ? "…" : "↳"}</span>
                  <div><p className={s.pendingStatus}>{item.state === "submitted" ? "Leistung erbracht, Bewertung ausstehend" : "Leistung noch zu erbringen"}</p><h3>{item.name}</h3><p>{item.course}</p><small>{item.state === "submitted" ? "Eingereicht" : "Geplant"}: <time dateTime={item.date}>{formatDate(item.date)}</time> · Beispiel</small></div>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <TargetCalculator />
      </div>
      <footer className={shared.dashboardFooter}><span>Lernapp · Dein Semester, verbunden.</span><span>Notenvorschau ohne Speicherung</span></footer>
    </div>
  );
}
