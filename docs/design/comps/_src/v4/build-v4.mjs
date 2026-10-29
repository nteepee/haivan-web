// node build-v4.mjs [name ...] -> writes ../../<name>.html from v4/pages/<name>.mjs
import { readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { v4here, page } from './lib-v4.mjs';

const want = process.argv.slice(2);
const names = readdirSync(join(v4here, 'pages')).filter((f) => f.endsWith('.mjs')).map((f) => f.replace('.mjs', '')).filter((n) => !want.length || want.includes(n));
for (const n of names) {
  const mod = await import(pathToFileURL(join(v4here, 'pages', `${n}.mjs`)).href + `?t=${Date.now()}`);
  writeFileSync(join(v4here, '..', '..', `${n}.html`), page(mod.default));
  console.log('built', n);
}
