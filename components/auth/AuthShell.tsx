import Link from "next/link";
import styles from "./auth.module.css";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.shell} lang="en">
      <section className={styles.formPanel} aria-label="Account access">
        <header className={styles.header}><Link href="/" className={styles.wordmark}>Lernapp<span aria-hidden="true">.</span></Link></header>
        {children}
        <footer className={styles.footer}><span>Made for the way you learn.</span><span>One semester at a time.</span></footer>
      </section>
      <aside className={styles.story} aria-labelledby="story-title">
        <div className={styles.storyTop}><span className={styles.storyLabel}><i /> YOUR LEARNING, IN CONTEXT</span><span className={styles.edition}>THE STUDY SPACE</span></div>
        <div className={styles.storyContent}>
          <div className={styles.visual}>
            <div className={styles.paperBehind} aria-hidden="true" />
            <figure className={styles.courseCard} aria-label="Illustrative course preview with example content">
              <figcaption className={styles.cardTop}><span>YOUR SEMESTER</span><span className={styles.previewBadge}>Product preview</span></figcaption>
              <div className={styles.courseHeading}><div className={styles.courseIcon} aria-hidden="true">NK</div><div><p>COURSE</p><h2 lang="de">Neue Konzepte</h2></div></div>
              <div className={styles.lecture}><div className={styles.documentIcon} aria-hidden="true">03</div><div><p>Lecture 03</p><h3>Vibe Coding Setup</h3><span>Lecture material · 18 slides</span></div><span className={styles.lectureArrow} aria-hidden="true">↗</span></div>
              <div className={styles.note}><span className={styles.noteDot} aria-hidden="true" /><span>3 unresolved notes</span><span>Linked to your slides</span></div>
              <div className={styles.materials}><div><span className={styles.miniLabel}>SUMMARY</span><strong>The bigger picture</strong><div className={styles.textLines} aria-hidden="true"><i /><i /><i /></div></div><div><span className={styles.miniLabel}>FLASHCARDS</span><strong>24 cards ready</strong><div className={styles.miniCards} aria-hidden="true"><i /><i /><i>Q & A</i></div></div></div>
              <div className={styles.exam}><span className={styles.calendarIcon} aria-hidden="true">12</span><div><strong>Exam in 12 days</strong><span>A little progress, every day.</span></div><span className={styles.examDot} aria-hidden="true" /></div>
            </figure>
            <div className={styles.annotation} aria-hidden="true"><span>↳</span> Everything stays connected.</div>
          </div>
          <div className={styles.storyCopy}><p className={styles.storyKicker}>LESS SCATTERED. MORE PREPARED.</p><h2 id="story-title">Your semester,<br /><em>connected.</em></h2><p>Lecture materials, notes, deadlines and exam preparation — all in one learning workflow.</p></div>
        </div>
        <div className={styles.storyFooter}><span>From your first lecture to your last exam.</span><span aria-hidden="true">01 — 06</span></div>
      </aside>
    </main>
  );
}
