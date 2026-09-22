import type { Metadata } from "next";
import Link from "next/link";
import CourseSummaryEditor from "@/components/summaries/CourseSummaryEditor";
import shared from "@/components/dashboard.module.css";
import s from "@/components/summaries/summaries.module.css";

export const metadata: Metadata = {
  title: "Zusammenfassung | Lernapp",
  description: "Deine eigene Zusammenfassung für diesen Kurs.",
};

export default async function CourseSummariesPage(
  props: PageProps<"/courses/[courseId]/summaries">
) {
  const { courseId } = await props.params;

  return (
    <div className={shared.dashboard}>
      <div className={s.topRow}>
        <Link href={`/courses/${courseId}`} className={s.backLink}>
          ← Zurück zum Kurs
        </Link>
      </div>
      <section className={shared.intro}>
        <div>
          <p className={shared.eyebrow}>ZUSAMMENFASSUNG</p>
          <h1>Zusammenfassung.</h1>
          <p>Eine frei editierbare Zusammenfassung für diesen Kurs.</p>
        </div>
      </section>
      <CourseSummaryEditor courseId={courseId} />
      <footer className={shared.dashboardFooter}>
        <span>Gespeichert in deinem Konto.</span>
      </footer>
    </div>
  );
}
