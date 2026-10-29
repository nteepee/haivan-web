import { footer, callFab, ic, ico, fixture, vnd } from '../../lib.mjs';
import { headerV4, loginDialog, dialogScript } from '../lib-v4.mjs';

const hhmm = (s) => s.slice(11, 16);
const trips = fixture('trips.json').data.filter((t) => t.time >= '06:30' && t.time <= '10:30').sort((a, b) => a.time.localeCompare(b.time));
const states = { '07:30': 'few', '09:30': 'sold' };      // sample states: the captured trips all have 11 of 11 seats free

const seatBtn = (n, price, st = 'free') => {
  if (st === 'booked') return `<button class="seat seat--booked" type="button" aria-disabled="true" aria-label="Ghế ${n}, đã đặt"><span class="seat-no">${n}</span><span class="seat-price">Đã đặt</span></button>`;
  const on = st === 'on';
  return `<button class="seat" type="button" aria-pressed="${on}" aria-label="Ghế ${n}, ${vnd(price)}${on ? ', đang chọn' : ''}"><span class="seat-no">${n}</span><span class="seat-price num">${new Intl.NumberFormat('vi-VN').format(price)}</span>${on ? ic('check') : ''}</button>`;
};
const empty = '<span class="seat-empty" aria-hidden="true"></span>';
const wheels = '<i class="wheel wheel--l wheel--f" aria-hidden="true"></i><i class="wheel wheel--r wheel--f" aria-hidden="true"></i><i class="wheel wheel--l wheel--b" aria-hidden="true"></i><i class="wheel wheel--r wheel--b" aria-hidden="true"></i>';
const bus = `<div class="bus2" role="group" aria-label="Sơ đồ ghế Luxury 11 chỗ">${wheels}
  <div class="bus2-cab"><div class="bus2-driver"><i aria-hidden="true"></i>Tài xế</div><p class="bus2-front">Đầu xe</p><span aria-hidden="true"></span></div>
  <div class="bus-row">${empty}${seatBtn(1, 190000, 'on')}${seatBtn(2, 190000)}</div>
  <div class="bus-row">${seatBtn(3, 240000, 'booked')}${empty}${seatBtn(4, 240000, 'booked')}</div>
  <div class="bus-row">${seatBtn(5, 240000)}${empty}${seatBtn(6, 240000)}</div>
  <div class="bus-row">${seatBtn(7, 240000, 'booked')}${empty}${seatBtn(8, 240000, 'booked')}</div>
  <div class="bus-row">${seatBtn(9, 200000)}${seatBtn(10, 170000)}${seatBtn(11, 200000)}</div>
  <p class="bus2-rear">Cuối xe</p>
</div>`;

const row = (t, open) => {
  const st = states[t.time];
  const seats = st === 'few' ? 3 : st === 'sold' ? 0 : t.available_seats;
  const soldOut = seats === 0;
  const avail = soldOut ? `<span class="tag tag--out">Hết chỗ</span>` : seats <= 3 ? `<span class="badge badge--few">${ic('clock')}Còn ${seats} chỗ</span>` : `<span class="tag tag--in">${ic('check')}Còn ${seats} chỗ</span>`;
  const dur = t.duration.replace('h', ' giờ ').trim();
  return `<article class="trip2" data-open="${open}" aria-label="Chuyến ${hhmm(t.from.reached_at)}">
  <div class="trip2-main">
    <div class="trip2-photo"><span class="badge badge--blue badge--photo">${t.product.name}</span><img src="assets/img/phuong_tien_6.jpg" width="815" height="400" loading="lazy" alt="Xe Luxury Hải Vân màu đen"></div>
    <div class="trip2-body">
      <div class="trip2-times">
        <div class="trip2-t"><span class="time">${hhmm(t.from.reached_at)}</span></div>
        <div class="trip2-line"><span class="dur">${dur}</span></div>
        <div class="trip2-t"><span class="time">${hhmm(t.to.reached_at)}</span></div>
      </div>
      <ul class="trip2-stops"><li>${ic('map-pin', 'ic--sm')}<span>${t.from.place_name}</span></li><li>${ic('flag', 'ic--sm')}<span>${t.to.place_name}</span></li></ul>
      <div class="trip2-tags">${avail}${open ? `<span class="tag tag--on">${ic('check')}Đang chọn</span>` : ''}</div>
    </div>
    <div class="trip2-side">
      <div class="trip2-price"><strong>${vnd(t.price.price_discount)}</strong><s class="num">${vnd(t.price.price)}</s><small>đã gồm thuế VAT</small></div>
      <div class="trip2-act"><button class="btn btn--lg" type="button" aria-expanded="${open}" aria-controls="p${t.id}"${soldOut ? ' aria-disabled="true"' : ''}>${soldOut ? 'Hết chỗ' : 'Chọn ghế'}${soldOut ? '' : ic('chevron-down', open ? 'flip' : '')}</button></div>
    </div>
  </div>
  ${open ? `<p class="trip-note">${ic('info')}*Khởi hành: ${hhmm(t.node_time)} ngày 29/10/2026</p>
  <div class="panel2" id="p${t.id}">
    <div class="panel2-map">
      <ul class="legend" aria-label="Chú giải">
        <li><span class="seat" aria-hidden="true"></span>Chỗ trống</li>
        <li><span class="seat seat--on" aria-hidden="true"></span>Đang chọn</li>
        <li><span class="seat seat--booked" aria-hidden="true"></span>Đã đặt</li>
      </ul>
      ${bus}
    </div>
    <div class="panel2-info">
      <div class="photos4">
        <figure class="thumb"><img src="assets/img/phuong_tien_6.jpg" width="815" height="400" loading="lazy" alt="Xe Luxury Hải Vân nhìn từ ngoài"></figure>
        <figure class="thumb"><img src="assets/img/don-khach.jpg" width="900" height="600" loading="lazy" alt="Khách lên xe tại điểm đón ở Vũng Tàu"></figure>
        <figure class="thumb"><img src="assets/img/tien_ich_1.jpg" width="544" height="363" loading="lazy" alt="Màn hình riêng và nước uống"></figure>
        <figure class="thumb"><img src="assets/img/tien_ich_2.jpg" width="544" height="363" loading="lazy" alt="Cổng sạc USB tại chỗ ngồi"></figure>
      </div>
      <ul class="perks"><li>${ico('bed-double', '', 'ico--sm')}Rèm che riêng tư</li><li>${ico('smartphone', 'teal', 'ico--sm')}Màn hình riêng và nước uống</li><li>${ico('qr-code', 'blue', 'ico--sm')}Vé QR về điện thoại</li></ul>
    </div>
  </div>` : ''}
</article>`;
};

const css = `
/* top strip on the brand field: steps, title, trip summary */
.rs-top { background: var(--color-field); padding-block: var(--s-4) var(--s-8); }
.steps { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--s-2); counter-reset: step; }
.steps li { counter-increment: step; display: flex; align-items: center; gap: var(--s-2); min-height: var(--tap-min); padding: var(--s-2) var(--s-3); border-radius: var(--r-1); background: var(--color-accent-hover); color: var(--color-ink); font-weight: var(--weight-strong); }
.steps li::before { content: counter(step); display: grid; place-items: center; width: 28px; height: 28px; flex: none; border-radius: var(--r-1); background: var(--color-surface); font-size: var(--fs-14); line-height: var(--lh-14); font-weight: var(--weight-display); }
.steps li[aria-current="step"] { background: var(--color-surface); box-shadow: var(--shadow-1); font-weight: var(--weight-display); }
.steps li[aria-current="step"]::before { background: var(--color-accent); }
.steps span { overflow-wrap: anywhere; line-height: 1.25; }
.page-title { display: grid; gap: var(--s-1); margin-block: var(--s-4); }
.page-title h1 { max-width: none; font-size: var(--fs-h1); line-height: var(--lh-h1); }
.page-title p { color: var(--color-accent-ink); }
.rs-sum { display: grid; gap: var(--s-3); padding: var(--s-4); background: var(--color-surface); border-radius: var(--r-3); box-shadow: var(--shadow-2); }
.rs-sum ul { display: flex; flex-wrap: wrap; gap: var(--s-1) var(--s-6); }
.rs-sum li { display: flex; align-items: center; gap: var(--s-3); font-weight: var(--weight-strong); min-height: var(--tap-min); }
.rs-sum li .ic { color: var(--color-muted); }
@media (min-width: 40rem) { .rs-sum { grid-template-columns: minmax(0, 1fr) auto; align-items: center; } .rs-sum ul { gap: var(--s-8); } }
.app-main { padding-bottom: var(--s-12); }
/* sticky glass filter bar: floats under the header while trips scroll beneath it */
.sample-note { display: flex; align-items: center; gap: var(--s-2); color: var(--color-muted); font-size: var(--fs-14); line-height: var(--lh-14); padding-block: var(--s-4) var(--s-3); }
.rs-filterbar { position: sticky; top: calc(var(--header-h) + var(--s-2)); z-index: var(--z-sticky); margin-bottom: var(--s-4); padding: var(--s-3); border-radius: var(--r-3); }
.rs-chips { display: flex; gap: var(--s-2); overflow-x: auto; scrollbar-width: none; }
.rs-chips::-webkit-scrollbar { display: none; }
.rs-chips .chip { flex: none; }
.rs-chips .chip--sort { margin-left: auto; }
@media (min-width: 60rem) { .rs-chips { overflow: visible; } }
.results-grid { display: grid; gap: var(--s-6); grid-template-columns: minmax(0, 1fr); align-items: start; }
.trips2 { display: grid; gap: var(--gap-card); }
/* trip card: solid white, shadow-1, r-3 with the photo inset s-2 at r-2 (concentric). Selected = soft yellow + 2px ring + tick. */
.trip2 { position: relative; display: grid; padding: var(--s-2); background: var(--color-surface); border-radius: var(--r-3); box-shadow: var(--shadow-1); transition: box-shadow var(--dur-short) var(--ease-out); }
.trip2:hover { box-shadow: var(--shadow-2); }
.trip2[data-open="true"], .trip2[data-open="true"]:hover { background: var(--select-bg); box-shadow: var(--select-ring), var(--shadow-1); }
.trip2[data-open="true"] .tag--in { background: var(--color-surface); }
.trip2-main { display: grid; }
.trip2-photo { position: relative; aspect-ratio: 16 / 9; border-radius: var(--r-2); overflow: hidden; background: var(--color-paper-3); }
.trip2-photo img { width: 100%; height: 100%; object-fit: cover; }
.trip2-body { display: grid; gap: var(--s-4); padding: var(--s-4) var(--s-2) var(--s-2); }
.trip2-times { display: grid; grid-template-columns: auto minmax(0, 1fr) auto; gap: var(--s-3); align-items: start; }
.time { font-size: var(--fs-32); line-height: var(--lh-32); font-weight: var(--weight-display); font-variant-numeric: tabular-nums; color: var(--color-ink); }
.dur { font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); font-weight: var(--weight-strong); }
.trip2-line { position: relative; align-self: center; display: grid; justify-items: center; gap: var(--s-1); padding-top: var(--s-2); }
.trip2-line::before { content: ""; order: 2; width: 100%; border-top: var(--line) dashed var(--color-edge); }
.trip2-stops { display: grid; gap: var(--s-1); font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); font-weight: var(--weight-strong); }
.trip2-stops li { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: var(--s-2); align-items: start; }
.trip2-tags { display: flex; flex-wrap: wrap; gap: var(--s-2); align-items: center; }
.trip2-side { display: grid; gap: var(--s-3); align-content: space-between; padding: 0 var(--s-2) var(--s-2); }
.trip2-price { display: flex; align-items: baseline; flex-wrap: wrap; gap: var(--s-1) var(--s-3); }
.trip2-price strong { font-size: var(--fs-32); line-height: var(--lh-32); font-weight: var(--weight-display); font-variant-numeric: tabular-nums; color: var(--color-ink); }
.trip2-price s { font-size: var(--fs-14); line-height: var(--lh-14); }
.trip2-price small { flex-basis: 100%; color: var(--color-muted); }
.trip2-act { display: grid; }
.trip2 .flip { transform: rotate(180deg); }
@media (min-width: 60rem) {
  .trip2-main { grid-template-columns: 11rem minmax(0, 1fr) 13rem; }
  .trip2-photo { aspect-ratio: auto; min-height: 100%; }
  .trip2-body { padding: var(--s-4); align-content: center; }
  .trip2-side { padding: var(--s-4) var(--s-4) var(--s-4) 0; }
  .results-grid { grid-template-columns: minmax(0, 8fr) minmax(0, 4fr); gap: var(--s-8); }
  .results-grid > aside { position: sticky; top: calc(var(--header-h) + var(--s-4)); }
}
.trip-note { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-3) var(--s-4); font-weight: var(--weight-strong); }
/* open panel: sits on the selected card's soft yellow, no card of its own */
.panel2 { display: grid; gap: var(--s-6); padding: var(--s-4); border-top: var(--line) solid var(--color-accent-edge); }
.panel2-map { display: grid; gap: var(--s-4); justify-items: center; align-content: start; }
.panel2-info { display: grid; gap: var(--s-4); align-content: start; }
.photos4 { display: grid; gap: var(--s-2); grid-template-columns: repeat(2, minmax(0, 1fr)); }
.thumb { width: 100%; aspect-ratio: 4 / 3; border-radius: var(--r-1); overflow: hidden; background: var(--color-paper-3); }
.thumb img { width: 100%; height: 100%; object-fit: cover; }
.perks { display: grid; gap: var(--s-2); }
.perks li { display: flex; align-items: center; gap: var(--s-3); min-height: var(--tap-min); font-weight: var(--weight-strong); }
@media (min-width: 60rem) { .panel2 { grid-template-columns: auto minmax(0, 1fr); gap: var(--s-8); } .photos4 { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
/* seat map: seats r-1, bus outline r-3 (hairline edge, no black) */
.legend { display: flex; flex-wrap: wrap; gap: var(--s-2) var(--s-6); font-size: var(--fs-14); line-height: var(--lh-14); font-weight: var(--weight-strong); color: var(--color-text); }
.legend li { display: inline-flex; align-items: center; gap: var(--s-2); min-height: var(--tap-min); }
.legend .seat { width: 24px; height: 24px; min-width: 0; padding: 0; pointer-events: none; }
.legend .seat .ic { width: 16px; height: 16px; position: static; }
.legend .seat--on::after { content: ""; }
.legend .seat--booked::after { content: ""; position: absolute; left: 3px; right: 3px; top: 50%; border-top: var(--line-strong) solid var(--color-muted); }
.bus2 { position: relative; width: max-content; max-width: 100%; margin-inline: auto; padding: var(--s-4) var(--s-4) var(--s-6); border: var(--line) solid var(--color-edge); border-radius: var(--r-3); background: var(--color-surface); display: grid; gap: var(--s-2); }
.bus2-cab { display: grid; grid-template-columns: 64px minmax(0, 1fr) 64px; align-items: center; gap: var(--s-2); padding: var(--s-2) 0 var(--s-3); margin-bottom: var(--s-2); border-bottom: var(--line) dashed var(--color-edge); }
.bus2-front, .bus2-rear { text-align: center; font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); font-weight: var(--weight-strong); }
.bus2-driver { display: grid; justify-items: center; gap: 0; font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); font-weight: var(--weight-strong); }
.bus2-driver i { width: var(--s-8); height: var(--s-8); border-radius: var(--r-1); border: var(--line) solid var(--color-edge); background: var(--color-paper-2); }
.bus2 .wheel { position: absolute; width: var(--s-2); height: var(--s-8); background: var(--color-edge); }
.bus2 .wheel--l { left: calc(-1 * var(--s-2) - var(--line)); border-radius: var(--r-1) 0 0 var(--r-1); }
.bus2 .wheel--r { right: calc(-1 * var(--s-2) - var(--line)); border-radius: 0 var(--r-1) var(--r-1) 0; }
.bus2 .wheel--f { top: var(--s-16); } .bus2 .wheel--b { bottom: var(--s-12); }
.bus2-rear { padding-top: var(--s-2); border-top: var(--line) dashed var(--color-edge); margin-top: var(--s-2); }
.bus-row { display: grid; grid-template-columns: repeat(3, 64px); gap: var(--s-2); justify-content: center; }
.seat { position: relative; width: 64px; height: 52px; display: grid; place-content: center; justify-items: center; gap: 0; padding: 0; border: var(--line) solid var(--color-edge); border-radius: var(--r-1); background: var(--color-surface); color: var(--color-text); font-weight: var(--weight-display); line-height: 1.1; transition: background-color var(--dur-micro) var(--ease-out); }
.seat-no { font-size: var(--fs-16); line-height: var(--lh-16); font-variant-numeric: tabular-nums; }
.seat-price { font-size: var(--fs-14); line-height: var(--lh-14); font-weight: var(--weight-strong); font-variant-numeric: tabular-nums; }
.seat:hover { background: var(--color-accent-soft); }
.seat:active { transform: translateY(var(--line)); }
.seat[aria-pressed="true"], .seat--on { background: var(--color-accent); border-color: var(--color-accent); box-shadow: var(--select-ring); color: var(--color-accent-ink); }
.seat[aria-pressed="true"] .ic { position: absolute; top: 2px; right: 2px; width: 18px; height: 18px; stroke-width: 3; }
.seat--booked { background: var(--color-sold); border-color: var(--color-sold); color: var(--color-muted); cursor: not-allowed; }
.seat--booked:hover { background: var(--color-sold); }
.seat--booked .seat-no { text-decoration: line-through; }
.seat-empty { width: 64px; height: 52px; }
/* total: glass bar floating at the bottom on phones, solid card in the right column from 60rem */
.sticky-bar { position: fixed; left: var(--gutter); right: var(--gutter); bottom: calc(var(--s-3) + env(safe-area-inset-bottom, 0px)); z-index: var(--z-sticky); padding: var(--s-3); border-radius: var(--r-3); }
.sticky-inner { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--s-4); align-items: center; }
.sticky-sum { display: grid; gap: 0; min-width: 0; }
.sticky-sum .label { font-size: var(--fs-16); line-height: var(--lh-16); color: var(--color-ink); overflow-wrap: anywhere; }
.total { font-size: var(--fs-32); line-height: var(--lh-32); font-weight: var(--weight-display); font-variant-numeric: tabular-nums; color: var(--color-ink); }
.sticky-msg { grid-column: 1 / -1; font-size: var(--fs-16); line-height: var(--lh-16); }
.sum-detail { display: none; }
.sum-title { display: grid; gap: var(--s-1); }
.sum-title h2 { font-size: var(--fs-18); line-height: var(--lh-18); max-width: none; }
.sum-title p { color: var(--color-muted); font-size: var(--fs-14); line-height: var(--lh-14); }
.sel-chips { display: flex; flex-wrap: wrap; gap: var(--s-2); }
.bar-spacer { height: 96px; }
@media (min-width: 60rem) {
  .bar-spacer { display: none; }
  .sticky-bar { position: static; padding: var(--card-pad); background: var(--color-surface); -webkit-backdrop-filter: none; backdrop-filter: none; box-shadow: var(--shadow-1); }
  .sticky-inner { grid-template-columns: minmax(0, 1fr); }
  .sum-detail { display: grid; gap: var(--s-3); }
  .sticky-sum .label { font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); }
}
.more-row { margin-top: var(--s-6); }
`;

const body = `${headerV4()}
<main id="main" class="app-main">
<section class="rs-top" aria-label="Chuyến đã tìm">
  <div class="container">
    <nav aria-label="Các bước đặt vé"><ol class="steps"><li aria-current="step"><span>Chọn ghế</span></li><li><span>Thông tin của bạn</span></li><li><span>Thanh toán</span></li></ol></nav>
    <div class="page-title"><h1>Xe khách Quận 1 đi Vũng Tàu</h1><p>94 chuyến ngày 29/10/2026</p></div>
    <div class="rs-sum">
      <ul><li>${ic('map-pin')}Quận 1 đi Vũng Tàu</li><li>${ic('calendar')}29/10/2026</li><li>${ic('users')}1 người</li></ul>
      <a class="btn btn--sm btn--ghost" href="#sp">Sửa</a>
    </div>
  </div>
</section>
<div class="container">
  <p class="sample-note"><span class="badge badge--new">Đề xuất</span>Bộ lọc và sắp xếp chưa có trong luồng đặt vé hiện tại. Bản mẫu: số chỗ còn, ghế đã đặt và ghế đang chọn là minh hoạ.</p>
  <div class="rs-filterbar glass" role="group" aria-label="Lọc và sắp xếp (đề xuất)">
    <div class="rs-chips">
      <button class="chip" type="button" aria-haspopup="true">${ic('clock')}Giờ đi${ic('chevron-down')}</button>
      <button class="chip" type="button" aria-haspopup="true">${ic('bus')}Hạng xe${ic('chevron-down')}</button>
      <button class="chip" type="button" aria-pressed="true">${ic('check')}Luxury</button>
      <button class="chip" type="button" aria-haspopup="true">${ic('banknote')}Giá${ic('chevron-down')}</button>
      <button class="chip chip--sort" type="button" aria-haspopup="true">${ic('sliders-horizontal')}Giờ đi sớm nhất${ic('chevron-down')}</button>
    </div>
  </div>
  <div class="results-grid">
    <section aria-label="Danh sách chuyến"><div class="trips2">${trips.map((t, i) => row(t, i === 0)).join('')}</div>
      <p class="more-row"><a class="btn btn--ghost" href="?page=2">Xem thêm chuyến</a></p></section>
    <aside aria-label="Tóm tắt chọn chỗ">
      <div class="sticky-bar glass"><div class="sticky-inner">
        <div class="sum-detail"><div class="sum-title"><h2>Quận 1 đi Vũng Tàu</h2><p>06:45 ngày 29/10/2026, Luxury</p></div><ul class="sel-chips" aria-label="Ghế đã chọn"><li class="tag tag--on">${ic('check')}Ghế 1</li></ul></div>
        <div class="sticky-sum"><span class="label">Ghế 1, Luxury 06:45</span><span class="total num">190.000đ</span><span class="label">Tổng giá tiền</span></div>
        <a class="btn btn--lg" href="/xe-khach/xac-nhan">Tiếp tục</a>
        <p class="sticky-msg" aria-live="polite" hidden>Chọn ít nhất 1 ghế để tiếp tục.</p>
      </div></div>
    </aside>
  </div>
</div>
</main>
<div class="bar-spacer" aria-hidden="true"></div>
${footer()}
${callFab()}
${loginDialog()}`;

export default {
  title: 'Xe khách Quận 1 đi Vũng Tàu, chọn chuyến và ghế | Hải Vân',
  desc: 'Danh sách chuyến xe Quận 1 đi Vũng Tàu ngày 29/10/2026: giờ chạy, giá vé, chọn ghế trên sơ đồ.',
  bodyClass: 'has-sticky-bar',
  stamp: {
    shape: 'app screen (results with seat map), v4 functional glass', hero: 'none (app screen; brand-yellow summary strip)', imagery: 'real fleet and interior photographs, seat map in a bus outline built in CSS', signature: 'selected trip as soft yellow with a ring and tick, seat map in its r-3 bus outline, glass filter bar and total',
    critique: 'P4 H4 E4 S4 R4 V4 · weakest: S, a results screen is one repeated card by nature; the trip card carries the photo, big times and a price block so rows scan in one glance',
    waive: [
      'note glass · functional glass by owner brief (v4): the sticky filter bar and the phone total bar float over scrolling content; no text under 16px on them; solid fallback under no-backdrop-filter and prefers-reduced-transparency; three glass layers at most on a screen (header, filter bar, total bar)',
      'answered F5 · the perk icons sit in the owner-picked illustrated tile style (lucide stroke on a brand fill), at list size, one weight, r-1',
      'answered F20 · the filter chips are a proposal marked on the page ("Đề xuất"), visual only, not a promise of filtering in the old flow',
    ],
  },
  css,
  body,
  script: dialogScript,
};
