"use client";

import { useState } from "react";
import { courseGradeSummary, formatGrade, formatEcts, parseTarget, targetGrade, type EctsAssessment } from "../calculations";
import s from "./GradeStudio.module.css";

export default function GoalEditor({ assessments }: { assessments: EctsAssessment[] }) {
  const [input, setInput] = useState("2,0");
  const target = parseTarget(input);
  const result = targetGrade(assessments, target);
  const summary = courseGradeSummary(assessments);

  return (
    <section className={s.goal} aria-labelledby="goal-heading">
      <div className={s.goalHeading}>
        <h2 id="goal-heading">Dein Ziel</h2>
        <span className={s.micro}>ZIELRECHNER</span>
      </div>
      <label className={s.goalLabel} htmlFor="target-grade">Gewünschte Gesamtnote</label>
      <div className={s.goalControl}>
        <input id="target-grade" type="text" inputMode="decimal" value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-invalid={result.kind === "invalid"} aria-describedby="target-help target-result" />
        <button type="button" onClick={() => setInput("2,0")}>Zurücksetzen</button>
      </div>
      <div id="target-result" className={s.goalResult} role="status" aria-atomic="true">
        {result.kind === "invalid" && <p>{result.message}</p>}
        {result.kind === "noOpenAssessments" && <>
          <h3>{summary.totalEcts === 0 ? "Dein erster Schritt fehlt noch." : "Alles bewertet."}</h3>
          <p>{summary.totalEcts === 0
            ? "Für diesen Kurs sind noch keine Prüfungsleistungen erfasst — leg zuerst eine an."
            : "Keine offene Leistung: Alle erfassten ECTS sind bereits bewertet. Es gibt nichts mehr zu berechnen."}</p>
        </>}
        {result.kind === "impossible" && <>
          <h3>Ziel rechnerisch nicht erreichbar.</h3>
          <p>Selbst mit 1,0 in den verbleibenden {formatEcts(summary.openEcts)} offenen ECTS lässt sich diese Zielnote nicht mehr erreichen.</p>
        </>}
        {result.kind === "any" && <>
          <h3>Auch mit 5,0 erreichbar.</h3>
          <p>Die Zielnote wird selbst mit 5,0 in den verbleibenden {formatEcts(summary.openEcts)} offenen ECTS erreicht. Das ist keine Aussage zum Bestehen der Prüfung.</p>
        </>}
        {result.kind === "required" && <>
          <p className={s.micro}>NÖTIG ÜBER DIE OFFENEN {formatEcts(result.openEcts)} ECTS</p>
          <h3 className={s.requiredGrade}>{formatGrade(result.safeGrade)} <small>oder besser</small></h3>
          <p>Damit erreichst du rechnerisch die Gesamtnote {formatGrade(target!)} oder besser — bezogen auf die bisher erfassten {formatEcts(summary.totalEcts)} ECTS.</p>
          {result.conservative && <p>Konservativ auf zwei Nachkommastellen abgerundet: Die exakte Obergrenze wird nicht gelockert.</p>}
        </>}
      </div>
      <details className={s.goalMethod}>
        <summary>Berechnung & Hinweise</summary>
        <p id="target-help">1,0 bis 5,0 · höchstens zwei Nachkommastellen, Komma oder Punkt. Eingaben werden nicht gespeichert.</p>
        <p>(Zielnote × erfasste ECTS − Summe aus Note × ECTS der bewerteten Leistungen) ÷ offene ECTS.</p>
        <p>Nur bereits erfasste Leistungen zählen. Jede Note fließt linear mit ihren ECTS ein; 1,0 ist die beste und 5,0 die schlechteste Note.</p>
        <p>Unverbindliche Rechnung. Hochschulspezifische Notenstufen, Rundungs-, Bestehens- und Prüfungsordnungsregeln werden nicht berücksichtigt.</p>
      </details>
    </section>
  );
}
