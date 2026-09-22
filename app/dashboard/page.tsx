import Link from "next/link";
import s from "@/components/home.module.css";

// Product-preview content, not authenticated user records.
const courses = [
  { name: "Neue Konzepte", code: "NK", topic: "Lecture 03 · Vibe Coding Setup", notes: "3 offene Notizen", progress: 42 },
  { name: "IT Security", code: "IS", topic: "Lecture 08 · Network Security", notes: "Prüfungsvorbereitung", progress: 68 },
];
const events = [
  { day: "14", kind: "LERNSESSION", title: "Lecture Review", detail: "Neue Konzepte · 14:00 Uhr" },
  { day: "24", kind: "PRÜFUNG", title: "IT Security", detail: "Network Security · 09:00 Uhr" },
];
const notes = [
  { title: "2 Folien zum Noch-mal-Verstehen", detail: "IT Security · Lecture 08 · Noch einmal erklären" },
  { title: "1 erkannte Deadline prüfen", detail: "Neue Konzepte · Vorschlag, noch nicht bestätigt" },
];

export default function Home() {
  return (
    <div className={s.home} data-full-bleed>
      <div className={s.preview}>
        PRODUKTVORSCHAU <span>Kurse, Termine und Lernstände sind illustrative Beispieldaten.</span>
      </div>

      <div className={s.container}>
        <header className={s.pageHeader}>
          <p className={s.micro}>01 / ÜBERSICHT</p>
          <h1>Guten Tag.</h1>
          <p className={s.subhead}>
            Du bist zuletzt bei <strong>Vibe Coding Setup</strong> · Lecture 03 geblieben, Folie 8 von 18.
          </p>
        </header>

        <div className={s.grid}>
          <section className={`${s.card} ${s.resumeCard}`} aria-labelledby="resume-heading">
            <div className={s.cardHead}>
              <span className={s.micro}>Weiter lernen</span>
              <span className={s.tag}>Lecture 03</span>
            </div>
            <h2 id="resume-heading">Vibe Coding Setup</h2>
            <p className={s.cardMeta}>Zuletzt bei Folie 8 von 18 · 3 offene Notizen</p>
            <div className={s.progressRow}>
              <progress max={100} value={44} aria-label="Beispielhafter Lernfortschritt: 44 Prozent" />
              <span>44%</span>
            </div>
            <Link className={s.cardAction} href="/documents">
              Weiterlesen <span aria-hidden="true">→</span>
            </Link>
          </section>

          <section className={s.card} aria-labelledby="events-heading">
            <div className={s.cardHead}>
              <span className={s.micro}>Nächste Termine</span>
              <Link className={s.cardLink} href="/calendar">Alle →</Link>
            </div>
            <h2 id="events-heading" className={s.srOnly}>Termine</h2>
            <ul className={s.list}>
              {events.map((event) => (
                <li key={event.day}>
                  <span className={s.eventDate}>{event.day}<small>OKT</small></span>
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.kind} · {event.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section className={s.card} aria-labelledby="courses-heading">
            <div className={s.cardHead}>
              <span className={s.micro}>Kurse</span>
              <Link className={s.cardLink} href="/courses">Alle →</Link>
            </div>
            <h2 id="courses-heading" className={s.srOnly}>Kurse</h2>
            <ul className={s.list}>
              {courses.map((course) => (
                <li key={course.code}>
                  <div>
                    <strong>{course.name}</strong>
                    <span>{course.topic} · {course.notes}</span>
                  </div>
                  <span className={s.percent}>{course.progress}%</span>
                </li>
              ))}
            </ul>
          </section>

          <section className={s.card} aria-labelledby="notes-heading">
            <div className={s.cardHead}>
              <span className={s.micro}>Offene Notizen</span>
              <span className={s.tag}>Beispiel</span>
            </div>
            <h2 id="notes-heading" className={s.srOnly}>Offene Notizen</h2>
            <ul className={s.list}>
              {notes.map((note) => (
                <li key={note.title}>
                  <div>
                    <strong>{note.title}</strong>
                    <span>{note.detail}</span>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <footer className={s.footer}>
          <span>Beispieldaten in dieser Vorschau.</span>
          <span>Ohne Datenanbindung</span>
        </footer>
      </div>
    </div>
  );
}
