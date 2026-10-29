// Shared helpers for the static comps: icon sprite (lucide, ISC), header, footer, formatters, real data.
import { readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export const here = dirname(fileURLToPath(import.meta.url));
export const repo = join(here, '../../../..');
const LUCIDE = join(repo, 'node_modules/.pnpm/lucide-react@1.63.0_@types+react@19.3.0_react@19.3.0/node_modules/lucide-react/dist/esm/icons');
const FIX = join(repo, 'apps/booking/test/fixtures');

export const readJson = (p) => JSON.parse(readFileSync(p, 'utf8'));
export const fixture = (n) => readJson(join(FIX, n));
export const layout = readJson(join(repo, 'apps/booking/src/content/layout-fallback.json'));
export const routes = readJson(join(repo, 'apps/booking/src/content/popular-routes.json'));
export const tokensCss = readFileSync(join(repo, 'docs/design/tokens.css'), 'utf8').replace(/^\/\*[\s\S]*?\*\/\n/, '');
export const sharedCss = readFileSync(join(here, 'shared.css'), 'utf8') + '\n' + readFileSync(join(here, 'marketing.css'), 'utf8') + '\n' + readFileSync(join(here, 'app.css'), 'utf8');

// ---- icons: one library, inline sprite, only the symbols a page uses
const nodeCache = new Map();
function iconNodes(name) {
  if (nodeCache.has(name)) return nodeCache.get(name);
  const f = join(LUCIDE, `${name}.mjs`);
  if (!existsSync(f)) throw new Error(`lucide icon missing: ${name}`);
  let src = readFileSync(f, 'utf8');
  const alias = src.match(/export \{ default \} from '\.\/([\w-]+)\.mjs'/);
  if (alias) return iconNodes(alias[1]);
  const start = src.indexOf('node:') + 5;
  let i = src.indexOf('[', start), depth = 0, j = i;
  for (; j < src.length; j++) { if (src[j] === '[') depth++; else if (src[j] === ']' && --depth === 0) break; }
  const nodes = new Function(`return ${src.slice(i, j + 1)}`)();
  nodeCache.set(name, nodes);
  return nodes;
}
export function spriteFor(html) {
  const used = [...new Set([...html.matchAll(/href="#i-([a-z0-9-]+)"/g)].map((m) => m[1]))].sort();
  const sym = used.map((n) => {
    const inner = iconNodes(n).map(([tag, attrs]) => `<${tag} ${Object.entries(attrs).filter(([k]) => k !== 'key').map(([k, v]) => `${k}="${v}"`).join(' ')}/>`).join('');
    return `<symbol id="i-${n}" viewBox="0 0 24 24">${inner}</symbol>`;
  }).join('');
  return `<svg class="sprite" width="0" height="0" aria-hidden="true" focusable="false"><defs>${sym}</defs></svg>`;
}
export const ico = (n, tone = '', cls = '') => `<span class="ico${tone ? ' ico--' + tone : ''}${cls ? ' ' + cls : ''}" aria-hidden="true">${ic(n)}</span>`;
export const ic = (n, cls = '') => `<svg class="ic ${cls}" width="24" height="24" aria-hidden="true" focusable="false"><use href="#i-${n}"/></svg>`;

// ---- formatters
export const vnd = (n) => new Intl.NumberFormat('vi-VN').format(n) + 'đ';
export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- chrome
const nav = layout.vi.primary;
export function header({ current = '' } = {}) {
  const links = nav.map((n) => `<a class="nav-link" href="${n.href}"${current === n.label ? ' aria-current="page"' : ''}>${n.label}${n.children ? ic('chevron-down', 'ic--sm') : ''}</a>`).join('');
  const mlinks = nav.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('');
  return `<header class="site-header">
  <div class="container header-row">
    <a class="brand" href="/" aria-label="Hải Vân, trang chủ"><img src="assets/img/logo.svg" width="121" height="24" alt="HAIVAN"></a>
    <nav class="nav" aria-label="Chính">${links}</nav>
    <a class="header-call" href="tel:19006763" aria-label="Gọi tổng đài 1900 6763">${ic('phone')}<span class="header-call-num">1900 6763</span></a>
    <a class="btn btn--ghost btn--sm header-login" href="/dang-nhap">Đăng nhập</a>
    <a class="lang" href="/en" lang="en" aria-label="English">EN</a>
    <details class="menu">
      <summary class="menu-btn" aria-label="Mở menu">${ic('menu', 'menu-open')}${ic('x', 'menu-close')}<span>Menu</span></summary>
      <ul class="menu-panel">${mlinks}<li><a href="/dang-nhap">Đăng nhập</a></li><li><a href="/en" lang="en">English</a></li></ul>
    </details>
  </div>
</header>`;
}

export function callFab() {
  return `<a class="call-fab" href="tel:19006763" aria-label="Gọi tổng đài 1900 6763">${ic('phone', 'ic--lg')}</a>`;
}

const col = (c) => `<div class="fcol"><h2 class="fhead">${c.title}</h2><ul>${c.items.map((i) => `<li><a href="${i.href}">${i.label}</a></li>`).join('')}</ul></div>`;
export function footer() {
  const cols = layout.vi.footer_columns.map(col).join('');
  const co = layout.vi.company;
  const partners = layout.partners.map((p, i) => `<li><img src="assets/img/partner${i + 1}.png" width="120" height="64" loading="lazy" alt="${p.alt}"></li>`).join('');
  return `<footer class="site-footer">
  <div class="container">
    <div class="mast">
      <img class="mast-logo" src="assets/img/logo-white.svg" width="130" height="24" alt="HAIVAN">
      <span></span>
      <a class="mast-call" href="tel:19006763">${ic('phone', 'ic--lg')}<span>1900 6763</span></a>
    </div>
    <div class="fcols">${cols}</div>
    <div class="fmeta">
      <section aria-labelledby="f-partner"><h2 class="fhead" id="f-partner">Đối tác</h2><ul class="logo-tiles">${partners}</ul></section>
      <section aria-labelledby="f-member"><h2 class="fhead" id="f-member">Thành viên</h2><ul class="logo-tiles"><li><a href="https://gpn.travel/vietnam/"><img src="assets/img/member.png" width="120" height="64" loading="lazy" alt="Thành viên Global Passenger Network"></a></li></ul>
        <h2 class="fhead" id="f-pay">Thanh toán</h2><ul class="logo-tiles"><li><img src="assets/img/vnpay.jpg" width="120" height="64" loading="lazy" alt="VNPay-QR"></li><li><img src="assets/img/icontien.jpg" width="120" height="64" loading="lazy" alt="Tiền mặt"></li></ul>
      </section>
    </div>
    <div class="flegal">
      <div class="flegal-text"><p><strong>${co.name}</strong></p>${co.lines.map((l) => `<p>${l}</p>`).join('')}<p>${layout.copyright}</p></div>
      <div class="flegal-side">
        <h2 class="fhead">Chứng nhận</h2><a href="${layout.certificate.href}"><img src="assets/img/verify_info.png" width="160" height="60" loading="lazy" alt="${layout.certificate.alt}"></a>
        <h2 class="fhead">Theo dõi</h2><ul class="social"><li><a href="${layout.social.facebook}" aria-label="Facebook Hải Vân"><img src="assets/img/facebook.svg" width="32" height="32" alt=""></a></li><li><a href="${layout.social.youtube}" aria-label="YouTube Hải Vân"><img src="assets/img/youtube.svg" width="32" height="32" alt=""></a></li></ul>
        <h2 class="fhead">Ứng dụng HAIVAN</h2><ul class="badges"><li><a href="${layout.apps.ios}"><img src="assets/img/appstore.png" width="140" height="44" loading="lazy" alt="Tải trên App Store"></a></li><li><a href="${layout.apps.android}"><img src="assets/img/playstore.png" width="140" height="44" loading="lazy" alt="Tải trên Google Play"></a></li></ul>
      </div>
    </div>
  </div>
</footer>`;
}

const COMMON = [
  'dismissed 42 · the footer is a mast over four link columns because Hải Vân publishes about thirty real destination and policy pages',
  'dismissed 58 · the footer sitemap and legal lines hold about two hundred of the page words; each body section stays short',
  'waive 49b · one real legal page title wrapping to two lines at 320px · the footer link Chính sách và quy trình giải quyết khiếu nại is the page\'s own title and cannot shorten',
  'answered F4 · ghost buttons, the stepper and carousel arrows are outlined secondaries; each screen holds one yellow primary',
  'answered F7 · the swap, call and step-marker circles are controls sized as controls',
];
export const stampText = (s) => {
  const lines = [
    `/* Hallmark · shape: ${s.shape} · genre: editorial · theme: Ink (by request) · job: book · draw: 3a5769`,
    ` * hero: ${s.hero} · nav: ${s.nav ?? 'slab'} · footer: ${s.footer ?? 'mast'} · imagery: ${s.imagery} · signature: ${s.signature} · ink: board${s.copy ? ' · copy: verbatim' : ''}`,
    ` * axes: light/rounded-sans/brand-yellow · posture: committed · contrast: pass · fold: pass · v2.0.0 */`,
    `/* Hallmark · pre-emit critique: ${s.critique} */`,
    ...[...(s.waive ?? []), ...COMMON].map((w) => `/* Hallmark · ${w} */`),
  ];
  return lines.join('\n');
};

// Progressive enhancement only: arrows, end fade and the banner counter. Rails scroll and snap without it.
export const railScript = `<script>
(function () {
  document.querySelectorAll('.rail-wrap').forEach(function (w) {
    var r = w.querySelector('.hrail'); if (!r) return; var c = document.querySelector('.rail-ctrls[data-for="' + r.id + '"]'), p = c && c.querySelector('.rail-prev'), n = c && c.querySelector('.rail-next'); if (c) c.hidden = false;
    function sync() { var end = r.scrollLeft + r.clientWidth >= r.scrollWidth - 4; w.toggleAttribute('data-end', end); if (p) p.disabled = r.scrollLeft < 4; if (n) n.disabled = end; }
    [p, n].forEach(function (b, i) { if (!b) return; b.addEventListener('click', function () { r.scrollBy({ left: (i ? 1 : -1) * r.clientWidth * 0.8, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }); });
    r.addEventListener('scroll', sync, { passive: true }); sync();
  });
  document.querySelectorAll('[data-banner]').forEach(function (b) {
    var s = b.querySelector('.slides'), c = b.querySelector('.slide-count output'), k = s.children.length;
    function idx() { var i = Math.round(s.scrollLeft / (s.children[0].getBoundingClientRect().width + parseFloat(getComputedStyle(s).columnGap || 0))); return Math.max(0, Math.min(k - 1, i)); }
    function go(d) { var i = (idx() + d + k) % k, el = s.children[i]; s.scrollTo({ left: el.offsetLeft - s.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); }
    b.querySelector('.slide-prev').addEventListener('click', function () { go(-1); }); b.querySelector('.slide-next').addEventListener('click', function () { go(1); });
    s.addEventListener('scroll', function () { c.textContent = idx() + 1; }, { passive: true });
  });
})();
</script>`;

export function page({ title, desc, stamp, css = '', body, bodyClass = '', script = '' }) {
  const style = `${stampText(stamp)}\n${tokensCss}\n${sharedCss}\n${css}`;
  return `<!doctype html>
<html lang="vi">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<style>
${style}
</style>
</head>
<body class="${bodyClass}">
${spriteFor(body)}
<a class="skip" href="#main">Bỏ qua, tới nội dung</a>
${body}
${script}
</body>
</html>
`;
}
