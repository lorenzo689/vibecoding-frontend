// Run with Node 24+: node --test components/flashcards/session.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { boundedIndex, rateCard, ratingCounts } from "./session.ts";

test("navigation remains inside the stable card range", () => {
  assert.equal(boundedIndex(0, -1, 5), 0);
  assert.equal(boundedIndex(0, 1, 5), 1);
  assert.equal(boundedIndex(4, 1, 5), 4);
});

test("re-rating one card replaces its state instead of adding a count", () => {
  const unsure = rateCard({}, "meaning", "unsure");
  assert.deepEqual(ratingCounts(unsure), { unsure: 1, understood: 0 });
  const understood = rateCard(unsure, "meaning", "understood");
  assert.deepEqual(understood, { meaning: "understood" });
  assert.deepEqual(ratingCounts(understood), { unsure: 0, understood: 1 });
});

test("counts are derived from the same per-card rating state", () => {
  const ratings = rateCard(rateCard({}, "meaning", "understood"), "context", "unsure");
  assert.deepEqual(ratingCounts(ratings), { unsure: 1, understood: 1 });
});
