import { header, footer, callFab, ic, ico, fixture, vnd } from '../lib.mjs';
import { searchPanel, panelCss } from '../parts.mjs';

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
      <div class="trip2-tags">${avail}</div>
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

const css = `${panelCss}
/* top strip on the brand field: steps, title, trip summary */
.rs-top { background: var(--color-field); padding-block: var(--s-4) var(--s-8); }
.rs-top .steps li { border-top-color: var(--color-ink); color: var(--color-ink); }
.rs-top .steps li::before { border-color: var(--color-ink); }
.rs-top .steps li[aria-current="step"]::before { background: var(--color-ink); color: var(--color-accent); }
.rs-top .page-title { margin-block: var(--s-4) var(--s-4); }
.rs-top .page-title p { color: var(--color-accent-ink); }
.rs-top .page-title h1 { font-size: var(--fs-h1); line-height: var(--lh-h1); }
.rs-sum { display: grid; gap: var(--s-3); padding: var(--s-4); background: var(--color-surface); border-radius: var(--r-md); box-shadow: var(--shadow-float); }
.rs-sum ul { display: flex; flex-wrap: wrap; gap: var(--s-1) var(--s-6); }
.rs-sum li { display: flex; align-items: center; gap: var(--s-3); font-weight: var(--weight-strong); min-height: var(--tap-min); }
.rs-sum li .ic { color: var(--color-muted); }
@media (min-width: 40rem) { .rs-sum { grid-template-columns: minmax(0, 1fr) auto; align-items: center; } .rs-sum ul { gap: var(--s-8); } }
.app-main--v3 { padding-top: 0; }
/* filter row (proposal) */
.rs-filters { display: grid; gap: var(--s-3); padding-block: var(--s-6) var(--s-4); }
.rs-chips { display: flex; gap: var(--s-2); overflow-x: auto; scrollbar-width: none; margin-inline: calc(-1 * var(--gutter)); padding: var(--s-1) var(--gutter); }
.rs-chips::-webkit-scrollbar { display: none; }
.rs-chips .chip { flex: none; }
.rs-count { display: flex; align-items: center; justify-content: space-between; gap: var(--s-4); }
.rs-count h2 { font-size: var(--fs-18); line-height: var(--lh-18); max-width: none; }
@media (min-width: 60rem) { .rs-chips { flex-wrap: wrap; overflow: visible; margin-inline: 0; padding-inline: 0; } }
.trip2-stops { display: grid; gap: var(--s-1); font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); font-weight: var(--weight-strong); }
.trip2-stops li { display: grid; grid-template-columns: 20px minmax(0, 1fr); gap: var(--s-2); align-items: start; }
.trip2-stops .ic { margin-top: 0; }
.trips2 { display: grid; gap: var(--gap-card); }
.trip-note { display: flex; align-items: center; gap: var(--s-3); padding: var(--s-3) var(--s-4); background: var(--color-accent-soft); border-top: var(--line) solid var(--color-accent-edge); font-weight: var(--weight-strong); }
/* summary card */
.sum-title { display: grid; gap: var(--s-1); }
.sum-title h2 { font-size: var(--fs-18); line-height: var(--lh-18); max-width: none; }
.sum-title p { color: var(--color-muted); font-size: var(--fs-14); line-height: var(--lh-14); }
.sticky-bar--aside .sticky-sum .total { color: var(--color-ink); }
@media (min-width: 60rem) { .sticky-bar--aside { box-shadow: var(--shadow-float); } .sticky-bar--aside .sticky-inner { grid-template-columns: minmax(0, 1fr); } }
`;

const body = `${header()}
<main id="main" class="app-main app-main--v3">
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
  <div class="rs-filters" role="group" aria-label="Lọc và sắp xếp (đề xuất)">
    <div class="rs-chips">
      <button class="chip" type="button" aria-haspopup="true">${ic('clock')}Giờ đi${ic('chevron-down')}</button>
      <button class="chip" type="button" aria-haspopup="true">${ic('bus')}Hạng xe${ic('chevron-down')}</button>
      <button class="chip" type="button" aria-haspopup="true">${ic('banknote')}Giá${ic('chevron-down')}</button>
      <button class="chip" type="button" aria-haspopup="true">${ic('sliders-horizontal')}Giờ đi sớm nhất${ic('chevron-down')}</button>
    </div>
    <p class="sample-note"><span class="badge badge--new">Đề xuất</span>Bộ lọc và sắp xếp chưa có trong luồng đặt vé hiện tại. Bản mẫu: số chỗ còn, ghế đã đặt và ghế đang chọn là minh hoạ.</p>
  </div>
  <div class="results-grid">
    <section aria-label="Danh sách chuyến"><div class="trips2">${trips.map((t, i) => row(t, i === 0)).join('')}</div>
      <p class="more-row"><a class="btn btn--ghost" href="?page=2">Xem thêm chuyến</a></p></section>
    <aside aria-label="Tóm tắt chọn chỗ">
      <div class="sticky-bar sticky-bar--aside"><div class="sticky-inner">
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
${callFab()}`;

export default {
  title: 'Xe khách Quận 1 đi Vũng Tàu, chọn chuyến và ghế | Hải Vân',
  desc: 'Danh sách chuyến xe Quận 1 đi Vũng Tàu ngày 29/10/2026: giờ chạy, giá vé, chọn ghế trên sơ đồ.',
  bodyClass: 'has-sticky-bar',
  stamp: {
    shape: 'app screen (results with seat map), v3 app-style', hero: 'none (app screen; brand-yellow summary strip)', imagery: 'real fleet and interior photographs, seat map in a bus outline built in CSS', signature: 'the seat map in its bus outline with the sticky total',
    critique: 'P4 H4 E4 S4 R4 V4 · weakest: S, a results screen is one repeated card by nature; the trip card carries the photo, big times and a price block so rows scan in one glance',
    waive: [
      'answered F5 · the perk icons sit in the owner-picked illustrated circle style (lucide stroke on a brand fill), at list size, one weight',
      'answered F20 · the filter chips are a proposal marked on the page ("Đề xuất"), visual only, not a promise of filtering in the old flow',
    ],
  },
  css,
  body,
};
