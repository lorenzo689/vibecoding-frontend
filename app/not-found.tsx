import Link from "next/link";

export default function NotFoundPage() {
  return <main style={{ maxWidth: 640, margin: "10vh auto", padding: 24 }}>
    <h1>Seite nicht gefunden</h1>
    <p>Der Link ist ungültig oder der Inhalt wurde entfernt.</p>
    <Link href="/dashboard">Zur Startseite</Link>
  </main>;
}
