import type { Metadata } from "next";
import FlashcardWorkspace from "@/components/flashcards/FlashcardWorkspace";
import shared from "@/components/dashboard.module.css";
import s from "@/components/flashcards/flashcards.module.css";

export const metadata: Metadata = {
  title: "Karteikarten | Lernapp",
  description: "Karteikarten mit Kurs-, Vorlesungs- und Quellenkontext lernen.",
};

export default async function CourseFlashcardsPage(
  props: PageProps<"/courses/[courseId]/flashcards">
) {
  const { courseId } = await props.params;

  return (
    <div className={`${shared.dashboard} ${s.page}`}>
      <section className={shared.intro}>
        <div>
          <p className={shared.eyebrow}>DEIN WISSEN, KARTE FÜR KARTE</p>
          <h1>Deine Karteikarten.</h1>
          <p>Aus Vorlesungsmaterial wird eine klare, verbundene Lernroutine.</p>
        </div>
        <div className={shared.semester}>
          <small>BEISPIELSEMESTER</small>
          <strong>Wintersemester 2026/27</strong>
          <span>Wiederholen. Verstehen. Weitergehen.</span>
        </div>
      </section>
      <p className={shared.notice}>
        Produktvorschau · Kartensätze, Inhalte, Quellen und Lernstände sind illustrative,
        KI-generierte Beispieldaten. Fortschritt wird nicht gespeichert.
      </p>
      <FlashcardWorkspace courseId={courseId} />
      <footer className={shared.dashboardFooter}>
        <span>Lernapp · Dein Semester, verbunden.</span>
        <span>Karteikartenvorschau ohne Datenanbindung</span>
      </footer>
    </div>
  );
}
