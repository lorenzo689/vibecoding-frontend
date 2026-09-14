import type { Metadata } from "next";
import FlashcardDeckDetail from "@/components/flashcards/FlashcardDeckDetail";
import shared from "@/components/dashboard.module.css";

export const metadata: Metadata = {
  title: "Karteikarten | Lernapp",
  description: "Deine eigenen Karteikarten in diesem Deck.",
};

export default async function FlashcardDeckPage(
  props: PageProps<"/courses/[courseId]/flashcards/[deckId]">
) {
  const { courseId, deckId } = await props.params;

  return (
    <div className={shared.dashboard}>
      <FlashcardDeckDetail courseId={courseId} materialId={deckId} />
      <footer className={shared.dashboardFooter}>
        <span>Lernapp · Dein Semester, verbunden.</span>
        <span>Gespeichert in deinem Konto</span>
      </footer>
    </div>
  );
}
