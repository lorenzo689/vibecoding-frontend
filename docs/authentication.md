# Frontend-Authentifizierung

Die Anwendung verwendet Supabase Auth über `@supabase/ssr`. Browser- und
Server-Client teilen Cookie-Sessions; `proxy.ts` erneuert und validiert sie.

## Umgebung

`.env.example` nach `.env.local` kopieren:

```dotenv
NEXT_PUBLIC_SUPABASE_URL=<project-url>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
AUTH_SITE_URL=http://127.0.0.1:3000
```

`AUTH_SITE_URL` muss eine Basisadresse ohne Pfad sein und in Staging und
Produktion der echten HTTPS-Frontend-Domain entsprechen. Sie wird serverseitig
für Recovery-Redirects und Same-Origin-Prüfungen verwendet.

Niemals Service-Role-Key, Secret-Key, Datenbankpasswort oder Management-Token in
das Frontend eintragen. `.env.local` ist gitignored; `.env.example` enthält nur
Platzhalter.

## Registrierung und Profil

Die Registrierung sendet:

```ts
options: { data: { display_name: validatedName } }
```

Der Backend-Trigger legt das Profil an und speichert den Wert in
`profiles.name`. `display_name` ist nur der Name des Auth-Metadatenfeldes und
keine aktuelle Datenbankspalte.

Der Browser legt niemals selbst Profile an. Profilabfragen werden über
`user_id = authUser.id` auf das eigene Profil beschränkt; RLS bildet die echte
Autorisierungsgrenze. Bearbeitbar ist ausschließlich `name` mit 1–60
Unicode-Zeichen.

## Bestätigungslinks

Die Backend-Mailvorlagen verweisen auf:

```text
/auth/confirm?token_hash=...&type=email
/auth/confirm?token_hash=...&type=recovery
```

Der Proxy übernimmt nur die erlaubten Typen `email` und `recovery` in ein
kurzlebiges HttpOnly-Cookie und entfernt den Token aus der sichtbaren URL. Der
GET-Aufruf verbraucht den Token nicht. Erst die ausdrückliche Bestätigung sendet
einen Same-Origin-POST an `/auth/confirm/verify`, der `verifyOtp()` aufruft.

Erfolgreiche E-Mail-Bestätigung führt nach `/dashboard`. Ein Recovery-Link führt
mit einer kurzlebigen serverseitigen Recovery-Markierung nach
`/auth/reset-password`.

`/auth/callback` bleibt ausschließlich für bestehende PKCE-Code-Links erhalten
und tauscht einen `code` einmalig über `exchangeCodeForSession()` aus.

## Passwort zurücksetzen

1. `/forgot-password` fordert über `resetPasswordForEmail()` eine Mail an.
2. Die Antwort verrät nicht, ob ein Konto zur Adresse existiert.
3. Der Recovery-Mail-Link wird ausdrücklich bestätigt.
4. `/auth/reset-password` verlangt eine validierte Auth-Session und die
   kurzlebige Recovery-Markierung.
5. Das neue Passwort wird unverändert mit `updateUser({ password })` gesendet.
6. Nach Erfolg werden Recovery-Markierung und lokale Session beendet; die
   Anmeldung erfolgt mit dem neuen Passwort.

## Routenschutz

Geschützt sind Dashboard, Assistent, Kurse samt Unterseiten, Kalender,
Unterlagen, Karteikarten, Zusammenfassungen, Noten und Profil. Unauthentifizierte
Aufrufe werden mit einer geprüften internen Rücksprungadresse nach `/login`
geleitet. Externe, protokollrelative und öffentliche Ziele werden verworfen.

## Manuelle Abnahme

1. Registrieren und eine neue Bestätigungsmail öffnen.
2. Link auch in einem zweiten Browser prüfen.
3. Bestätigungsschaltfläche verwenden und Weiterleitung prüfen.
4. Profil, Reload und geschützte Direktaufrufe prüfen.
5. Logout und erneuten Direktzugriff testen.
6. Passwort-Reset vollständig durchführen.
7. Abgelaufene und bereits verbrauchte Links prüfen.
8. Staging-/Produktions-Site-URL, Redirect-Allowlist und SMTP separat abnehmen.

Remote-Einstellungen werden durch dieses Frontend nicht automatisch geändert.
