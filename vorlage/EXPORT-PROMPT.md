# Export-Vorlage für andere Chats

So kommt ein Social-Media-Plan aus einem Chat in den Planer:

1. Den Prompt unten komplett kopieren und im Chat des Projekts einfügen. In der App geht das auch über **⋯ → Prompt für Chats kopieren**.
2. Der Chat liefert eine Datei `<projekt-id>.plan.json` oder einen JSON-Block.
3. In der App auf **Importieren** klicken und die Datei hineinziehen, auswählen oder den Text aus dem Chat in das Feld einfügen.
4. Ändert sich der Plan, im Chat erneut exportieren lassen und wieder importieren. Die App fragt dann jedes Mal, ob sie zusammenführen, ersetzen oder ein neues Projekt anlegen soll.

Eine ausgefüllte Beispieldatei liegt daneben: [`beispiel-plan.json`](beispiel-plan.json).

> Diese Datei wird von `node tools/vorlage.mjs` erzeugt. Änderungen am Prompt bitte dort vornehmen, das Beispiel in `beispiel-plan.json`.

## Prompt zum Kopieren

~~~text
Exportiere den Social-Media-Plan aus diesem Chat als Importdatei für meinen Social-Media-Planer (eine Kalender-App).

AUSGABE
- Eine Datei namens <projekt-id>.plan.json zum Herunterladen.
- Wenn du keine Datei erzeugen kannst: genau ein JSON-Codeblock, ohne Text davor oder danach.

OBERSTE EBENE
- "format": immer "social-media-plan"
- "version": immer 1
- "projekt": Angaben zum Projekt (siehe PROJEKT)
- "exportiert_am": heutiges Datum als "JJJJ-MM-TT"
- "eintraege": Liste mit einem Eintrag pro Beitrag und pro To-do (siehe EINTRAG)

PROJEKT
- "id": feste Kennung, nur Kleinbuchstaben, Ziffern und Bindestriche, z. B. "baeckerei-mueller". Bei jedem späteren Export exakt gleich, sonst legt die App ein zweites Projekt an.
- "name": Anzeigename des Projekts.
- "kuerzel": 2 bis 3 Großbuchstaben. Steht im Kalender vor jeder Nummer, z. B. "BM".
- "farbe" (optional): Farbvorschlag als "#RRGGBB".

EINTRAG
- "id" (Pflicht): eindeutig im Projekt und dauerhaft, z. B. "bm-01" oder "bm-z1". Ein Eintrag behält seine id für immer, auch wenn sich Datum oder Titel ändern. Neue Einträge bekommen neue ids, alte ids nie wiederverwenden.
- "typ" (Pflicht): "post" für eine Veröffentlichung, "todo" für eine Aufgabe mit Fälligkeitsdatum (z. B. Fotos liefern, Freigabe geben).
- "nr" (Pflicht): Kennnummer im Kalender. Posts zweistellig "01", "02" …, To-dos "Z1", "Z2" …
- "titel" (Pflicht): kurz, höchstens etwa 60 Zeichen.
- "datum" (Pflicht): "JJJJ-MM-TT". Bei Posts der Veröffentlichungstag, bei To-dos der Tag, bis zu dem es erledigt sein muss. Wochentage prüfen.
- "uhrzeit" (optional): "HH:MM" im 24-Stunden-Format, nur bei fest geplanter Uhrzeit. Sonst weglassen.
- "plattform" (bei Posts Pflicht, bei To-dos weglassen): Liste aus "Instagram", "TikTok", "YouTube Shorts" (außerdem möglich: "Facebook", "LinkedIn"). Läuft derselbe Beitrag auf mehreren Plattformen: ein Eintrag mit mehreren Plattformen.
- "format" (optional): z. B. "Reel 20 s", "Karussell 7 Slides", "Story", "Short 30 s".
- "status" (optional, Standard "offen"): bei Posts "offen", "in_arbeit", "fertig" oder "gepostet"; bei To-dos "offen", "in_arbeit" oder "erledigt".
- "notiz" (optional): höchstens ein kurzer Satz.
- "link" (optional): Link zum veröffentlichten Beitrag.

REGELN
- Gültiges JSON: doppelte Anführungszeichen, keine Kommentare, kein Komma nach dem letzten Element einer Liste.
- Keine weiteren Felder. Captions, Hashtags und Skripte gehören nicht in diese Datei.
- Alle Einträge des Plans exportieren, auch bereits gepostete und erledigte, jeweils mit aktuellem Status.

BEISPIEL (ein erfundenes Projekt, nur zur Orientierung)
{
  "format": "social-media-plan",
  "version": 1,
  "projekt": {
    "id": "muster-cafe",
    "name": "Musterprojekt Café",
    "kuerzel": "MC",
    "farbe": "#D9468F"
  },
  "exportiert_am": "2026-10-01",
  "eintraege": [
    {
      "id": "mc-01",
      "typ": "post",
      "nr": "01",
      "titel": "Herbstkarte: die drei neuen Kuchen",
      "datum": "2026-10-07",
      "uhrzeit": "18:00",
      "plattform": [
        "Instagram",
        "TikTok"
      ],
      "format": "Reel 15 s",
      "status": "fertig"
    },
    {
      "id": "mc-02",
      "typ": "post",
      "nr": "02",
      "titel": "Hinter der Theke: so entsteht der Zimtknoten",
      "datum": "2026-10-10",
      "plattform": [
        "Instagram"
      ],
      "format": "Karussell 6 Slides",
      "status": "in_arbeit"
    },
    {
      "id": "mc-z1",
      "typ": "todo",
      "nr": "Z1",
      "titel": "Fotos der Herbstkuchen liefern",
      "datum": "2026-10-12",
      "status": "offen",
      "notiz": "Tageslicht, von oben und schräg"
    },
    {
      "id": "mc-03",
      "typ": "post",
      "nr": "03",
      "titel": "Frage der Woche: Hafer- oder Kuhmilch?",
      "datum": "2026-10-14",
      "uhrzeit": "12:30",
      "plattform": [
        "Instagram",
        "TikTok",
        "YouTube Shorts"
      ],
      "format": "Short 20 s",
      "status": "offen"
    },
    {
      "id": "mc-z2",
      "typ": "todo",
      "nr": "Z2",
      "titel": "Texte für Beitrag 04 freigeben",
      "datum": "2026-10-15",
      "status": "offen"
    },
    {
      "id": "mc-04",
      "typ": "post",
      "nr": "04",
      "titel": "Wochenend-Öffnungszeiten im Herbst",
      "datum": "2026-10-17",
      "plattform": [
        "Instagram"
      ],
      "format": "Story",
      "status": "offen",
      "notiz": "Mit Umfrage-Sticker"
    },
    {
      "id": "mc-05",
      "typ": "post",
      "nr": "05",
      "titel": "Ein Tag im Café in 30 Sekunden",
      "datum": "2026-10-21",
      "uhrzeit": "19:00",
      "plattform": [
        "TikTok",
        "YouTube Shorts"
      ],
      "format": "Short 30 s",
      "status": "offen"
    }
  ]
}
~~~
