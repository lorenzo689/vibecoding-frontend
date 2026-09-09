import Link from "next/link";
import s from "@/components/dashboard.module.css";
// Static illustrative content only. These are not user records.
const courses = [
  {
    name: "Neue Konzepte",
    code: "NK",
    topic: "Lecture 03 · Vibe Coding Setup",
    progress: 42,
    notes: "3 offene Notizen",
  },
  {
    name: "IT Security",
    code: "IS",
    topic: "Lecture 08 · Network Security",
    progress: 68,
    notes: "Prüfungsvorbereitung",
  },
  {
    name: "Advanced Practical IT Security",
    code: "AP",
    topic: "Lab 04 · Threat Modeling",
    progress: 28,
    notes: "2 offene Lernpunkte",
  },
];
const events = [
  {
    day: "14",
    kind: "LERNSESSION",
    title: "Lecture Review",
    detail: "Neue Konzepte · 14:00 Uhr",
  },
  {
    day: "18",
    kind: "PRÄSENTATION",
    title: "Neue Konzepte",
    detail: "Vibe Coding · 10:00 Uhr",
  },
  {
    day: "24",
    kind: "PRÜFUNG",
    title: "IT Security",
    detail: "Network Security · 09:00 Uhr",
  },
];
export default function Home() {
  return (
    <div className={s.dashboard}>
      <section className={s.intro}>
        <div>
          <p className={s.eyebrow}>DEIN STUDIENRAUM</p>
          <h1>Dein Semester im Überblick.</h1>
          <p>Mehr Klarheit. Weniger verstreute Gedanken.</p>
        </div>
        <div className={s.semester}>
          <small>BEISPIELSEMESTER</small>
          <strong>Wintersemester</strong>
          <span>Ein Schritt nach dem anderen.</span>
        </div>
      </section>
      <p className={s.notice}>
        Statische Produktvorschau · Kurse, Termine und Lernstände sind
        illustrative Beispieldaten.
      </p>
      <section aria-labelledby="courses-heading">
        <div className={s.sectionHeader}>
          <h2 id="courses-heading">
            Deine Kurse <small>03</small>
          </h2>
          <Link href="/courses">Zur Kursübersicht ↗</Link>
        </div>
        <div className={s.courseGrid}>
          {courses.map((c, i) => (
            <article className={s.course} key={c.code}>
              <div className={s.courseTop}>
                <span className={s.badge} data-tone={i}>
                  {c.code}
                </span>
                <small>KURS</small>
              </div>
              <h3>{c.name}</h3>
              <p>{c.topic}</p>
              <div className={s.progressLabel}>
                <span>Lernfortschritt · Beispiel</span>
                <span>{c.progress}%</span>
              </div>
              <div
                className={s.progress}
                role="img"
                aria-label={`Beispielhafter Lernfortschritt: ${c.progress} Prozent`}
              >
                <i style={{ width: `${c.progress}%` }} />
              </div>
              <footer>· {c.notes}</footer>
            </article>
          ))}
        </div>
      </section>
      <div className={s.contentGrid}>
        <div>
          <section aria-labelledby="continue-heading">
            <div className={s.sectionHeader}>
              <h2 id="continue-heading">Hier geht’s weiter</h2>
              <small>DEIN LERNKONTEXT</small>
            </div>
            <article className={s.study}>
              <div className={s.studyHeader}>
                <span>NEUE KONZEPTE</span>
                <span>LECTURE 03</span>
              </div>
              <div className={s.studyBody}>
                <div className={s.document} aria-hidden="true">
                  <span>03</span>
                  <i />
                  <i />
                  <i />
                  <b>
                    Vibe Coding
                    <br />
                    Setup
                  </b>
                </div>
                <div>
                  <small>VOM VERSTEHEN ZUM BEHALTEN</small>
                  <h3>Vibe Coding Setup</h3>
                  <p>
                    Deine Unterlagen, Gedanken und Lernmaterialien.
                    <br />
                    Genau dort, wo sie zusammengehören.
                  </p>
                  <Link href="/documents">Zu den Unterlagen →</Link>
                </div>
              </div>
              <div className={s.artifacts}>
                <div>
                  <small>NOTIZEN</small>
                  <strong>3 offene Gedanken</strong>
                </div>
                <div>
                  <small>ZUSAMMENFASSUNG</small>
                  <strong>Das Wesentliche im Blick</strong>
                </div>
                <div>
                  <small>KARTEIKARTEN</small>
                  <strong>24 Karten bereit</strong>
                </div>
              </div>
            </article>
          </section>
          <section className={s.attention} aria-labelledby="attention-heading">
            <div className={s.sectionHeader}>
              <h2 id="attention-heading">Noch ein Gedanke offen.</h2>
              <small>03</small>
            </div>
            <p>Kleine offene Punkte. Ein guter nächster Schritt.</p>
            <ul>
              {[
                {
                  mark: "?",
                  title: "2 Folien zum Noch-mal-Verstehen",
                  detail: "IT Security · Lecture 08 · „Noch einmal erklären“",
                  tag: "Verstehen",
                },
                {
                  mark: "!",
                  title: "1 erkannte Deadline prüfen",
                  detail: "Neue Konzepte · Vorschlag, noch nicht bestätigt",
                  tag: "Prüfen",
                },
                {
                  mark: "…",
                  title: "3 Vorlesungsnotizen aufgreifen",
                  detail: "Neue Konzepte · Lecture 03 · Folien 4, 8 und 12",
                  tag: "Vertiefen",
                },
              ].map((item) => (
                <li key={item.title}>
                  <span className={s.attentionMark} aria-hidden="true">
                    {item.mark}
                  </span>
                  <div>
                    <strong>{item.title}</strong>
                    <small>{item.detail}</small>
                  </div>
                  <span className={s.tag}>{item.tag}</span>
                </li>
              ))}
            </ul>
          </section>
        </div>
        <aside className={s.upcoming} aria-labelledby="upcoming-heading">
          <div className={s.sectionHeader}>
            <h2 id="upcoming-heading">Als Nächstes</h2>
            <small>OKTOBER · BEISPIEL</small>
          </div>
          <ol>
            {events.map((e) => (
              <li key={e.day}>
                <div className={s.date}>
                  <strong>{e.day}</strong>
                  <small>OKT</small>
                </div>
                <div>
                  <small>{e.kind}</small>
                  <h3>{e.title}</h3>
                  <p>{e.detail}</p>
                </div>
              </li>
            ))}
          </ol>
          <Link className={s.calendarLink} href="/calendar">
            Zum Kalender <span aria-hidden="true">→</span>
          </Link>
          <div className={s.preparation}>
            <p className={s.eyebrow}>GUT VORBEREITET</p>
            <h3>Aus vielen kleinen Schritten wird ein gutes Gefühl.</h3>
            <p>
              Vorlesung für Vorlesung. Notiz für Notiz. Dein Wissen wächst
              zusammen.
            </p>
            <div className={s.steps} aria-hidden="true">
              {[18, 30, 46, 62, 80, 100].map((n) => (
                <i key={n} style={{ height: `${n}%` }} />
              ))}
            </div>
            <small>Von der ersten Folie bis zur Prüfung.</small>
          </div>
        </aside>
      </div>
      <footer className={s.dashboardFooter}>
        <span>Lernapp · Dein Semester, verbunden.</span>
        <span>Präsentationsansicht ohne Datenanbindung</span>
      </footer>
    </div>
  );
}
