"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import s from "./calendar.module.css";
import { KIND_LABELS } from "./EventDialog";
import { parseIcs } from "@/lib/calendar/ics";
import { dedupe, guessKind, type ImportCandidate } from "@/lib/calendar/importModel";
import type { CalendarEvent, CalendarEventKind } from "@/lib/supabase/queries/calendar";
import type { Course } from "@/lib/supabase/queries/courses";
import { formatEventWhen } from "./dateUtils";

type Tab = "google" | "file" | "url";

type Props = {
  existing: CalendarEvent[];
  courses: Course[];
  onImport: (candidates: ImportCandidate[], courseId: string | null) => Promise<number>;
  onClose: () => void;
};

const MONTH_OPTIONS = [3, 6, 12, 24];

/**
 * The Google consent round trip cannot resolve a promise - it navigates away
 * and comes back, so its outcome arrives in the address bar. It is read once
 * as initial state rather than in an effect: an effect that calls setState
 * synchronously just renders twice to reach the value we already have here.
 */
function consentStatus(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("import");
}

const CONSENT_MESSAGES: Record<string, string> = {
  "google-ready": "Google-Kalender verbunden. Jetzt Termine laden.",
  "google-denied": "Der Zugriff auf den Google-Kalender wurde abgelehnt.",
  "google-failed": "Die Verbindung zu Google ist fehlgeschlagen.",
  "google-unconfigured": "Google-Kalender ist auf diesem Server nicht eingerichtet.",
};

export default function CalendarImport({ existing, courses, onImport, onClose }: Props) {
  const [tab, setTab] = useState<Tab>("google");
  const [months, setMonths] = useState(6);
  const [url, setUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(() => CONSENT_MESSAGES[consentStatus() ?? ""] ?? null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [candidates, setCandidates] = useState<ImportCandidate[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [kinds, setKinds] = useState<Record<string, CalendarEventKind>>({});
  const [courseId, setCourseId] = useState<string>("");
  const [googleReady, setGoogleReady] = useState(() => consentStatus() === "google-ready");
  const fileInput = useRef<HTMLInputElement>(null);

  // Only the address bar is touched here - the state above already holds the
  // outcome. Without this the status would survive a reload and reappear.
  useEffect(() => {
    if (!consentStatus()) return;
    const clean = new URL(window.location.href);
    clean.searchParams.delete("import");
    window.history.replaceState(null, "", clean.toString());
  }, []);

  const split = useMemo(
    () => (candidates ? dedupe(candidates, existing) : null),
    [candidates, existing],
  );

  function present(list: ImportCandidate[], notes: string[]) {
    const result = dedupe(list, existing);
    setCandidates(list);
    setWarnings(notes);
    setChosen(new Set(result.fresh.map((item) => item.sourceUid)));
    setKinds(Object.fromEntries(list.map((item) => [item.sourceUid, item.kind])));
    if (list.length === 0) setMessage("Im gewählten Zeitraum wurden keine Termine gefunden.");
    else if (result.fresh.length === 0) setMessage("Alle gefundenen Termine stehen bereits in deinem Kalender.");
    else setMessage(null);
  }

  async function loadGoogle() {
    setBusy(true); setMessage(null);
    try {
      const response = await fetch(`/api/calendar/google/events?months=${months}`);
      if (response.status === 401) {
        setGoogleReady(false);
        setMessage("Nicht mit Google verbunden. Bitte zuerst den Zugriff erlauben.");
        return;
      }
      if (!response.ok) { setMessage("Die Termine konnten nicht von Google geladen werden."); return; }
      const payload = (await response.json()) as { candidates: ImportCandidate[] };
      present(payload.candidates, []);
    } catch {
      setMessage("Die Termine konnten nicht von Google geladen werden.");
    } finally {
      setBusy(false);
    }
  }

  async function loadFile(file: File) {
    setBusy(true); setMessage(null);
    try {
      const text = await file.text();
      const windowEnd = new Date();
      windowEnd.setMonth(windowEnd.getMonth() + months);
      const parsed = parseIcs(text, { windowEnd });
      present(
        parsed.events.map((event) => ({
          sourceUid: event.uid,
          source: "ics-file" as const,
          title: event.title,
          description: event.description,
          location: event.location,
          startsAt: event.startsAt,
          endsAt: event.endsAt,
          allDay: event.allDay,
          kind: guessKind(event.title, event.description),
          recurring: event.recurring,
        })),
        parsed.warnings,
      );
    } catch {
      setMessage("Die Datei konnte nicht gelesen werden.");
    } finally {
      setBusy(false);
    }
  }

  async function loadUrl() {
    if (!url.trim()) return;
    setBusy(true); setMessage(null);
    try {
      const response = await fetch("/api/calendar/ics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, months }),
      });
      const payload = (await response.json()) as {
        candidates?: ImportCandidate[]; warnings?: string[]; message?: string;
      };
      if (!response.ok) { setMessage(payload.message ?? "Die Adresse konnte nicht gelesen werden."); return; }
      present(payload.candidates ?? [], payload.warnings ?? []);
    } catch {
      setMessage("Die Adresse konnte nicht gelesen werden.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmImport() {
    if (!split) return;
    const picked = split.fresh
      .filter((item) => chosen.has(item.sourceUid))
      .map((item) => ({ ...item, kind: kinds[item.sourceUid] ?? item.kind }));
    if (picked.length === 0) return;
    setBusy(true);
    try {
      const count = await onImport(picked, courseId || null);
      setMessage(`${count} von ${picked.length} Terminen übernommen.`);
      setCandidates(null);
    } catch {
      setMessage("Die Termine konnten nicht gespeichert werden.");
    } finally {
      setBusy(false);
    }
  }

  const fresh = split?.fresh ?? [];
  const duplicateCount = split?.duplicates.length ?? 0;

  return (
    <div className={s.importPanel} role="region" aria-label="Kalender importieren">
      <header className={s.importHeader}>
        <div>
          <h2>Kalender übernehmen</h2>
          <p>Termine werden erst angezeigt und von dir bestätigt. Nichts wird ohne deine Auswahl gespeichert.</p>
        </div>
        <button type="button" className={s.importClose} onClick={onClose} aria-label="Import schließen">×</button>
      </header>

      <div className={s.importTabs} role="tablist" aria-label="Quelle wählen">
        {([["google", "Google Kalender"], ["file", "Kalenderdatei (.ics)"], ["url", "Abo-Adresse"]] as Array<[Tab, string]>).map(([value, label]) => (
          <button
            key={value} type="button" role="tab" aria-selected={tab === value}
            className={s.importTab} data-active={tab === value}
            onClick={() => { setTab(value); setCandidates(null); setMessage(null); setWarnings([]); }}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={s.importControls}>
        <label htmlFor="import-months">Zeitraum</label>
        <select id="import-months" value={months} onChange={(event) => setMonths(Number(event.target.value))}>
          {MONTH_OPTIONS.map((value) => <option key={value} value={value}>kommende {value} Monate</option>)}
        </select>

        {tab === "google" && (
          <>
            <a className={s.importAction} href="/api/calendar/google/start">
              {googleReady ? "Zugriff erneuern" : "Zugriff erlauben"}
            </a>
            <button type="button" className={s.importAction} onClick={loadGoogle} disabled={busy}>
              {busy ? "Lädt …" : "Termine laden"}
            </button>
          </>
        )}

        {tab === "file" && (
          <>
            <input
              ref={fileInput} type="file" accept=".ics,text/calendar" className={s.importFile}
              onChange={(event) => { const file = event.target.files?.[0]; if (file) void loadFile(file); }}
            />
            <button type="button" className={s.importAction} onClick={() => fileInput.current?.click()} disabled={busy}>
              {busy ? "Liest …" : "Datei wählen"}
            </button>
          </>
        )}

        {tab === "url" && (
          <>
            <input
              type="url" value={url} placeholder="https://… oder webcal://…"
              className={s.importUrl} onChange={(event) => setUrl(event.target.value)}
            />
            <button type="button" className={s.importAction} onClick={loadUrl} disabled={busy || !url.trim()}>
              {busy ? "Lädt …" : "Kalender lesen"}
            </button>
          </>
        )}
      </div>

      {tab === "google" && (
        <p className={s.importHint}>
          Es wird ausschließlich lesend auf deinen Hauptkalender zugegriffen. Die Erlaubnis gilt nur für diesen
          Besuch und wird nicht gespeichert.
        </p>
      )}
      {tab === "file" && (
        <p className={s.importHint}>
          Dein Computer-Kalender lässt sich nicht direkt auslesen — kein Browser darf das. Exportiere stattdessen
          in Apple Kalender über <em>Ablage → Exportieren</em> oder in Outlook über <em>Kalender speichern</em> und
          wähle die Datei hier aus. Die Datei verlässt deinen Rechner nicht.
        </p>
      )}
      {tab === "url" && (
        <p className={s.importHint}>
          Für einen Kalender, der sich weiter ändert: In Apple Kalender <em>Kalender veröffentlichen</em>, in Google
          Kalender die private iCal-Adresse. Diese Adresse ist wie ein Passwort — wer sie hat, sieht deine Termine.
        </p>
      )}

      {message && <p className={s.importMessage} role="status">{message}</p>}
      {warnings.map((warning) => <p key={warning} className={s.importWarning}>{warning}</p>)}

      {split && fresh.length > 0 && (
        <>
          <div className={s.importSummary}>
            <strong>{fresh.length} neue Termine</strong>
            {duplicateCount > 0 && <span>{duplicateCount} bereits vorhanden und übersprungen</span>}
            <label htmlFor="import-course">Kurs zuordnen</label>
            <select id="import-course" value={courseId} onChange={(event) => setCourseId(event.target.value)}>
              <option value="">Ohne Kurs</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.title}</option>)}
            </select>
            <button
              type="button" className={s.importAction}
              onClick={() => setChosen(chosen.size === fresh.length ? new Set() : new Set(fresh.map((item) => item.sourceUid)))}
            >
              {chosen.size === fresh.length ? "Keinen auswählen" : "Alle auswählen"}
            </button>
          </div>

          <ul className={s.importList}>
            {fresh.map((candidate) => (
              <li key={candidate.sourceUid}>
                <label className={s.importRow}>
                  <input
                    type="checkbox" checked={chosen.has(candidate.sourceUid)}
                    onChange={(event) => setChosen((previous) => {
                      const next = new Set(previous);
                      if (event.target.checked) next.add(candidate.sourceUid); else next.delete(candidate.sourceUid);
                      return next;
                    })}
                  />
                  <span className={s.importWhen}>
                    {formatEventWhen(candidate.startsAt, candidate.endsAt, candidate.allDay)}
                  </span>
                  <span className={s.importTitle}>
                    {candidate.title}
                    {candidate.recurring && <em className={s.importRepeat}> · Serie</em>}
                  </span>
                </label>
                <select
                  aria-label={`Art für ${candidate.title}`}
                  value={kinds[candidate.sourceUid] ?? candidate.kind}
                  onChange={(event) => setKinds((previous) => ({
                    ...previous, [candidate.sourceUid]: event.target.value as CalendarEventKind,
                  }))}
                >
                  {Object.entries(KIND_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </li>
            ))}
          </ul>

          <div className={s.importFooter}>
            <button type="button" className={s.createButton} onClick={confirmImport} disabled={busy || chosen.size === 0}>
              {chosen.size} Termine übernehmen
            </button>
          </div>
        </>
      )}
    </div>
  );
}
