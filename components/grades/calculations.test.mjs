// Run with Node 22+: node --test components/grades/calculations.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import {
  courseGradeSummary,
  targetGrade,
  parseTarget,
  parseGermanDecimal,
  pointsConsistent,
  statusGradeConsistent,
  formatGrade,
} from "./calculations.ts";
import { mapAssessment } from "../../lib/supabase/queries/grades-map.ts";

// Mixed course: two graded, one open (50% still open).
const mixed = [
  { weight: 30, grade: 2.0, status: "graded" },
  { weight: 20, grade: 1.7, status: "graded" },
  { weight: 50, grade: null, status: "planned" },
];
// Fully graded course: nothing open.
const fullyGraded = [
  { weight: 70, grade: 2.3, status: "graded" },
  { weight: 30, grade: 1.7, status: "graded" },
];
// Fully entered but entirely ungraded.
const ungraded = [
  { weight: 40, grade: null, status: "submitted" },
  { weight: 60, grade: null, status: "planned" },
];
// Under 100% total weight (only 50% of the course entered so far).
const underWeighted = [{ weight: 50, grade: 2.0, status: "graded" }];
// Over 100% total weight.
const overWeighted = [
  { weight: 60, grade: 2.0, status: "graded" },
  { weight: 50, grade: null, status: "planned" },
];

test("weighted current standing only includes graded assessments", () => {
  const summary = courseGradeSummary(mixed);
  assert.equal(summary.average, 1.88);
  assert.equal(summary.gradedWeight, 50);
  assert.equal(summary.totalWeight, 100);
  assert.equal(summary.openWeight, 50);
});

test("a course with nothing graded yet has no numeric average", () => {
  const summary = courseGradeSummary(ungraded);
  assert.equal(summary.average, null);
  assert.equal(summary.gradedWeight, 0);
  assert.equal(summary.openWeight, 100);
});

test("total weight under, at, and over 100% is detected", () => {
  assert.equal(courseGradeSummary(underWeighted).weightStatus, "incomplete");
  assert.equal(courseGradeSummary(mixed).weightStatus, "complete");
  assert.equal(courseGradeSummary(overWeighted).weightStatus, "invalid");
  assert.equal(courseGradeSummary([]).weightStatus, "incomplete");
  assert.equal(courseGradeSummary([]).totalWeight, 0);
});

test("target grade with multiple still-open assessments sums their combined weight", () => {
  const twoOpen = [
    { weight: 30, grade: 2.0, status: "graded" },
    { weight: 20, grade: null, status: "planned" },
    { weight: 50, grade: null, status: "planned" },
  ];
  const result = targetGrade(twoOpen, 2);
  assert.equal(result.kind, "required");
  assert.equal(result.remainingWeight, 70);
  assert.equal(result.safeGrade, 2);
  assert.equal(result.conservative, false);
});

test("an unreachable target is reported as impossible", () => {
  const result = targetGrade([
    { weight: 90, grade: 4.0, status: "graded" },
    { weight: 10, grade: null, status: "planned" },
  ], 2);
  assert.equal(result.kind, "impossible");
});

test("a target already guaranteed even with the worst remaining grade is reported as reachable", () => {
  const result = targetGrade([
    { weight: 90, grade: 1.0, status: "graded" },
    { weight: 10, grade: null, status: "planned" },
  ], 1.5);
  assert.equal(result.kind, "any");
});

test("a fully graded course has no open assessments left for the target calculator", () => {
  assert.equal(targetGrade(fullyGraded, 2).kind, "noOpenAssessments");
});

test("a course weighted over 100% makes the target calculation invalid", () => {
  assert.equal(targetGrade(overWeighted, 2).kind, "overWeight");
});

test("invalid target inputs never produce a numeric requirement", () => {
  for (const input of ["", " ", "abc", "0", "5,01", "1,234", "NaN", "Infinity", "2e0", "2,", "2.1.2"]) {
    assert.equal(parseTarget(input), null, input);
    assert.equal(targetGrade(mixed, parseTarget(input)).kind, "invalid");
  }
  for (const value of [NaN, Infinity, -Infinity, 0, 5.01, null]) {
    assert.equal(targetGrade(mixed, value).kind, "invalid");
  }
});

test("German-locale decimal input is accepted and normalized", () => {
  assert.equal(parseTarget(" 2,12 "), 2.12);
  assert.equal(parseTarget("2.12"), 2.12);
  assert.equal(parseTarget("1,0"), 1);
  assert.equal(parseTarget("5,0"), 5);
  assert.equal(parseGermanDecimal("2,3"), 2.3);
  assert.equal(parseGermanDecimal("2.3"), 2.3);
  assert.equal(parseGermanDecimal("  7  "), 7);
  assert.equal(parseGermanDecimal(""), null);
  assert.equal(parseGermanDecimal("abc"), null);
});

test("a rounded requirement never relaxes the exact grade threshold (conservative rounding)", () => {
  const thirds = [
    { weight: 30, grade: 1.7, status: "graded" },
    { weight: 70, grade: null, status: "planned" },
  ];
  const result = targetGrade(thirds, 2);
  assert.equal(result.kind, "required");
  assert.equal(result.conservative, true);
  assert.equal(result.safeGrade, 2.12);
  assert.ok(result.safeGrade <= result.threshold);
  assert.ok((1.7 * 30 + result.safeGrade * 70) / 100 <= 2);
  assert.ok((1.7 * 30 + (result.safeGrade + 0.01) * 70) / 100 > 2);
});

test("exact boundary requirements 1.0 and 5.0 remain reachable", () => {
  const single = [
    { weight: 30, grade: 1.7, status: "graded" },
    { weight: 70, grade: null, status: "planned" },
  ];
  assert.equal(targetGrade(single, 1.21).safeGrade, 1);
  assert.equal(targetGrade(single, 4.01).safeGrade, 5);
  assert.equal(targetGrade(single, 1.20).kind, "impossible");
  assert.equal(targetGrade(single, 4.02).kind, "any");
});

test("points must be both present or both absent, earned within [0, max], and max positive", () => {
  assert.equal(pointsConsistent(null, null), true);
  assert.equal(pointsConsistent(8, 10), true);
  assert.equal(pointsConsistent(10, 10), true);
  assert.equal(pointsConsistent(0, 10), true);
  assert.equal(pointsConsistent(8, null), false);
  assert.equal(pointsConsistent(null, 10), false);
  assert.equal(pointsConsistent(11, 10), false);
  assert.equal(pointsConsistent(-1, 10), false);
  assert.equal(pointsConsistent(5, 0), false);
  assert.equal(pointsConsistent(5, -3), false);
});

test("status and grade presence must agree: graded requires a grade, others forbid one", () => {
  assert.equal(statusGradeConsistent("graded", 2.0), true);
  assert.equal(statusGradeConsistent("graded", null), false);
  assert.equal(statusGradeConsistent("planned", null), true);
  assert.equal(statusGradeConsistent("planned", 2.0), false);
  assert.equal(statusGradeConsistent("submitted", null), true);
  assert.equal(statusGradeConsistent("submitted", 2.0), false);
});

test("formatGrade renders German-locale decimals", () => {
  assert.equal(formatGrade(2), "2,0");
  assert.equal(formatGrade(2.12), "2,12");
});

test("database rows map to the frontend model with numeric coercion", () => {
  const row = {
    id: "a1", course_id: "c1", title: "Klausur", kind: "exam", status: "graded",
    weight: "50.00", grade: "2.30", assessment_date: "2026-11-20",
    points_earned: "45.00", points_max: "50.00", notes: null,
    created_at: "2026-09-01T00:00:00Z", updated_at: "2026-09-02T00:00:00Z",
  };
  const mapped = mapAssessment(row);
  assert.equal(mapped.weight, 50);
  assert.equal(mapped.grade, 2.3);
  assert.equal(mapped.pointsEarned, 45);
  assert.equal(mapped.pointsMax, 50);
  assert.equal(mapped.notes, "");
  assert.equal(mapped.courseId, "c1");

  const withoutGradeOrPoints = mapAssessment({
    ...row, grade: null, points_earned: null, points_max: null, notes: "Wichtig",
  });
  assert.equal(withoutGradeOrPoints.grade, null);
  assert.equal(withoutGradeOrPoints.pointsEarned, null);
  assert.equal(withoutGradeOrPoints.notes, "Wichtig");
});
