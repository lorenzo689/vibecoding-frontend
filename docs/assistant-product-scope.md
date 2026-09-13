# KI-Assistent: verbindlicher Produktumfang

Status: freigegebene Scope-Baseline  
Last reviewed: 2026-09-13

Dieses Dokument definiert, was für die erste produktive Version des
KI-Assistenten als fertig gilt. Es ist eine Produktspezifikation und noch kein
technischer Backend-Vertrag. Konkrete Tabellen, Endpunkte, Payloads und
Provider werden erst in den nachfolgenden Implementierungsschritten gegen das
tatsächliche Backend festgelegt.

Repository-Inhalte und freigegebene Backend-Verträge bleiben für den
technischen Ist-Zustand maßgeblich. Eine Änderung dieses Umfangs muss in einem
expliziten Feature-Auftrag erfolgen.

## Produktziel

Der KI-Assistent hilft einem angemeldeten Studierenden, Fragen zu den eigenen
Kursunterlagen zu beantworten. Antworten bleiben mit ihrem Kurs- und
Quellenkontext verbunden. Der Assistent ist kein allgemeiner, kontextloser
Chatbot und darf fehlendes Wissen oder nicht ausgeführte Aktionen nicht
vortäuschen.

"Produktiv" bedeutet in diesem Dokument, dass alle unten beschriebenen
Nutzerabläufe, Sicherheitsgrenzen, Zustände und Acceptance Criteria erfüllt
sind. Es bedeutet nicht, dass Modellantworten inhaltlich unfehlbar sind.

## Akteure und Voraussetzungen

Der einzige Akteur der ersten Version ist ein angemeldeter Studierender.

Voraussetzungen für die Nutzung:

- eine gültige, bestätigte Sitzung
- mindestens ein eigener, zugreifbarer Kurs für kursbezogene Chats
- für unterlagenbasierte Antworten mindestens eine erfolgreich verarbeitete
  Kursunterlage
- eine erreichbare, serverseitige Assistant-Schnittstelle

Ohne Anmeldung ist der KI-Assistent nicht erreichbar. Fehlende Kurse oder noch
nicht verarbeitete Unterlagen werden als eigener Zustand erklärt und nicht
durch Beispieldaten ersetzt.

## Verbindlicher Funktionsumfang

### 1. Authentifizierter Zugriff

- Nur angemeldete Nutzer können `/assistant` und zugehörige Unterhaltungen
  aufrufen.
- Abgelaufene oder ungültige Sitzungen führen zur Anmeldung.
- Nach dem Logout ist der direkte Zugriff erneut gesperrt.
- Ein Nutzer kann weder Unterhaltungen noch Quellen eines anderen Nutzers
  lesen, verändern oder löschen.

### 2. Kurs als expliziter Kontext

- Vor oder beim Start eines Chats wählt der Nutzer genau einen eigenen Kurs.
- Die Auswahl enthält ausschließlich Kurse, auf die der Nutzer Zugriff hat.
- Der aktive Kurs bleibt während der Unterhaltung sichtbar.
- Antworten dürfen für kursbezogene Aussagen nur freigegebene Inhalte dieses
  Kurses verwenden.
- Ein Kurswechsel startet eine neue Unterhaltung oder verlangt eine
  ausdrückliche Bestätigung; bestehender Kontext wird nicht still vermischt.

### 3. Persistente Unterhaltungen

- Nutzer können eine neue Unterhaltung beginnen.
- Nutzer- und Assistentennachrichten werden dauerhaft gespeichert.
- Nach Navigation, Reload und erneuter Anmeldung wird der gespeicherte Verlauf
  korrekt geladen.
- Die Nachrichtenreihenfolge ist stabil und eindeutig.
- Ein Nutzer kann eine eigene Unterhaltung inklusive ihrer gespeicherten
  Quellenverweise löschen.
- Das Löschen anderer Produktdaten ist dadurch nicht erlaubt.

### 4. Nachricht senden und Antwort streamen

- Eine nicht leere, gültige Frage kann genau einmal abgesendet werden.
- Die Nutzernachricht erscheint unmittelbar mit einem sichtbaren Sendestatus.
- Die Assistentenantwort wird schrittweise dargestellt, sobald Text verfügbar
  ist.
- Doppelte Submits werden verhindert.
- Der Nutzer kann eine laufende Antwort abbrechen.
- Eine abgeschlossene Antwort bleibt nach Reload erhalten.
- Leere, zu lange oder ungültige Eingaben werden vor dem Versand verständlich
  abgewiesen.

### 5. Antworten auf Grundlage eigener Kursunterlagen

- Für jede kursbezogene Frage wird ausschließlich in Unterlagen des aktiven
  Kurses gesucht.
- Nur erfolgreich verarbeitete Inhalte dürfen als Kontext verwendet werden.
- Die Antwort trennt Modellwissen und belegte Kursaussagen nicht irreführend.
- Hochgeladene Inhalte gelten als nicht vertrauenswürdige Daten und können
  keine Systemregeln oder Berechtigungen überschreiben.
- Der Assistent darf keine Unterlage als gelesen darstellen, die nicht als
  Kontext bereitgestellt wurde.

### 6. Sichtbare und nachvollziehbare Quellen

- Belegte Aussagen zeigen mindestens einen realen Quellenverweis, sofern
  geeigneter Kurskontext verwendet wurde.
- Ein Quellenverweis nennt die Unterlage und, falls vorhanden, Seite oder
  Abschnitt.
- Der Nutzer kann eine Quelle öffnen oder eindeutig zum Ursprungsinhalt
  navigieren.
- Quellenverweise werden serverseitig gegen tatsächlich verwendete Inhalte
  validiert und nicht ungeprüft aus Modelltext übernommen.
- Quellen bleiben gemeinsam mit der Antwort persistent und nach Reload
  nachvollziehbar.

### 7. Ehrliches Verhalten bei fehlender Evidenz

- Liefert die Suche keinen ausreichend relevanten Kontext, sagt der Assistent
  klar, dass die Frage anhand der vorhandenen Kursunterlagen nicht verlässlich
  beantwortet werden kann.
- Er erfindet in diesem Zustand weder Antwort, Dokumenttitel, Seite noch Zitat.
- Die Oberfläche bietet sinnvolle nächste Schritte an, beispielsweise eine
  andere Frage, einen anderen Kurs oder das Bereitstellen passender Unterlagen.

### 8. Wiederholen fehlgeschlagener Antworten

- Netzwerk-, Rate-Limit-, Verarbeitungs- und Providerfehler werden als
  verständliche, nicht technische Meldung angezeigt.
- Eine fehlgeschlagene Nutzernachricht kann erneut gesendet werden.
- Ein Retry erzeugt nicht unbemerkt doppelte Nutzernachrichten.
- Fehlgeschlagene Teilantworten werden als unvollständig markiert und nicht
  als erfolgreiche Antwort ausgegeben.
- Rohfehler, Secrets und interne Prompts werden niemals angezeigt.

### 9. Karteikarten nur nach Bestätigung

- Eine Bitte um Karteikarten erzeugt zunächst ausschließlich einen
  strukturierten Entwurf.
- Der Entwurf zeigt Frage, Antwort und verwendete Quellen vor dem Speichern.
- Erst eine ausdrückliche Nutzerbestätigung darf echte Karteikarten anlegen.
- Abbrechen verändert keine Karteikarten oder Materialien.
- Erfolg wird erst gemeldet, nachdem das Backend die Speicherung bestätigt
  hat.
- Teilfehler dürfen nicht zu einer als vollständig dargestellten Erstellung
  führen.

### 10. Mandantentrennung

- Nutzer-, Kurs- oder Conversation-IDs aus dem Browser sind niemals eine
  Autorisierungsentscheidung.
- Die serverseitige Autorisierung und RLS prüfen jeden Lese- und
  Schreibzugriff.
- Manipulierte IDs liefern keine fremden Nachrichten, Chunks, Quellen oder
  Karteikarten.
- Das Modell erhält ausschließlich Daten, die der aktuelle Nutzer im aktiven
  Kurs lesen darf.

## Verbindliche UI-Zustände

Die Oberfläche muss mindestens folgende Zustände eindeutig darstellen:

- Sitzung wird geprüft
- keine eigenen Kurse vorhanden
- Kurs ausgewählt, aber keine verarbeiteten Unterlagen vorhanden
- Unterlagen werden verarbeitet
- neue beziehungsweise leere Unterhaltung
- Verlauf wird geladen
- Nachricht wird gesendet
- Antwort wird gestreamt
- Antwort wurde abgebrochen
- Antwort ist abgeschlossen
- Antwort ist fehlgeschlagen und kann wiederholt werden
- keine ausreichende Evidenz gefunden
- Quellen werden geladen oder sind nicht mehr verfügbar
- Karteikartenentwurf wartet auf Bestätigung
- Karteikarten werden gespeichert
- Karteikartenerstellung erfolgreich oder fehlgeschlagen
- Unterhaltung wird gelöscht oder konnte nicht gelöscht werden

Keiner dieser Zustände darf durch dauerhaft eingeblendete Mockdaten simuliert
werden.

## UX- und Barrierefreiheitsanforderungen

- Der aktive Kurs ist jederzeit erkennbar.
- Generierte Inhalte und Nutzerinhalte sind visuell unterscheidbar.
- Streaming-Antworten und Fehler werden über geeignete Live-Regionen
  angekündigt, ohne Screenreader mit jedem Token zu überlasten.
- Senden ist per Tastatur möglich; ein Zeilenumbruch bleibt ebenfalls möglich.
- Fokus bleibt nach Senden, Retry, Abbruch und Dialogbestätigungen sinnvoll.
- Alle interaktiven Quellen und Aktionen besitzen sichtbare Fokuszustände und
  verständliche Namen.
- Unsicheres HTML aus Nutzer-, Dokument- oder Modellausgaben wird nicht direkt
  gerendert.
- Desktop- und Mobilansicht unterstützen denselben Kernablauf.

## Explizite Nicht-Ziele der ersten produktiven Version

- Websuche oder Antworten aus frei recherchierten Internetquellen
- Voice-Chat, Spracheingabe oder Sprachausgabe
- Bild- oder Videogenerierung
- autonomes Ändern oder Löschen von Kursdaten
- unbeaufsichtigte Agentenabläufe
- freie, vom Modell erfundene Tools oder Datenbankoperationen
- Zusammenarbeit mehrerer Nutzer in einer Unterhaltung
- öffentliche oder teilbare Chatlinks
- providerbezogenes Branding im Frontend
- eine Garantie, dass jede fachliche Modellantwort korrekt ist

Diese Punkte dürfen später nur durch einen neuen, ausdrücklichen Scope
aufgenommen werden.

## Kernabläufe

### Neue Unterhaltung

1. Nutzer öffnet den geschützten KI-Assistenten.
2. Eigene Kurse werden geladen.
3. Nutzer wählt einen Kurs.
4. Verfügbarkeit verarbeiteter Unterlagen wird angezeigt.
5. Nutzer startet eine leere Unterhaltung.
6. Die Unterhaltung bleibt diesem Kurs zugeordnet.

### Frage und Antwort

1. Nutzer sendet eine gültige Frage.
2. Die Frage erscheint genau einmal im Verlauf.
3. Der Server validiert Sitzung, Unterhaltung und Kurszugriff.
4. Passende Kursquellen werden ermittelt.
5. Die Antwort wird sichtbar gestreamt.
6. Antwort und verwendete Quellen werden gespeichert.
7. Die final gespeicherte Nachricht ersetzt den Streaming-Zustand.

### Keine ausreichende Quelle

1. Die Quellensuche unterschreitet die definierte Relevanzschwelle.
2. Es wird keine belegte Kursantwort erfunden.
3. Der Nutzer erhält eine klare Begründung und nächste Schritte.

### Karteikarten erstellen

1. Nutzer fordert Karteikarten im aktiven Kurs an.
2. Der Assistent liefert einen Entwurf mit Quellen.
3. Nutzer prüft und bestätigt oder verwirft den Entwurf.
4. Nur nach Bestätigung speichert das Backend die Karten.
5. Das Frontend verlinkt auf den tatsächlich gespeicherten Kartensatz.

## Acceptance Criteria

Der Scope ist erst implementiert, wenn alle folgenden Aussagen nachweisbar sind:

- Unangemeldeter Direktzugriff auf den Assistenten wird zur Anmeldung
  umgeleitet.
- Ein angemeldeter Nutzer sieht im Kontextwähler nur eigene Kurse.
- Kurswechsel vermischt keine Unterhaltungen oder Quellen.
- Eine Frage erzeugt genau eine persistierte Nutzernachricht.
- Die Antwort wird gestreamt und nach Abschluss persistent geladen.
- Abbruch und Retry funktionieren ohne doppelte oder fälschlich erfolgreiche
  Nachrichten.
- Antworten verwenden ausschließlich erlaubte Inhalte des aktiven Kurses.
- Geeignete Antworten besitzen reale, aufrufbare Quellenverweise.
- Ohne ausreichende Evidenz wird keine Quelle oder belegte Antwort erfunden.
- Reload und erneute Anmeldung stellen eigene Unterhaltungen korrekt wieder her.
- Eigene Unterhaltungen können vollständig gelöscht werden.
- Manipulierte Kurs-, Conversation-, Message- und Chunk-IDs legen keine fremden
  Daten offen.
- Karteikarten werden vor der Nutzerbestätigung nicht gespeichert.
- Eine bestätigte Karteikartenerstellung verweist auf echte gespeicherte
  Karten; Fehler werden nicht als Erfolg dargestellt.
- Leere, zu lange und doppelte Submits werden kontrolliert behandelt.
- Provider-, Netzwerk-, Auth-, Rate-Limit- und Verarbeitungsfehler besitzen
  sichere, nutzbare UI-Zustände.
- Nutzer-, Dokument- und Modelltext kann kein unsicheres HTML ausführen.
- Der Kernablauf ist per Tastatur und in der Mobilansicht nutzbar.
- Automatisierte Mandantentrennungs-, Funktions-, Frontend- und E2E-Tests sind
  grün.
- Ein dokumentierter End-to-End-Test mit einem real verarbeiteten Dokument,
  Quellenanzeige, Reload, Retry, Löschung und bestätigter
  Karteikartenerstellung ist erfolgreich.

## Freigaberegel

Die Kennzeichnung als Design- oder Produktvorschau darf erst entfernt werden,
wenn alle Acceptance Criteria erfüllt und die erforderlichen Backend-Verträge
implementiert, getestet und ausgerollt sind. Bis dahin bleiben deaktivierte
Interaktionen und Beispieldaten eindeutig als Vorschau gekennzeichnet.
