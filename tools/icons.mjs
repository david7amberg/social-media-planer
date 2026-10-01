#!/usr/bin/env node
// Rendert icons/icon.svg als PNG (180 für iPhone, 192/512 fürs Manifest). Braucht Playwright mit Chromium.
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadPlaywright } from './pw.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(ROOT, 'icons/icon.svg'), 'utf8');
const { chromium, launchOpts } = await loadPlaywright();
const browser = await chromium.launch(launchOpts);
for (const size of [180, 192, 512]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: join(ROOT, `icons/icon-${size}.png`) });
  await page.close();
}
await browser.close();
console.log('icons/icon-180.png, icon-192.png, icon-512.png geschrieben');
