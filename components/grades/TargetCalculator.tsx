"use client";

import { useState } from "react";
import { courseSummary, formatGrade, parseTarget, targetGrade } from "./calculations";
import { targetCourse } from "./examples";
import s from "./grades.module.css";

export default function TargetCalculator() {
  const [input, setInput] = useState("2,0");
  const target = parseTarget(input);
  const result = targetGrade(targetCourse.assessments, target);
  const summary = courseSummary(targetCourse.assessments);
  const remaining = targetCourse.assessments.find((item) => item.grade === null)!;
  return (
    <section className={s.calculator} aria-labelledby="calculator-heading">
      <p className={s.eyebrow}>DEIN ZIEL, DURCHGERECHNET</p>
      <h2 id="calculator-heading">Was brauchst du noch?</h2>
      <p className={s.calculatorCourse}>{targetCourse.name} · Beispielrechnung</p>
      <dl className={s.calculationInputs}>
        {targetCourse.assessments.map((item) => (
          <div key={item.name}><dt>{item.name}<small>{item.weight} % Gewichtung</small></dt><dd>{item.grade === null ? "Ausstehend" : formatGrade(item.grade)}</dd></div>
        ))}
      </dl>
      <label className={s.targetLabel} htmlFor="target-grade">Gewünschte Gesamtnote</label>
      <div className={s.targetInput}>
        <input id="target-grade" type="text" inputMode="decimal" value={input} onChange={(event) => setInput(event.target.value)} aria-invalid={result.kind === "invalid"} aria-describedby="target-help target-result" />
        <button type="button" onClick={() => setInput("2,0")}>Zurücksetzen</button>
      </div>
      <p id="target-help" className={s.calculatorHelp}>1,0 bis 5,0 · höchstens zwei Nachkommastellen, Komma oder Punkt. Eingaben werden nicht gespeichert.</p>
      <div id="target-result" className={s.targetResult} role="status" aria-atomic="true">
        {result.kind === "invalid" && <p>{result.message}</p>}
        {result.kind === "impossible" && <><strong>Ziel rechnerisch nicht erreichbar</strong><p>Selbst mit 1,0 in der verbleibenden {remaining.name} lässt sich diese Zielnote im Beispielmodell nicht erreichen.</p></>}
        {result.kind === "any" && <><strong>Rechnerisch auch mit 5,0 erreichbar</strong><p>Die Zielnote wird im Beispielmodell selbst mit 5,0 in der {remaining.name} erreicht. Das ist keine Aussage zum Bestehen der Prüfung.</p></>}
        {result.kind === "required" && <>
          <span>IN DER VERBLEIBENDEN {remaining.name.toLocaleUpperCase("de-DE")}</span>
          <strong className={s.requiredGrade}>{formatGrade(result.safeGrade)} <small>oder besser</small></strong>
          <p>Damit erreichst du rechnerisch die Gesamtnote {formatGrade(target!)} oder besser.</p>
          {result.conservative && <p>Konservativ auf zwei Nachkommastellen abgerundet: Die exakte Obergrenze wird nicht gelockert.</p>}
        </>}
      </div>
      <details className={s.calculationMethod}>
        <summary>Wie wird gerechnet?</summary>
        <p>(Zielnote × Gesamtgewicht − Summe bekannter Note × Gewicht) ÷ verbleibendes Gewicht.</p>
        <p>Hier: (Zielnote × {summary.totalWeight} − {formatGrade(summary.weightedHundredths / 100)}) ÷ {remaining.weight}.</p>
        <p>Lineare Gewichtung; 1,0 ist die beste und 5,0 die schlechteste Note. Alle Werte zwischen diesen Grenzen sind im Modell zulässig.</p>
      </details>
      <p className={s.calculatorHelp}>Unverbindliche Beispielrechnung. Hochschulspezifische Notenstufen, Rundungs-, Bestehens- und Prüfungsordnungsregeln werden nicht berücksichtigt.</p>
    </section>
  );
}
