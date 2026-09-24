// Run with Node 22+: node --test lib/calendar/ics.test.mjs
// Pinned to a DST-observing zone so the all-day and TZID cases are decidable.
process.env.TZ = "Europe/Berlin";

import assert from "node:assert/strict";
import { test } from "node:test";
import { parseIcs } from "./ics.ts";
import { dedupe, fingerprint, guessKind, buildMarker, readMarker, buildDescription } from "./importModel.ts";

const WINDOW = { windowEnd: new Date("2027-12-31T00:00:00Z") };

function wrap(body) {
  return ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//test//EN", body, "END:VCALENDAR"].join("\r\n");
}

test("liest einen einfachen Termin mit UTC-Zeit", () => {
  const { events } = parseIcs(wrap([
    "BEGIN:VEVENT", "UID:a-1", "SUMMARY:Vorlesung Analysis",
    "DTSTART:20261012T080000Z", "DTEND:20261012T093000Z", "END:VEVENT",
  ].join("\r\n")), WINDOW);

  assert.equal(events.length, 1);
  assert.equal(events[0].title, "Vorlesung Analysis");
  assert.equal(events[0].allDay, false);
  assert.equal(new Date(events[0].startsAt).toISOString(), "2026-10-12T08:00:00.000Z");
  assert.equal(new Date(events[0].endsAt).toISOString(), "2026-10-12T09:30:00.000Z");
});

test("rechnet eine TZID-Wandzeit korrekt um, auch über die Zeitumstellung", () => {
  const { events } = parseIcs(wrap([
    "BEGIN:VEVENT", "UID:tz-1", "SUMMARY:Sommer",
    "DTSTART;TZID=Europe/Berlin:20260701T120000", "END:VEVENT",
    "BEGIN:VEVENT", "UID:tz-2", "SUMMARY:Winter",
    "DTSTART;TZID=Europe/Berlin:20261201T120000", "END:VEVENT",
  ].join("\r\n")), WINDOW);

  const bySummary = Object.fromEntries(events.map((event) => [event.title, event]));
  // Sommerzeit: UTC+2, Winterzeit: UTC+1 - dieselbe Wandzeit, andere Instants.
  assert.equal(new Date(bySummary.Sommer.startsAt).toISOString(), "2026-07-01T10:00:00.000Z");
  assert.equal(new Date(bySummary.Winter.startsAt).toISOString(), "2026-12-01T11:00:00.000Z");
});

test("behandelt das exklusive Enddatum eines Ganztagestermins", () => {
  const { events } = parseIcs(wrap([
    "BEGIN:VEVENT", "UID:d-1", "SUMMARY:Ein Tag",
    "DTSTART;VALUE=DATE:20261012", "DTEND;VALUE=DATE:20261013", "END:VEVENT",
    "BEGIN:VEVENT", "UID:d-2", "SUMMARY:Drei Tage",
    "DTSTART;VALUE=DATE:20261019", "DTEND;VALUE=DATE:20261022", "END:VEVENT",
  ].join("\r\n")), WINDOW);

  const single = events.find((event) => event.title === "Ein Tag");
  const span = events.find((event) => event.title === "Drei Tage");
  assert.equal(single.allDay, true);
  assert.equal(single.endsAt, null, "ein einzelner Tag braucht kein Ende");
  assert.ok(span.endsAt.startsWith("2026-10-21"), "der letzte eingeschlossene Tag ist der 21.");
});

test("entfaltet gefaltete Zeilen und löst Escapes auf", () => {
  const { events } = parseIcs(wrap([
    "BEGIN:VEVENT", "UID:f-1", "SUMMARY:Klausur Teil 1\\, Teil 2",
    "DESCRIPTION:Erste Zeile\\nZweite Zeile mit sehr langem Text der ge",
    " faltet wurde", "DTSTART:20261012T080000Z", "END:VEVENT",
  ].join("\r\n")), WINDOW);

  assert.equal(events[0].title, "Klausur Teil 1, Teil 2");
  assert.match(events[0].description, /Erste Zeile\nZweite Zeile/);
  assert.match(events[0].description, /gefaltet wurde/);
});

test("expandiert eine wöchentliche Serie mit COUNT", () => {
  const { events } = parseIcs(wrap([
    "BEGIN:VEVENT", "UID:r-1", "SUMMARY:Übung",
    "DTSTART;TZID=Europe/Berlin:20261005T100000",
    "RRULE:FREQ=WEEKLY;COUNT=4", "END:VEVENT",
  ].join("\r\n")), WINDOW);

  assert.equal(events.length, 4);
  assert.ok(events.every((event) => event.recurring));
  const days = events.map((event) => event.startsAt.slice(0, 10));
  assert.deepEqual(days, ["2026-10-05", "2026-10-12", "2026-10-19", "2026-10-26"]);
});

test("beachtet BYDAY und EXDATE", () => {
  const { events } = parseIcs(wrap([
    "BEGIN:VEVENT", "UID:r-2", "SUMMARY:Vorlesung",
    "DTSTART;TZID=Europe/Berlin:20261005T100000",
    "RRULE:FREQ=WEEKLY;BYDAY=MO,WE;UNTIL=20261015T000000Z",
    "EXDATE;TZID=Europe/Berlin:20261007T100000", "END:VEVENT",
  ].join("\r\n")), WINDOW);

  const days = events.map((event) => event.startsAt.slice(0, 10));
  assert.ok(days.includes("2026-10-05"), "Montag ist dabei");
  assert.ok(!days.includes("2026-10-07"), "der per EXDATE gestrichene Mittwoch fehlt");
  assert.ok(days.includes("2026-10-12"), "der Montag der Folgewoche ist dabei");
});

test("überspringt abgesagte Termine und meldet fehlende Kalenderstruktur", () => {
  const cancelled = parseIcs(wrap([
    "BEGIN:VEVENT", "UID:c-1", "SUMMARY:Fällt aus", "STATUS:CANCELLED",
    "DTSTART:20261012T080000Z", "END:VEVENT",
  ].join("\r\n")), WINDOW);
  assert.equal(cancelled.events.length, 0);

  const garbage = parseIcs("das ist keine Kalenderdatei", WINDOW);
  assert.equal(garbage.events.length, 0);
  assert.ok(garbage.warnings.some((warning) => warning.includes("BEGIN:VCALENDAR")));
});

test("schneidet Termine jenseits des Zeitfensters ab", () => {
  const { events } = parseIcs(wrap([
    "BEGIN:VEVENT", "UID:w-1", "SUMMARY:Weit weg",
    "DTSTART:20991012T080000Z", "END:VEVENT",
  ].join("\r\n")), { windowEnd: new Date("2027-01-01T00:00:00Z") });
  assert.equal(events.length, 0);
});

test("errät die Terminart aus dem Titel", () => {
  assert.equal(guessKind("Klausur Statistik"), "exam");
  assert.equal(guessKind("Abgabe Hausarbeit"), "deadline");
  assert.equal(guessKind("Übung Datenbanken"), "exercise");
  assert.equal(guessKind("Vorlesung Analysis"), "lecture");
  assert.equal(guessKind("Zahnarzt"), "other");
});

test("Marker ist stabil und wiederauffindbar", () => {
  const marker = buildMarker("google", "abc-123");
  assert.equal(marker, buildMarker("google", "abc-123"));
  assert.notEqual(marker, buildMarker("ics-file", "abc-123"));
  assert.equal(readMarker(`Text\n\n${marker}`), marker);
  assert.equal(readMarker("Text ohne Marker"), null);
  assert.notEqual(fingerprint("a"), fingerprint("b"));
});

test("erkennt bereits importierte Termine wieder", () => {
  const candidate = {
    sourceUid: "u-1", source: "google", title: "Vorlesung", description: "", location: "",
    startsAt: "2026-10-05T10:00:00+02:00", endsAt: null, allDay: false, kind: "lecture", recurring: false,
  };
  const stored = { title: "Vorlesung", startsAt: "2026-10-05T10:00:00+02:00", description: buildDescription(candidate) };

  const first = dedupe([candidate], []);
  assert.equal(first.fresh.length, 1);

  const second = dedupe([candidate], [stored]);
  assert.equal(second.fresh.length, 0);
  assert.equal(second.duplicates.length, 1);
});

test("erkennt Duplikate auch ohne Marker über Titel und Startzeit", () => {
  const candidate = {
    sourceUid: "u-2", source: "ics-file", title: "Klausur", description: "", location: "",
    startsAt: "2027-02-01T09:00:00+01:00", endsAt: null, allDay: false, kind: "exam", recurring: false,
  };
  const handWritten = { title: " klausur ", startsAt: "2027-02-01T09:00:00+01:00", description: "selbst angelegt" };
  const result = dedupe([candidate], [handWritten]);
  assert.equal(result.fresh.length, 0, "ein von Hand angelegter Termin wird nicht verdoppelt");
});

test("entfernt Dubletten innerhalb eines Imports", () => {
  const make = (uid) => ({
    sourceUid: uid, source: "ics-url", title: "Termin", description: "", location: "",
    startsAt: "2026-11-01T10:00:00+01:00", endsAt: null, allDay: false, kind: "other", recurring: false,
  });
  const result = dedupe([make("x"), make("x")], []);
  assert.equal(result.fresh.length, 1);
  assert.equal(result.duplicates.length, 1);
});
