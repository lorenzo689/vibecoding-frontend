"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/browser";
import { listCourses, type Course } from "@/lib/supabase/queries/courses";
import { listEvents } from "@/lib/supabase/queries/calendar";
import {
  getProfileName,
  listRecentDocuments,
  listUnfinishedDocuments,
} from "@/lib/supabase/queries/dashboard";
import { deriveCourseBadge } from "@/lib/courseBadge";
import { KIND_LABELS } from "@/components/calendar/EventDialog";
import { formatDateKey, formatEventWhen, localDateKey } from "@/components/calendar/dateUtils";
import { describeIndexingProgress, type IndexingTone } from "@/components/courses/documentIndexing";
import {
  attentionDocuments,
  documentTypeLabel,
  eventDayLabel,
  nextEventByCourse,
  recentDocuments,
  upcomingEvents,
} from "./dashboardModel";
import s from "@/components/home.module.css";

// The dashboard only shows real data of the signed-in user. Every block loads on its
// own, so a failing block shows its own error without taking the page down.

type Loadable<T> = { status: "loading" } | { status: "error" } | { status: "ready"; data: T };

function useLoadable<T>(load: () => Promise<T>) {
  const [state, setState] = useState<Loadable<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    load()
      .then((data) => { if (active) setState({ status: "ready", data }); })
      .catch(() => { if (active) setState({ status: "error" }); });
    return () => { active = false; };
  }, [load, attempt]);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((value) => value + 1);
  }, []);

  return [state, reload] as const;
}

const loadCourses = () => listCourses();
const loadEvents = () => listEvents();
const loadRecentDocuments = () => listRecentDocuments(createClient(), 5);
const loadUnfinishedDocuments = () => listUnfinishedDocuments(createClient());
const loadProfileName = () => getProfileName(createClient());

const MAX_COURSES = 6;
const MAX_EVENTS = 5;

const TONE_LABELS: Record<IndexingTone, string> = {
  ready: "Bereit",
  active: "Wird verarbeitet",
  pending: "Wartet",
  failed: "Fehlgeschlagen",
};

function formatAdded(iso: string): string {
  return new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(iso));
}

type IconName = "calendar" | "course" | "file" | "alert" | "chevron";

const ICONS: Record<IconName, ReactNode> = {
  calendar: <><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M4 9.5h16M8 3v3.4M16 3v3.4" /></>,
  course: <><path d="M4 5.5C4 4.67 4.67 4 5.5 4H13v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" /><path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" /></>,
  file: <><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M13.6 3.6V8h4.3M9 12.5h6M9 16h6" /></>,
  alert: <><path d="M12 4 3.5 19h17L12 4Z" /><path d="M12 10v4M12 16.8v.2" /></>,
  chevron: <path d="m9 6 6 6-6 6" />,
};

function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {ICONS[name]}
    </svg>
  );
}

function Block({
  id,
  title,
  action,
  className,
  tone,
  children,
}: {
  id: string;
  title: string;
  action?: ReactNode;
  className?: string;
  tone?: string;
  children: ReactNode;
}) {
  return (
    <section className={`${s.card} ${className ?? ""}`} data-tone={tone} aria-labelledby={id}>
      <div className={s.cardHead}>
        <h2 id={id}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Skeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className={s.skeletonList} role="status">
      <span className={s.srOnly}>Wird geladen …</span>
      {Array.from({ length: rows }, (_, index) => <div key={index} className={s.skeletonRow} aria-hidden="true" />)}
    </div>
  );
}

function BlockError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className={s.blockError} role="alert">
      <p>{message}</p>
      <button type="button" className={s.textButton} onClick={onRetry}>Erneut laden</button>
    </div>
  );
}

function Empty({ icon, title, text, href, cta }: { icon: IconName; title: string; text: string; href: string; cta: string }) {
  return (
    <div className={s.empty}>
      <span className={s.emptyIcon}><Icon name={icon} /></span>
      <div className={s.emptyBody}>
        <strong>{title}</strong>
        <p>{text}</p>
      </div>
      <Link href={href} className={s.ctaLink}>{cta}</Link>
    </div>
  );
}

export default function DashboardOverview() {
  const [now] = useState(() => Date.now());
  const [name] = useLoadable(loadProfileName);
  const [courses, reloadCourses] = useLoadable(loadCourses);
  const [events, reloadEvents] = useLoadable(loadEvents);
  const [recent, reloadRecent] = useLoadable(loadRecentDocuments);
  const [unfinished] = useLoadable(loadUnfinishedDocuments);

  const courseTitles = useMemo(
    () => new Map(courses.status === "ready" ? courses.data.map((course) => [course.id, course.title]) : []),
    [courses]
  );
  const nextByCourse = useMemo(
    () => (events.status === "ready" ? nextEventByCourse(events.data, now) : new Map()),
    [events, now]
  );
  const attention = useMemo(
    () => (unfinished.status === "ready" ? attentionDocuments(unfinished.data) : { items: [], total: 0 }),
    [unfinished]
  );

  const displayName = name.status === "ready" ? name.data : null;

  return (
    <div className={s.home}>
      <header className={s.header}>
        {name.status === "loading" ? (
          <div className={s.titleSkeleton} role="status"><span className={s.srOnly}>Wird geladen …</span></div>
        ) : (
          <h1>{displayName ? `Hallo, ${displayName}` : "Willkommen zurück"}</h1>
        )}
        <p className={s.lead}>Bereit für die nächste Lerneinheit?</p>
        <p className={s.subhead}>Hier siehst du, was als Nächstes ansteht und wo du weiterlernen kannst.</p>
      </header>

      <div className={s.layout}>
        <Block
          id="upcoming-heading"
          title="Als Nächstes"
          className={s.areaNext}
          action={<Link href="/calendar" className={s.headLink}>Kalender öffnen</Link>}
        >
          {events.status === "loading" && <Skeleton />}
          {events.status === "error" && (
            <BlockError message="Deine Termine konnten nicht geladen werden." onRetry={reloadEvents} />
          )}
          {events.status === "ready" && (() => {
            const upcoming = upcomingEvents(events.data, now, MAX_EVENTS);
            if (upcoming.length === 0) {
              return (
                <Empty
                  icon="calendar"
                  title="Keine anstehenden Termine"
                  text="Vorlesungen, Abgaben und Prüfungen aus dem Kalender erscheinen hier."
                  href="/calendar"
                  cta="Termin eintragen"
                />
              );
            }
            return (
              <ol className={s.list}>
                {upcoming.map((event, index) => {
                  const dayKey = localDateKey(event.startsAt);
                  const courseTitle = event.courseId ? courseTitles.get(event.courseId) : undefined;
                  return (
                    <li key={event.id}>
                      <Link href="/calendar" className={s.eventRow} data-first={index === 0}>
                        <span className={s.dateBadge} aria-hidden="true">
                          <b>{formatDateKey(dayKey, { day: "2-digit" })}</b>
                          <small>{formatDateKey(dayKey, { month: "short" })}</small>
                        </span>
                        <span className={s.rowBody}>
                          <span className={s.rowMeta}>{eventDayLabel(event.startsAt, now)} · {KIND_LABELS[event.kind]}</span>
                          <strong className={s.eventTitle}>{event.title}</strong>
                          <span className={s.rowSub}>
                            {formatEventWhen(event.startsAt, event.endsAt, event.allDay)}
                            {courseTitle ? ` · ${courseTitle}` : ""}
                          </span>
                        </span>
                        <Icon name="chevron" className={s.chevron} />
                      </Link>
                    </li>
                  );
                })}
              </ol>
            );
          })()}
        </Block>

        <Block
          id="courses-heading"
          title="Deine Kurse"
          className={s.areaCourses}
          action={<Link href="/courses" className={s.headLink}>Alle Kurse</Link>}
        >
          {courses.status === "loading" && <Skeleton rows={2} />}
          {courses.status === "error" && (
            <BlockError message="Deine Kurse konnten nicht geladen werden." onRetry={reloadCourses} />
          )}
          {courses.status === "ready" && (courses.data.length === 0 ? (
            <Empty
              icon="course"
              title="Dein erster Kurs wartet"
              text="Ein Kurs bündelt Unterlagen, Notizen und Termine."
              href="/courses"
              cta="Kurs anlegen"
            />
          ) : (
            <>
              <ul className={s.courseList}>
                {courses.data.slice(0, MAX_COURSES).map((course: Course) => {
                  const badge = deriveCourseBadge(course.title);
                  const next = nextByCourse.get(course.id);
                  return (
                    <li key={course.id} className={s.courseItem}>
                      <Link href={`/courses/${course.id}`} className={s.courseRow}>
                        <span className={s.courseBadge} data-tone={badge.color} aria-hidden="true">{badge.code}</span>
                        <span className={s.rowBody}>
                          <strong className={s.courseTitle}>{course.title}</strong>
                          <span className={s.rowSub}>
                            {next
                              ? `Nächster Termin: ${eventDayLabel(next.startsAt, now)} · ${next.title}`
                              : course.description || "Keine Beschreibung hinterlegt."}
                          </span>
                        </span>
                        <Icon name="chevron" className={s.chevron} />
                      </Link>
                      <div className={s.courseActions}>
                        <Link href={`/courses/${course.id}/documents`} className={s.pill}>Unterlagen</Link>
                        <Link href={`/courses/${course.id}/flashcards`} className={s.pill}>Karteikarten</Link>
                        <Link href={`/courses/${course.id}/summaries`} className={s.pill}>Zusammenfassung</Link>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {courses.data.length > MAX_COURSES && (
                <p className={s.more}>
                  {courses.data.length - MAX_COURSES} weitere Kurse in <Link href="/courses">Alle Kurse</Link>.
                </p>
              )}
            </>
          ))}
        </Block>

        {attention.total > 0 && (
          <Block
            id="attention-heading"
            title="Verarbeitungsstatus"
            className={s.areaWide}
            tone={attention.items.some(({ progress }) => progress.tone === "failed") ? "failed" : "info"}
          >
            <ul className={s.docGrid}>
              {attention.items.map(({ document, progress }) => (
                <li key={document.materialId}>
                  <Link href={`/courses/${document.courseId}/documents/${document.fileId}`} className={s.docRow} data-attention={progress.tone}>
                    <span className={s.docType} aria-hidden="true">{documentTypeLabel(document.mimeType)}</span>
                    <span className={s.rowBody}>
                      <strong className={s.docName}>{document.name}</strong>
                      <span className={s.rowSub}>
                        {courseTitles.get(document.courseId) ?? "Kurs"} · {progress.label}
                      </span>
                      {progress.detail && <span className={s.rowDetail}>{progress.detail}</span>}
                    </span>
                    <span className={s.chip} data-tone={progress.tone}>{TONE_LABELS[progress.tone]}</span>
                  </Link>
                </li>
              ))}
            </ul>
            {attention.total > attention.items.length && (
              <p className={s.more}>Weitere Dokumente findest du in den jeweiligen Kursen.</p>
            )}
          </Block>
        )}

        <Block id="recent-heading" title="Zuletzt hinzugefügt" className={s.areaWide}>
          {recent.status === "loading" && <Skeleton rows={2} />}
          {recent.status === "error" && (
            <BlockError message="Deine Unterlagen konnten nicht geladen werden." onRetry={reloadRecent} />
          )}
          {recent.status === "ready" && (() => {
            const documents = recentDocuments(recent.data, 5);
            if (documents.length === 0) {
              return (
                <Empty
                  icon="file"
                  title="Noch keine Unterlagen"
                  text="Lade in einem Kurs Vorlesungsmaterial hoch, dann erscheint es hier."
                  href="/courses"
                  cta="Zu deinen Kursen"
                />
              );
            }
            return (
              <ul className={s.docGrid}>
                {documents.map((document) => {
                  const progress = describeIndexingProgress("ready", document.state);
                  return (
                    <li key={document.materialId}>
                      <Link href={`/courses/${document.courseId}/documents/${document.fileId}`} className={s.docRow}>
                        <span className={s.docType} aria-hidden="true">{documentTypeLabel(document.mimeType)}</span>
                        <span className={s.rowBody}>
                          <strong className={s.docName}>{document.name}</strong>
                          <span className={s.rowSub}>
                            {courseTitles.get(document.courseId) ?? "Kurs"} · {formatAdded(document.addedAt)}
                          </span>
                        </span>
                        <span className={s.chip} data-tone={progress.tone}>{TONE_LABELS[progress.tone]}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            );
          })()}
        </Block>
      </div>
    </div>
  );
}
