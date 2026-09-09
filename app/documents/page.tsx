import type { Metadata } from "next";
import DocumentList from "@/components/documents/DocumentList";
import shared from "@/components/dashboard.module.css";
import s from "@/components/documents/documents.module.css";

export const metadata: Metadata = {
  title: "Unterlagen | Lernapp",
  description: "Vorlesungsmaterial, persönliche Notizen und Lernfortschritt im Kurskontext.",
};

export default function DocumentsPage() {
  return (
    <div className={`${shared.dashboard} ${s.page}`}>
      <section className={shared.intro}>
        <div>
          <p className={shared.eyebrow}>DEIN MATERIAL, IM KONTEXT</p>
          <h1>Deine Unterlagen.</h1>
          <p>Von der ersten Folie zum nächsten Aha-Moment. Dein Wissen bleibt verbunden.</p>
        </div>
        <div className={shared.semester}>
          <small>BEISPIELSEMESTER</small>
          <strong>Wintersemester 2026/27</strong>
          <span>Ein Ort für deine Vorlesungen.</span>
        </div>
      </section>
      <p className={shared.notice}>
        Produktvorschau · Dokumente, Quellen und Lernstände sind illustrative Beispieldaten.
        Es werden keine Dateien hochgeladen oder verarbeitet.
      </p>

      <div className={s.layout}>
        <div className={s.materials}>
          <section aria-labelledby="continue-heading">
            <div className={shared.sectionHeader}>
              <h2 id="continue-heading">Hier warst du zuletzt</h2>
              <small>DEIN LERNKONTEXT</small>
            </div>
            <article className={s.featured}>
              <div className={s.featuredTop}>
                <span>NEUE KONZEPTE · LECTURE 03</span>
                <span className={s.featuredBadge}>Bereit · Beispiel</span>
              </div>
              <div className={s.featuredBody}>
                <div className={s.paper} aria-hidden="true">
                  <span>LECTURE 03</span>
                  <i /><i /><i />
                  <strong>Vibe Coding<br />Setup</strong>
                  <small>PDF · 18 FOLIEN</small>
                </div>
                <div className={s.featuredCopy}>
                  <p className={s.kicker}>DEINE GEDANKEN BLEIBEN DABEI</p>
                  <h3>Vibe Coding Setup.pdf</h3>
                  <p>Zuletzt bei Folie 8 von 18 · <time dateTime="2026-10-12">12. Oktober 2026</time></p>
                  <div className={s.readingPosition}>
                    <span aria-hidden="true" />
                  </div>
                  <button type="button" className={s.continueButton} disabled aria-describedby="reader-note">
                    Bei Folie 8 weiterlesen <span aria-hidden="true">→</span>
                  </button>
                  <p id="reader-note" className={s.readerNote}>Folienansicht in dieser Vorschau noch nicht verfügbar.</p>
                </div>
              </div>
              <dl className={s.artifacts}>
                <div><dt>NOTIZEN</dt><dd>3 offene Gedanken</dd></div>
                <div><dt>ZUSAMMENFASSUNG</dt><dd>Verfügbar · KI-Beispiel</dd></div>
                <div><dt>KARTEIKARTEN</dt><dd>24 Karten · KI-Beispiel</dd></div>
              </dl>
              <p className={s.detectedDate}>
                <span aria-hidden="true">↳</span> 1 erkannter Termin · Folie 12 · Noch nicht bestätigt
              </p>
            </article>
          </section>

          <DocumentList />
        </div>

        <aside className={s.uploadColumn} aria-labelledby="upload-heading">
          <div className={shared.sectionHeader}><h2 id="upload-heading">Dokument hinzufügen</h2></div>
          <p className={s.asideIntro}>Gib deinem Material einen Platz im Semester.</p>
          <div className={s.uploadPanel}>
            <span className={s.previewBadge}>UPLOAD-VORSCHAU</span>
            <div className={s.uploadFields}>
              <label htmlFor="upload-course">Kurs</label>
              <select id="upload-course" disabled defaultValue="nk" aria-describedby="upload-note">
                <option value="nk">Neue Konzepte</option>
              </select>
              <label htmlFor="upload-lecture">Vorlesung</label>
              <select id="upload-lecture" disabled defaultValue="03" aria-describedby="upload-note">
                <option value="03">Lecture 03 · Vibe Coding Setup</option>
              </select>
            </div>
            <div className={s.dropzone}>
              <span className={s.uploadIcon} aria-hidden="true">↑</span>
              <h3>Ein neuer Ausgangspunkt.</h3>
              <p>Hier findet dein Vorlesungsmaterial künftig seinen Platz.</p>
              <button type="button" disabled aria-describedby="upload-note">Datei auswählen</button>
              <small>PDF vorgesehen · Größenlimit noch offen</small>
            </div>
            <p id="upload-note" className={s.uploadNote}>Dateiauswahl, Drag-and-drop und Analyse sind noch nicht verfügbar.</p>
          </div>
          <section className={s.workflow} aria-labelledby="workflow-heading">
            <p className={shared.eyebrow}>AUS MATERIAL WIRD WISSEN</p>
            <h3 id="workflow-heading">Ein Dokument. Viel Zusammenhang.</h3>
            <ol>
              <li><span aria-hidden="true">01</span><div><strong>Im Kurs einordnen</strong><p>Vorlesung und Unterlagen bleiben zusammen.</p></div></li>
              <li><span aria-hidden="true">02</span><div><strong>Folie für Folie verstehen</strong><p>Notizen dort festhalten, wo sie entstehen.</p></div></li>
              <li><span aria-hidden="true">03</span><div><strong>Mit Kontext lernen</strong><p>Zusammenfassungen und Karten aus deinem Material.</p></div></li>
            </ol>
            <small>So ist der Lernworkflow vorgesehen.</small>
          </section>
        </aside>
      </div>
      <footer className={shared.dashboardFooter}>
        <span>Lernapp · Dein Semester, verbunden.</span>
        <span>Unterlagenvorschau mit Beispieldaten</span>
      </footer>
    </div>
  );
}
