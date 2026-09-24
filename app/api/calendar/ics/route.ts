import { NextResponse, type NextRequest } from "next/server";
import { parseIcs } from "@/lib/calendar/ics";
import { checkFetchUrl } from "@/lib/calendar/urlGuard";
import { guessKind, type ImportCandidate } from "@/lib/calendar/importModel";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return NextResponse.json({ error: "NOT_SIGNED_IN" }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { url?: string; months?: number } | null;
  const target = body?.url;
  if (!target) return NextResponse.json({ error: "MISSING_URL" }, { status: 400 });

  const guard = checkFetchUrl(target);
  if (!guard.ok) return NextResponse.json({ error: "REJECTED", message: guard.message }, { status: 400 });

  let response: Response;
  try {
    response = await fetch(guard.url, {
      redirect: "manual",
      signal: AbortSignal.timeout(15000),
      headers: { Accept: "text/calendar, text/plain;q=0.8, */*;q=0.5" },
    });
  } catch {
    return NextResponse.json({ error: "FETCH_FAILED", message: "Die Adresse war nicht erreichbar." }, { status: 502 });
  }

  if (response.status >= 300 && response.status < 400) {
    return NextResponse.json(
      { error: "REDIRECT", message: "Die Adresse leitet weiter. Bitte die endgültige Adresse eintragen." },
      { status: 400 },
    );
  }
  if (!response.ok) {
    return NextResponse.json({ error: "FETCH_FAILED", message: `Die Adresse antwortete mit ${response.status}.` }, { status: 502 });
  }

  const length = Number(response.headers.get("content-length") ?? 0);
  if (length > MAX_BYTES) {
    return NextResponse.json({ error: "TOO_LARGE", message: "Der Kalender ist zu groß (über 5 MB)." }, { status: 413 });
  }
  const text = await response.text();
  if (text.length > MAX_BYTES) {
    return NextResponse.json({ error: "TOO_LARGE", message: "Der Kalender ist zu groß (über 5 MB)." }, { status: 413 });
  }

  const months = Math.min(24, Math.max(1, Number(body?.months ?? 6)));
  const windowEnd = new Date();
  windowEnd.setMonth(windowEnd.getMonth() + months);

  const parsed = parseIcs(text, { windowEnd });
  const candidates: ImportCandidate[] = parsed.events.map((event) => ({
    sourceUid: event.uid,
    source: "ics-url",
    title: event.title,
    description: event.description,
    location: event.location,
    startsAt: event.startsAt,
    endsAt: event.endsAt,
    allDay: event.allDay,
    kind: guessKind(event.title, event.description),
    recurring: event.recurring,
  }));

  return NextResponse.json({ candidates, warnings: parsed.warnings });
}
