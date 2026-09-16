export type AssessmentStatus = "planned" | "submitted" | "graded";

// The pure calculation inputs a real grade_assessments row reduces to.
export type WeightedAssessment = {
  weight: number;
  grade: number | null;
  status: AssessmentStatus;
};

export type WeightStatus = "complete" | "incomplete" | "invalid";

// Grades and weights carry at most two decimal digits (numeric(3,2) /
// numeric(5,2) in the database). All internal math happens on rounded
// hundredths (weight) and hundredths (grade) as exact integers, so no
// floating-point drift can ever make a required grade look easier than it
// mathematically is. Only the final, single division to a display number is
// a float operation.
function toHundredths(value: number): number {
  return Math.round(value * 100);
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function validGrade(grade: number): boolean {
  return Number.isFinite(grade) && grade >= 1 && grade <= 5 &&
    Math.abs(grade * 100 - Math.round(grade * 100)) < 1e-9;
}

export function validWeight(weight: number): boolean {
  return Number.isFinite(weight) && weight > 0 && weight <= 100 &&
    Math.abs(weight * 100 - Math.round(weight * 100)) < 1e-9;
}

export type GradeSummary = {
  /** Sum of all assessment weights (percent), rounded to 2 decimals. */
  totalWeight: number;
  /** Sum of the weights of graded assessments, rounded to 2 decimals. */
  gradedWeight: number;
  /** 100 - gradedWeight, clamped to >= 0; how much weight is still open toward 100%. */
  openWeight: number;
  /** "complete" at exactly 100%, "incomplete" under, "invalid" over. */
  weightStatus: WeightStatus;
  /** Weighted current standing over graded assessments only, or null if none are graded. */
  average: number | null;
  /** Internal: sum(grade_hundredths * weight_hundredths) over graded items. */
  weightedProduct: number;
  /** Internal: sum(weight_hundredths) over graded items. */
  gradedWeightUnits: number;
};

export function courseGradeSummary(assessments: WeightedAssessment[]): GradeSummary {
  const weightUnits = assessments.map((item) => toHundredths(item.weight));
  const totalWeightUnits = weightUnits.reduce((sum, units) => sum + units, 0);

  const gradedIndexes = assessments
    .map((item, index) => ({ item, index }))
    .filter(({ item }) => item.grade !== null);
  const gradedWeightUnits = gradedIndexes.reduce((sum, { index }) => sum + weightUnits[index], 0);
  const weightedProduct = gradedIndexes.reduce(
    (sum, { item, index }) => sum + toHundredths(item.grade!) * weightUnits[index],
    0,
  );

  const totalWeight = round2(totalWeightUnits / 100);
  const gradedWeight = round2(gradedWeightUnits / 100);
  const openWeight = Math.max(0, round2(100 - gradedWeight));
  const weightStatus: WeightStatus =
    totalWeightUnits > 10000 ? "invalid" : totalWeightUnits === 10000 ? "complete" : "incomplete";

  return {
    totalWeight,
    gradedWeight,
    openWeight,
    weightStatus,
    average: gradedWeightUnits > 0 ? weightedProduct / (100 * gradedWeightUnits) : null,
    weightedProduct,
    gradedWeightUnits,
  };
}

export function parseTarget(input: string): number | null {
  if (!/^[1-5](?:[.,]\d{1,2})?$/.test(input.trim())) return null;
  const target = Number(input.trim().replace(",", "."));
  return validGrade(target) ? target : null;
}

export type TargetResult =
  | { kind: "invalid"; message: string }
  | { kind: "overWeight" }
  | { kind: "noOpenAssessments" }
  | { kind: "impossible" }
  | { kind: "any" }
  | { kind: "required"; threshold: number; safeGrade: number; conservative: boolean; remainingWeight: number };

/**
 * Required average grade over ALL still-open weight (100 - gradedWeight),
 * targeting a fixed total weight of 100%. Never floors past the true
 * threshold in a way that would understate the required grade: safeGrade is
 * the best (numerically lowest, since 1.0 is the best grade) achievable
 * hundredth-grade that still guarantees the target.
 */
export function targetGrade(assessments: WeightedAssessment[], target: number | null): TargetResult {
  if (target === null || !validGrade(target)) {
    return { kind: "invalid", message: "Bitte eine Zielnote von 1,0 bis 5,0 mit höchstens zwei Nachkommastellen eingeben." };
  }
  const summary = courseGradeSummary(assessments);
  if (summary.weightStatus === "invalid") {
    return { kind: "overWeight" };
  }
  const remainingWeightUnits = 10000 - summary.gradedWeightUnits;
  if (remainingWeightUnits <= 0) {
    return { kind: "noOpenAssessments" };
  }

  const targetHundredths = toHundredths(target);
  const numerator = targetHundredths * 10000 - summary.weightedProduct;
  const denominator = remainingWeightUnits * 100;

  if (numerator < denominator) return { kind: "impossible" };
  if (numerator > 5 * denominator) return { kind: "any" };

  const safeGradeHundredths = Math.floor((numerator * 100) / denominator);
  return {
    kind: "required",
    threshold: numerator / denominator,
    safeGrade: safeGradeHundredths / 100,
    conservative: (numerator * 100) % denominator !== 0,
    remainingWeight: round2(remainingWeightUnits / 100),
  };
}

export function pointsConsistent(pointsEarned: number | null, pointsMax: number | null): boolean {
  if (pointsEarned === null && pointsMax === null) return true;
  if (pointsEarned === null || pointsMax === null) return false;
  return pointsMax > 0 && pointsEarned >= 0 && pointsEarned <= pointsMax;
}

export function statusGradeConsistent(status: AssessmentStatus, grade: number | null): boolean {
  return status === "graded" ? grade !== null : grade === null;
}

export function formatGrade(value: number): string {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 1, maximumFractionDigits: 2 });
}

export function formatWeight(value: number): string {
  return value.toLocaleString("de-DE", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

/**
 * German-locale decimal input ("2,3" or "2.3") normalized to a JS number, or
 * null if not a plain finite decimal. Does not enforce a value range; use
 * validGrade/validWeight for that.
 */
export function parseGermanDecimal(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;
  if (!/^\d+(?:[.,]\d+)?$/.test(trimmed)) return null;
  const value = Number(trimmed.replace(",", "."));
  return Number.isFinite(value) ? value : null;
}
