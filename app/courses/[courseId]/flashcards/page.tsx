import type { Metadata } from "next";
import CourseFlashcardsManager from "@/components/flashcards/CourseFlashcardsManager";
import shared from "@/components/dashboard.module.css";

export const metadata: Metadata = {
  title: "Karteikarten | Lernapp",
  description: "Deine eigenen Karteikarten für diesen Kurs.",
};

export default async function CourseFlashcardsPage(
  props: PageProps<"/courses/[courseId]/flashcards">
) {
  const { courseId } = await props.params;

  return (
    <div className={shared.dashboard}>
      <section className={shared.intro}>
        <div>
          <p className={shared.eyebrow}>DEIN WISSEN, KARTE FÜR KARTE</p>
          <h1>Deine Karteikarten.</h1>
          <p>Leg eigene Karteikarten für diesen Kurs an und lerne damit.</p>
        </div>
      </section>
      <CourseFlashcardsManager courseId={courseId} />
      <footer className={shared.dashboardFooter}>
        <span>Lernapp · Dein Semester, verbunden.</span>
        <span>Gespeichert in deinem Konto</span>
      </footer>
    </div>
  );
}
