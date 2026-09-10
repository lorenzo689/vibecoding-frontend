import type { Metadata } from "next";
import AssistantWorkspace from "@/components/assistant/AssistantWorkspace";
import shared from "@/components/dashboard.module.css";

export const metadata: Metadata = {
  title: "KI-Assistent | Lernapp",
  description: "Frag deinen KI-Assistenten zu Kursen, Vorlesungen und Terminen.",
};

export default function AssistantPage() {
  return (
    <div className={shared.dashboard}>
      <section className={shared.intro}>
        <div>
          <p className={shared.eyebrow}>IMMER MIT KONTEXT</p>
          <h1>Dein KI-Assistent.</h1>
          <p>Fragen zu deinen Kursen, Vorlesungen und Terminen – an einem Ort.</p>
        </div>
        <div className={shared.semester}>
          <small>BEISPIELSEMESTER</small>
          <strong>Wintersemester 2026/27</strong>
          <span>Verbunden mit deinem Studienraum.</span>
        </div>
      </section>
      <p className={shared.notice}>
        Produktvorschau · Antworten sind illustrative Beispielinhalte, es wird
        nichts generiert oder gesendet.
      </p>
      <AssistantWorkspace />
      <footer className={shared.dashboardFooter}>
        <span>Lernapp · Dein Semester, verbunden.</span>
        <span>Assistenten-Vorschau ohne Datenanbindung</span>
      </footer>
    </div>
  );
}
