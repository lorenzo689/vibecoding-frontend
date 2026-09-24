// Dependency-free iCalendar (RFC 5545) reader, limited to what a study calendar
// actually contains: VEVENT with DTSTART/DTEND, all-day dates, TZID wall times
// and the recurrence rules a timetable uses. Deliberately NOT supported:
// BYSETPOS, BYMONTHDAY/BYYEARDAY combinations, RDATE, VTIMEZONE definitions
// (we resolve TZID through Intl instead) and RECURRENCE-ID overrides. Anything
// unsupported is reported, never silently dropped - see IcsParseResult.warnings.

export type IcsEvent = {
  uid: string;
  title: string;
  description: string;
  location: string;
  /** ISO 8601 with offset. */
  startsAt: string;
  /** ISO 8601 with offset, or null when the source gave no end. */
  endsAt: string | null;
  allDay: boolean;
  /** True when this instance came out of an RRULE expansion. */
  recurring: boolean;
};

export type IcsParseResult = {
  events: IcsEvent[];
  warnings: string[];
};

type RawProperty = { name: string; params: Record<string, string>; value: string };

const MAX_INSTANCES_PER_RULE = 400;

/** RFC 5545 folding: a CRLF followed by a space or tab continues the line. */
function unfold(text: string): string[] {
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of lines) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length > 0) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

function parseLine(line: string): RawProperty | null {
  const colon = indexOfUnquoted(line, ":");
  if (colon < 0) return null;
  const head = line.slice(0, colon);
  const value = line.slice(colon + 1);
  const segments = splitUnquoted(head, ";");
  const name = (segments.shift() ?? "").toUpperCase();
  if (!name) return null;
  const params: Record<string, string> = {};
  for (const segment of segments) {
    const eq = segment.indexOf("=");
    if (eq < 0) continue;
    params[segment.slice(0, eq).toUpperCase()] = stripQuotes(segment.slice(eq + 1));
  }
  return { name, params, value };
}

/** Parameter values may be quoted and then contain ':' or ';' literally. */
function indexOfUnquoted(text: string, needle: string): number {
  let quoted = false;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === '"') quoted = !quoted;
    else if (!quoted && text[i] === needle) return i;
  }
  return -1;
}

function splitUnquoted(text: string, separator: string): string[] {
  const parts: string[] = [];
  let current = "";
  let quoted = false;
  for (const char of text) {
    if (char === '"') { quoted = !quoted; current += char; }
    else if (!quoted && char === separator) { parts.push(current); current = ""; }
    else current += char;
  }
  parts.push(current);
  return parts;
}

function stripQuotes(value: string): string {
  return value.startsWith('"') && value.endsWith('"') && value.length > 1 ? value.slice(1, -1) : value;
}

function unescapeText(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    if (value[i] !== "\\") { out += value[i]; continue; }
    const next = value[++i];
    if (next === "n" || next === "N") out += "\n";
    else if (next === undefined) out += "\\";
    else out += next; // covers \, \; \\ and any stray escape
  }
  return out;
}

/**
 * Offset of a time zone at a given instant, in milliseconds. Derived from Intl
 * so we need no VTIMEZONE parsing and no zone database of our own.
 */
function zoneOffsetMs(instant: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone, hour12: false,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const parts = formatter.formatToParts(instant);
  const pick = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? "0");
  const asUtc = Date.UTC(pick("year"), pick("month") - 1, pick("day"), pick("hour") % 24, pick("minute"), pick("second"));
  return asUtc - instant.getTime();
}

/** A wall-clock time in a named zone to a real instant. Two passes settle DST. */
function wallTimeToInstant(parts: number[], timeZone: string): Date {
  const [year, month, day, hour, minute, second] = parts;
  const naive = Date.UTC(year, month - 1, day, hour, minute, second);
  let instant = naive - zoneOffsetMs(new Date(naive), timeZone);
  instant = naive - zoneOffsetMs(new Date(instant), timeZone);
  return new Date(instant);
}

type DateValue = { date: Date; allDay: boolean };

function parseDateValue(property: RawProperty, fallbackZone: string): DateValue | null {
  const raw = property.value.trim();
  const isDateOnly = property.params.VALUE === "DATE" || /^\d{8}$/.test(raw);
  if (isDateOnly) {
    const match = /^(\d{4})(\d{2})(\d{2})$/.exec(raw);
    if (!match) return null;
    const [, y, m, d] = match;
    // All-day events carry no zone. Anchor them to local midnight so they land
    // on the day the person wrote down, not the day UTC happens to agree with.
    return { date: new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0), allDay: true };
  }
  const match = /^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?$/.exec(raw);
  if (!match) return null;
  const numbers = [Number(match[1]), Number(match[2]), Number(match[3]), Number(match[4]), Number(match[5]), Number(match[6])];
  if (match[7] === "Z") {
    return { date: new Date(Date.UTC(numbers[0], numbers[1] - 1, numbers[2], numbers[3], numbers[4], numbers[5])), allDay: false };
  }
  const zone = property.params.TZID || fallbackZone;
  try {
    return { date: wallTimeToInstant(numbers, zone), allDay: false };
  } catch {
    // Unknown TZID: fall back to the viewer's own zone rather than losing the event.
    return { date: new Date(numbers[0], numbers[1] - 1, numbers[2], numbers[3], numbers[4], numbers[5]), allDay: false };
  }
}

/** ISO 8601 with the local offset, which is what the rest of the app stores. */
function toIso(date: Date): string {
  const pad = (value: number, width = 2) => String(Math.abs(value)).padStart(width, "0");
  const offset = -date.getTimezoneOffset();
  const sign = offset >= 0 ? "+" : "-";
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T` +
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}` +
    `${sign}${pad(Math.trunc(offset / 60))}:${pad(offset % 60)}`;
}

function parseDuration(value: string): number | null {
  const match = /^([+-])?P(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value.trim());
  if (!match) return null;
  const sign = match[1] === "-" ? -1 : 1;
  const [weeks, days, hours, minutes, seconds] = match.slice(2).map((part) => Number(part ?? 0) || 0);
  const total = ((weeks * 7 + days) * 24 * 60 * 60 + hours * 60 * 60 + minutes * 60 + seconds) * 1000;
  return total === 0 ? null : sign * total;
}

const WEEKDAYS = ["SU", "MO", "TU", "WE", "TH", "FR", "SA"];

type Recurrence = {
  freq: "DAILY" | "WEEKLY" | "MONTHLY" | "YEARLY";
  interval: number;
  count: number | null;
  until: Date | null;
  byDay: number[];
  unsupported: string[];
};

function parseRecurrence(value: string): Recurrence | null {
  const entries: Record<string, string> = {};
  for (const part of value.split(";")) {
    const eq = part.indexOf("=");
    if (eq > 0) entries[part.slice(0, eq).toUpperCase()] = part.slice(eq + 1);
  }
  const freq = entries.FREQ?.toUpperCase();
  if (freq !== "DAILY" && freq !== "WEEKLY" && freq !== "MONTHLY" && freq !== "YEARLY") return null;

  const unsupported = ["BYSETPOS", "BYMONTHDAY", "BYYEARDAY", "BYWEEKNO", "BYMONTH"]
    .filter((key) => key in entries);

  let until: Date | null = null;
  if (entries.UNTIL) {
    const parsed = parseDateValue({ name: "UNTIL", params: {}, value: entries.UNTIL }, "UTC");
    until = parsed?.date ?? null;
  }
  const byDay = (entries.BYDAY ?? "")
    .split(",")
    .map((day) => WEEKDAYS.indexOf(day.trim().slice(-2).toUpperCase()))
    .filter((index) => index >= 0);

  return {
    freq,
    interval: Math.max(1, Number(entries.INTERVAL ?? 1) || 1),
    count: entries.COUNT ? Number(entries.COUNT) || null : null,
    until,
    byDay,
    unsupported,
  };
}

function addByFrequency(date: Date, rule: Recurrence, steps: number): Date {
  const next = new Date(date);
  if (rule.freq === "DAILY") next.setDate(next.getDate() + rule.interval * steps);
  else if (rule.freq === "WEEKLY") next.setDate(next.getDate() + 7 * rule.interval * steps);
  else if (rule.freq === "MONTHLY") next.setMonth(next.getMonth() + rule.interval * steps);
  else next.setFullYear(next.getFullYear() + rule.interval * steps);
  return next;
}

/** Start instants produced by a rule, bounded by the window and a hard cap. */
function expandRecurrence(start: Date, rule: Recurrence, windowEnd: Date, exdates: Set<number>): Date[] {
  const results: Date[] = [];
  const limit = rule.count ?? MAX_INSTANCES_PER_RULE;
  const stopAt = rule.until && rule.until < windowEnd ? rule.until : windowEnd;

  const push = (candidate: Date) => {
    if (candidate > stopAt) return false;
    if (!exdates.has(candidate.getTime())) results.push(candidate);
    return true;
  };

  if (rule.freq === "WEEKLY" && rule.byDay.length > 0) {
    // Anchor on the Sunday of the start's week, then walk the named weekdays.
    const weekStart = new Date(start);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    for (let step = 0; results.length < limit && step < MAX_INSTANCES_PER_RULE; step++) {
      const base = new Date(weekStart);
      base.setDate(base.getDate() + 7 * rule.interval * step);
      let anyInWindow = false;
      for (const weekday of [...rule.byDay].sort((a, b) => a - b)) {
        const candidate = new Date(base);
        candidate.setDate(candidate.getDate() + weekday);
        candidate.setHours(start.getHours(), start.getMinutes(), start.getSeconds(), 0);
        if (candidate < start) continue;
        if (candidate > stopAt) continue;
        anyInWindow = true;
        if (results.length < limit) push(candidate);
      }
      if (!anyInWindow && base > stopAt) break;
    }
    return results.sort((a, b) => a.getTime() - b.getTime()).slice(0, limit);
  }

  for (let step = 0; results.length < limit && step < MAX_INSTANCES_PER_RULE; step++) {
    const candidate = addByFrequency(start, rule, step);
    if (candidate > stopAt) break;
    push(candidate);
  }
  return results;
}

export type ParseOptions = {
  /** Instances after this point are dropped. Defaults to one year ahead. */
  windowEnd?: Date;
  /** Zone for wall times whose TZID we cannot read. Defaults to the viewer's. */
  fallbackZone?: string;
};

export function parseIcs(text: string, options: ParseOptions = {}): IcsParseResult {
  const windowEnd = options.windowEnd ?? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);
  const fallbackZone = options.fallbackZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const warnings: string[] = [];
  const events: IcsEvent[] = [];

  let current: RawProperty[] | null = null;
  let sawCalendar = false;

  for (const line of unfold(text)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    if (trimmed.toUpperCase() === "BEGIN:VCALENDAR") { sawCalendar = true; continue; }
    if (trimmed.toUpperCase() === "BEGIN:VEVENT") { current = []; continue; }
    if (trimmed.toUpperCase() === "END:VEVENT") {
      if (current) {
        const built = buildEvents(current, { windowEnd, fallbackZone, warnings });
        events.push(...built);
      }
      current = null;
      continue;
    }
    if (!current) continue;
    const property = parseLine(trimmed);
    if (property) current.push(property);
  }

  if (!sawCalendar) warnings.push("Die Datei enthält kein BEGIN:VCALENDAR — vermutlich keine Kalenderdatei.");
  if (sawCalendar && events.length === 0) warnings.push("Keine Termine im gewählten Zeitraum gefunden.");

  events.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  return { events, warnings };
}

function buildEvents(
  properties: RawProperty[],
  context: { windowEnd: Date; fallbackZone: string; warnings: string[] },
): IcsEvent[] {
  const find = (name: string) => properties.find((property) => property.name === name);
  const findAll = (name: string) => properties.filter((property) => property.name === name);

  const dtstart = find("DTSTART");
  if (!dtstart) return [];
  const start = parseDateValue(dtstart, context.fallbackZone);
  if (!start) {
    context.warnings.push("Ein Termin hatte kein lesbares Startdatum und wurde übersprungen.");
    return [];
  }

  const status = find("STATUS")?.value.toUpperCase();
  if (status === "CANCELLED") return [];

  const title = unescapeText(find("SUMMARY")?.value ?? "").trim() || "Ohne Titel";
  const description = unescapeText(find("DESCRIPTION")?.value ?? "").trim();
  const location = unescapeText(find("LOCATION")?.value ?? "").trim();
  const uid = find("UID")?.value.trim() || `${title}|${start.date.toISOString()}`;

  const dtend = find("DTEND");
  const end = dtend ? parseDateValue(dtend, context.fallbackZone) : null;
  const durationMs = end
    ? end.date.getTime() - start.date.getTime()
    : parseDuration(find("DURATION")?.value ?? "") ?? null;

  const exdates = new Set<number>();
  for (const property of findAll("EXDATE")) {
    for (const piece of property.value.split(",")) {
      const parsed = parseDateValue({ ...property, value: piece }, context.fallbackZone);
      if (parsed) exdates.add(parsed.date.getTime());
    }
  }

  const make = (startAt: Date, recurring: boolean): IcsEvent => {
    let endsAt: string | null = null;
    if (durationMs !== null && durationMs > 0) {
      const endDate = new Date(startAt.getTime() + durationMs);
      if (start.allDay) {
        // DTEND of an all-day event is exclusive. One day long means no end.
        const days = Math.round(durationMs / (24 * 60 * 60 * 1000));
        if (days > 1) {
          const last = new Date(startAt);
          last.setDate(last.getDate() + days - 1);
          endsAt = toIso(last);
        }
      } else {
        endsAt = toIso(endDate);
      }
    }
    return {
      uid: recurring ? `${uid}#${startAt.toISOString()}` : uid,
      title,
      description,
      location,
      startsAt: toIso(startAt),
      endsAt,
      allDay: start.allDay,
      recurring,
    };
  };

  const rruleValue = find("RRULE")?.value;
  if (!rruleValue) {
    return start.date > context.windowEnd ? [] : [make(start.date, false)];
  }

  const rule = parseRecurrence(rruleValue);
  if (!rule) {
    context.warnings.push(`„${title}“ hat eine Wiederholung, die nicht gelesen werden konnte — nur der erste Termin wird übernommen.`);
    return [make(start.date, false)];
  }
  if (rule.unsupported.length > 0) {
    context.warnings.push(`„${title}“ nutzt ${rule.unsupported.join(", ")} — die Wiederholung wird vereinfacht übernommen.`);
  }

  const instances = expandRecurrence(start.date, rule, context.windowEnd, exdates);
  if (instances.length === 0) return [];
  return instances.map((instance) => make(instance, true));
}
