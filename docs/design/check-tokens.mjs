#!/usr/bin/env node
// Consistency check for the Hải Vân design system.
// usage: node docs/design/check-tokens.mjs [file.html|file.css ...]   (default: every comp in docs/design/comps/*.html)
// Fails (exit 1) when CSS outside the :root token block uses a raw length for radius, padding, margin, gap, font-size,
// border or outline width, text-decoration thickness, or an off-token box-shadow. Raw px is legal only inside :root.
// Also checks the declared text/fill colour pairs in tokens.css for WCAG contrast (4.5:1 text pairs).
// v4: radius tokens --r-1..--r-4 and --r-round, shadows --shadow-1..3 (v3 names stay legal as aliases in older files). v4 comps (*-v4.html, radius-spec.html)
// must use the v4 names only and must not carry black borders: any border* declaration whose value uses var(--color-ink) fails, except focus
// selectors (:focus, :focus-visible) and the negative examples of radius-spec (selectors starting .dont-). Outlines are never flagged.
// WP scan (default run): wordpress/wp-content/themes/haivan-web-child/assets/css/*.css is checked like the app CSS (v4).
// App scan (default run, or pass paths): apps/booking/src/**/*.css is checked like a v4 comp, and every apps/booking/src/**/*.{tsx,ts} class string is scanned for
// border-2 / border-t-2 ..., ink/black border colours, border-[...], rounded-* outside rounded-none|1|2|3|4|round (and rounded-[...]), borderRadius in style props.
// Violations print as file:line. Per-line escape for a legit exception: put `check-tokens-ignore` in a comment on the same line.
// Glass check: ink and text colours on --glass-bg / --glass-bg-yellow must hold 4.5:1 over the worst backdrops (pure black and pure white).
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const walk = (d) => readdirSync(d).flatMap((n) => { const p = join(d, n); return statSync(p).isDirectory() ? (n === 'node_modules' || n.startsWith('.') ? [] : walk(p)) : [p]; });
const appSrc = join(here, '..', '..', 'apps', 'booking', 'src');
const appFiles = walk(appSrc).filter((f) => /\.(css|tsx?)$/.test(f));
const wpCss = join(here, '..', '..', 'wordpress', 'wp-content', 'themes', 'haivan-web-child', 'assets', 'css');
const wpFiles = (() => { try { return readdirSync(wpCss).filter((f) => f.endsWith('.css')).map((f) => join(wpCss, f)); } catch { return []; } })();   // WP child theme CSS: checked like the app (v4)
const files = process.argv.slice(2).length ? process.argv.slice(2) : [...readdirSync(join(here, 'comps')).filter((f) => f.endsWith('.html')).map((f) => join(here, 'comps', f)), join(here, 'tokens-v4.css'), ...appFiles, ...wpFiles];
const isV4 = (f) => /-v4\.html$|radius-spec\.html$|apps\/booking\/src\/|haivan-web-child\/assets\/css\//.test(f);
const INK = /var\(--color-(ink|ink-deep|text|accent-ink)\)|\b(black|#000|#333)\b/i;
// Tailwind class tokens that break v4 (variant prefixes and ! are stripped before testing)
const BAD_CLASS = [
  [/^border(-[trblxyse])?-2$/, 'border-2: no 2px borders (focus ring or select-ring only)'],
  [/^border(-[trblxyse])?-(ink|ink-deep|black|text|foreground|accent-ink)(\/\d+)?$/, 'ink/black border colour: v4 has no black borders'],
  [/^border(-[trblxyse])?-\[/, 'border-[...]: use border (1px) + border-edge or border-rule'],
  [/^rounded(-(t|r|b|l|s|e|tl|tr|bl|br|ss|se|es|ee))?-(xs|sm|md|lg|xl|2xl|3xl|4xl|full|pill)$/, 'rounded-* outside the v4 map: use rounded-1/2/3/4/round'],
  [/^rounded(-(t|r|b|l|s|e|tl|tr|bl|br|ss|se|es|ee))?$/, 'bare rounded: use rounded-1/2/3/4/round'],
  [/^rounded(-(t|r|b|l|s|e|tl|tr|bl|br|ss|se|es|ee))?-\[/, 'rounded-[...]: radius must come from the v4 ladder'],
  [/^shadow-\[/, 'shadow-[...]: use shadow-1/2/3 or select-ring'],
];
function scanTsx(f, src) {
  const found = [];
  src.split('\n').forEach((line, i) => {
    if (/^\s*(\/\/|\*|\/\*)/.test(line) || line.includes('check-tokens-ignore')) return;
    if (/\bborderRadius\b\s*:/.test(line)) found.push(`  ${f}:${i + 1}  borderRadius in a style prop: use a rounded-* class`);
    for (const raw of line.split(/[\s"'`{}(),;]+/)) {
      const t = raw.replace(/^.*?:(?![^\[]*\])/, '').replace(/^!/, '');   // drop variant prefix (md:, hover:, data-[x]:)
      if (!t || !/[a-z]/.test(t)) continue;
      for (const [re, why] of BAD_CLASS) if (re.test(t)) { found.push(`  ${f}:${i + 1}  ${raw}  ${why}`); break; }
    }
  });
  return found;
}
const R_OK = /^var\(--r-(sm|md|lg|pill|1|2|3|4|round)\)$/, R_V4 = /^var\(--r-(1|2|3|4|round)\)$/;
const SH_OK = /^var\(--shadow-(card|float|raise|1|2|3)\)$|^var\(--glass-edge\)$|^var\(--select-ring\)$/, SH_V4 = /^var\(--shadow-(1|2|3)\)$|^var\(--glass-edge\)$|^var\(--select-ring\)$/;

const LEN = /(^|[\s(,*/+-])-?\d*\.?\d+(px|rem|em|vh|vw|dvh|ch|%)\b/;   // a non-zero raw length
const RULES = [
  [/^border-radius$/, (v) => v.trim().split(/\s+/).every((p) => R_OK.test(p) || p === '0'), 'radius must be --r-1..--r-4 or --r-round (v3 aliases --r-sm/md/lg/pill still legal outside v4 comps), or 0'],
  [/^(padding|margin)(-(top|right|bottom|left|inline|block)(-(start|end))?)?$/, (v) => !LEN.test(v), 'padding/margin must use --s-* tokens (or 0 / auto)'],
  [/^(gap|row-gap|column-gap)$/, (v) => !LEN.test(v), 'gap must use --s-* tokens'],
  [/^font-size$/, (v) => /^var\(--fs-[\w]+\)$/.test(v.trim()) || v.trim() === 'inherit', 'font-size must be a --fs-* token'],
  [/^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?$|^outline$/, (v) => !/\d+px/.test(v), 'border/outline width must be var(--line) or var(--line-strong)'],
  [/^(border|outline)(-(top|right|bottom|left))?-width$|^outline-offset$|^text-decoration-thickness$/, (v) => !/\d+px/.test(v.replace(/var\([^)]*\)/g, '')), 'width/thickness must be a line token'],
  [/^box-shadow$/, (v) => v.trim() === 'none' || v.split(/,(?![^(]*\))/).every((x) => SH_OK.test(x.trim()) || /^inset 0 0 0 var\(--line(-strong)?\) var\(--color-[\w-]+\)$/.test(x.trim())), 'box-shadow: only --shadow-1..3 (v3: card, float, raise), --glass-edge, --select-ring or an inset ring of a line token; comma lists allowed'],
];

let bad = 0;
const blank = (t) => t.replace(/[^\n]/g, ' ');   // keep line numbers when text is dropped
for (const f of files) {
  const src = readFileSync(f, 'utf8');
  const rel = f.replace(process.cwd() + '/', '');
  if (/\.tsx?$/.test(f)) {
    const found = scanTsx(rel, src);
    if (found.length) { bad += found.length; console.log(`${rel}: ${found.length} violation(s)\n${found.join('\n')}`); }
    continue;
  }
  let css = f.endsWith('.css') ? src : src.replace(/<style>([\s\S]*?)<\/style>|[\s\S]/g, (m, st) => (st === undefined ? (m === '\n' ? m : ' ') : blank('<style>') + st + blank('</style>')));
  css = css.replace(/\/\*[\s\S]*?\*\//g, blank);
  // walk blocks, tracking the line of each declaration
  const stack = []; let i = 0, cur = '', out = [], line = 1, curLine = 1;
  while (i < css.length) {
    const c = css[i];
    if (c === '\n') line++;
    if (c === '{') { stack.push(cur.trim()); cur = ''; }
    else if (c === '}') { if (cur.trim()) out.push({ sel: stack[stack.length - 1], decl: cur, line: curLine }); stack.pop(); cur = ''; }
    else if (c === ';') { out.push({ sel: stack[stack.length - 1], decl: cur, line: curLine }); cur = ''; }
    else { if (!cur.trim() && !/\s/.test(c)) curLine = line; cur += c; }
    i++;
  }
  const found = [];
  for (const { sel, decl, line: ln } of out) {
    if (!sel || sel === ':root' || sel.startsWith('@font-face') || sel.startsWith('@media') || sel.startsWith('@keyframes')) continue;
    const m = decl.match(/^\s*([a-z-]+)\s*:\s*([\s\S]+?)\s*$/);
    if (!m) continue;
    const [, prop, value] = m;
    const v = value.replace(/!important/, '').replace(/env\([^)]*\)/g, '0').trim();
    const at = `  ${rel}:${ln}  ${sel.slice(0, 50)} { ${prop}: ${v.slice(0, 60)} }`;
    for (const [re, ok, why] of RULES) if (re.test(prop) && !ok(v)) found.push(`${at}  ${why}`);
    if (isV4(f)) {
      const sels = sel.split(',').map((x) => x.trim());
      const focusOnly = sels.every((x) => /:focus/.test(x) || /^\.dont-/.test(x));
      const strike = sels.every((x) => /::(before|after)$/.test(x));   // decorative strike lines are not borders
      if (/^border/.test(prop) && INK.test(v) && !focusOnly) found.push(`${at}  black border: v4 has no ink borders (focus outlines only)`);
      if (prop === 'box-shadow' && /inset[^,]*var\(--color-(ink|ink-deep|text|accent-ink)\)/.test(v) && !focusOnly) found.push(`${at}  ink ring via inset box-shadow: use --select-ring or a 1px rule/edge ring`);
      if (/^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?(-width)?$/.test(prop) && /var\(--line-strong\)/.test(v) && !focusOnly && !strike) found.push(`${at}  2px border: use the select ring (box-shadow) or a 1px --line`);
      if (prop === 'border-radius' && v.split(/\s+/).some((p) => /^var\(--r-(sm|md|lg|pill)\)$/.test(p))) found.push(`${at}  v4 uses --r-1..--r-4 / --r-round, not the v3 aliases`);
      if (prop === 'box-shadow' && /var\(--shadow-(card|float|raise)\)/.test(v)) found.push(`${at}  v4 uses --shadow-1..3, not the v3 aliases`);
    }
  }
  if (found.length || !/apps\/booking\/src\/|haivan-web-child\/assets\/css\//.test(f)) console.log(`${rel}: ${found.length ? found.length + ' violation(s)' : 'ok'}`);
  if (found.length) { bad += found.length; console.log([...new Set(found)].join('\n')); }
}

// ---- contrast of the declared pairs (hex fallbacks in tokens.css)
const tok = readFileSync(join(here, 'tokens-v4.css'), 'utf8');
const hexOf = (name) => { if (name === 'select-bg') name = 'color-accent-soft'; /* --select-bg is an alias of --color-accent-soft */ const m = tok.match(new RegExp('--' + name + ':\\s*(#[0-9A-Fa-f]{6})')); if (!m) throw new Error('token without hex fallback: --' + name); return m[1]; };
const lum = (h) => { const [r, g, b] = [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(hexOf(a)), y = lum(hexOf(b)); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const PAIRS = [   // [text, ground, minimum]
  ['color-accent-ink', 'color-accent', 4.5], ['color-text', 'color-paper', 4.5], ['color-muted', 'color-paper', 4.5], ['color-muted', 'color-paper-2', 4.5], ['color-muted', 'color-tint-warm', 4.5],
  ['color-ink', 'color-tint-warm', 4.5], ['color-ink', 'color-accent-soft', 4.5], ['color-surface', 'color-ink', 4.5], ['color-muted-on-dark', 'color-ink', 4.5],
  ['color-error', 'color-error-soft', 4.5], ['color-success', 'color-success-soft', 4.5], ['color-link', 'color-surface', 4.5],
  ['color-ink', 'color-promo-orange', 4.5], ['color-on-strong', 'color-promo-teal', 4.5], ['color-on-strong', 'color-promo-coral', 4.5], ['color-on-strong', 'color-promo-leaf', 4.5], ['color-on-strong', 'color-promo-blue', 4.5],
  ...['orange', 'teal', 'coral', 'leaf', 'blue'].map((c) => ['color-ink', `color-promo-${c}-soft`, 4.5]),
  ['color-edge', 'color-surface', 3], ['color-select-edge', 'color-surface', 3], ['color-select-edge', 'color-paper', 3], ['color-select-edge', 'select-bg', 3], ['color-promo-coral', 'color-promo-coral-soft', 3], ['color-promo-teal', 'color-promo-teal-soft', 3], ['color-promo-leaf', 'color-promo-leaf-soft', 3], ['color-promo-blue', 'color-promo-blue-soft', 3],
];
let weak = 0;
for (const [t, g, min] of PAIRS) { const r = ratio(t, g); if (r < min) { weak++; console.log(`  contrast ${t} on ${g}: ${r.toFixed(2)} < ${min}`); } }
// glass: blend --glass-bg (surface 78%) and --glass-bg-yellow (accent 85%) over the worst backdrops, then test the text colours that may sit on glass
const rgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
const lumRgb = (c) => { const [r, g, b] = c.map((x) => x / 255).map((x) => (x <= 0.04045 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratioRgb = (a, b) => { const x = lumRgb(a), y = lumRgb(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const v4tok = readFileSync(join(here, 'tokens-v4.css'), 'utf8');
const GLASS = [['glass-bg', 'color-surface', 0.78], ['glass-bg-yellow', 'color-accent', 0.85]];
let glassN = 0;
for (const [g, base, a] of GLASS) {
  if (!new RegExp('--' + g + ':').test(v4tok)) { weak++; console.log('  tokens-v4.css lacks --' + g); continue; }
  for (const [bn, back] of [['black', [0, 0, 0]], ['white', [255, 255, 255]]]) {
    const bg = rgb(hexOf(base)).map((c, i) => Math.round(c * a + back[i] * (1 - a)));
    for (const t of ['color-ink', 'color-text']) { glassN++; const r = ratioRgb(rgb(hexOf(t)), bg); if (r < 4.5) { weak++; console.log(`  glass ${t} on ${g} over ${bn}: ${r.toFixed(2)} < 4.5`); } }
  }
}
for (const n of ['r-1', 'r-2', 'r-3', 'r-4', 'r-round', 'shadow-1', 'shadow-2', 'shadow-3', 'glass-bg', 'glass-bg-yellow', 'glass-blur', 'glass-saturate', 'glass-edge', 'select-bg', 'select-ring', 'color-select-edge', 'hairline']) if (!new RegExp('--' + n + ':').test(v4tok)) { weak++; console.log('  tokens-v4.css lacks --' + n); }
console.log(`glass contrast (worst case over black and white): ${glassN} pairs checked`);
console.log(`tokens contrast: ${weak ? weak + ' pair(s) below minimum' : PAIRS.length + ' pairs ok'}`);
if (weak) bad += weak;
if (bad) { console.log(`\ncheck-tokens: ${bad} violation(s)`); process.exit(1); }
console.log('check-tokens: all clean');
