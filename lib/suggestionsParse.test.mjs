import assert from "node:assert/strict";
import test from "node:test";
import { parseSuggestionDate, parseSuggestions } from "./suggestionsParse.ts";

test("parses topics, definitions and dates with sources", () => {
  const { suggestions, discarded } = parseSuggestions([
    "Hier die Liste:",
    "THEMA: Graphen | 3 | Grundbegriffe [1]",
    "DEFINITION: Baum | S. 4 | Zusammenhängender Graph ohne Kreis",
    "TERMIN: Klausur | 1 | 2026-12-01 | - | Die Klausur findet am 1.12. statt",
  ].join("\n"));
  assert.equal(discarded, 0);
  assert.deepEqual(suggestions.map((s) => [s.kind, s.title, s.pageNumber]), [["topic", "Graphen", 3], ["definition", "Baum", 4], ["date", "Klausur", 1]]);
  assert.equal(suggestions[0].detail, "Grundbegriffe");
  assert.equal(suggestions[2].allDay, true);
  assert.equal(suggestions[2].startsAt, "2026-12-01T12:00:00.000Z");
  assert.equal(suggestions[2].quote, "Die Klausur findet am 1.12. statt");
});

test("discards malformed lines instead of guessing", () => {
  const { suggestions, discarded } = parseSuggestions([
    "TERMIN: Ohne Datum | 1 | bald | - | x",
    "TERMIN: Falscher Tag | 1 | 2026-02-30 | - | x",
    "DEFINITION: Leer | 2",
    "THEMA: | 1 | kein Titel",
    "THEMA: Doppelt | - | a",
    "THEMA: doppelt | - | b",
  ].join("\n"));
  assert.deepEqual(suggestions.map((s) => s.title), ["Doppelt"]);
  assert.equal(discarded, 5);
});

test("a time makes the date a timed event, a missing page becomes null", () => {
  const timed = parseSuggestionDate("2026-12-01", "09:30");
  assert.equal(timed.allDay, false);
  assert.equal(new Date(timed.startsAt).getHours(), 9);
  assert.equal(parseSuggestionDate("2026-12-01", "25:00").allDay, true);
  assert.equal(parseSuggestions("THEMA: Ohne Seite | - | Text").suggestions[0].pageNumber, null);
});
