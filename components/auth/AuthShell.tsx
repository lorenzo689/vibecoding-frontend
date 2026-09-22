import Link from "next/link";
import styles from "./auth.module.css";

const steps = [
  { n: "01", label: "Kurs anlegen" },
  { n: "02", label: "Material hochladen" },
  { n: "03", label: "Folie für Folie verstehen" },
  { n: "04", label: "Termine bestätigen" },
  { n: "05", label: "Mit Kontext lernen" },
];

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className={styles.shell} lang="de">
      <section className={styles.formPanel} aria-label="Kontozugang">
        <header className={styles.header}><Link href="/" className={styles.wordmark}>Lernapp<span aria-hidden="true">.</span></Link></header>
        {children}
        <footer className={styles.footer}><span>Lernapp</span><span>Für Studierende gebaut.</span></footer>
      </section>
      <aside className={styles.story} aria-labelledby="story-title">
        <div className={styles.storyTop}>
          <span className={styles.storyLabel}><i /> DEIN LERNEN, IM KONTEXT</span>
          <span className={styles.edition}>V1</span>
        </div>
        <div className={styles.storyContent}>
          <p className={styles.storyKicker}>SO FUNKTIONIERT&apos;S</p>
          <h2 id="story-title">Vom Upload<br />zur <em>Prüfung.</em></h2>
          <p className={styles.storyLede}>Jede hochgeladene Folie hängt automatisch am richtigen Kurs, mit Notizen, erkannten Terminen und generiertem Lernmaterial.</p>
          <ol className={styles.steps}>
            {steps.map((step) => (
              <li key={step.n}><span aria-hidden="true">{step.n}</span><strong>{step.label}</strong></li>
            ))}
          </ol>
        </div>
        <div className={styles.storyFooter}><span>Für Studierende in prüfungsintensiven Studiengängen.</span><span aria-hidden="true">01 — 06</span></div>
      </aside>
    </main>
  );
}
