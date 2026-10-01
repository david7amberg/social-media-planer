// Lädt Playwright: zuerst lokal (npm install -D playwright), sonst die globale Installation.
import { createRequire } from 'node:module';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

export async function loadPlaywright() {
  const require = createRequire(import.meta.url);
  let pw;
  try { pw = require('playwright'); } catch {
    const root = execSync('npm root -g').toString().trim();
    pw = require(`${root}/playwright`);
  }
  const exe = process.env.CHROME;  // optional: eigener Chromium-Pfad
  return { chromium: pw.chromium, launchOpts: exe && existsSync(exe) ? { executablePath: exe } : {} };
}
