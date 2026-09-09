export type Assessment = {
  name: string;
  weight: number;
  grade: number | null;
  date: string;
  state: "graded" | "planned" | "submitted";
};

export type Course = {
  id: string;
  name: string;
  assessments: Assessment[];
};

export type CourseStatus = "complete" | "partial" | "ungraded";

// This preview models integer percentage weights and grades with at most
// two decimals. Integer hundredths preserve exact boundary comparisons.
function validGrade(grade: number) {
  return Number.isFinite(grade) && grade >= 1 && grade <= 5 &&
    Math.abs(grade * 100 - Math.round(grade * 100)) < 1e-9;
}

export function courseSummary(assessments: Assessment[]) {
  if (!assessments.length || assessments.some((item) =>
    !Number.isInteger(item.weight) || item.weight <= 0 || item.weight > 100 ||
    (item.grade !== null && !validGrade(item.grade)) ||
    (item.state === "graded") !== (item.grade !== null),
  )) throw new Error("Ungültige Beispielbewertungen.");

  const totalWeight = assessments.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight !== 100) throw new Error("Die Beispielgewichte müssen 100 % ergeben.");
  const graded = assessments.filter((item) => item.grade !== null);
  const gradedWeight = graded.reduce((sum, item) => sum + item.weight, 0);
  const weightedHundredths = graded.reduce((sum, item) => sum + Math.round(item.grade! * 100) * item.weight, 0);
  const status: CourseStatus = gradedWeight === 100 ? "complete" : gradedWeight > 0 ? "partial" : "ungraded";
  return {
    totalWeight, gradedWeight, weightedHundredths, status,
    average: gradedWeight ? weightedHundredths / (100 * gradedWeight) : null,
  };
}

export function semesterSummary(courses: Course[]) {
  const summaries = courses.map((course) => courseSummary(course.assessments));
  const completed = summaries.filter((summary) => summary.status === "complete");
  return {
    complete: completed.length,
    open: summaries.length - completed.length,
    average: completed.length ? completed.reduce((sum, item) => sum + item.average!, 0) / completed.length : null,
  };
}

export function parseTarget(input: string): number | null {
  if (!/^[1-5](?:[.,]\d{1,2})?$/.test(input.trim())) return null;
  const target = Number(input.trim().replace(",", "."));
  return validGrade(target) ? target : null;
}

type TargetResult =
  | { kind: "invalid"; message: string }
  | { kind: "impossible" }
  | { kind: "any" }
  | { kind: "required"; threshold: number; safeGrade: number; conservative: boolean };

export function targetGrade(assessments: Assessment[], target: number | null): TargetResult {
  if (target === null || !validGrade(target)) {
    return { kind: "invalid", message: "Bitte eine Zielnote von 1,0 bis 5,0 mit höchstens zwei Nachkommastellen eingeben." };
  }
  let summary;
  try {
    summary = courseSummary(assessments);
  } catch {
    return { kind: "invalid", message: "Die Leistungsgewichte oder Bewertungen sind für diese Beispielrechnung ungültig." };
  }
  const remaining = assessments.filter((item) => item.grade === null);
  if (remaining.length !== 1) {
    return { kind: "invalid", message: "Die Rechnung benötigt genau eine verbleibende Leistung mit positivem Gewicht." };
  }
  const weight = remaining[0].weight;
  const numerator = Math.round(target * 100) * summary.totalWeight - summary.weightedHundredths;
  const denominator = 100 * weight;
  if (numerator < denominator) return { kind: "impossible" };
  if (numerator > 5 * denominator) return { kind: "any" };
  return {
    kind: "required",
    threshold: numerator / denominator,
    // Floor the rational result to hundredths, never relax the upper bound.
    safeGrade: Math.floor(numerator / weight) / 100,
    conservative: numerator % weight !== 0,
  };
}

export function formatGrade(value: number) {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}
