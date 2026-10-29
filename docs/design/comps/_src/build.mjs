// node build.mjs [name ...]  -> writes ../<name>.html from pages/<name>.mjs
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { here, page } from './lib.mjs';

const want = process.argv.slice(2);
const names = readdirSync(join(here, 'pages')).filter((f) => f.endsWith('.mjs')).map((f) => f.replace('.mjs', '')).filter((n) => !want.length || want.includes(n));
for (const n of names) {
  const mod = await import(pathToFileURL(join(here, 'pages', `${n}.mjs`)).href + `?t=${Date.now()}`);
  writeFileSync(join(here, '..', `${n}.html`), page(mod.default));
  console.log('built', n);
}
