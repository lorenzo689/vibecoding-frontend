import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.shell} lang="de">
      <section className={styles.formPanel} aria-label="Kontozugang">
        <header className={styles.header}><Link href="/" className={styles.wordmark}>Lernapp<span aria-hidden="true">.</span></Link></header>
        {children}
        <footer className={styles.footer}><span>Gemacht für deinen Lernweg.</span><span>Semester für Semester.</span></footer>
      </section>
      <aside className={styles.story} aria-labelledby="story-title">
        <div className={styles.storyTop}><span className={styles.storyLabel}><i /> DEIN LERNEN, IM KONTEXT</span><span className={styles.edition}>DEIN STUDIENRAUM</span></div>
        <div className={styles.storyContent}>
          <div className={styles.visual}>
            <div className={styles.paperBehind} aria-hidden="true" />
            <figure className={styles.courseCard} aria-label="Illustrative course preview with example content">
              <figcaption className={styles.cardTop}><span>DEIN SEMESTER</span><span className={styles.previewBadge}>Produktvorschau</span></figcaption>
              <div className={styles.courseHeading}><div className={styles.courseIcon} aria-hidden="true">NK</div><div><p>COURSE</p><h2 lang="de">Neue Konzepte</h2></div></div>
              <div className={styles.lecture}><div className={styles.documentIcon} aria-hidden="true">03</div><div><p>Vorlesung 03</p><h3>Vibe Coding Setup</h3><span>Vorlesungsmaterial · 18 Folien</span></div><span className={styles.lectureArrow} aria-hidden="true">↗</span></div>
              <div className={styles.note}><span className={styles.noteDot} aria-hidden="true" /><span>3 offene Notizen</span><span>Mit deinen Folien verbunden</span></div>
              <div className={styles.materials}><div><span className={styles.miniLabel}>ZUSAMMENFASSUNG</span><strong>Das große Ganze</strong><div className={styles.textLines} aria-hidden="true"><i /><i /><i /></div></div><div><span className={styles.miniLabel}>KARTEIKARTEN</span><strong>24 Karten bereit</strong><div className={styles.miniCards} aria-hidden="true"><i /><i /><i>F & A</i></div></div></div>
              <div className={styles.exam}><span className={styles.calendarIcon} aria-hidden="true">12</span><div><strong>Prüfung in 12 Tagen</strong><span>Jeden Tag ein kleiner Fortschritt.</span></div><span className={styles.examDot} aria-hidden="true" /></div>
            </figure>
            <div className={styles.annotation} aria-hidden="true"><span>↳</span> Alles bleibt verbunden.</div>
          </div>
          <div className={styles.storyCopy}><p className={styles.storyKicker}>WENIGER VERSTREUT. BESSER VORBEREITET.</p><h2 id="story-title">Dein Semester,<br /><em>verbunden.</em></h2><p>Vorlesungsmaterial, Notizen, Termine und Prüfungsvorbereitung – in einem Lernworkflow.</p></div>
        </div>
        <div className={styles.storyFooter}><span>Von der ersten Vorlesung bis zur letzten Prüfung.</span><span aria-hidden="true">01 — 06</span></div>
      </aside>
    </main>
  );
}
