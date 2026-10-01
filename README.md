# Social-Media-Planer

Ein Kalender für mehrere Social-Media-Projekte. Die Pläne kommen als JSON-Datei aus deinen Chats. Jedes Projekt bekommt eine eigene Farbe, und du hakst direkt im Kalender ab, was erledigt ist.

Die ganze App ist **eine HTML-Datei** (`index.html`). Sie braucht keine Installation und kein Konto und läuft offline. Deine Daten bleiben in deinem Browser.

## Starten

### Am Mac (lokal, empfohlen)

1. `index.html` herunterladen und an einen festen Ort legen, z. B. `Dokumente/Social-Media-Planer/`.
   Am einfachsten geht das mit dem ganzen Ordner: auf GitHub **Code → Download ZIP**, entpacken und verschieben.
2. Die Datei per Doppelklick öffnen. Sie öffnet sich in Safari.
3. Als Lesezeichen speichern (⌘D) oder die Datei ins Dock ziehen.

Lass die Datei an ihrem Ort. Wenn du sie verschiebst, findet der Browser die gespeicherten Daten eventuell nicht mehr. Dann hilft **Backup laden**.

### Am iPhone (online, über GitHub Pages)

Adresse: **https://david7amberg.github.io/social-media-planer/**

1. Die Adresse in Safari öffnen.
2. Auf **Teilen** tippen, dann **Zum Home-Bildschirm**. Danach startet die App wie eine normale App, auch offline.
3. Den Stand vom Mac holst du per Backup: am Mac **Backup sichern** (die Datei z. B. in iCloud Drive legen), am iPhone in der Seitenleiste ☰ auf **Backup laden** tippen.

Jeder Ort hat seinen eigenen Speicher: die lokale Datei am Mac, die Online-Adresse in Safari und die App auf dem Home-Bildschirm. Abgehakt wird am Mac, das iPhone dient zum Ansehen.

## Benutzen

| Was | Wie |
|---|---|
| **Ansichten** | Heute (Überfälliges, heute, nächste 7 Tage, Fortschritt pro Projekt), Monat, Woche, Liste mit Suche. Tasten `1` bis `4` |
| **Blättern** | Pfeile neben „Heute“ oder Tasten `←` `→`. Taste `T` springt zu heute |
| **Status ändern** | Auf das Symbol vor dem Eintrag klicken: offen ○ → in Arbeit ◐ → fertig ● → gepostet ✓. To-dos: offen → in Arbeit → erledigt |
| **Verschieben** | Eintrag per Drag & Drop auf einen anderen Tag ziehen (Monat und Woche) |
| **Bearbeiten** | Auf den Eintrag klicken: Titel, Nummer, Datum, Uhrzeit, Plattformen, Format, Status, Notiz, Link |
| **Neu anlegen** | Doppelklick auf einen Tag, das `+` am Tag, der Button **Eintrag** oder Taste `N` |
| **Rückgängig** | Im Hinweis unten auf **Rückgängig** klicken oder `⌘Z` |
| **Projekte** | In der Seitenleiste ein- und ausblenden. Über `⋯` Farbe, Name und Kürzel ändern oder das Projekt als Plan exportieren |
| **Farben** | Rot umrandet heißt überfällig. Gelb umrandet heißt: in 2 Tagen fällig und noch nicht fertig |
| **Feiertage** | Die Feiertage in Bayern stehen klein im Kalender |
| **Darstellung** | Folgt der macOS-Einstellung (hell/dunkel). Umschalten unter `⋯ → Darstellung` |

## Pläne aus Chats importieren

1. In der App **⋯ → Prompt für Chats kopieren** wählen und den Prompt im Chat des Projekts einfügen. Er steht auch in [`vorlage/EXPORT-PROMPT.md`](vorlage/EXPORT-PROMPT.md).
2. Der Chat liefert eine Datei `<projekt-id>.plan.json` oder einen JSON-Block. Ein Muster liegt in [`vorlage/beispiel-plan.json`](vorlage/beispiel-plan.json).
3. In der App auf **Importieren** klicken und dann die Datei hineinziehen, auswählen oder den Text aus dem Chat in das Feld einfügen.

Die App prüft jede Datei, bevor sie etwas übernimmt. Kleine Fehler korrigiert sie selbst und zeigt einen Hinweis, z. B. bei einem Datum `13.10.2026` statt `2026-10-13`, bei `18 Uhr` statt `18:00` oder bei einem überzähligen Komma. Bei echten Fehlern, z. B. wenn eine `id` oder ein Datum fehlt, zeigt sie eine Liste im Klartext. Die kannst du dem Chat zurückgeben.

### Erneut importieren

Kennt die App das Projekt schon (gleiche `projekt.id`), fragt sie jedes Mal, was passieren soll:

- **Zusammenführen:** Neue Einträge kommen dazu. Was der Chat geändert hat, wird übernommen. Was du in der App geändert hast (Verschiebung, Uhrzeit, Notiz), bleibt erhalten, solange der Chat dasselbe Feld nicht auch geändert hat. Beim Status gilt der weiter fortgeschrittene. Einträge, die im neuen Plan fehlen, bleiben durchgestrichen stehen oder werden auf Wunsch gelöscht. Selbst angelegte Einträge bleiben immer.
- **Ersetzen:** Das Projekt wird komplett durch den neuen Plan ersetzt.
- **Als neues Projekt anlegen:** Der Plan kommt zusätzlich mit eigener Farbe dazu.

Damit das klappt, muss jeder Eintrag seine `id` dauerhaft behalten. Das verlangt der Prompt ausdrücklich.

## Daten und Backup

- Alles wird im Speicher deines Browsers gesichert, nur auf diesem Gerät. Nichts geht ins Internet.
- **Backup sichern** (Seitenleiste oder `⋯`) speichert alles als JSON in „Downloads“. Hast du länger als 7 Tage nichts gesichert, erinnert die App dich daran.
- **Backup laden** stellt einen Stand wieder her. Das ersetzt alle Daten im Browser und ist z. B. der Weg aufs iPhone.
- Wenn du in Safari die Website-Daten löschst, ist auch der Planer leer. Dann hilft das letzte Backup.

## Raumfokus Medien

Im Repo `raumfokusmedien` erzeugt `python3 content/plan.py export-kalender` die Datei `content/raumfokus-kalender.json`. Darin stehen die 26 Beiträge und die Zuarbeit Z1 bis Z6 mit Fälligkeit. Die Datei wird außerdem bei jedem `plan.py set …` und `build` neu geschrieben. Zum Aktualisieren importierst du sie hier erneut und wählst **Zusammenführen**.

## Entwicklung

- `index.html` enthält alles (HTML, CSS, JavaScript) und hat keine Abhängigkeiten.
- Prompt oder Beispiel geändert? Dann `node tools/vorlage.mjs` ausführen. Das Skript schreibt `vorlage/EXPORT-PROMPT.md` neu und bettet Prompt und Beispiel in `index.html` ein (`--check` prüft nur).
- `node tools/icons.mjs` rendert die App-Icons aus `icons/icon.svg`.
- `node tests/smoke.mjs [plan.json]` testet alle Funktionen im Browser (Playwright mit Chromium). Die Screenshots landen in `tests/out/`.
- `manifest.webmanifest` und `sw.js` werden nur online genutzt (Home-Bildschirm, offline).
