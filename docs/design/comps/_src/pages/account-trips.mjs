import { header, footer, callFab, ic } from '../lib.mjs';

const order = ({ code, route, product, seats, when, created, total, paid, cancelOpen }) => `<article class="order" aria-label="Đơn ${code}">
  <header class="order-head"><div><p class="order-code">Mã đơn hàng <b class="num">${code}</b></p><p class="order-sub">Ngày tạo đơn ${created}</p></div>${paid ? `<span class="tag tag--paid">${ic('check')}Đã thanh toán</span>` : `<span class="tag tag--unpaid">${ic('circle-alert')}Chưa thanh toán</span>`}</header>
  <div class="order-body">
    <div class="order-route"><h2>${route}</h2><p class="muted">Xe liên tỉnh, ${product}</p></div>
    <dl class="order-kv"><div><dt>Khởi hành</dt><dd class="num">${when}</dd></div><div><dt>Ghế</dt><dd>${seats}</dd></div><div><dt>Tổng giá tiền</dt><dd class="num">${total}</dd></div></dl>
  </div>
  ${cancelOpen ? `<div class="order-cancel" role="group" aria-labelledby="cx-${code}">
    <h3 id="cx-${code}">Bạn có chắc chắn muốn huỷ vé?</h3>
    <p>Vé sẽ bị huỷ và chỗ ngồi được nhả cho khách khác. Trước khi huỷ, hãy cho chúng tôi biết lý do.</p>
    <div class="field"><label for="why-${code}">Lý do huỷ</label><input class="input" id="why-${code}" name="reason" placeholder="Chia sẻ lý do của bạn"></div>
    <div class="dialog-actions"><button class="btn btn--ghost" type="button">Giữ vé</button><button class="btn" type="button">Huỷ vé</button></div>
  </div>` : `<div class="order-actions">${paid ? `<a class="btn btn--ghost btn--sm" href="#">Xem vé</a><button class="btn btn--ghost btn--sm" type="button">Huỷ vé</button>` : `<a class="btn btn--sm" href="/xe-khach/thanh-toan">Thanh toán</a><button class="btn btn--ghost btn--sm" type="button">Huỷ đơn hàng</button>`}</div>`}
</article>`;

const css = `
.tabs--row { display: flex; overflow-x: auto; scrollbar-width: none; margin-bottom: var(--s-6); }
.tabs--row .tab { flex: 0 0 auto; }
.orders { display: grid; gap: var(--gap-card); }
.order { background: var(--color-surface); border: var(--line) solid var(--color-rule); border-radius: var(--r-md); overflow: hidden; }
.order-head { display: flex; flex-wrap: wrap; align-items: flex-start; justify-content: space-between; gap: var(--s-4); padding: var(--s-3) var(--card-pad); border-bottom: var(--line) solid var(--color-rule); background: var(--color-paper-2); }
.order-code { font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); } .order-code b { color: var(--color-ink); font-size: var(--fs-16); }
.order-sub { font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); }
.order-body { display: grid; gap: var(--s-4); padding: var(--card-pad); }
.order-route h2 { font-size: var(--fs-20); line-height: var(--lh-20); max-width: none; }
.order-kv { display: grid; gap: var(--s-3); grid-template-columns: repeat(2, minmax(0, 1fr)); }
.order-kv dt { font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); font-weight: var(--weight-strong); }
.order-kv dd { margin: 0; font-weight: var(--weight-display); font-size: var(--fs-18); line-height: var(--lh-18); }
.order-actions { display: flex; flex-wrap: wrap; gap: var(--s-2); padding: var(--s-3) var(--card-pad) var(--card-pad); }
.order-cancel { display: grid; gap: var(--s-3); padding: var(--card-pad); border-top: var(--line-strong) solid var(--color-ink); background: var(--color-accent-soft); }
.order-cancel h3 { font-size: var(--fs-18); line-height: var(--lh-18); }
@media (min-width: 60rem) { .order-body { grid-template-columns: minmax(0, 4fr) minmax(0, 7fr); align-items: center; } .order-kv { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
.states { display: grid; gap: var(--s-6); margin-top: var(--s-12); }
.states > h2 { font-size: var(--fs-20); line-height: var(--lh-20); }
.state-grid { display: grid; gap: var(--gap-card); }
.state { background: var(--color-surface); border: var(--line) solid var(--color-rule); border-radius: var(--r-md); padding: var(--card-pad); display: grid; gap: var(--s-3); align-content: start; }
.state h3 { font-size: var(--fs-16); line-height: var(--lh-16); color: var(--color-muted); }
.skel--line { height: var(--s-4); } .skel--title { height: var(--s-6); width: 60%; } .skel--half { width: 40%; }
@media (min-width: 60rem) { .state-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
`;

const body = `${header()}
<main id="main" class="app-main">
<div class="container">
  <div class="page-title"><h1>Chuyến đi của tôi</h1></div>
  <div class="tabs tabs--row" role="tablist" aria-label="Trạng thái chuyến đi"><a class="tab" role="tab" aria-selected="true" href="?tab=sap-toi">Chuyến đi sắp tới</a><a class="tab" role="tab" aria-selected="false" href="?tab=hoan-thanh">Hoàn thành</a><a class="tab" role="tab" aria-selected="false" href="?tab=huy">Chuyến huỷ</a></div>
  <div class="orders">
    ${order({ code: 'B0124ZZVQPKEPD', route: 'Mỹ Đình đi Điện Biên', product: 'Economy', seats: 'C1-5', when: '19:00 ngày 03/11/2026', created: '25/10/2026', total: '485.000đ', paid: true })}
    ${order({ code: 'B02ELR75VVGL79', route: 'Vũng Tàu đi Tân Sơn Nhất', product: 'Luxury', seats: '7, 8', when: '05:30 ngày 09/11/2026', created: '25/10/2026', total: '400.000đ', paid: false, cancelOpen: true })}
  </div>
  <section class="states" aria-labelledby="h-states"><h2 id="h-states">Trạng thái khác của danh sách (mẫu thiết kế)</h2>
    <div class="state-grid">
      <div class="state" aria-busy="true"><h3>Đang tải</h3><div class="skel skel--title"></div><div class="skel skel--line"></div><div class="skel skel--line skel--half"></div></div>
      <div class="state"><h3>Chưa có chuyến</h3><p>Bạn chưa có chuyến đi nào!</p><a class="btn btn--sm" href="/">Tìm chuyến đi khác</a></div>
      <div class="state"><h3>Lỗi tải</h3><p class="notice notice--error" role="alert">${ic('triangle-alert')}<span><strong>Không tải được danh sách.</strong> Kiểm tra mạng rồi thử lại, hoặc gọi 1900 6763.</span></p><button class="btn btn--sm btn--ghost" type="button">Thử lại</button></div>
    </div>
  </section>
</div>
</main>
${footer()}
${callFab()}`;

export default {
  title: 'Chuyến đi của tôi | Hải Vân',
  desc: 'Xem, thanh toán và huỷ vé Hải Vân đã đặt: chuyến sắp tới, hoàn thành và đã huỷ.',
  stamp: {
    shape: 'app screen (order list with tabs)', hero: 'none (app screen)', imagery: 'none', signature: 'order rows with an inline cancel confirmation instead of a modal',
    critique: 'P4 H4 E4 S4 R4 V3 · weakest: V, rows over cards keep it scannable; the cancel step opens in place and says its consequence',
    waive: ['dismissed 3 · the three state cards each hold a title and a working sample of loading, empty or error, so none is an icon tile above a heading'],
  },
  css,
  body,
};
