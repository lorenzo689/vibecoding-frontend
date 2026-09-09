// Run with Node 24+: node --test components/grades/calculations.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { courseSummary, semesterSummary, parseTarget, targetGrade } from "./calculations.ts";
import { courses } from "./examples.ts";

const partial = courses[0].assessments;
test("Complete course uses all weights; partial course excludes missing grades", () => {
  assert.equal(courseSummary(courses[1].assessments).average, 2.12);
  assert.equal(courseSummary(courses[1].assessments).status, "complete");
  assert.equal(courseSummary(partial).average, 1.88);
  assert.equal(courseSummary(partial).gradedWeight, 50);
  assert.equal(courseSummary(partial).status, "partial");
});
test("Ungraded course has no numeric average; semester excludes incomplete courses", () => {
  assert.equal(courseSummary(courses[2].assessments).average, null);
  assert.equal(courseSummary(courses[2].assessments).gradedWeight, 0);
  assert.equal(courseSummary(courses[2].assessments).status, "ungraded");
  assert.deepEqual(semesterSummary(courses), { complete: 1, open: 2, average: 2.12 });
  assert.equal(semesterSummary([]).average, null);
});
test("Regular target is calculated from the known weighted contributions", () => {
  assert.deepEqual(targetGrade(partial, 2), { kind: "required", threshold: 2.12, safeGrade: 2.12, conservative: false });
});
test("Impossible and above-scale requirements are distinguished", () => {
  assert.equal(targetGrade(partial, 1).kind, "impossible");
  assert.equal(targetGrade(partial, 4).kind, "any");
});
test("Exact boundary requirements 1.0 and 5.0 remain reachable", () => {
  assert.equal(targetGrade(partial, 1.44).safeGrade, 1);
  assert.equal(targetGrade(partial, 3.44).safeGrade, 5);
  assert.equal(targetGrade(partial, 1.43).kind, "impossible");
  assert.equal(targetGrade(partial, 3.45).kind, "any");
});
test("German decimals and valid endpoints parse; invalid targets never yield numbers", () => {
  assert.equal(parseTarget(" 2,12 "), 2.12);
  assert.equal(parseTarget("2.12"), 2.12);
  assert.equal(parseTarget("1,0"), 1);
  assert.equal(parseTarget("5,0"), 5);
  for (const input of ["", " ", "abc", "0", "5,01", "1,234", "NaN", "Infinity", "2e0", "2,", "2.1.2"]) {
    assert.equal(parseTarget(input), null, input);
    assert.equal(targetGrade(partial, parseTarget(input)).kind, "invalid");
  }
  for (const value of [NaN, Infinity, -Infinity, 0, 5.01, null]) {
    assert.equal(targetGrade(partial, value).kind, "invalid");
  }
});
test("Missing, zero or multiple remaining weights are rejected", () => {
  assert.equal(targetGrade(courses[1].assessments, 2).kind, "invalid");
  assert.equal(targetGrade(courses[2].assessments, 2).kind, "invalid");
  assert.equal(targetGrade([{ ...partial[2], weight: 0 }], 2).kind, "invalid");
  assert.equal(targetGrade([], 2).kind, "invalid");
});
test("Invalid weights, grades and contradictory states fail validation", () => {
  for (const weight of [0, -1, NaN, Infinity, 49, 50.5]) {
    assert.throws(() => courseSummary([...partial.slice(0, 2), { ...partial[2], weight }]));
  }
  assert.throws(() => courseSummary([{ ...partial[0], weight: 100, grade: 0 }]));
  assert.throws(() => courseSummary([{ ...partial[0], weight: 100, grade: null }]));
});
test("A rounded requirement never relaxes the exact grade threshold", () => {
  const thirds = [
    { ...partial[0], weight: 30, grade: 1.7 },
    { ...partial[2], weight: 70 },
  ];
  const result = targetGrade(thirds, 2);
  assert.equal(result.kind, "required");
  assert.equal(result.conservative, true);
  assert.equal(result.safeGrade, 2.12);
  assert.ok(result.safeGrade <= result.threshold);
  assert.ok((1.7 * 30 + result.safeGrade * 70) / 100 <= 2);
  assert.ok((1.7 * 30 + (result.safeGrade + 0.01) * 70) / 100 > 2);
});
