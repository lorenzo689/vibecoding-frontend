import s from "@/components/home.module.css";

// Product-preview content, not authenticated user records.
const stats = [
  { label: "Kurse", value: 4, tone: "blue", icon: <><path d="M4 5.5C4 4.67 4.67 4 5.5 4H13v16H5.5A1.5 1.5 0 0 1 4 18.5v-13Z" /><path d="M20 5.5c0-.83-.67-1.5-1.5-1.5H13v16h5.5a1.5 1.5 0 0 0 1.5-1.5v-13Z" /></> },
  { label: "Karteikarten", value: 50, tone: "pink", icon: <><rect x="4" y="5" width="13" height="15" rx="2.4" /><path d="M9 10h4M9 14h4" /></> },
  { label: "Zusammenfassungen", value: 6, tone: "green", icon: <><path d="M7 3.5h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1Z" /><path d="M13.6 3.6V8h4.3M9 12.5h6M9 16h6" /></> },
];

const activity = [
  { title: "Zusammenfassung erstellt", detail: "Vibe Coding Setup · Lecture 03", stamp: "23.09.2026, 09:12", tone: "blue" },
  { title: "Karteikarten geübt", detail: "IT Security · 12 Karten wiederholt", stamp: "22.09.2026, 21:04", tone: "green" },
  { title: "Dokument hochgeladen", detail: "Neue Konzepte · Lecture 04 Folien", stamp: "22.09.2026, 18:47", tone: "blue" },
  { title: "Karteikarten geübt", detail: "Neue Konzepte · 8 Karten wiederholt", stamp: "22.09.2026, 15:20", tone: "green" },
  { title: "Termin bestätigt", detail: "IT Security · Prüfung am 24. Okt", stamp: "21.09.2026, 11:30", tone: "blue" },
];

export default function Home() {
  return (
    <div className={s.home}>
      <div className={s.preview}>
        PRODUKTVORSCHAU <span>Kurse, Aktivitäten und Lernstände sind illustrative Beispieldaten.</span>
      </div>

      <header className={s.pageHeader}>
        <h1>Dashboard</h1>
        <p className={s.subhead}>Behalte deinen Lernfortschritt und deine Aktivität im Blick.</p>
      </header>

      <div className={s.statGrid}>
        {stats.map((stat) => (
          <section key={stat.label} className={s.statCard}>
            <div className={s.statHead}>
              <span className={s.statLabel}>{stat.label.toUpperCase()}</span>
              <span className={s.statIcon} data-tone={stat.tone} aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{stat.icon}</svg>
              </span>
            </div>
            <strong className={s.statValue}>{stat.value}</strong>
          </section>
        ))}
      </div>

      <section className={s.activityCard} aria-labelledby="activity-heading">
        <div className={s.activityHead}>
          <span className={s.activityIcon} aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
          </span>
          <h2 id="activity-heading">Letzte Aktivität</h2>
        </div>
        <ul className={s.activityList}>
          {activity.map((entry) => (
            <li key={`${entry.title}-${entry.stamp}`}>
              <span className={s.activityDot} data-tone={entry.tone} aria-hidden="true" />
              <div>
                <strong>{entry.title}:</strong> {entry.detail}
                <span className={s.activityStamp}>{entry.stamp}</span>
              </div>
              <span className={s.activityView}>Ansehen</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
