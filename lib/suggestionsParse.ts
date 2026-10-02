// Turns the answer of the extraction prompt into suggestion drafts. AI output is untrusted:
// every line is validated, anything malformed is discarded and counted, never guessed.
import type { NewSuggestion } from "./supabase/queries/document-suggestions";

export const SUGGESTIONS_PROMPT =
  "Analysiere das Dokument und liste die wichtigsten Themen, Definitionen und genannten Termine " +
  "(Prüfungen, Abgaben, Präsentationen, Fristen). Erfinde nichts; nenne nur, was im Text steht. " +
  "Antworte ausschließlich in diesem Format, eine Zeile pro Eintrag, ohne zusätzlichen Text:\n" +
  "THEMA: <Titel> | <Seitenzahl oder -> | <eine Zeile Erläuterung>\n" +
  "DEFINITION: <Begriff> | <Seitenzahl oder -> | <Definition aus dem Text>\n" +
  "TERMIN: <Titel> | <Seitenzahl oder -> | <JJJJ-MM-TT> | <HH:MM oder -> | <kurzes wörtliches Zitat>";

export type SuggestionParseResult = { suggestions: NewSuggestion[]; discarded: number };

const LINE = /^(?:[-*•]\s+)?(THEMA|DEFINITION|TERMIN)\s*:\s*(.+)$/i;
const MAX_ITEMS = 50;
// Citation markers like "[1][2]" that the chat backend appends to every statement.
const CITATION_MARKERS = /[ \t]*(?:\[[1-9]\d?\])+/g;

function parsePage(value: string | undefined): number | null {
  const match = value?.match(/^(?:S\.?\s*|Seite\s*)?(\d{1,4})$/i);
  const page = match ? Number(match[1]) : NaN;
  return Number.isInteger(page) && page > 0 ? page : null;
}

/** `YYYY-MM-DD` that is a real calendar day, plus an optional local `HH:MM`. */
export function parseSuggestionDate(date: string | undefined, time: string | undefined): { startsAt: string; allDay: boolean } | null {
  const day = date?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!day) return null;
  const [year, month, dayOfMonth] = [Number(day[1]), Number(day[2]), Number(day[3])];
  const probe = new Date(Date.UTC(year, month - 1, dayOfMonth));
  if (year < 2000 || year > 2100 || probe.getUTCMonth() !== month - 1 || probe.getUTCDate() !== dayOfMonth) return null;
  const clock = time?.match(/^([01]?\d|2[0-3]):([0-5]\d)$/);
  if (!clock) return { startsAt: `${day[0]}T12:00:00.000Z`, allDay: true };
  return { startsAt: new Date(year, month - 1, dayOfMonth, Number(clock[1]), Number(clock[2])).toISOString(), allDay: false };
}

export function parseSuggestions(raw: string): SuggestionParseResult {
  const suggestions: NewSuggestion[] = [];
  const seen = new Set<string>();
  let discarded = 0;
  for (const rawLine of raw.replace(CITATION_MARKERS, "").replace(/\r\n?/g, "\n").split("\n")) {
    const match = rawLine.trim().match(LINE);
    if (!match) continue;
    const kind = match[1].toUpperCase();
    const fields = match[2].split("|").map((field) => field.trim());
    const title = fields[0]?.slice(0, 200);
    const pageNumber = parsePage(fields[1]);
    let suggestion: NewSuggestion | null = null;
    if (title && kind === "TERMIN") {
      const when = parseSuggestionDate(fields[2], fields[3]);
      if (when) suggestion = { kind: "date", title, pageNumber, quote: fields[4]?.slice(0, 1000) || undefined, ...when };
    } else if (title && fields.length >= 3 && fields[2]) {
      suggestion = { kind: kind === "THEMA" ? "topic" : "definition", title, pageNumber, detail: fields.slice(2).join(" | ").slice(0, 2000) };
    } else if (title && kind === "THEMA") {
      suggestion = { kind: "topic", title, pageNumber };
    }
    const key = suggestion ? `${suggestion.kind}|${suggestion.title.toLowerCase()}|${suggestion.startsAt ?? ""}` : "";
    if (!suggestion || seen.has(key) || suggestions.length >= MAX_ITEMS) { discarded += 1; continue; }
    seen.add(key);
    suggestions.push(suggestion);
  }
  return { suggestions, discarded };
}
