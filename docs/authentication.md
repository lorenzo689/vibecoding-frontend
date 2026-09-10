# Frontend-Authentifizierung einrichten

Die Anwendung verwendet Supabase Auth über `@supabase/ssr`. Sessions liegen in
Cookies, werden in `proxy.ts` erneuert und auf geschützten Routen serverseitig
geprüft. Im Browser dürfen ausschließlich Projekt-URL und Publishable-/Anon-Key
verwendet werden.

## Lokale Umgebung

`.env.example` nach `.env.local` kopieren und eintragen:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<öffentlicher lokaler Key>
```

Bei einem älteren Projekt kann stattdessen `NEXT_PUBLIC_SUPABASE_ANON_KEY`
verwendet werden. Niemals Service-Role-Key, Secret-Key, Datenbankpasswort oder
Supabase Access Token in das Frontend eintragen.

## Supabase Auth URLs

Lokal:

- Site URL: `http://127.0.0.1:3000`
- Redirect Allowlist: `http://127.0.0.1:3000/auth/callback`
- optional zusätzlich: `http://localhost:3000/auth/callback`

Für Staging und Produktion jeweils die echte Domain konfigurieren:

- Site URL: `https://<tatsächliche-domain>`
- Redirect Allowlist: `https://<tatsächliche-domain>/auth/callback`

Keine fremden Domains oder unnötigen Wildcards freigeben. Der ausgewählte
Backend-`dev`-Contract verlangt E-Mail-Bestätigung und mindestens acht
Passwortzeichen. Remote-Einstellungen werden nicht durch dieses Frontend
übertragen; sie müssen im Backend mit dessen dokumentiertem Plan-/Push-Prozess
oder bewusst im Supabase Dashboard gesetzt werden.

## Manueller End-to-End-Check

1. Registrieren und die Mail in der lokalen Mail-Oberfläche öffnen.
2. Bestätigungslink im selben Browser öffnen, in dem die Registrierung gestartet wurde.
3. Weiterleitung zu `/dashboard`, Profilanzeige und Reload prüfen.
4. Abmelden und den direkten Zugriff auf `/dashboard` prüfen.
5. Login mit falschem und richtigem Passwort sowie unbestätigter Adresse prüfen.

Browser-Callback und Mailzustellung sind nicht Bestandteil der Unit-Tests.
