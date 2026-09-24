# Kalender übernehmen

`/calendar` kann Termine aus drei Quellen übernehmen. Jede Quelle endet in
derselben Vorschau: gefundene Termine werden aufgelistet, die Person wählt aus,
erst dann wird geschrieben. Ohne Bestätigung wird nichts gespeichert.

## Die drei Quellen

| Reiter | Weg | Server beteiligt |
| --- | --- | --- |
| Google Kalender | OAuth-Zustimmung, danach lesender Zugriff auf den Hauptkalender | ja |
| Kalenderdatei (.ics) | Datei aus Apple Kalender oder Outlook exportieren und auswählen | nein |
| Abo-Adresse | Veröffentlichte iCal-Adresse, die der Server abruft | ja |

## Warum der Computer-Kalender nicht direkt gelesen wird

Es gibt keine Browser-Schnittstelle für Apple Kalender, Outlook oder einen
anderen lokalen Kalender. Kein Web-Programm kann sie auslesen, unabhängig von
erteilten Berechtigungen. Die beiden tragfähigen Wege sind deshalb der Export
als `.ics` und die veröffentlichte Abo-Adresse. Der Dateiweg läuft vollständig
im Browser: die Datei wird lokal gelesen und nicht an den Server übertragen.

## Google einrichten

Ohne die folgenden Werte bleibt der Google-Reiter funktionslos; die beiden
anderen Quellen arbeiten weiter.

1. In der Google Cloud Console ein Projekt anlegen und die **Google Calendar
   API** aktivieren.
2. OAuth-Client vom Typ *Webanwendung* erstellen.
3. Als autorisierte Weiterleitungs-URI eintragen:
   `<AUTH_SITE_URL>/api/calendar/google/callback`
4. `GOOGLE_CLIENT_ID` und `GOOGLE_CLIENT_SECRET` in `.env.local` setzen.

Angefordert wird ausschließlich `calendar.readonly`.

**Die Kalenderfreigabe ist bewusst von der Anmeldung getrennt.** Wer sich mit
E-Mail und Passwort registriert hat, würde durch eine Google-Anmeldung sein
Anmeldeverfahren wechseln. Deshalb läuft der Kalenderzugriff über einen eigenen
Vorgang. Das Zugriffstoken liegt in einem httpOnly-Cookie, lebt höchstens eine
Stunde, wird nirgends gespeichert und es wird kein Refresh-Token angefordert.
Ein Widerruf im Google-Konto wirkt sofort.

## Abo-Adresse und ihre Risiken

Eine veröffentlichte iCal-Adresse ist ein Geheimnis: Wer sie kennt, sieht alle
Termine. Der Hinweis steht auch in der Oberfläche.

Die Route ruft eine vom Aufrufer bestimmte Adresse ab und ist damit von Natur
aus anfällig für serverseitige Anfragefälschung. Gegenmaßnahmen: nur `http` und
`https`, Ablehnung von `localhost` und privaten Adressbereichen anhand des
Hostnamens, **keine** Weiterleitungen, 15 Sekunden Zeitlimit, 5 MB Obergrenze.
Zusätzlich muss die aufrufende Person angemeldet sein.

> Die Hostprüfung arbeitet auf dem Namen, nicht auf der aufgelösten Adresse. Ein
> öffentlicher Name, der absichtlich auf `127.0.0.1` zeigt, kommt daran vorbei.
> Vollständig geschlossen wird das erst durch eine Auflösung der Adresse vor dem
> Verbindungsaufbau; solange das Frontend keinen eigenen Netzzugang zu internen
> Diensten hat, ist der Schaden begrenzt.

## Wiederholungen

Google liefert Serien bereits aufgelöst (`singleEvents=true`). Für `.ics` löst
der eigene Parser die Regeln auf, die in einem Stundenplan vorkommen: `FREQ`
täglich bis jährlich, `INTERVAL`, `COUNT`, `UNTIL`, `BYDAY` für wöchentliche
Serien und `EXDATE` für gestrichene Einzeltermine. Nicht unterstützt sind
`BYSETPOS`, `BYMONTHDAY`, `RDATE` und `RECURRENCE-ID`-Ausnahmen — solche
Termine werden vereinfacht übernommen und in der Vorschau als Hinweis gemeldet.
Der Zeitraum ist wählbar (3 bis 24 Monate), pro Regel gilt eine Obergrenze von
400 Instanzen.

## Doppelte Termine

`calendar_events` hat keine Spalte für eine fremde Kennung, und die Tabelle
liegt im Backend-Projekt. Bis dahin trägt jeder importierte Termin einen Marker
am Ende seiner Beschreibung:

```
[lernapp-import:google:3f2a1c9d8e7b6a50]
```

Ein erneuter Import erkennt daran, was bereits übernommen wurde. Zusätzlich
greift ein Vergleich über Titel und Startzeit, damit ein von Hand angelegter
Termin nicht verdoppelt wird.

**Das ist ein Behelf.** Sauber wäre eine Spalte `external_uid` mit einem
eindeutigen Index je Besitzer. Solange der Marker in der Beschreibung steht,
kann eine Person ihn löschen und damit den Schutz aufheben — der Schaden
beschränkt sich auf einen doppelten Eintrag im eigenen Kalender.

## Was noch fehlt

- Kein fortlaufender Abgleich: der Import ist eine Momentaufnahme. Ändert sich
  ein Termin in der Quelle, ändert sich der übernommene Termin nicht mit.
- Keine Auswahl unter mehreren Google-Kalendern; es wird der Hauptkalender
  gelesen.
- Keine Rücknahme eines Imports in einem Schritt.

## Prüfungen

```bash
npm test          # enthält lib/calendar/ics.test.mjs
npm run lint
npm run build
```
