import { NextResponse, type NextRequest } from "next/server";
import { cookies } from "next/headers";
import { GOOGLE_TOKEN_COOKIE, readAccessToken } from "@/lib/calendar/googleAuth";
import { guessKind, type ImportCandidate } from "@/lib/calendar/importModel";
import { createClient } from "@/lib/supabase/server";

type GoogleEvent = {
  id?: string;
  iCalUID?: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  recurringEventId?: string;
  start?: { date?: string; dateTime?: string };
  end?: { date?: string; dateTime?: string };
};

function toCandidate(event: GoogleEvent): ImportCandidate | null {
  const startRaw = event.start?.dateTime ?? event.start?.date;
  if (!startRaw) return null;
  const allDay = !event.start?.dateTime;
  const title = (event.summary ?? "").trim() || "Ohne Titel";
  const description = (event.description ?? "").trim();

  let endsAt: string | null = null;
  const endRaw = event.end?.dateTime ?? event.end?.date;
  if (endRaw) {
    if (allDay) {
      // Google reports the exclusive end date for all-day entries, exactly as
      // iCalendar does. One day long therefore means: no end worth storing.
      const start = new Date(`${startRaw}T00:00:00`);
      const end = new Date(`${endRaw}T00:00:00`);
      const days = Math.round((end.getTime() - start.getTime()) / 86400000);
      if (days > 1) {
        const last = new Date(start);
        last.setDate(last.getDate() + days - 1);
        endsAt = last.toISOString();
      }
    } else {
      endsAt = new Date(endRaw).toISOString();
    }
  }

  return {
    sourceUid: event.iCalUID ?? event.id ?? `${title}|${startRaw}`,
    source: "google",
    title,
    description,
    location: (event.location ?? "").trim(),
    startsAt: allDay ? new Date(`${startRaw}T00:00:00`).toISOString() : new Date(startRaw).toISOString(),
    endsAt,
    allDay,
    kind: guessKind(title, description),
    recurring: Boolean(event.recurringEventId),
  };
}

export async function GET(request: NextRequest) {
  // The calendar belongs to a signed-in person; an anonymous caller has no
  // business spending our Google quota, even holding a token cookie.
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) {
    return NextResponse.json({ error: "NOT_SIGNED_IN" }, { status: 401 });
  }

  const token = await readAccessToken();
  if (!token) return NextResponse.json({ error: "NOT_CONNECTED" }, { status: 401 });

  const months = Math.min(24, Math.max(1, Number(request.nextUrl.searchParams.get("months") ?? 6)));
  const timeMin = new Date();
  const timeMax = new Date();
  timeMax.setMonth(timeMax.getMonth() + months);

  const url = new URL("https://www.googleapis.com/calendar/v3/calendars/primary/events");
  url.searchParams.set("timeMin", timeMin.toISOString());
  url.searchParams.set("timeMax", timeMax.toISOString());
  // Let Google expand recurrences: it owns the rules and the exceptions.
  url.searchParams.set("singleEvents", "true");
  url.searchParams.set("orderBy", "startTime");
  url.searchParams.set("maxResults", "250");

  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (response.status === 401 || response.status === 403) {
    const store = await cookies();
    store.delete(GOOGLE_TOKEN_COOKIE);
    return NextResponse.json({ error: "NOT_CONNECTED" }, { status: 401 });
  }
  if (!response.ok) {
    return NextResponse.json({ error: "GOOGLE_FAILED" }, { status: 502 });
  }

  const payload = (await response.json()) as { items?: GoogleEvent[] };
  const candidates = (payload.items ?? [])
    .filter((event) => event.status !== "cancelled")
    .map(toCandidate)
    .filter((candidate): candidate is ImportCandidate => candidate !== null);

  return NextResponse.json({ candidates });
}
