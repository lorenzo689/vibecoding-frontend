// iCalendar (RFC 5545) export of calendar events. Pure: the browser downloads the result as a file,
// nothing is sent anywhere. Reminders and recurrence are intentionally not part of the export.

export type IcsEvent = {
  id: string;
  title: string;
  description: string;
  kind: string;
  startsAt: string;
  endsAt: string | null;
  allDay: boolean;
};

const KIND_LABELS: Record<string, string> = {
  lecture: "Vorlesung", exercise: "Übung", study: "Lernzeit", presentation: "Präsentation", exam: "Prüfung", deadline: "Abgabe/Frist", other: "Sonstiges",
};

function pad(value: number, length = 2): string { return String(value).padStart(length, "0"); }

function utcStamp(date: Date): string {
  return `${pad(date.getUTCFullYear(), 4)}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`;
}

function localDay(date: Date, addDays = 0): string {
  const shifted = new Date(date.getFullYear(), date.getMonth(), date.getDate() + addDays);
  return `${pad(shifted.getFullYear(), 4)}${pad(shifted.getMonth() + 1)}${pad(shifted.getDate())}`;
}

export function escapeIcsText(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\r\n?|\n/g, "\\n");
}

/** Folds a content line to at most 75 octets per line, never splitting a multi-byte character. */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let current = "";
  let bytes = 0;
  for (const char of line) {
    const size = encoder.encode(char).length;
    if (bytes + size > (parts.length === 0 ? 75 : 74)) { parts.push(current); current = ""; bytes = 0; }
    current += char;
    bytes += size;
  }
  parts.push(current);
  return parts.join("\r\n ");
}

export function buildIcs(events: IcsEvent[], now = new Date()): string {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//UniVerse//Kalender//DE", "CALSCALE:GREGORIAN"];
  for (const event of events) {
    const start = new Date(event.startsAt);
    const end = event.endsAt ? new Date(event.endsAt) : null;
    if (Number.isNaN(start.getTime())) continue;
    lines.push("BEGIN:VEVENT", `UID:${event.id}@universe.local`, `DTSTAMP:${utcStamp(now)}`);
    if (event.allDay) {
      // DTEND of an all-day event is exclusive: the day after the last day.
      lines.push(`DTSTART;VALUE=DATE:${localDay(start)}`, `DTEND;VALUE=DATE:${localDay(end ?? start, 1)}`);
    } else {
      lines.push(`DTSTART:${utcStamp(start)}`);
      if (end && end.getTime() > start.getTime()) lines.push(`DTEND:${utcStamp(end)}`);
    }
    lines.push(`SUMMARY:${escapeIcsText(event.title)}`);
    if (event.description.trim()) lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
    lines.push(`CATEGORIES:${escapeIcsText(KIND_LABELS[event.kind] ?? "Sonstiges")}`, "END:VEVENT");
  }
  lines.push("END:VCALENDAR");
  return lines.map(foldIcsLine).join("\r\n") + "\r\n";
}
