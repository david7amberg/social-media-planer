#!/usr/bin/env node
// Erzeugt vorlage/EXPORT-PROMPT.md aus dem Prompt unten und vorlage/beispiel-plan.json
// und bettet beides in index.html ein (Buttons "Prompt kopieren" / "Beispieldatei").
//   node tools/vorlage.mjs          schreiben
//   node tools/vorlage.mjs --check  nur prüfen, Exit-Code 1 wenn etwas nicht aktuell ist
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CHECK = process.argv.includes('--check');

const example = JSON.parse(readFileSync(join(ROOT, 'vorlage/beispiel-plan.json'), 'utf8'));
const exampleText = JSON.stringify(example, null, 2);

const PROMPT = `Exportiere den Social-Media-Plan aus diesem Chat als Importdatei für meinen Social-Media-Planer (eine Kalender-App).

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
${exampleText}
`;

const MD = `# Export-Vorlage für andere Chats

So kommt ein Social-Media-Plan aus einem Chat in den Planer:

1. Den Prompt unten komplett kopieren und im Chat des Projekts einfügen. In der App geht das auch über **⋯ → Prompt für Chats kopieren**.
2. Der Chat liefert eine Datei \`<projekt-id>.plan.json\` oder einen JSON-Block.
3. In der App auf **Importieren** klicken und die Datei hineinziehen, auswählen oder den Text aus dem Chat in das Feld einfügen.
4. Ändert sich der Plan, im Chat erneut exportieren lassen und wieder importieren. Die App fragt dann jedes Mal, ob sie zusammenführen, ersetzen oder ein neues Projekt anlegen soll.

Eine ausgefüllte Beispieldatei liegt daneben: [\`beispiel-plan.json\`](beispiel-plan.json).

> Diese Datei wird von \`node tools/vorlage.mjs\` erzeugt. Änderungen am Prompt bitte dort vornehmen, das Beispiel in \`beispiel-plan.json\`.

## Prompt zum Kopieren

~~~text
${PROMPT}~~~
`;

let stale = [];
function put(rel, content) {
  const path = join(ROOT, rel);
  let old = '';
  try { old = readFileSync(path, 'utf8'); } catch {}
  if (old === content) return;
  stale.push(rel);
  if (!CHECK) writeFileSync(path, content);
}

put('vorlage/EXPORT-PROMPT.md', MD);

const htmlPath = join(ROOT, 'index.html');
let html = readFileSync(htmlPath, 'utf8');
for (const [id, body] of [['vorlage-beispiel', exampleText], ['vorlage-prompt', PROMPT]]) {
  if (body.includes('</script')) throw new Error(`${id}: darf kein </script enthalten`);
  const re = new RegExp(`(<script type="[^"]+" id="${id}">)[\\s\\S]*?(</script>)`);
  if (!re.test(html)) throw new Error(`Platzhalter #${id} fehlt in index.html`);
  html = html.replace(re, (_, a, b) => `${a}\n${body.trimEnd()}\n${b}`);
}
put('index.html', html);

if (CHECK && stale.length) {
  console.error('Nicht aktuell (node tools/vorlage.mjs ausführen): ' + stale.join(', '));
  process.exit(1);
}
console.log(stale.length ? (CHECK ? '' : 'aktualisiert: ' + stale.join(', ')) : 'alles aktuell');
