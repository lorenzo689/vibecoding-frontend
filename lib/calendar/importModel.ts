import type { CalendarEventInput, CalendarEventKind } from "@/lib/supabase/queries/calendar-map";

export type ImportSource = "google" | "ics-file" | "ics-url";

export type ImportCandidate = {
  /** Stable identity of the entry in its source calendar. */
  sourceUid: string;
  source: ImportSource;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
  kind: CalendarEventKind;
  recurring: boolean;
};

/**
 * calendar_events has no column for a foreign id, and the table lives in the
 * backend repository. Until it gains one, the origin is recorded as a marker
 * line inside description: it survives a round trip, is visible to the person
 * whose data it is, and lets a second import recognise what it already wrote.
 * A real external_uid column belongs in the backend - see the note in the
 * calendar import docs.
 */
const MARKER_PREFIX = "lernapp-import";
const MARKER_PATTERN = /\[lernapp-import:([a-z]+):([0-9a-f]{8,16})\]/i;

/** FNV-1a. Not a security primitive - it only has to be stable and short. */
export function fingerprint(value: string): string {
  let hash = 0x811c9dc5;
  for (let index = 0; index < value.length; index++) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  // A second pass over the reversed input widens the value and makes
  // collisions between similar recurring instances far less likely.
  let tail = 0x811c9dc5;
  for (let index = value.length - 1; index >= 0; index--) {
    tail ^= value.charCodeAt(index);
    tail = Math.imul(tail, 0x01000193) >>> 0;
  }
  return hash.toString(16).padStart(8, "0") + tail.toString(16).padStart(8, "0");
}

export function buildMarker(source: ImportSource, sourceUid: string): string {
  const kind = source === "google" ? "google" : "ics";
  return `[${MARKER_PREFIX}:${kind}:${fingerprint(`${kind}:${sourceUid}`)}]`;
}

export function readMarker(description: string): string | null {
  const match = MARKER_PATTERN.exec(description ?? "");
  return match ? match[0] : null;
}

/**
 * JavaScript's \b is defined over ASCII word characters, so it reports no
 * boundary before "Ü" and a pattern like /\bübung/ never matches "Übung".
 * German titles are exactly the case this has to get right, so the boundaries
 * are spelled out over Unicode letters instead.
 */
function word(alternatives: string): RegExp {
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${alternatives})(?![\\p{L}\\p{N}])`, "iu");
}

const KIND_RULES: Array<{ kind: CalendarEventKind; pattern: RegExp }> = [
  { kind: "exam", pattern: word("klausur\\w*|pr[üu]fung\\w*|exam|test|testat") },
  { kind: "deadline", pattern: word("abgabe\\w*|deadline|frist\\w*|einreichung|hand\\s?-?in") },
  { kind: "presentation", pattern: word("pr[äa]sentation\\w*|vortrag\\w*|presentation|kolloquium|verteidigung") },
  { kind: "exercise", pattern: word("[üu]bung\\w*|tutorium|tutorien|praktikum|labor\\w*|exercise|tutorial") },
  { kind: "lecture", pattern: word("vorlesung\\w*|lecture|seminar\\w*|kurs|unterricht") },
  { kind: "study", pattern: word("lernen|lernzeit|repetitorium|study|revision|wiederholung") },
];

/** A guess from the title, always overridable in the preview before import. */
export function guessKind(title: string, description = ""): CalendarEventKind {
  const haystack = `${title} ${description}`;
  for (const rule of KIND_RULES) {
    if (rule.pattern.test(haystack)) return rule.kind;
  }
  return "other";
}

export function buildDescription(candidate: ImportCandidate): string {
  const parts: string[] = [];
  if (candidate.description) parts.push(candidate.description);
  if (candidate.location) parts.push(`Ort: ${candidate.location}`);
  parts.push(buildMarker(candidate.source, candidate.sourceUid));
  return parts.join("\n\n");
}

export function toEventInput(candidate: ImportCandidate, courseId: string | null): CalendarEventInput {
  return {
    courseId,
    title: candidate.title,
    description: buildDescription(candidate),
    kind: candidate.kind,
    startsAt: candidate.startsAt,
    endsAt: candidate.endsAt,
    allDay: candidate.allDay,
  };
}

export type DedupeResult = {
  fresh: ImportCandidate[];
  duplicates: ImportCandidate[];
};

/**
 * Split candidates by whether this calendar already holds them. Matching is by
 * marker first; entries that predate markers fall back to identical title and
 * start, which is what a person would call the same appointment.
 */
export function dedupe(
  candidates: ImportCandidate[],
  existing: Array<{ title: string; startsAt: string; description: string }>,
): DedupeResult {
  const markers = new Set<string>();
  const naturalKeys = new Set<string>();
  for (const event of existing) {
    const marker = readMarker(event.description);
    if (marker) markers.add(marker.toLowerCase());
    naturalKeys.add(`${event.title.trim().toLowerCase()}|${event.startsAt}`);
  }

  const seenInBatch = new Set<string>();
  const fresh: ImportCandidate[] = [];
  const duplicates: ImportCandidate[] = [];

  for (const candidate of candidates) {
    const marker = buildMarker(candidate.source, candidate.sourceUid).toLowerCase();
    const natural = `${candidate.title.trim().toLowerCase()}|${candidate.startsAt}`;
    if (markers.has(marker) || naturalKeys.has(natural) || seenInBatch.has(marker)) {
      duplicates.push(candidate);
      continue;
    }
    seenInBatch.add(marker);
    fresh.push(candidate);
  }

  return { fresh, duplicates };
}
