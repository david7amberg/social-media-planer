# CLAUDE.md: Social-Media-Planer

Kalender-App für David (david7amberg) mit mehreren Social-Media-Projekten. Mit David auf Deutsch sprechen und duzen. Kurz berichten, was gebaut wurde und was er tun muss.

## Was es ist
- **Eine HTML-Datei** (`index.html`) ohne Abhängigkeiten, ohne CDN und ohne Build. Läuft lokal per Doppelklick (Safari am Mac) und online über GitHub Pages (iPhone, Home-Bildschirm).
- Daten liegen nur im `localStorage` des Browsers (Schlüssel `social-media-planer.v1`). Dazu gibt es Backup und Wiederherstellen als JSON. Es gibt keinen Server und keine Synchronisierung.
- Import: JSON im Format `social-media-plan`, Version 1 (siehe `vorlage/`). Ein Projekt pro Datei. Beim erneuten Import fragt die App jedes Mal: zusammenführen (Dreiwege-Abgleich über `src`), ersetzen oder neues Projekt.

## Entscheidungen von David (01.10.2026)
HTML-Datei im Browser; Safari; Format JSON. Ansichten Heute, Monat, Woche, Liste. Im Kalender stehen Posts und To-dos. Status: offen → in_arbeit → fertig → gepostet (To-dos: offen → in_arbeit → erledigt). Voll bearbeitbar (Drag & Drop, Editor, neu anlegen). 2 bis 3 Projekte; Plattformen Instagram, TikTok, YouTube Shorts. Farben automatisch, aber änderbar. Beim erneuten Import jedes Mal fragen. Keine Mitteilungen der App selbst. Im Detail reichen Name und Nummer, mehr nicht. Uhrzeit optional. Hell/Dunkel wie macOS. Beschriftung „Kürzel Nr · Titel“. Feiertage in Bayern. Vorwarnung gelb, wenn es in 2 Tagen fällig und noch nicht fertig ist. Repo öffentlich mit GitHub Pages; am iPhone nur ansehen (Abgleich per Backup).

**Nachtrag 01.10.2026, Apple Kalender:** David wünscht sich, „mit einem Knopfdruck den Plan auf meinen Apple Kalender übertragen“. Gebaut ist ein Knopf **Apple Kalender**, der eine .ics-Datei erzeugt (Import, kein Abo, weil es keinen Server gibt). Apple Kalender ignoriert beim Import die UID und legt Termine doppelt an. Deshalb merkt sich die App die übertragenen Einträge in `settings.icsSent` und bietet „Nur Neues“ an. Erinnerungen sind optional, Standard ist „keine“.

## Regeln
- Vor Installationen fragen (npm-Pakete, Tools). Für Tests reicht das global installierte Playwright (`tools/pw.mjs` findet es).
- Das Importformat nur abwärtskompatibel ändern. Neue Felder sind optional, sonst `version` erhöhen und alte Dateien weiter lesen.
- Prompt oder Beispiel geändert: `node tools/vorlage.mjs` ausführen (schreibt `vorlage/EXPORT-PROMPT.md` und bettet beides in `index.html` ein).
- Vor jedem Push `node tools/vorlage.mjs --check` und `node tests/smoke.mjs` ausführen, dazu die Screenshots in `tests/out/` ansehen (Desktop hell und dunkel, iPhone 390 px). Kein Text darf abgeschnitten sein, nichts darf sich überlagern, und es darf keine horizontale Scrollleiste geben.
- Keinen Pull Request öffnen oder mergen, außer David verlangt es. Commit-Nachrichten auf Englisch.
