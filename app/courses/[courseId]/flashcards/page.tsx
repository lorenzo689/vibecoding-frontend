import type { Metadata } from "next";
import CourseFlashcardDecks from "@/components/flashcards/CourseFlashcardDecks";
import shared from "@/components/dashboard.module.css";

export const metadata: Metadata = {
  title: "Karteikarten | Lernapp",
  description: "Deine Karteikarten-Decks für diesen Kurs.",
};

export default async function CourseFlashcardsPage(
  props: PageProps<"/courses/[courseId]/flashcards">
) {
  const { courseId } = await props.params;

  return (
    <div className={shared.dashboard}>
      <CourseFlashcardDecks courseId={courseId} />
      <footer className={shared.dashboardFooter}>
        <span>Lernapp · Dein Semester, verbunden.</span>
        <span>Gespeichert in deinem Konto</span>
      </footer>
    </div>
  );
}
