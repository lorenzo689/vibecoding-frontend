import assert from "node:assert/strict";
import { test } from "node:test";
import { countByLecture, isLectureNotFound, matchesLectureFilter, resolveLectureFilter } from "./lectureFilter.ts";

const lectures = [{ id: "a" }, { id: "b" }];

test("resolveLectureFilter akzeptiert nur bekannte Vorlesungen", () => {
  assert.equal(resolveLectureFilter(null, lectures), "all");
  assert.equal(resolveLectureFilter("none", lectures), "none");
  assert.equal(resolveLectureFilter("b", lectures), "b");
  assert.equal(resolveLectureFilter("gone", lectures), "all");
});

test("matchesLectureFilter", () => {
  assert.equal(matchesLectureFilter(null, "all"), true);
  assert.equal(matchesLectureFilter(null, "none"), true);
  assert.equal(matchesLectureFilter("a", "none"), false);
  assert.equal(matchesLectureFilter("a", "a"), true);
  assert.equal(matchesLectureFilter("a", "b"), false);
  assert.equal(matchesLectureFilter(undefined, "a"), false);
});

test("countByLecture ignoriert Unterlagen ohne Vorlesung", () => {
  const counts = countByLecture([{ lectureId: "a" }, { lectureId: "a" }, { lectureId: null }, { lectureId: "b" }]);
  assert.equal(counts.get("a"), 2);
  assert.equal(counts.get("b"), 1);
  assert.equal(counts.size, 2);
});

test("isLectureNotFound erkennt den Backend-Fehler", () => {
  assert.equal(isLectureNotFound({ message: "LECTURE_NOT_FOUND" }), true);
  assert.equal(isLectureNotFound({ message: "x", details: "LECTURE_NOT_FOUND" }), true);
  assert.equal(isLectureNotFound(new Error("other")), false);
  assert.equal(isLectureNotFound(null), false);
});
