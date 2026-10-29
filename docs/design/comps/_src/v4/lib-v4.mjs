// v4 page shell: tokens-v4.css + styles-v4.css + page css. Reuses icons, header, footer, data from the v3 lib (unchanged).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { here, repo, spriteFor, esc, stampText } from '../lib.mjs';

export const v4here = join(here, 'v4');
export const tokensV4 = readFileSync(join(repo, 'docs/design/tokens-v4.css'), 'utf8').replace(/^\/\*[\s\S]*?\*\/\n/, '');
export const stylesV4 = readFileSync(join(v4here, 'styles-v4.css'), 'utf8');

// v4 search form (glass card on home, plain card elsewhere): same markup as v3 parts.searchPanel, v4 css
export const plateCss = `
.plate { border-radius: var(--r-3); }
.plate-grid { display: grid; gap: var(--gap-field) var(--s-4); padding: var(--card-pad); grid-template-columns: minmax(0, 1fr); }
.p-swap { justify-self: end; margin-block: calc(-1 * var(--s-1)); }
.p-go { margin-top: var(--s-2); }
@media (min-width: 40rem) {
  .field-msg:empty { display: flex; }
  .plate-grid { grid-template-columns: minmax(0, 1fr) var(--control-h) minmax(0, 1fr); align-items: start; gap: var(--gap-field) var(--s-3); }
  .p-swap { justify-self: center; margin: calc(var(--lh-16) + var(--s-2)) 0 0; }
  .p-date { grid-column: 1; } .p-people { grid-column: 3; } .p-go { grid-column: 1 / -1; margin-top: var(--s-3); }
}
.plate .tabs { margin: var(--card-pad) var(--card-pad) 0; }
@media (min-width: 40rem) { .plate .tabs { width: fit-content; } }
/* text on glass is 16px or larger: labels, tabs, values */
.plate .field > label, .plate .field > .label { font-size: var(--fs-16); line-height: var(--lh-16); }
.plate .field-msg:empty { display: none; }
`;

export function page({ title, desc, stamp, css = '', body, bodyClass = '', script = '' }) {
  const style = `${stampText(stamp)}\n/* v4: radius ladder r-1..r-4 from the logo, glass on floating layers only, no black borders. Source: docs/design/v4-glass-radius-proposal.md */\n${tokensV4}\n${stylesV4}\n${css}`;
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

// progressive enhancement: open the login dialog from the header link; the link still goes to /dang-nhap without JS
export const dialogScript = `<script>
(function () {
  var d = document.getElementById('login-dialog'); if (!d || !d.showModal) return;
  document.querySelectorAll('[data-open-login]').forEach(function (a) { a.addEventListener('click', function (e) { e.preventDefault(); d.showModal(); }); });
  d.querySelectorAll('[data-close]').forEach(function (b) { b.addEventListener('click', function () { d.close(); }); });
  d.addEventListener('click', function (e) { if (e.target === d) d.close(); });
})();
</script>`;

// ---- v4 header: glass-yellow, sticky. Login opens the dialog (progressive).
import { layout, ic } from '../lib.mjs';
export function headerV4({ current = '' } = {}) {
  const nav = layout.vi.primary;
  const links = nav.map((n) => `<a class="nav-link" href="${n.href}"${current === n.label ? ' aria-current="page"' : ''}>${n.label}${n.children ? ic('chevron-down', 'ic--sm') : ''}</a>`).join('');
  const mlinks = nav.map((n) => `<li><a href="${n.href}">${n.label}</a></li>`).join('');
  return `<header class="site-header glass-yellow">
  <div class="container header-row">
    <a class="brand" href="/" aria-label="Hải Vân, trang chủ"><img src="assets/img/logo.svg" width="121" height="24" alt="HAIVAN"></a>
    <nav class="nav" aria-label="Chính">${links}</nav>
    <a class="header-call" href="tel:19006763" aria-label="Gọi tổng đài 1900 6763">${ic('phone')}<span class="header-call-num">1900 6763</span></a>
    <a class="btn btn--ghost btn--sm header-login" href="/dang-nhap" data-open-login>Đăng nhập</a>
    <a class="lang" href="/en" lang="en" aria-label="English">EN</a>
    <details class="menu">
      <summary class="menu-btn" aria-label="Mở menu">${ic('menu', 'menu-open')}${ic('x', 'menu-close')}<span>Menu</span></summary>
      <ul class="menu-panel">${mlinks}<li><a href="/dang-nhap" data-open-login>Đăng nhập</a></li><li><a href="/en" lang="en">English</a></li></ul>
    </details>
  </div>
</header>`;
}

// login dialog: scrim + glass sheet. Fields are solid; every label on the glass is 16px or larger.
export const loginDialog = (open = false) => `<dialog id="login-dialog" aria-labelledby="login-title"${open ? ' open' : ''}>
  <form class="dialog-body" method="dialog" action="/dang-nhap">
    <div class="dialog-head"><h2 id="login-title">Đăng nhập</h2><button class="dialog-close" type="button" data-close aria-label="Đóng">${ic('x')}</button></div>
    <p class="lead">Xem vé đã đặt và tích điểm thưởng bằng số điện thoại.</p>
    <div class="field"><label for="lg-phone">Số điện thoại</label><div class="input-wrap">${ic('phone')}<input class="input" id="lg-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="Nhập số điện thoại"></div></div>
    <div class="field"><label for="lg-pass">Mật khẩu</label><div class="input-wrap">${ic('lock')}<input class="input" id="lg-pass" name="password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu"></div></div>
    <button class="btn btn--lg btn--block" type="submit">Đăng nhập</button>
    <p class="dialog-alt"><a class="link" href="/quen-mat-khau">Quên mật khẩu</a><a class="link" href="/dang-ky">Tạo tài khoản</a></p>
  </form>
</dialog>`;
