import type { Metadata } from "next";
import AssistantWorkspace from "@/components/assistant/AssistantWorkspace";
import shared from "@/components/dashboard.module.css";

export const metadata: Metadata = {
  title: "KI-Assistent | Lernapp",
  description: "Stelle Fragen zu deinen Kursunterlagen und erhalte Antworten mit Quellen.",
};

export default function AssistantPage() {
  return (
    <div className={shared.dashboard}>
      <section className={shared.intro}>
        <div>
          <p className={shared.eyebrow}>IMMER MIT KONTEXT</p>
          <h1>Dein KI-Assistent.</h1>
          <p>Stelle Fragen zu deinen Kursunterlagen und erhalte Antworten mit Quellen.</p>
        </div>
      </section>
      <AssistantWorkspace />
      <footer className={shared.dashboardFooter}>
        <span>Lernapp · Dein Semester, verbunden.</span>
        <span>Antworten mit Bezug zu deinen Unterlagen</span>
      </footer>
    </div>
  );
}
