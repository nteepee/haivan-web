// node shoot.mjs [name ...] : full-page screenshots (desk 1440, mob 360) + horizontal-scroll check at 320/360/768/1440
import { createRequire } from 'node:module';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { here } from './lib.mjs';
const { chromium } = createRequire('/Users/phuc/Documents/HaiVan-Web/apps/booking/package.json')('@playwright/test');
const want = process.argv.slice(2);
const names = readdirSync(join(here, 'pages')).map((f) => f.replace('.mjs', '')).filter((n) => !want.length || want.includes(n));
const browser = await chromium.launch({ channel: 'chrome' });
for (const n of names) {
  const url = 'file://' + join(here, '..', `${n}.html`);
  for (const [tag, w, h] of [['desk', 1440, 900], ['mob', 360, 800]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: tag === 'mob' ? 2 : 1, reducedMotion: 'no-preference' });
    const p = await ctx.newPage();
    await p.goto(url, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    await p.evaluate(async () => { document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; }); await Promise.race([Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 4000))]); });
    await p.screenshot({ path: join(here, '..', 'shots', `${n}-${tag}.png`), fullPage: true });
    await ctx.close();
  }
  const out = [];
  for (const w of [320, 360, 768, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 } });
    const p = await ctx.newPage(); await p.goto(url, { waitUntil: 'load' });
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, over: [...document.querySelectorAll('body *')].filter((e) => { const b = e.getBoundingClientRect(); return b.right > document.documentElement.clientWidth + 1 && b.width > 0 && getComputedStyle(e).position !== 'fixed'; }).slice(0, 4).map((e) => e.tagName + '.' + e.className) }));
    out.push(`${w}:${r.sw <= r.cw ? 'ok' : 'SCROLL ' + r.sw}${r.over.length ? ' over=' + r.over.join('|') : ''}`);
    await ctx.close();
  }
  console.log(n, out.join('  '));
}
await browser.close();
