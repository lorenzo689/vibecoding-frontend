"use client";

import { useState } from "react";
import { courseGradeSummary, formatGrade, formatEcts, parseTarget, targetGrade, type EctsAssessment } from "./calculations";
import s from "./grades.module.css";

export default function TargetCalculator({ courseName, assessments }: { courseName: string; assessments: EctsAssessment[] }) {
  const [input, setInput] = useState("2,0");
  const target = parseTarget(input);
  const result = targetGrade(assessments, target);
  const summary = courseGradeSummary(assessments);

  return (
    <section className={s.calculator} aria-labelledby="calculator-heading">
      <p className={s.eyebrow}>DEIN ZIEL, DURCHGERECHNET</p>
      <h2 id="calculator-heading">Was brauchst du noch?</h2>
      <p className={s.calculatorCourse}>{courseName}</p>

      <label className={s.targetLabel} htmlFor="target-grade">Gewünschte Gesamtnote</label>
      <div className={s.targetInput}>
        <input
          id="target-grade"
          type="text"
          inputMode="decimal"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          aria-invalid={result.kind === "invalid"}
          aria-describedby="target-help target-result"
        />
        <button type="button" onClick={() => setInput("2,0")}>Zurücksetzen</button>
      </div>
      <p id="target-help" className={s.calculatorHelp}>1,0 bis 5,0 · höchstens zwei Nachkommastellen, Komma oder Punkt. Eingaben werden nicht gespeichert.</p>

      <div id="target-result" className={s.targetResult} role="status" aria-atomic="true">
        {result.kind === "invalid" && <p>{result.message}</p>}
        {result.kind === "noOpenAssessments" && <>
          <strong>{summary.totalEcts === 0 ? "Keine Leistungen erfasst" : "Keine offene Leistung"}</strong>
          <p>
            {summary.totalEcts === 0
              ? "Für diesen Kurs sind noch keine Prüfungsleistungen erfasst — leg zuerst eine an."
              : "Alle erfassten ECTS sind bereits bewertet. Es gibt nichts mehr zu berechnen."}
          </p>
        </>}
        {result.kind === "impossible" && <>
          <strong>Ziel rechnerisch nicht erreichbar</strong>
          <p>Selbst mit 1,0 in den verbleibenden {formatEcts(summary.openEcts)} offenen ECTS lässt sich diese Zielnote nicht mehr erreichen.</p>
        </>}
        {result.kind === "any" && <>
          <strong>Rechnerisch auch mit 5,0 erreichbar</strong>
          <p>Die Zielnote wird selbst mit 5,0 in den verbleibenden {formatEcts(summary.openEcts)} offenen ECTS erreicht. Das ist keine Aussage zum Bestehen der Prüfung.</p>
        </>}
        {result.kind === "required" && <>
          <span>DURCHSCHNITT ÜBER DIE OFFENEN {formatEcts(result.openEcts)} ECTS</span>
          <strong className={s.requiredGrade}>{formatGrade(result.safeGrade)} <small>oder besser</small></strong>
          <p>Damit erreichst du rechnerisch die Gesamtnote {formatGrade(target!)} oder besser — bezogen auf die bisher erfassten {formatEcts(summary.totalEcts)} ECTS.</p>
          {result.conservative && <p>Konservativ auf zwei Nachkommastellen abgerundet: Die exakte Obergrenze wird nicht gelockert.</p>}
        </>}
      </div>

      <details className={s.calculationMethod}>
        <summary>Wie wird gerechnet?</summary>
        <p>(Zielnote × erfasste ECTS − Summe aus Note × ECTS der bewerteten Leistungen) ÷ offene ECTS.</p>
        <p>Es wird kein Gesamtziel von 100 % oder einer festen ECTS-Summe angenommen — nur bereits erfasste Leistungen zählen. Jede Note fließt linear mit ihren ECTS ein; 1,0 ist die beste und 5,0 die schlechteste Note.</p>
      </details>
      <p className={s.calculatorHelp}>Unverbindliche Rechnung. Hochschulspezifische Notenstufen, Rundungs-, Bestehens- und Prüfungsordnungsregeln werden nicht berücksichtigt.</p>
    </section>
  );
}
