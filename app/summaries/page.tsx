import type { Metadata } from "next";
import SummaryWorkspace from "@/components/summaries/SummaryWorkspace";
import shared from "@/components/dashboard.module.css";
import s from "@/components/summaries/summaries.module.css";

export const metadata: Metadata = {
  title: "Zusammenfassungen | Lernapp",
  description: "Zusammenfassungen mit Kurs-, Vorlesungs- und Quellenkontext.",
};

export default function SummariesPage() {
  return (
    <div className={`${shared.dashboard} ${s.page}`}>
      <section className={shared.intro}>
        <div>
          <p className={shared.eyebrow}>DEIN WISSEN, AUF DEN PUNKT</p>
          <h1>Deine Zusammenfassungen.</h1>
          <p>Das Wesentliche aus deinen Vorlesungen – mit dem Material verbunden.</p>
        </div>
        <div className={shared.semester}>
          <small>BEISPIELSEMESTER</small>
          <strong>Wintersemester 2026/27</strong>
          <span>Verstehen beginnt beim Zusammenhang.</span>
        </div>
      </section>
      <p className={shared.notice}>
        Produktvorschau · Zusammenfassungen und Quellen sind illustrative, KI-generierte
        Beispielinhalte. Bitte immer mit den Originalunterlagen abgleichen.
      </p>
      <SummaryWorkspace />
      <footer className={shared.dashboardFooter}>
        <span>Lernapp · Dein Semester, verbunden.</span>
        <span>Zusammenfassungsvorschau ohne Datenanbindung</span>
      </footer>
    </div>
  );
}
