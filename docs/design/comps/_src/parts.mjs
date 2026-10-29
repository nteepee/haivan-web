// Reusable page parts (search panel, FAQ, etc.) shared by several comps.
import { ic } from './lib.mjs';

export function searchPanel({ icons = false, from = '', to = '', date = '29/10/2026', people = 1, id = 'sp', compact = false, errorFrom = false } = {}) {
  const tabs = ['Xe liên tỉnh', 'Xe sân bay', 'Xe hợp đồng', 'Xe du lịch'];
  const tabIcon = ['bus', 'plane', 'car-front', 'map'];
  return `<form class="plate${compact ? ' plate--compact' : ''}" action="/xe-khach/tim-chuyen" method="get" aria-label="Tìm vé">
    <div class="tabs" role="tablist" aria-label="Loại hình">${tabs.map((t, i) => `<a class="tab" role="tab" href="#${id}" aria-selected="${i === 0}">${icons ? ic(tabIcon[i]) : ''}${t}</a>`).join('')}</div>
    <div class="plate-grid">
      <div class="field p-from">
        <label for="${id}-from">Điểm xuất phát</label>
        <div class="input-wrap">${ic('map-pin')}<input class="input" id="${id}-from" name="from" autocomplete="off" placeholder="Chọn điểm xuất phát" value="${from}"${errorFrom ? ' aria-invalid="true" aria-describedby="' + id + '-from-msg"' : ''}></div>
        <p class="field-msg${errorFrom ? ' field-msg--error' : ''}" id="${id}-from-msg">${errorFrom ? ic('circle-alert', 'ic--sm') + 'Chọn điểm xuất phát để tìm chuyến.' : ''}</p>
      </div>
      <button class="swap p-swap" type="button" aria-label="Đổi chiều đi và đến">${ic('arrow-left-right')}</button>
      <div class="field p-to">
        <label for="${id}-to">Điểm đến</label>
        <div class="input-wrap">${ic('map-pin')}<input class="input" id="${id}-to" name="to" autocomplete="off" placeholder="Chọn điểm đến" value="${to}"></div>
        <p class="field-msg"></p>
      </div>
      <div class="field p-date">
        <label for="${id}-date">Ngày đi</label>
        <div class="input-wrap">${ic('calendar')}<input class="input num" id="${id}-date" name="date" inputmode="numeric" autocomplete="off" value="${date}"></div>
      </div>
      <div class="field p-people">
        <span class="label" id="${id}-ppl">Số người</span>
        <div class="stepper" role="group" aria-labelledby="${id}-ppl"><button type="button" aria-label="Bớt một người">${ic('minus')}</button><output aria-live="polite">${people}</output><button type="button" aria-label="Thêm một người">${ic('plus')}</button></div>
      </div>
      <button class="btn btn--lg p-go" type="submit">Tìm vé</button>
    </div>
  </form>`;
}

export const panelCss = `
.plate { background: var(--color-surface); border: var(--line-strong) solid var(--color-ink); border-radius: var(--r-lg); }
.plate-grid { display: grid; gap: var(--gap-field) var(--s-4); padding: var(--card-pad); grid-template-columns: minmax(0, 1fr); }
.p-swap { justify-self: end; margin-block: calc(-1 * var(--s-1)); }
.p-go { margin-top: var(--s-2); }
@media (min-width: 40rem) {
  .field-msg:empty { display: flex; }
  .plate-grid { grid-template-columns: minmax(0, 1fr) var(--control-h) minmax(0, 1fr); align-items: start; gap: var(--gap-field) var(--s-3); }
  .p-swap { justify-self: center; margin: calc(var(--lh-14) + var(--s-2)) 0 0; }
  .p-date { grid-column: 1; } .p-people { grid-column: 3; } .p-go { grid-column: 1 / -1; margin-top: var(--s-3); }
}
@media (min-width: 60rem) { .plate--compact .plate-grid { grid-template-columns: minmax(0, 1fr) var(--control-h) minmax(0, 1fr) 9rem 9rem 9rem; } .plate--compact .p-date, .plate--compact .p-people, .plate--compact .p-go { grid-column: auto; margin-top: 0; align-self: end; } .plate--compact .p-people { align-self: start; } .plate--compact .p-go { align-self: start; margin-top: calc(var(--lh-14) + var(--s-2)); } }
`;

export function faqList(items) {
  return `<div class="faq-list ruled">${items.map(([q, a]) => `<details class="faq"><summary>${q}${ic('chevron-down')}</summary><div class="faq-body"><p>${a}</p></div></details>`).join('')}</div>`;
}
