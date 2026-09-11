import type { Metadata } from "next";
import CourseSummaryEditor from "@/components/summaries/CourseSummaryEditor";
import shared from "@/components/dashboard.module.css";

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
      <section className={shared.intro}>
        <div>
          <p className={shared.eyebrow}>DEIN WISSEN, AUF DEN PUNKT</p>
          <h1>Deine Zusammenfassung.</h1>
          <p>Das Wesentliche aus diesem Kurs, in deinen eigenen Worten.</p>
        </div>
      </section>
      <CourseSummaryEditor courseId={courseId} />
      <footer className={shared.dashboardFooter}>
        <span>Lernapp · Dein Semester, verbunden.</span>
        <span>Gespeichert in deinem Konto</span>
      </footer>
    </div>
  );
}
