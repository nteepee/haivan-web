// node shoot-v4.mjs [home-v4 search-results-seat-v4 radius-spec]
// full-page desk 1440 and mob 390, plus: home fold 1440x900, scrolled header/filter-bar crops, login dialog, horizontal-scroll check
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { v4here } from './lib-v4.mjs';
const { chromium } = createRequire('/Users/phuc/Documents/HaiVan-Web/apps/booking/package.json')('@playwright/test');
const comps = join(v4here, '..', '..'), shots = join(comps, 'shots');
const want = process.argv.slice(2).length ? process.argv.slice(2) : ['home-v4', 'search-results-seat-v4', 'radius-spec'];
const browser = await chromium.launch({ channel: 'chrome' });
async function open(n, w, h, scale = 1) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: scale, reducedMotion: 'no-preference' });
  const p = await ctx.newPage();
  await p.goto('file://' + join(comps, `${n}.html`), { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.evaluate(async () => { document.querySelectorAll('img[loading=lazy]').forEach((i) => { i.loading = 'eager'; }); await Promise.race([Promise.all([...document.images].map((i) => i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; }))), new Promise((r) => setTimeout(r, 5000))]); });
  return { ctx, p };
}
for (const n of want) {
  if (n === 'radius-spec') { const { ctx, p } = await open(n, 1200, 900); await p.screenshot({ path: join(shots, 'radius-spec.png'), fullPage: true }); await ctx.close(); console.log(n, 'shot'); continue; }
  for (const [tag, w, h, sc] of [['desk', 1440, 900, 1], ['mob', 390, 844, 2]]) {
    const { ctx, p } = await open(n, w, h, sc);
    await p.screenshot({ path: join(shots, `${n}-${tag}.png`), fullPage: true });
    if (n === 'home-v4' && tag === 'desk') await p.screenshot({ path: join(shots, 'home-v4-fold.png') });
    if (n === 'home-v4') { // scrolled: sticky glass header over content
      await p.evaluate((y) => window.scrollTo(0, y), tag === 'desk' ? 520 : 760); await p.waitForTimeout(150);
      await p.screenshot({ path: join(shots, `home-v4-scrolled-${tag}.png`) });
      await p.evaluate(() => window.scrollTo(0, 0));
      await p.click('[data-open-login]:visible, .menu-btn', { timeout: 2000 }).catch(() => {});
      if (tag === 'mob') await p.click('.menu-panel [data-open-login]').catch(() => {});
      await p.waitForTimeout(250);
      await p.screenshot({ path: join(shots, `home-v4-dialog-${tag}.png`) });
    }
    if (n === 'search-results-seat-v4') {
      await p.evaluate((y) => window.scrollTo(0, y), tag === 'desk' ? 700 : 900); await p.waitForTimeout(150);
      await p.screenshot({ path: join(shots, `search-results-seat-v4-scrolled-${tag}.png`) });
    }
    await ctx.close();
  }
  const out = [];
  for (const w of [320, 360, 390, 768, 1440]) {
    const { ctx, p } = await open(n, w, 800);
    const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth }));
    out.push(`${w}:${r.sw <= r.cw ? 'ok' : 'SCROLL ' + r.sw}`); await ctx.close();
  }
  console.log(n, out.join('  '));
}
await browser.close();
