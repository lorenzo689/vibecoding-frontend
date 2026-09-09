import Link from "next/link";
import s from "./landing.module.css";

const compare = [
  {
    tone: "neutral" as const,
    label: "EINZELNE TOOLS",
    items: [
      "Ein PDF-Chatbot für Dokumente",
      "Eine Karteikarten-App für Prüfungen",
      "Ein Kalender ohne Vorlesungskontext",
      "Zusammenfassungen ohne Bezug zur Quelle",
    ],
  },
  {
    tone: "positive" as const,
    label: "EIN VERBUNDENER WORKFLOW",
    items: [
      "Kurs, Vorlesung und Folie bleiben verknüpft",
      "Notizen und Termine kommen aus dem Material",
      "Zusammenfassungen und Karteikarten mit Quellenbezug",
      "Prüfungsvorbereitung auf dem gesammelten Kontext",
    ],
  },
];

const steps = [
  "Kurs anlegen",
  "Vorlesung hinzufügen",
  "Dokument hochladen",
  "Folien annotieren",
  "Termine bestätigen",
  "Zusammenfassung erhalten",
  "Karteikarten lernen",
  "Prüfung vorbereiten",
];

const features = [
  {
    code: "01",
    title: "Folien-Annotationen",
    text: "Persönliche Notizen und Markierungen bleiben an die jeweilige Folie gebunden – nicht lose irgendwo gesammelt.",
  },
  {
    code: "02",
    title: "Erkannte Termine",
    text: "Prüfungen und Abgaben werden aus dem Material vorgeschlagen. Du prüfst und bestätigst, bevor etwas im Kalender landet.",
  },
  {
    code: "03",
    title: "KI-Zusammenfassungen & Karteikarten",
    text: "Generiert aus deinem Vorlesungskontext, klar als KI-Ergebnis gekennzeichnet.",
  },
  {
    code: "04",
    title: "Notenübersicht",
    text: "Behalte erzielte Punkte und deinen aktuellen Notenstand im Blick, kursweise.",
  },
];

export default function LandingPage() {
  return (
    <div className={s.page}>
      <div className={s.inner}>
        <header className={s.header}>
          <span className={s.wordmark}>
            Lernapp<span aria-hidden="true">.</span>
          </span>
          <nav className={s.nav} aria-label="Hauptnavigation">
            <Link href="/login" className={s.navLink}>
              Anmelden
            </Link>
            <Link href="/register" className={s.primaryButton}>
              Registrieren
            </Link>
          </nav>
        </header>

        <section className={s.hero}>
          <div>
            <p className={s.eyebrow}>DEIN STUDIENRAUM</p>
            <h1>
              Vorlesung, Notizen und Prüfung
              <br />
              <em>endlich verbunden.</em>
            </h1>
            <p className={s.heroSubtitle}>
              Kurse, Vorlesungsmaterial, persönliche Notizen, Termine und
              Prüfungsvorbereitung in einem durchgehenden Workflow, statt
              verstreut über einzelne Tools.
            </p>
          </div>
          <div className={s.visual} aria-hidden="true">
            <div className={s.visualBehind} />
            <div className={s.visualCard}>
              <div className={s.visualHeader}>
                <span>KI-ASSISTENT</span>
                <span>AUTOMATISCHE ANALYSE</span>
              </div>
              <div className={s.visualBody}>
                <div className={s.document}>
                  <span>✨</span>
                  <i />
                  <i />
                  <i />
                </div>
                <div>
                  <h3>Deine Vorlesung, analysiert.</h3>
                  <p>
                    Themen, Definitionen und Termine werden direkt aus
                    deinem Material erkannt.
                  </p>
                </div>
              </div>
              <div className={s.visualArtifacts}>
                <div>
                  <small>ZUSAMMENFASSUNG</small>
                  <strong>In Sekunden erstellt</strong>
                </div>
                <div>
                  <small>KARTEIKARTEN</small>
                  <strong>Automatisch generiert</strong>
                </div>
                <div>
                  <small>TERMINE</small>
                  <strong>Erkannt, zu bestätigen</strong>
                </div>
              </div>
            </div>
            <p className={s.visualNote}>
              <i /> Beispielhafte Vorschau des KI-Assistenten
            </p>
          </div>
        </section>

        <section className={s.differentiation} aria-labelledby="diff-heading">
          <p className={s.sectionEyebrow}>WARUM LERNAPP</p>
          <h2 id="diff-heading">
            Kein weiterer PDF-Chatbot. Keine isolierte Karteikarten-App.
          </h2>
          <div className={s.compareGrid}>
            {compare.map((col) => (
              <div key={col.label} className={s.compareCard} data-tone={col.tone}>
                <small>{col.label}</small>
                <ul>
                  {col.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className={s.howItWorks} aria-labelledby="how-heading">
          <p className={s.sectionEyebrow}>DER WORKFLOW</p>
          <h2 id="how-heading">So funktioniert&apos;s</h2>
          <div className={s.stepRow}>
            {steps.map((step, i) => (
              <div className={s.step} key={step}>
                <span>{String(i + 1).padStart(2, "0")}</span>
                <strong>{step}</strong>
              </div>
            ))}
          </div>
        </section>

        <section className={s.features} aria-labelledby="features-heading">
          <p className={s.sectionEyebrow}>FUNKTIONEN</p>
          <h2 id="features-heading">Was das im Alltag bedeutet</h2>
          <div className={s.featureGrid}>
            {features.map((f) => (
              <article className={s.featureCard} key={f.code}>
                <span className={s.featureBadge}>{f.code}</span>
                <h3>{f.title}</h3>
                <p>{f.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className={s.audience}>
          <p>
            Entwickelt vor allem für Studierende in inhaltlich dichten,
            prüfungsintensiven Studiengängen – eine erste Produkthypothese,
            noch kein belegtes Ergebnis.
          </p>
        </section>

        <section className={s.finalCta} aria-labelledby="cta-heading">
          <h2 id="cta-heading">Ein Ort für dein ganzes Semester.</h2>
          <p>
            Leg deinen ersten Kurs an und verbinde Vorlesung, Notizen und
            Prüfungsvorbereitung von Anfang an.
          </p>
        </section>

        <footer className={s.footer}>
          <span>Lernapp · Dein Semester, verbunden.</span>
          <span>Frontend-Vorschau ohne Datenanbindung</span>
        </footer>
      </div>
    </div>
  );
}
