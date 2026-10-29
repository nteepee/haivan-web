import { header, footer, callFab, ic, vnd } from '../lib.mjs';

const css = `
.form-card { background: var(--color-surface); border: var(--line) solid var(--color-rule); border-radius: var(--r-md); padding: var(--card-pad); display: grid; gap: var(--gap-field); }
.form-card h2 { font-size: var(--fs-20); line-height: var(--lh-20); max-width: none; }
.form-stack { display: grid; gap: var(--s-6); grid-template-columns: minmax(0, 1fr); }
.two-f { display: grid; gap: var(--gap-field); grid-template-columns: minmax(0, 1fr); }
@media (min-width: 40rem) { .two-f { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.choice { display: grid; gap: var(--gap-card); }
.opt { display: grid; grid-template-columns: var(--icon-size) minmax(0, 1fr); gap: var(--s-3); align-items: start; padding: var(--s-3) var(--s-4); background: var(--color-surface); border: var(--line-strong) solid var(--color-rule); border-radius: var(--r-md); cursor: pointer; min-height: var(--control-h); }
.opt:hover { border-color: var(--color-ink); } .opt:active { background: var(--color-accent-soft); }
.opt:has(input:checked) { border-color: var(--color-ink); background: var(--color-accent-soft); }
.opt:has(input:focus-visible) { outline: var(--line-strong) solid var(--color-focus); outline-offset: var(--line-strong); }
.opt input { width: var(--icon-size); height: var(--icon-size); margin: 0; accent-color: var(--color-ink); }
.opt b { display: block; } .opt small { color: var(--color-muted); }
.check { display: flex; align-items: center; gap: var(--s-3); min-height: var(--tap-min); font-weight: var(--weight-strong); }
.check input { width: var(--icon-size); height: var(--icon-size); accent-color: var(--color-ink); }
.policy { font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); max-width: 60ch; }
.timer-bar { position: sticky; top: 0; z-index: var(--z-sticky); }
.timer-bar .timer { border-radius: 0; border-inline: 0; }
.timer span { flex: 1; }
@media (min-width: 60rem) { .timer-bar { position: static; } .timer-bar .timer { border-radius: var(--r-sm); border-inline: var(--line) solid var(--color-accent-edge); } }
.pricing .qty { color: var(--color-muted); }
`;

const body = `${header()}
<div class="timer-bar" role="timer" aria-label="Thời gian giữ chỗ"><div class="timer">${ic('hourglass')}<span>Thời gian còn lại để xác nhận</span><strong class="num">09:41</strong></div></div>
<main id="main" class="app-main">
<div class="container">
  <nav aria-label="Các bước đặt vé"><ol class="steps"><li class="done">${ic('check')}<span>Chọn ghế</span></li><li aria-current="step"><span>Thông tin của bạn</span></li><li><span>Thanh toán</span></li></ol></nav>
  <div class="page-title"><h1>Kiểm tra thông tin đặt vé</h1></div>
  <div class="results-grid">
    <form class="form-stack" action="/xe-khach/thanh-toan" method="post" novalidate>
      <section class="form-card" aria-labelledby="f-you"><h2 id="f-you">Thông tin của bạn</h2>
        <div class="two-f">
          <div class="field"><label for="c-name">Họ và tên</label><input class="input" id="c-name" name="name" autocomplete="name" value="Nguyễn Văn An"><p class="field-msg"></p></div>
          <div class="field"><label for="c-phone">Số điện thoại</label><input class="input" id="c-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel" aria-invalid="true" aria-describedby="c-phone-msg"><p class="field-msg field-msg--error" id="c-phone-msg">${ic('circle-alert', 'ic--sm')}Nhập số điện thoại để nhận vé điện tử.</p></div>
        </div>
        <div class="field"><label for="c-mail">Thư điện tử</label><input class="input" id="c-mail" name="email" type="email" inputmode="email" autocomplete="email" placeholder="vidu@email.com"><p class="field-msg"></p></div>
        <div class="field"><label for="c-note">Ghi chú</label><input class="input" id="c-note" name="note" placeholder="Nhập ghi chú ..."></div>
      </section>
      <section class="form-card" aria-labelledby="f-move"><h2 id="f-move">Đón và trả</h2>
        <div class="choice" role="radiogroup" aria-labelledby="f-move">
          <label class="opt"><input type="radio" name="move" checked><span><b>Tự di chuyển</b><small>Tới điểm đón có trong chuyến.</small></span></label>
          <label class="opt"><input type="radio" name="move"><span><b>Xe trung chuyển</b><small>Đón tận nhà, trả tận nhà.</small></span></label>
        </div>
      </section>
      <section class="form-card" aria-label="Hóa đơn và khuyến mãi">
        <label class="check"><input type="checkbox" name="invoice">Tôi muốn xuất hóa đơn</label>
        <button class="btn btn--ghost" type="button">${ic('ticket')}Dùng mã hoặc điểm</button>
      </section>
      <div class="form-stack">
        <p class="policy">Bằng việc ấn vào nút này, bạn công nhận mình đã đọc và đồng ý với các Điều khoản và Điều kiện, Chính sách bảo mật của Hải Vân.</p>
        <button class="btn btn--lg btn--block" type="submit">Tiếp tục</button>
      </div>
    </form>
    <aside aria-label="Tóm tắt chuyến đi">
      <div class="summary">
        <h2>Xe liên tỉnh, Luxury</h2>
        <div class="timeline"><div class="trip-route"><p class="stop"><b>06:45</b>159 Điện Biên Phủ, Đa Kao, Quận 1</p><p class="stop stop--end"><b>09:25</b>TP Vũng Tàu (Gành Hào)</p></div>
        <dl class="kv"><dt>Khởi hành</dt><dd>06:30 ngày 29/10/2026</dd></dl></div>
        <table class="pricing"><caption class="sr-only">Chi tiết giá</caption><thead><tr><th scope="col">Chi tiết giá</th><th scope="col">Thành tiền</th></tr></thead><tbody><tr><td>Ghế 1</td><td class="num">190.000đ</td></tr></tbody><tfoot><tr><th scope="row">Tổng giá tiền</th><td class="num">190.000đ</td></tr></tfoot></table>
      </div>
    </aside>
  </div>
</div>
</main>
${footer()}
${callFab()}`;

export default {
  title: 'Kiểm tra thông tin đặt vé | Hải Vân',
  desc: 'Nhập thông tin hành khách, chọn cách đón trả và kiểm tra giá vé trước khi thanh toán.',
  stamp: {
    shape: 'app screen (form with summary)', hero: 'none (app screen)', imagery: 'none', signature: 'the held-seat timer pinned above the form on phones',
    critique: 'P4 H4 E4 S4 R4 V3 · weakest: V, the screen is one working form so it stays plain; the timer and an inline field error carry the state',
    waive: [],
  },
  css,
  body,
};
