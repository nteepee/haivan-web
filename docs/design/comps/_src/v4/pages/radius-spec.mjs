import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { ic } from '../../lib.mjs';
import { v4here } from '../lib-v4.mjs';

const raw = readFileSync(join(v4here, '..', '..', 'assets/img/logo.svg'), 'utf8');
const paths = [...raw.matchAll(/<path[^>]*?\/>/g)].map((m) => m[0].replace(/fill="#58595B"/g, 'fill="currentColor"')).join('');
// logo at 7x: viewBox 121x24; corner circles: r = 2 units (k = 2/24 = 1/12) on outer corners that are rounded in the artwork
const corners = [[2, 22], [4.75, 1.95]];
const logoBig = `<svg class="logo-big" viewBox="-2 -3 125 30" role="img" aria-label="Logo HAIVAN với bán kính góc bo r bằng 2 trên chiều cao chữ 24">
  <g class="logo-fill">${paths}</g>
  ${corners.map(([x, y]) => `<circle class="corner-ring" cx="${x}" cy="${y}" r="2"/>`).join('')}
  <line class="dim" x1="-1.2" y1="0" x2="-1.2" y2="24"/><line class="dim" x1="-1.9" y1="0" x2="-0.5" y2="0"/><line class="dim" x1="-1.9" y1="24" x2="-0.5" y2="24"/>
  <text class="dim-t" font-size="1.1" x="-2.4" y="12.8" text-anchor="end">24</text>
</svg>`;
// zoom on the H bottom-left corner: 8 x 8 units at 40x
const zoom = `<svg class="logo-zoom" viewBox="-1 17 7 8" role="img" aria-label="Phóng to góc dưới trái của chữ H: cung bo bán kính 2 đơn vị">
  <g class="logo-fill">${paths}</g>
  <circle class="corner-ring" cx="2" cy="22" r="2"/>
  <line class="dim" x1="2" y1="22" x2="2" y2="24"/><line class="dim" x1="0" y1="22" x2="2" y2="22"/>
  <circle class="dot" cx="2" cy="22" r="0.12"/>
  <text class="dim-t" font-size="0.95" x="2.35" y="23.2">r = 2</text>
</svg>`;

const row = (tok, side, raw, r, uses, h, w = 240) => `<tr><th scope="row"><code>${tok}</code></th><td class="num">${side}</td><td class="num">${raw}</td><td class="num">${r}</td><td>${uses}</td></tr>`;
const sample = (cls, h, label) => `<figure class="sw"><div class="sw-box ${cls}" style="height:${h}px"><span>${label}</span></div></figure>`;

const css = `
body { background: var(--color-surface); }
.sheet { padding-block: var(--s-12) var(--s-16); display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--s-16); }
.sheet h1 { max-width: none; font-size: var(--fs-40); line-height: var(--lh-40); }
.sheet h2 { max-width: none; margin-bottom: var(--s-4); }
.sheet p.lead { max-width: 70ch; }
.sheet code { white-space: nowrap; font-family: ui-monospace, "SFMono-Regular", Menlo, monospace; font-size: var(--fs-14); background: var(--color-paper-2); padding: 0 var(--s-1); border-radius: var(--r-1); }
.top { display: grid; gap: var(--s-3); }
.k-badge { display: inline-flex; width: fit-content; }
/* A. logo */
.a-grid { display: grid; gap: var(--s-6); grid-template-columns: minmax(0, 1fr); align-items: start; }
.panel { background: var(--color-paper); border-radius: var(--r-3); padding: var(--s-6); box-shadow: var(--shadow-1); display: grid; gap: var(--s-4); align-content: start; }
.logo-big { width: 100%; height: auto; color: var(--color-ink); overflow: visible; }
.logo-zoom { width: 100%; max-width: 20rem; height: auto; color: var(--color-ink); background: var(--color-surface); border-radius: var(--r-2); }
.logo-fill { fill: currentColor; }
.corner-ring { fill: none; stroke: var(--color-accent); stroke-width: 0.14; }
.dim { stroke: var(--color-promo-coral); stroke-width: 0.1; fill: none; }
.dot { fill: var(--color-promo-coral); }
.dim-t { font-family: var(--font-display); font-weight: 800; fill: var(--color-promo-coral); }
.facts { display: grid; gap: var(--s-2); }
.facts li { display: flex; gap: var(--s-3); align-items: start; }
.facts .ic { color: var(--color-success); margin-top: var(--s-1); }
@media (min-width: 60rem) { .a-grid { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); } }
/* B. table + swatches */
.tbl { width: 100%; border-collapse: collapse; background: var(--color-paper); border-radius: var(--r-3); overflow: hidden; box-shadow: var(--shadow-1); }
.tbl th, .tbl td { padding: var(--s-3) var(--s-4); text-align: left; vertical-align: top; font-weight: var(--weight-body); }
.tbl thead th { background: var(--color-paper-3); font-weight: var(--weight-display); font-size: var(--fs-14); line-height: var(--lh-14); }
.tbl tbody tr + tr > * { border-top: var(--hairline); }
.tbl .num { font-variant-numeric: tabular-nums; white-space: nowrap; }
@media (max-width: 39.99rem) {
  .tbl thead { display: none; }
  .tbl tbody tr { display: grid; gap: var(--s-1); padding: var(--s-3) var(--s-4); }
  .tbl tbody tr + tr { border-top: var(--hairline); }
  .tbl tbody tr + tr > * { border-top: 0; }
  .tbl th, .tbl td { padding: 0; white-space: normal; }
}
.swatches { display: flex; flex-wrap: wrap; align-items: end; gap: var(--s-6); margin-top: var(--s-6); }
.sw { display: grid; gap: var(--s-2); justify-items: start; }
.sw-box { width: 240px; display: grid; place-content: center; background: var(--color-accent); color: var(--color-accent-ink); font-weight: var(--weight-display); text-align: center; }
.sw-box span { padding: var(--s-2); }
.r1 { border-radius: var(--r-1); } .r2 { border-radius: var(--r-2); } .r3 { border-radius: var(--r-3); } .r4 { border-radius: var(--r-4); }
.sw figcaption { font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); margin: 0; }
/* C. concentric */
.c-grid { display: grid; gap: var(--s-6); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 60rem) { .c-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.nest { display: grid; gap: var(--s-3); align-content: start; }
.nest-outer { background: var(--color-paper-3); color: var(--color-ink); box-shadow: var(--shadow-1); padding: var(--pad); height: 168px; }
.nest-inner { background: var(--color-accent); color: var(--color-accent-ink); height: 100%; display: grid; place-content: center; font-weight: var(--weight-display); text-align: center; }
.n1 { --pad: var(--s-2); border-radius: var(--r-3); } .n1 .nest-inner { border-radius: var(--r-2); }
.n2 { --pad: var(--s-3); border-radius: var(--r-3); } .n2 .nest-inner { border-radius: var(--r-1); }
.n3 { --pad: var(--s-2); border-radius: var(--r-4); } .n3 .nest-inner { border-radius: var(--r-3); }
.n-bad { --pad: var(--s-3); border-radius: var(--r-3); } .n-bad .nest-inner { border-radius: var(--r-3); }
.nest p { font-size: var(--fs-14); line-height: var(--lh-14); }
.formula { display: flex; flex-wrap: wrap; gap: var(--s-3) var(--s-6); align-items: center; padding: var(--s-4) var(--s-6); background: var(--color-accent-soft); border-radius: var(--r-3); font-weight: var(--weight-strong); margin-bottom: var(--s-6); }
.formula strong { font-size: var(--fs-20); line-height: var(--lh-20); }
/* D. do / don't */
.dd { display: grid; gap: var(--s-4); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 40rem) { .dd { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 90rem) { .dd { grid-template-columns: repeat(4, minmax(0, 1fr)); } }
.dd-item { display: grid; gap: var(--s-3); align-content: start; }
.dd-pair { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-3); }
.verdict { display: grid; gap: var(--s-2); align-content: start; justify-items: start; }
.verdict .tag { font-weight: var(--weight-display); }
.tag--ok { background: var(--color-success-soft); color: var(--color-success); box-shadow: inset 0 0 0 var(--line) var(--color-success); }
.tag--no { background: var(--color-error-soft); color: var(--color-error); box-shadow: inset 0 0 0 var(--line) var(--color-error); }
.demo { display: grid; place-items: center; min-height: 96px; width: 100%; background: var(--color-paper-2); border-radius: var(--r-2); padding: var(--s-3); }
.demo .badge { }
.demo-photo { background: url("assets/img/home-hero.jpg") 50% 70% / cover; position: relative; overflow: hidden; }
.demo-photo .glass { padding: var(--s-3); border-radius: var(--r-3); font-weight: var(--weight-strong); color: var(--color-ink); text-align: center; }
.dd-item h3 { font-size: var(--fs-18); line-height: var(--lh-18); }
.dd-item p { font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); }
/* negative examples: the lint exempts selectors starting with .dont- */
.dont-pill { border-radius: var(--r-4); }
.dont-mixed { background: var(--color-accent); padding: var(--s-4); border-radius: var(--r-3) var(--r-1) var(--r-4) var(--r-2); font-weight: var(--weight-display); }
.dont-black { background: var(--color-surface); padding: var(--s-4); border: var(--line-strong) solid var(--color-ink); border-radius: var(--r-3); font-weight: var(--weight-display); }
.dont-wide-round { border-radius: var(--r-round); min-width: 96px; }
.specimen { background: var(--color-surface); padding: var(--s-4); border-radius: var(--r-3); box-shadow: var(--shadow-1); font-weight: var(--weight-display); }
.do-round { width: var(--control-h); height: var(--control-h); border: 0; border-radius: var(--r-round); background: var(--color-accent); box-shadow: var(--shadow-1); display: grid; place-items: center; }
.dont-flat-glass { padding: var(--s-3); border-radius: var(--r-3); font-weight: var(--weight-strong); }
`;

const swatch = [['r1', 48, 'r-1, 4px, nút 48'], ['r2', 96, 'r-2, 8px, hàng 96'], ['r3', 192, 'r-3, 16px, form 192'], ['r4', 288, 'r-4, 24px, ảnh 288']]
  .map(([c, h, l]) => `<figure class="sw"><div class="sw-box ${c}" style="height:${h}px"><span>${l}</span></div></figure>`).join('');

const body = `<main id="main" class="container sheet">
  <header class="top">
    <h1>Bo góc suy ra từ logo HAIVAN</h1>
    <p class="lead">Góc bo của chữ khối trong logo bằng khoảng 1/12 chiều cao chữ. Mọi bán kính trên site đều là bội số của tỉ lệ đó, khoá thành bốn bậc. Không có giá trị thứ năm, ngoại trừ hình tròn cho nút chỉ có icon.</p>
  </header>

  <section aria-labelledby="a-h">
    <h2 id="a-h">1. Hình học logo: r = 2 trên chiều cao 24, k = 1/12</h2>
    <div class="a-grid">
      <div class="panel">${logoBig}<p class="muted">Vòng vàng: cung bo thật của chữ, r = 2. Đỉnh trong A, V, N sắc nhọn.</p></div>
      <div class="panel">${zoom}<ul class="facts"><li>${ic('check', 'ic--sm')}<span>Phóng 40 lần: cung (0, 22) đến (2, 24), tâm (2, 22)</span></li><li>${ic('check', 'ic--sm')}<span>k = 2 / 24 = 1/12</span></li><li>${ic('check', 'ic--sm')}<span>Bo nhẹ, không pill</span></li></ul></div>
    </div>
  </section>

  <section aria-labelledby="b-h">
    <h2 id="b-h">2. Bảng suy ra: cạnh ngắn x 1/12, làm tròn về bậc gần nhất</h2>
    <div class="formula"><strong>r = cạnh ngắn / 12</strong><span>gần nhất của 4, 8, 16, 24</span><span>Khung chứa nội dung dừng ở r-3. r-4 chỉ cho ảnh.</span></div>
    <table class="tbl">
      <thead><tr><th scope="col">Token</th><th scope="col">Cạnh ngắn</th><th scope="col">x 1/12</th><th scope="col">Bán kính</th><th scope="col">Dùng cho (đo trong comp)</th></tr></thead>
      <tbody>
        ${row('--r-1', '≤ 72 px', '4 (nút 48 = 4,0)', '4px', 'Nút, ô nhập, chip, tab, tag, ghế')}
        ${row('--r-2', '73 đến 144 px', '8 (96 = 8,0)', '8px', 'Ảnh lồng trong thẻ, thẻ địa chỉ, menu')}
        ${row('--r-3', '145 đến 240 px', '16 (192 = 16,0)', '16px', 'Thẻ ưu đãi, tuyến, chuyến, form tìm, dialog, thanh dính')}
        ${row('--r-4', '> 240 px, chỉ ảnh', '≥ 20 (kẹp 24)', '24px', 'Banner chính, ảnh lớn, bản đồ')}
        ${row('--r-round', 'ô vuông chỉ icon', '-', '50%', 'Nút gọi, mũi tên, nút đóng')}
      </tbody>
    </table>
    <div class="swatches" aria-label="Bốn bậc bo góc ở kích thước thật">${swatch}</div>
  </section>

  <section aria-labelledby="c-h">
    <h2 id="c-h">3. Lồng nhau: bán kính trong = bán kính ngoài trừ khoảng đệm</h2>
    <div class="formula"><strong>r trong = r ngoài − padding, tối thiểu r-1</strong><span>Cùng tâm cung, hai đường cong song song, không bị phình ở góc</span></div>
    <div class="c-grid">
      <div class="nest"><div class="nest-outer n1"><div class="nest-inner">r-2</div></div><p><strong>r-3 − s-2 = r-2.</strong> Ảnh lồng trong thẻ.</p></div>
      <div class="nest"><div class="nest-outer n2"><div class="nest-inner">r-1</div></div><p><strong>r-3 − s-3 = r-1.</strong> Thanh dính chứa chip.</p></div>
      <div class="nest"><div class="nest-outer n3"><div class="nest-inner">r-3</div></div><p><strong>r-4 − s-2 = r-3.</strong> Khung banner.</p></div>
    </div>
    <div class="c-grid" style="margin-top: var(--s-6)">
      <div class="nest"><div class="nest-outer n-bad"><div class="nest-inner">r-3 trong r-3</div></div><p><strong>Sai:</strong> cùng bán kính, góc trong phình.</p></div>
    </div>
  </section>

  <section aria-labelledby="d-h">
    <h2 id="d-h">4. Nên và không nên</h2>
    <div class="dd">
      <div class="dd-item"><h3>Badge và tag</h3>
        <div class="dd-pair">
          <div class="verdict"><span class="tag tag--no">${ic('x')}Không</span><div class="demo"><span class="badge badge--sale dont-pill">Tiết kiệm 101k</span></div></div>
          <div class="verdict"><span class="tag tag--ok">${ic('check')}Nên</span><div class="demo"><span class="badge badge--sale">Tiết kiệm 101k</span></div></div>
        </div><p>Badge là chữ nhật r-1.</p></div>
      <div class="dd-item"><h3>Một khung, một bán kính</h3>
        <div class="dd-pair">
          <div class="verdict"><span class="tag tag--no">${ic('x')}Không</span><div class="demo"><div class="dont-mixed">4 góc khác nhau</div></div></div>
          <div class="verdict"><span class="tag tag--ok">${ic('check')}Nên</span><div class="demo"><div class="specimen">r-3 cả bốn</div></div></div>
        </div><p>Tròn chỉ cho nút icon.</p></div>
      <div class="dd-item"><h3>Viền đen và ánh sáng</h3>
        <div class="dd-pair">
          <div class="verdict"><span class="tag tag--no">${ic('x')}Không</span><div class="demo"><div class="dont-black">Viền ink 2px</div></div></div>
          <div class="verdict"><span class="tag tag--ok">${ic('check')}Nên</span><div class="demo" style="background: var(--color-paper-2)"><div class="specimen">Nền đặc + shadow-1</div></div></div>
        </div><p>Viền ink chỉ còn ở focus.</p></div>
      <div class="dd-item"><h3>Kính chỉ ở lớp nổi</h3>
        <div class="dd-pair">
          <div class="verdict"><span class="tag tag--no">${ic('x')}Không</span><div class="demo"><div class="glass dont-flat-glass">Kính trên nền phẳng</div></div></div>
          <div class="verdict"><span class="tag tag--ok">${ic('check')}Nên</span><div class="demo demo-photo"><div class="glass">Kính trên ảnh</div></div></div>
        </div><p>Chỉ lớp nổi, chữ từ 16px.</p></div>
    </div>
  </section>
</main>`;

export default {
  title: 'Quy chuẩn bo góc v4 | Hải Vân',
  desc: 'Hệ bo góc 4/8/16/24 suy ra từ hình học logo HAIVAN, quy tắc lồng đồng tâm, nên và không nên.',
  stamp: {
    shape: 'spec sheet (internal, not a page of the site)', hero: 'none', imagery: 'logo geometry and token swatches', signature: 'logo corner annotated at 40x with k = 1/12',
    critique: 'P3 H4 E4 S3 R4 V4 · an internal reference sheet, not a marketing page',
    waive: ['waive 44c · internal reference sheet, not a landing page · the title block is the first screen, the logo plate follows below · nothing to fill beside a hero visual','waive 59 · internal reference sheet, sections sit 64px apart · each section is one table or one diagram, so a tighter rhythm reads as one document · not a marketing page','waive 78 · section heads at 32px under a 40px sheet title · the type scale tops at 40 outside the home hero · a spec sheet is scanned','dismissed 58 · the screen holds the derivation table and its annotations, which are the specification the owner asked for, not marketing copy; a table is read by row','note glass · the do/don\'t strip shows glass on purpose, one demo on a photo and one counter-example'],
  },
  css,
  body,
};
