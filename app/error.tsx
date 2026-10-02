"use client";

import Link from "next/link";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <main style={{ maxWidth: 640, margin: "10vh auto", padding: 24 }} role="alert">
    <h1>Diese Seite konnte nicht geladen werden.</h1>
    <p>Bitte versuche es erneut. Wenn der Fehler bleibt, öffne die Startseite.</p>
    <button type="button" onClick={reset}>Erneut versuchen</button>{" "}
    <Link href="/dashboard">Zur Startseite</Link>
  </main>;
}
