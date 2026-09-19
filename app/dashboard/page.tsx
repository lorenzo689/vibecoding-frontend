import Link from "next/link";
import s from "@/components/home.module.css";

// Product-preview content, not authenticated user records.
const courses = [
  { name: "Neue Konzepte", code: "NK", topic: "Lecture 03 · Vibe Coding Setup", progress: 42, notes: "3 offene Notizen" },
  { name: "IT Security", code: "IS", topic: "Lecture 08 · Network Security", progress: 68, notes: "Prüfungsvorbereitung" },
];
const events = [
  { day: "14", kind: "LERNSESSION", title: "Lecture Review", detail: "Neue Konzepte · 14:00 Uhr" },
  { day: "24", kind: "PRÜFUNG", title: "IT Security", detail: "Network Security · 09:00 Uhr" },
];
export default function Home() {
  return <div className={s.home} data-full-bleed>
    <div className={s.preview}>PRODUKTVORSCHAU <span>Kurse, Termine und Lernstände sind illustrative Beispieldaten.</span></div>
    <div className={s.opening}>
      <section className={s.focus} aria-labelledby="home-heading">
        <p className={s.micro}>01 / ÜBERSICHT</p>
        <h1 id="home-heading">Vibe Coding<br />Setup</h1>
        <div className={s.resume}><span className={s.resumeIndex}>03</span><div><p>NEUE KONZEPTE / LECTURE 03</p><h2>Zuletzt bei Folie 8 von 18</h2><span>3 offene Notizen · Zusammenfassung verfügbar</span></div></div>
        <Link className={s.focusAction} href="/documents">Weiterlesen <span aria-hidden="true">→</span></Link>
        <dl className={s.contextNotes}><div><dt>NOTIZEN</dt><dd>3 offen</dd></div><div><dt>KARTEIKARTEN</dt><dd>24 bereit</dd></div><div><dt>ZUSAMMENFASSUNG</dt><dd>Aktuell</dd></div></dl>
      </section>
      <section className={s.next} aria-labelledby="upcoming-heading">
        <div className={s.sectionLabel}><span>NÄCHSTE TERMINE</span><span>OKTOBER / BEISPIEL</span></div>
        <h2 id="upcoming-heading">Termine.</h2>
        <ol>{events.map(event=><li key={event.day}><div className={s.day}>{event.day}<span>OKT</span></div><div><p>{event.kind}</p><h3>{event.title}</h3><span>{event.detail}</span></div></li>)}</ol>
        <Link className={s.textLink} href="/calendar">Kalender öffnen →</Link>
      </section>
    </div>
    <div className={s.workbench}>
      <section className={s.courseIndex} aria-labelledby="courses-heading">
        <header><h2 id="courses-heading">Kurse.</h2><Link href="/courses">Alle Kurse →</Link></header>
        <ol>{courses.map((course,index)=><li key={course.code}><span className={s.index}>{String(index+1).padStart(2,"0")}</span><div><h3>{course.name}</h3><p>{course.topic}</p><small>{course.notes}</small></div><div className={s.progress}><strong>{course.progress}<small>%</small></strong><progress max={100} value={course.progress} aria-label={`Beispielhafter Lernfortschritt: ${course.progress} Prozent`} /><span>BEISPIEL</span></div></li>)}</ol>
      </section>
      <section className={s.openThreads} aria-labelledby="threads-heading">
        <p className={s.micro}>NOCH OFFEN / BEISPIEL</p><h2 id="threads-heading">Offene Notizen.</h2>
        <ol><li><span>01</span><div><h3>2 Folien zum Noch-mal-Verstehen</h3><p>IT Security · Lecture 08 · Noch einmal erklären</p></div></li><li><span>02</span><div><h3>1 erkannte Deadline prüfen</h3><p>Neue Konzepte · Vorschlag, noch nicht bestätigt</p></div></li></ol>
      </section>
    </div>
    <footer className={s.footer}><span>Beispieldaten in dieser Vorschau.</span><span>Ohne Datenanbindung</span></footer>
  </div>;
}
