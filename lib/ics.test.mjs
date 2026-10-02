import assert from "node:assert/strict";
import test from "node:test";
import { buildIcs, escapeIcsText, foldIcsLine } from "./ics.ts";

const NOW = new Date("2026-10-01T10:00:00Z");

test("exports timed events in UTC and escapes text", () => {
  const ics = buildIcs([{ id: "e1", title: "Klausur; Teil 1, Raum A", description: "Zeile 1\nZeile 2", kind: "exam", startsAt: "2026-12-01T08:00:00Z", endsAt: "2026-12-01T09:30:00Z", allDay: false }], NOW);
  assert.ok(ics.startsWith("BEGIN:VCALENDAR\r\n") && ics.endsWith("END:VCALENDAR\r\n"));
  assert.ok(ics.includes("DTSTART:20261201T080000Z"));
  assert.ok(ics.includes("DTEND:20261201T093000Z"));
  assert.ok(ics.includes("SUMMARY:Klausur\\; Teil 1\\, Raum A"));
  assert.ok(ics.includes("DESCRIPTION:Zeile 1\\nZeile 2"));
  assert.ok(ics.includes("CATEGORIES:Prüfung"));
});

test("all-day events use exclusive end dates in local days", () => {
  const start = new Date(2026, 11, 24, 0, 0).toISOString();
  const end = new Date(2026, 11, 26, 23, 59, 59, 999).toISOString();
  const ics = buildIcs([{ id: "e2", title: "Ferien", description: "", kind: "other", startsAt: start, endsAt: end, allDay: true }], NOW);
  assert.ok(ics.includes("DTSTART;VALUE=DATE:20261224"));
  assert.ok(ics.includes("DTEND;VALUE=DATE:20261227"));
  const single = buildIcs([{ id: "e3", title: "Tag", description: "", kind: "other", startsAt: start, endsAt: null, allDay: true }], NOW);
  assert.ok(single.includes("DTEND;VALUE=DATE:20261225"));
});

test("long lines are folded without splitting characters", () => {
  const folded = foldIcsLine(`SUMMARY:${"ä".repeat(100)}`);
  for (const line of folded.split("\r\n")) assert.ok(new TextEncoder().encode(line).length <= 75);
  assert.equal(folded.replace(/\r\n /g, ""), `SUMMARY:${"ä".repeat(100)}`);
  assert.equal(escapeIcsText("a\\b"), "a\\\\b");
});
