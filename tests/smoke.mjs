#!/usr/bin/env node
// Durchlauf aller Funktionen im echten Browser (Chromium über Playwright).
//   node tests/smoke.mjs [pfad/zu/raumfokus-kalender.json]
// Screenshots landen in tests/out/ (nicht im Repo).
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { loadPlaywright } from '../tools/pw.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'tests/out');
mkdirSync(OUT, { recursive: true });
const URL_ = pathToFileURL(join(ROOT, 'index.html')).href;
const EXAMPLE = readFileSync(join(ROOT, 'vorlage/beispiel-plan.json'), 'utf8');
const RF_PATH = process.argv[2] || join(OUT, 'rf-fallback.json');
let RF;
try { RF = JSON.parse(readFileSync(RF_PATH, 'utf8')); } catch {
  // Ersatz, falls kein Raumfokus-Export übergeben wurde
  RF = { format: 'social-media-plan', version: 1, projekt: { id: 'raumfokus-medien', name: 'Raumfokus Medien', kuerzel: 'RF', farbe: '#29AEB1' }, exportiert_am: '2026-10-01',
    eintraege: Array.from({ length: 26 }, (_, i) => ({ id: `rf-${String(i + 1).padStart(2, '0')}`, typ: 'post', nr: String(i + 1).padStart(2, '0'), titel: `Beitrag ${i + 1}`, datum: new Date(Date.UTC(2026, 9, 6 + i * 3)).toISOString().slice(0, 10), plattform: ['Instagram'], status: 'offen' }))
      .concat([{ id: 'rf-z1', typ: 'todo', nr: 'Z1', titel: 'Zielgruppe festlegen', datum: '2026-10-01', status: 'offen' }]) };
  writeFileSync(RF_PATH, JSON.stringify(RF, null, 2));
}

let failures = 0;
const ok = (cond, msg) => { console.log(`${cond ? '  ok ' : 'FAIL '} ${msg}`); if (!cond) failures++; };

const { chromium, launchOpts } = await loadPlaywright();
const browser = await chromium.launch(launchOpts);
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'de-DE', timezoneId: 'Europe/Berlin', acceptDownloads: true });
const page = await ctx.newPage();
const errors = [];
page.on('pageerror', e => errors.push(String(e)));
page.on('console', m => { if (m.type() === 'error' && !/manifest|favicon|icon-/.test(m.text())) errors.push(m.text()); });
page.on('dialog', d => d.accept());
await page.clock.setFixedTime(new Date('2026-10-01T09:00:00+02:00'));
await page.goto(URL_);

const state = () => page.evaluate(() => window.__smp.state());
const entry = async id => (await state()).entries.find(e => e.id === id);
const shot = async name => { await page.waitForTimeout(80); await page.screenshot({ path: join(OUT, name + '.png'), fullPage: false }); };
const noHScroll = async label => {
  const w = await page.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
  ok(w[0] <= w[1], `${label}: keine horizontale Scrollleiste (${w[0]} <= ${w[1]})`);
};

// --- Leerer Start
ok(await page.isVisible('text=Willkommen im Social-Media-Planer'), 'Startbildschirm ohne Projekte');
await shot('01-leer');

// --- Beispiel per Einfügen importieren
await page.click('.empty [data-action=import]');
await page.fill('#impText', EXAMPLE);
await page.click('[data-imp=check]');
ok(await page.isVisible('.pv >> text=Musterprojekt Café'), 'Vorschau zeigt Projektnamen');
ok(await page.isVisible('.pv >> text=5 Posts · 2 To-dos'), 'Vorschau zählt Posts und To-dos');
await shot('02-import-vorschau');
await page.click('[data-imp=do]');
ok((await state()).entries.length === 7, 'Beispiel importiert: 7 Einträge');

// --- Raumfokus per Dateiauswahl importieren
await page.click('aside [data-action=import]');
const [chooser] = await Promise.all([page.waitForEvent('filechooser'), page.click('[data-imp=pick]')]);
await chooser.setFiles(RF_PATH);
await page.waitForSelector('.pv >> text=Raumfokus Medien');
await page.click('[data-imp=do]');
let s = await state();
const rfCount = RF.eintraege.length;
ok(s.entries.filter(e => e.projekt === 'raumfokus-medien').length === rfCount, `Raumfokus importiert: ${rfCount} Einträge`);
ok(s.projects.find(p => p.id === 'raumfokus-medien').farbe === '#29AEB1', 'Projektfarbe aus der Datei übernommen (#29AEB1)');
ok(s.projects.find(p => p.id === 'muster-cafe').farbe !== s.projects.find(p => p.id === 'raumfokus-medien').farbe, 'Projekte haben verschiedene Farben');

// --- Ansichten (Desktop hell)
await page.click('[data-view=monat]');
ok(await page.isVisible('.vtitle >> text=Oktober 2026'), 'Monatsansicht Oktober 2026');
ok(await page.isVisible('.day[data-date="2026-10-03"] .hol'), 'Feiertag 03.10. angezeigt');
ok(await page.isVisible('.chip >> text=RF 01 · Links eingerichtet. Rechts leer.') || RF === null, 'Beschriftung „RF 01 · Titel“');
await noHScroll('Monat Desktop');
await shot('03-monat-hell');
await page.click('[data-view=woche]');
await page.click('[data-action=next]');
await shot('04-woche-hell');
await noHScroll('Woche Desktop');
await page.click('[data-view=liste]');
await shot('05-liste-hell');
await page.fill('#listSearch', 'HDR');
ok((await page.$$('#view .row')).length >= 1, 'Suche in der Liste findet „HDR“');
await page.fill('#listSearch', '');
await page.click('[data-view=heute]');
ok(await page.isVisible('.sect >> text=Heute'), 'Heute-Ansicht');
await shot('06-heute-hell');

// --- Status ändern über das Menü
await page.click('[data-view=liste]');
await page.click('.row[data-uid="raumfokus-medien::rf-01"] [data-action=status]');
await page.click('#pop [data-status=in_arbeit]');
ok((await entry('rf-01')).status === 'in_arbeit', 'Status per Menü auf „in Arbeit“');
// Undo
await page.click('#toast [data-action=undo]');
ok((await entry('rf-01')).status === 'offen', 'Rückgängig stellt den Status wieder her');
await page.click('.row[data-uid="raumfokus-medien::rf-01"] [data-action=status]');
await page.click('#pop [data-status=in_arbeit]');

// --- Drag & Drop im Monat
await page.click('[data-view=monat]');
const rf03 = await entry('rf-03');
const target = '2026-10-14';
await page.dragAndDrop(`.chip[data-uid="raumfokus-medien::rf-03"]`, `.day[data-date="${target}"]`);
ok((await entry('rf-03')).datum === target, `Drag & Drop: rf-03 von ${rf03.datum} auf ${target}`);

// --- Bearbeiten: Uhrzeit setzen
await page.click('.chip[data-uid="raumfokus-medien::rf-02"] .lbl');
await page.fill('#edForm [name=uhrzeit]', '18:30');
await page.fill('#edForm [name=notiz]', 'Meine Notiz');
await shot('07-editor');
await page.click('#edForm [type=submit]');
ok((await entry('rf-02')).uhrzeit === '18:30', 'Editor speichert Uhrzeit');

// --- Neuer Eintrag per Doppelklick
await page.dblclick('.day[data-date="2026-10-20"]', { position: { x: 60, y: 90 } });
await page.selectOption('#edForm [name=projekt]', 'muster-cafe');
await page.click('#edTyp [data-typ=todo]');
ok(await page.inputValue('#edForm [name=nr]') === 'Z3', 'Nächste To-do-Nummer vorgeschlagen (Z3)');
await page.fill('#edForm [name=titel]', 'Kuchenfotos sichten');
await page.click('#edForm [type=submit]');
s = await state();
const mine = s.entries.find(e => e.titel === 'Kuchenfotos sichten');
ok(mine && mine.datum === '2026-10-20' && mine.typ === 'todo' && mine.lokal, 'Neuer lokaler Eintrag per Doppelklick');

// --- Erneuter Import: zusammenführen (Dreiwege-Abgleich)
const rf2 = JSON.parse(JSON.stringify(RF));
const find = id => rf2.eintraege.find(e => e.id === id);
find('rf-03').titel = 'Neuer Titel aus dem Chat';      // Plan ändert Titel, Datum bleibt -> lokale Verschiebung bleibt
find('rf-01').status = 'fertig';                        // weiter als lokal "in_arbeit" -> fertig
find('rf-02').notiz = '';                               // unverändert gegenüber letztem Import -> lokale Notiz bleibt
const lastId = rf2.eintraege.filter(e => e.typ === 'post').map(e => e.id).sort().pop();
rf2.eintraege = rf2.eintraege.filter(e => e.id !== lastId);  // fehlt im neuen Plan
rf2.eintraege.push({ id: 'rf-99', typ: 'post', nr: '99', titel: 'Ganz neuer Beitrag', datum: '2026-10-29', plattform: ['Instagram', 'TikTok'], status: 'offen' });
await page.click('aside [data-action=import]');
await page.fill('#impText', '```json\n' + JSON.stringify(rf2, null, 2) + '\n```');
await page.click('[data-imp=check]');
ok(await page.isDisabled('[data-imp=do]'), 'Bei bestehendem Projekt muss eine Option gewählt werden');
const statsText = await page.textContent('.opt:has(input[value=merge])');
ok(/Neu: 1 · geändert: 2/.test(statsText) && /fehlen im neuen Plan: 1/.test(statsText), 'Vorschau-Statistik: neu 1, geändert 2, fehlt 1 — ' + statsText.replace(/\s+/g, ' ').slice(0, 90));
await shot('08-reimport-frage');
await page.check('input[name=impMode][value=merge]');
await page.click('[data-imp=do]');
let e3 = await entry('rf-03');
ok(e3.titel === 'Neuer Titel aus dem Chat' && e3.datum === target, 'Zusammenführen: neuer Titel übernommen, eigene Verschiebung behalten');
ok((await entry('rf-01')).status === 'fertig', 'Zusammenführen: weiter fortgeschrittener Status gewinnt');
{ const e2 = await entry('rf-02'); ok(e2.notiz === 'Meine Notiz' && e2.uhrzeit === '18:30', 'Zusammenführen: eigene Notiz und Uhrzeit bleiben' + (e2.notiz === 'Meine Notiz' && e2.uhrzeit === '18:30' ? '' : ' ' + JSON.stringify(e2))); }
ok((await entry(lastId)).entfernt === true, 'Zusammenführen: fehlender Eintrag markiert, nicht gelöscht');
ok(!!(await entry('rf-99')), 'Zusammenführen: neuer Eintrag dazu');

// --- Erneuter Import als neues Projekt + Rückgängig
await page.click('aside [data-action=import]');
await page.fill('#impText', JSON.stringify(RF));
await page.click('[data-imp=check]');
await page.check('input[name=impMode][value=new]');
await page.click('[data-imp=do]');
s = await state();
const p2 = s.projects.find(p => p.name === 'Raumfokus Medien (2)');
ok(p2 && p2.id === 'raumfokus-medien-2' && p2.farbe !== '#29AEB1', 'Als neues Projekt: eigener Name, eigene ID, eigene Farbe');
await page.click('#toast [data-action=undo]');
ok(!(await state()).projects.some(p => p.id === 'raumfokus-medien-2'), 'Rückgängig entfernt das neue Projekt');

// --- Fehlerhafte Dateien
await page.click('aside [data-action=import]');
await page.fill('#impText', '{"format":"social-media-plan","projekt":{"id":"x","name":"X"},"eintraege":[{"id":"a","titel":"A","datum":"2026-13-01"},{"titel":"B","datum":"2026-10-02"}]}');
await page.click('[data-imp=check]');
ok(await page.isVisible('.note.red >> text="datum" "2026-13-01" ist kein gültiges Datum'), 'Fehler: ungültiges Datum im Klartext');
ok(await page.isVisible('.note.red >> text=Eintrag 2: "id" fehlt.'), 'Fehler: fehlende id im Klartext');
await shot('09-import-fehler');
await page.click('[data-imp=skip]');
await page.fill('#impText', '{"format":"social-media-plan","version":1,"projekt":{"id":"y","name":"Y","kuerzel":"Y"},"eintraege":[{"id":"y1","typ":"post","nr":"01","titel":"T","datum":"13.10.2026","uhrzeit":"18 Uhr","plattform":"Insta, TikTok","status":"in Arbeit",},]}');
await page.click('[data-imp=check]');
ok(await page.isVisible('.note.amber'), 'Kleine Fehler werden automatisch korrigiert (Hinweise)');
await page.click('[data-imp=do]');
const y1 = await entry('y1');
ok(y1 && y1.datum === '2026-10-13' && y1.uhrzeit === '18:00' && y1.plattform.join() === 'Instagram,TikTok' && y1.status === 'in_arbeit', 'Korrekturen: Datum, Uhrzeit, Plattformen, Status');

// --- Backup sichern, alles löschen, Backup laden
const [dl] = await Promise.all([page.waitForEvent('download'), page.click('aside [data-action=backup-save]')]);
const bpath = join(OUT, 'backup.json');
await dl.saveAs(bpath);
const backup = JSON.parse(readFileSync(bpath, 'utf8'));
ok(backup.format === 'social-media-planer-backup' && backup.daten.entries.length === (await state()).entries.length, 'Backup enthält alle Einträge');
await page.click('[data-action=menu]');
await page.click('#pop [data-m=wipe]');
ok((await state()).entries.length === 0, 'Alle Daten gelöscht');
const [ch2] = await Promise.all([page.waitForEvent('filechooser'), page.click('.empty [data-action=import]').then(() => page.click('[data-imp=pick]'))]);
await ch2.setFiles(bpath);
await page.waitForSelector('[data-imp=restore]');
await page.click('[data-imp=restore]');
ok((await state()).entries.length === backup.daten.entries.length, 'Backup wiederhergestellt');

// --- Projekt-Export im Importformat
await page.click('aside [data-action=proj-edit][data-pid=raumfokus-medien]');
const [dl2] = await Promise.all([page.waitForEvent('download'), page.click('[data-pj=export]')]);
const epath = join(OUT, 'export.json');
await dl2.saveAs(epath);
const exp = JSON.parse(readFileSync(epath, 'utf8'));
const re = await page.evaluate(x => window.__smp.validatePlan(x), exp);
ok(re.errors.length === 0 && exp.eintraege.find(e => e.id === 'rf-01').status === 'fertig', 'Projekt-Export ist gültiges Importformat mit aktuellem Status');
await page.keyboard.press('Escape');

// --- Bleibt nach Neuladen erhalten
await page.reload();
ok((await state()).entries.length === backup.daten.entries.length, 'Daten bleiben nach Neuladen erhalten');

// --- Feiertage
const hol = await page.evaluate(() => window.__smp.holidays(2026));
ok(hol['2026-04-03'] === 'Karfreitag' && hol['2026-06-04'] === 'Fronleichnam' && hol['2026-11-01'] === 'Allerheiligen', 'Feiertage Bayern 2026 (Ostern 05.04.)');
ok(window_ok(await page.evaluate(() => window.__smp.holidays(2027))), 'Feiertage 2027 (Ostern 28.03.)');
function window_ok(h) { return h['2027-03-26'] === 'Karfreitag' && h['2027-05-27'] === 'Fronleichnam'; }

// --- Dunkel
await page.click('[data-action=menu]');
await page.click('#pop [data-theme-set=dark]');
await page.click('[data-view=monat]');
await shot('10-monat-dunkel');
await page.click('[data-view=woche]');
await shot('11-woche-dunkel');
await page.click('[data-view=heute]');
await shot('12-heute-dunkel');

// --- Später im Monat: Überfällig und Vorwarnung
const later = await ctx.newPage();
later.on('pageerror', e => errors.push(String(e)));
await later.clock.setFixedTime(new Date('2026-10-21T09:00:00+02:00'));
await later.goto(URL_);
await later.click('[data-view=heute]');
ok(await later.isVisible('.sect.red >> text=Überfällig'), 'Überfällig-Abschnitt am 21.10.');
ok((await later.$$('.row .tag.amber')).length >= 1, 'Vorwarnung (gelb) für Posts in 2 Tagen, die nicht fertig sind');
await later.screenshot({ path: join(OUT, '13-heute-21-10-dunkel.png') });
await later.click('[data-view=monat]');
await later.screenshot({ path: join(OUT, '14-monat-21-10-dunkel.png') });
await later.close();

// --- iPhone
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-DE', timezoneId: 'Europe/Berlin' });
const m = await phone.newPage();
m.on('pageerror', e => errors.push(String(e)));
await m.clock.setFixedTime(new Date('2026-10-01T09:00:00+02:00'));
await m.goto(URL_);
await m.evaluate(b => { localStorage.setItem('social-media-planer.v1', JSON.stringify({ version: 1, projects: b.daten.projects, entries: b.daten.entries, settings: { view: 'heute', theme: 'light' } })); }, backup);
await m.reload();
await m.screenshot({ path: join(OUT, '20-iphone-heute.png') });
const mw = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
ok(mw[0] <= mw[1], `iPhone Heute: keine horizontale Scrollleiste (${mw[0]})`);
await m.click('[data-view=monat]');
await m.screenshot({ path: join(OUT, '21-iphone-monat.png') });
await m.tap('.day[data-date="2026-10-13"]');
ok(await m.isVisible('.modal >> text=Dienstag, 13. Oktober 2026'), 'iPhone: Tipp auf Tag zeigt Tagesliste');
await m.screenshot({ path: join(OUT, '22-iphone-tag.png') });
await m.click('.modal [data-close]');
await m.click('[data-view=woche]');
await m.screenshot({ path: join(OUT, '23-iphone-woche.png') });
const ww = await m.evaluate(() => [document.documentElement.scrollWidth, innerWidth]);
ok(ww[0] <= ww[1], `iPhone Woche: keine horizontale Scrollleiste (${ww[0]})`);
await m.click('[data-action=toggle-side]');
await m.waitForTimeout(300);
await m.screenshot({ path: join(OUT, '24-iphone-seitenleiste.png') });
await m.click('.scrim', { position: { x: 370, y: 400 } });
await m.click('[data-view=liste]');
await m.screenshot({ path: join(OUT, '25-iphone-liste.png') });
await m.click('.row[data-uid="raumfokus-medien::rf-04"] .rlbl');
await m.screenshot({ path: join(OUT, '26-iphone-editor.png') });
const ew = await m.evaluate(() => [document.querySelector('.modal').scrollWidth, document.querySelector('.modal').clientWidth]);
ok(ew[0] <= ew[1], 'iPhone Editor: nichts ragt aus dem Dialog');

ok(errors.length === 0, 'keine JavaScript-Fehler' + (errors.length ? ': ' + errors.join(' | ') : ''));
await browser.close();
console.log(failures ? `\n${failures} Fehler` : '\nAlles bestanden');
process.exit(failures ? 1 : 0);
