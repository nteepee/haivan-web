import { header, footer, callFab, ic, fixture } from '../lib.mjs';

const methods = fixture('info_payments.json');
const bank = methods.find((m) => m.type === 2).info[0];
const label = { 5: ['Thanh toán bằng mã QR qua VNPAY-QR', 'Quét mã bằng ứng dụng ngân hàng.'], 1: ['Thanh toán bằng thẻ ATM nội địa', 'Sử dụng Mobile Banking hỗ trợ VNPAY.'], 6: ['Thanh toán bằng mã QR qua PayOS', 'Quét mã bằng ứng dụng ngân hàng.'], 2: ['Thanh toán bằng chuyển khoản', 'Chuyển khoản theo thông tin bên dưới.'], 3: ['Thanh toán tại nhà xe', 'Thanh toán khi lên xe.'] };

const copyRow = (k, v) => `<div><dt>${k}</dt><dd>${v}</dd><button class="btn btn--sm btn--ghost" type="button" aria-label="Sao chép ${k.toLowerCase()}">${ic('copy', 'ic--sm')}Sao chép</button></div>`;
const method = (m, checked) => {
  const [t, hint] = label[m.type];
  const body = m.type === 2 && checked ? `<div class="method-body"><dl class="dl-copy">${copyRow('Số tài khoản', bank.code)}${copyRow('Tên tài khoản', bank.name_cp)}${copyRow('Ngân hàng', 'MB bank, ' + bank.branch)}${copyRow('Nội dung chuyển khoản', 'B02ELR3J6PD62D')}</dl>
    <p class="notice">${ic('info')}<span>Nhập đủ và đúng nội dung chuyển khoản để Hải Vân ghi nhận thanh toán.</span></p></div>` : '';
  return `<label class="method"><input type="radio" name="pay"${checked ? ' checked' : ''}><span><span class="method-title">${t}</span><br><span class="method-hint">${hint}</span></span>${body}</label>`;
};

const css = `
.pay-list { display: grid; gap: var(--gap-card); }
.method > span { display: block; }
.pay-actions { display: grid; gap: var(--s-3); }
.pay-note { color: var(--color-muted); font-size: var(--fs-14); line-height: var(--lh-14); }
.timer span { flex: 1; }
.timer-bar { position: sticky; top: 0; z-index: var(--z-sticky); }
.timer-bar .timer { border-radius: 0; border-inline: 0; }
@media (min-width: 60rem) { .timer-bar { position: static; } .timer-bar .timer { border-radius: var(--r-sm); border-inline: var(--line) solid var(--color-accent-edge); } .pay-submit-mobile { display: none; } }
`;

const body = `${header()}
<div class="timer-bar" role="timer" aria-label="Thời gian giữ chỗ"><div class="timer">${ic('hourglass')}<span>Thời gian còn lại để xác nhận</span><strong class="num">08:12</strong></div></div>
<main id="main" class="app-main">
<div class="container">
  <nav aria-label="Các bước đặt vé"><ol class="steps"><li class="done">${ic('check')}<span>Chọn ghế</span></li><li class="done">${ic('check')}<span>Thông tin của bạn</span></li><li aria-current="step"><span>Thanh toán</span></li></ol></nav>
  <div class="page-title"><h1>Lựa chọn thanh toán</h1></div>
  <div class="results-grid">
    <form class="pay-list" action="#" method="post" id="pay"><fieldset class="pay-list pay-fieldset"><legend class="sr-only">Hình thức thanh toán</legend>
      ${method(methods[0], false)}${method(methods[1], false)}${method(methods[3], false)}${method(methods[2], true)}${method(methods[4], false)}
    </fieldset></form>
    <aside aria-label="Tóm tắt thanh toán">
      <div class="sticky-bar sticky-bar--aside"><div class="sticky-inner">
        <div class="sticky-sum"><span class="label">Xe liên tỉnh, Luxury, Ghế 1</span><span class="label">06:45 ngày 29/10/2026</span><span class="total num">190.000đ</span><span class="label">Tổng giá tiền</span></div>
        <button class="btn btn--lg" type="submit" form="pay">Thanh toán</button>
      </div></div>
    </aside>
  </div>
</div>
</main>
<div class="bar-spacer" aria-hidden="true"></div>
${footer()}
${callFab()}`;

export default {
  title: 'Lựa chọn thanh toán | Hải Vân',
  desc: 'Chọn VNPAY-QR, PayOS, chuyển khoản hoặc thanh toán tại nhà xe cho vé Hải Vân.',
  bodyClass: 'has-sticky-bar',
  stamp: {
    shape: 'app screen (method list with sticky total)', hero: 'none (app screen)', imagery: 'none', signature: 'whole-row payment methods with copyable bank details',
    critique: 'P4 H4 E4 S4 R4 V3 · weakest: V, a payment page should look like the last one; whole-row radios and copy buttons carry the polish',
    waive: [],
  },
  css,
  body,
};
