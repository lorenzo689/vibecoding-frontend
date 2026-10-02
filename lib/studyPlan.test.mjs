import assert from "node:assert/strict";
import test from "node:test";
import { buildStudyPlan, describeFocus } from "./studyPlan.ts";

const NOW = new Date("2026-10-01T10:00:00Z");
const courses = [{ id: "a", title: "Algebra" }, { id: "b", title: "Biologie" }, { id: "c", title: "Chemie" }];

test("orders by nearest exam, then due cards, and hides idle courses", () => {
  const cards = [
    { courseId: "a", dueAt: "2026-09-30T00:00:00Z", known: false },
    { courseId: "a", dueAt: "2026-10-20T00:00:00Z", known: true },
    { courseId: "b", dueAt: "2026-09-30T00:00:00Z", known: true },
    { courseId: "b", dueAt: "2026-09-29T00:00:00Z", known: true },
  ];
  const exams = [{ courseId: "a", title: "Klausur", startsAt: "2026-10-11T08:00:00Z" }];
  const plan = buildStudyPlan(courses, cards, exams, NOW);
  assert.deepEqual(plan.map((entry) => entry.courseId), ["a", "b"]);
  assert.equal(plan[0].dueCards, 1);
  assert.equal(plan[0].weakCards, 1);
  assert.equal(plan[0].nextExam.daysLeft, 10);
  assert.equal(plan[1].dueCards, 2);
});

test("past exams are ignored", () => {
  const plan = buildStudyPlan(courses, [], [{ courseId: "a", title: "Alt", startsAt: "2026-08-01T00:00:00Z" }], NOW);
  assert.equal(plan.length, 0);
});

test("focus text spreads due cards over the days left", () => {
  assert.equal(describeFocus(30, 0, 10), "30 fällige Karten – ca. 3 pro Tag bis zur Prüfung.");
  assert.equal(describeFocus(2, 0, null), "2 Karten sind heute fällig.");
  assert.equal(describeFocus(0, 4, null), "4 Karten sitzen noch nicht – gezielt wiederholen.");
});
