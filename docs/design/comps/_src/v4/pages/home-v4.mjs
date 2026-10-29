import { footer, callFab, ic, ico, routes, railScript } from '../../lib.mjs';
import { searchPanel } from '../../parts.mjs';
import { headerV4, loginDialog, plateCss, dialogScript } from '../lib-v4.mjs';

const routeImg = {
  'quan-1/vung-tau': ['route-quan1-vungtau.jpg', 720, 520, 'Chợ Bến Thành, TP. Hồ Chí Minh'],
  'my-dinh/dien-bien': ['route-mydinh-dienbien.jpg', 900, 506, 'Toàn cảnh thành phố Điện Biên Phủ nhìn từ trên cao'],
  'vung-tau/tan-son-nhat': ['route-tansonnhat.jpg', 390, 258, 'Nhà ga sân bay Tân Sơn Nhất lúc chiều tối'],
  'tan-son-nhat/vung-tau': ['route-tansonnhat.jpg', 390, 258, 'Nhà ga sân bay Tân Sơn Nhất lúc chiều tối'],
  'my-dinh/son-la': ['route-sonla.jpg', 302, 167, 'Ruộng lúa chín và nhà sàn ở Sơn La'],
  'yen-nghia/dien-bien': ['ve_hai_van_2.jpg', 544, 363, 'Đoàn xe Hải Vân xếp hàng tại bến'],
  'my-dinh/ban-phu': ['ve_hai_van_1.jpg', 544, 363, 'Xe giường nằm Hải Vân màu đen'],
  'my-dinh/muong-cha': ['phuong_tien_3.jpg', 815, 400, 'Xe giường nằm Hải Vân trong bãi đỗ'],
  'vung-tau/quan-1-san-bay': ['don-khach.jpg', 900, 600, 'Nhân viên Hải Vân đón khách lên xe tại Vũng Tàu'],
};
const rcards = routes.map((r) => {
  const [f, w, h, alt] = routeImg[r.slug];
  const nm = r.name.replace(' - ', ' đi ');
  return `<li class="rcard rcard--rail">
  <div class="rcard-img"><img src="assets/img/${f}" width="${w}" height="${h}" loading="lazy" alt="${alt}"></div>
  <div class="rcard-body">
    <h3>${nm}</h3>
    <p class="rcard-time">${ic('clock', 'ic--sm')}<span class="num">${r.run_time.replace('h', ' giờ')}</span></p>
    <p class="rcard-price"><small>Từ</small> <strong class="num">${r.price_avg.replace('Từ ', '')}</strong></p>
    <a class="btn btn--sm rcard-go" href="/xe-khach/${r.slug}" aria-label="Đặt vé ${nm}">Đặt vé</a>
  </div></li>`;
}).join('');

const dests = [['Hà Nội', 'dest-hanoi.jpg', 494, 540], ['Vũng Tàu', 'dest-vungtau.jpg', 247, 270], ['Điện Biên', 'dest-dienbien.jpg', 900, 562], ['Sơn La', 'route-sonla.jpg', 302, 167], ['Hồ Chí Minh', 'dest-hochiminh.jpg', 247, 270], ['Lào Cai, Sa Pa', 'dest-sapa.jpg', 247, 270], ['Hà Giang', 'dest-hagiang.jpg', 247, 270]];
const dcards = dests.map(([n, f, w, h]) => `<li class="dcard"><a href="/diem-den/${n.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/[^a-z]+/g, '-')}"><img src="assets/img/${f}" width="${w}" height="${h}" loading="lazy" alt=""><span class="dcard-name">${n}</span></a></li>`).join('');

const news = [
  ['news-1.jpg', 900, 506, 'Hải Vân tri ân phái đẹp, tặng 100.000 điểm thưởng', 'Banner tri ân phái đẹp 20/10 của Hải Vân'],
  ['news-2.jpg', 900, 600, 'Hải Vân tri ân học sinh, sinh viên mùa tựu trường', 'Banner ưu đãi học sinh, sinh viên mùa tựu trường'],
  ['news-3.jpg', 900, 600, 'Hải Vân gửi tặng ưu đãi gửi hàng', 'Banner ưu đãi gửi hàng của Hải Vân'],
].map(([f, w, h, t, alt]) => `<li class="ncard"><a href="/chung-toi/bao-chi-tin-tuc"><span class="ncard-img"><img src="assets/img/${f}" width="${w}" height="${h}" loading="lazy" alt="${alt}"></span><div class="ncard-body"><h3>${t}</h3><span class="ncard-more">Đọc tiếp</span></div></a></li>`).join('');

const addr = [['34 Nguyễn Thái Bình', 'Quận 1, Sài Gòn'], ['307 Nguyễn Văn Trỗi', 'Sài Gòn'], ['607 Điện Biên Phủ', 'Sài Gòn'], ['156B Lê Hồng Phong', 'Vũng Tàu'], ['01 Nguyễn Hoàng', 'Mỹ Đình, Hà Nội'], ['Quầy Tân Sơn Nhất', 'Nhà ga T1, T2, T3']]
  .map(([a, b]) => `<li class="addr">${ico('map-pin', '', 'ico--sm')}<div><h3>${a}</h3><p>${b}</p></div></li>`).join('');

// "Ưu đãi hôm nay": only offers in docs/reference/route-landing/*.json (promo, sections[0].items) and the MKT banner copy
const offers = [
  { tone: 'teal', badge: ['sale', 'Tiết kiệm 101k'], title: 'Sài Gòn đi Vũng Tàu', price: '419k', unit: '/ 2 vé Luxury, 210k mỗi người', cond: 'Đặt trước ít nhất 1 tiếng. Chỉ chuyến có nhãn Combo.', img: ['don-khach.jpg', 900, 600, 'Nhân viên Hải Vân đón khách lên xe tại Vũng Tàu'], href: '/xe-khach/quan-1/vung-tau', cta: 'Đặt vé' },
  { tone: 'blue', badge: ['on-fill', 'Đi nhóm'], title: 'Sài Gòn đi Vũng Tàu, hàng cuối', price: '599k', unit: '/ 3 vé, 4 vé 789k', cond: 'Combo trọn hàng cuối, số suất mỗi chuyến có hạn.', img: ['phuong_tien_6.jpg', 815, 400, 'Xe Luxury Hải Vân màu đen'], href: '/xe-khach/quan-1/vung-tau', cta: 'Đặt vé' },
  { tone: 'orange', badge: ['on-fill', 'Đặt trước 3 ngày'], title: 'Hà Nội đi Điện Biên', price: '900.000đ', unit: '/ 2 vé Luxury, 450k mỗi vé', cond: 'Royal Cabin 1.200.000đ / 2 vé. Tiết kiệm đến 130.000đ.', img: ['route-mydinh-dienbien.jpg', 900, 506, 'Toàn cảnh thành phố Điện Biên Phủ'], href: '/xe-khach/my-dinh/dien-bien', cta: 'Đặt vé' },
  { tone: 'leaf', badge: ['on-fill', 'Đặt trước 7 ngày'], title: 'Hà Nội đi Điện Biên, xe Eco', price: '500.000đ', unit: '/ 2 vé, 250k mỗi vé', cond: 'Nhóm 4 vé 800.000đ. Xe Eco 44 giường bọc da.', img: ['class-economy.jpg', 815, 400, 'Xe giường nằm Hải Vân bên đường Hà Nội'], href: '/xe-khach/my-dinh/dien-bien', cta: 'Đặt vé' },
  { tone: 'coral', badge: ['on-fill', 'Ứng dụng Hải Vân'], title: 'Tặng bạn 50k', price: '50k', unit: 'cho lần đặt vé đầu tiên', cond: 'Khi đặt lần đầu qua ứng dụng Hải Vân.', icon: 'smartphone', href: '/dat-ve-nhanh', cta: 'Tải ứng dụng' },
];
const ocards = offers.map((o) => `<li><article class="pcard pcard--${o.tone}">
  <h3>${o.title}</h3>
  <span class="badge badge--${o.badge[0]}">${o.badge[0] === 'sale' ? ic('tag') : ''}${o.badge[1]}</span>
  <p class="pcard-price"><strong class="num">${o.price}</strong><small>${o.unit}</small></p>
  <p class="pcard-cond">${o.cond}</p>
  <div class="pcard-foot"><a class="pcard-go" href="${o.href}">${o.cta}${ic('chevron-right', 'ic--sm')}</a>${o.img ? `<div class="pcard-photo"><img src="assets/img/${o.img[0]}" width="${o.img[1]}" height="${o.img[2]}" loading="lazy" alt="${o.img[3]}"></div>` : `<span class="ico ico--sm" aria-hidden="true">${ic(o.icon)}</span>`}</div>
</article></li>`).join('');

const trust = [
  ['headset', 'Tổng đài 1900 6763', 'Gọi điện trực tiếp 24/7'],
  ['qr-code', 'Vé điện tử qua điện thoại', 'Vé QR, không sợ mất vé'],
  ['bed-double', 'Giữ đúng giường chọn', 'Tự chọn giường hoặc ghế'],
  ['credit-card', 'Thanh toán VNPay-QR', 'Cũng nhận tiền mặt'],
].map(([i, t, d]) => `<li>${ico(i)}<div><h3>${t}</h3><p>${d}</p></div></li>`).join('');

const rail = (id, label, items, cls) => `<div class="rail-wrap"><ul class="hrail ${cls}" id="${id}" tabindex="0" aria-label="${label}">${items}</ul></div>`;
const ctrls = (id, label, grid = false) => `<div class="rail-ctrls" data-for="${id}"${grid ? ' data-grid' : ''} hidden><button class="rail-btn rail-prev" type="button" aria-label="Cuộn về trước: ${label}" aria-controls="${id}">${ic('chevron-left')}</button><button class="rail-btn rail-next" type="button" aria-label="Cuộn tiếp: ${label}" aria-controls="${id}">${ic('chevron-right')}</button></div>`;
const head = (id, hid, title, href, linkText, label, grid = false) => `<div class="sec-head"><h2 id="${hid}">${title}</h2><div class="sec-head-end"><a class="link" href="${href}">${linkText}${ic('chevron-right')}</a>${ctrls(id, label, grid)}</div></div>`;

const css = `${plateCss}
/* hero: yellow field, display head, banner (r-4 frame). The search card is glass and floats over the banner photo. */
.brand-band { background: var(--color-field); padding-block: var(--s-4) 0; }
.lede-block { display: grid; gap: var(--s-2); margin-bottom: var(--s-4); }
.lede-block h1 { max-width: none; font-size: var(--fs-display); line-height: var(--lh-display); }
.lede-block .lead { color: var(--color-accent-ink); max-width: 40ch; }
.hero-banner { position: relative; }
.slides { display: flex; gap: var(--s-3); overflow-x: auto; overscroll-behavior-x: contain; scroll-snap-type: x mandatory; scrollbar-width: none; margin-inline: calc(-1 * var(--gutter)); padding: var(--s-2) var(--gutter) var(--s-4); scroll-padding-inline: var(--gutter); }
.slides::-webkit-scrollbar { display: none; }
.slides:focus-visible { outline-offset: calc(-1 * var(--line-strong)); }
.slide { position: relative; text-decoration: none; flex: 0 0 88%; scroll-snap-align: start; aspect-ratio: 3334 / 1156; display: block; border-radius: var(--r-2); overflow: hidden; box-shadow: var(--shadow-1); background: var(--color-ink); }
.slide > img { width: 100%; height: 100%; object-fit: cover; }
.slide--photo > img { object-position: 50% 46%; }
.slide-btn { position: absolute; top: 50%; translate: 0 -50%; z-index: var(--z-raised); width: var(--control-h); height: var(--control-h); display: none; place-items: center; border: 0; border-radius: var(--r-round); background: var(--color-surface); box-shadow: var(--shadow-2); }
.slide-btn:hover { background: var(--color-accent-soft); } .slide-btn:active { background: var(--color-accent); }
.slide-prev { left: var(--s-4); } .slide-next { right: var(--s-4); }
.slide-count { position: absolute; top: var(--s-4); right: var(--s-3); z-index: var(--z-raised); display: inline-flex; align-items: center; min-height: 28px; padding: 0 var(--s-2); border-radius: var(--r-1); background: var(--color-scrim); color: var(--color-surface); font-size: var(--fs-14); line-height: var(--lh-14); font-weight: var(--weight-strong); }
/* built promo slide: deep blue fill, real offer, vehicle cut-out */
.slide--promo { background: var(--color-promo-blue); color: var(--color-on-blue); display: grid; grid-template-columns: minmax(0, 6fr) minmax(0, 5fr); align-items: center; padding-left: var(--s-4); }
.slide-copy { display: grid; gap: var(--s-1); justify-items: start; min-width: 0; }
.slide-copy .badge { display: none; }
.slide-title { font-size: var(--fs-14); line-height: var(--lh-14); font-weight: var(--weight-display); }
.slide-big { display: block; font-size: var(--fs-24); line-height: var(--lh-24); }
.slide-sub, .slide-cta { display: none; }
.slide--promo > img { width: 100%; height: auto; align-self: end; object-fit: contain; margin-bottom: var(--s-4); }
.hero-card-wrap { position: relative; z-index: var(--z-raised); margin-top: calc(-1 * var(--s-6)); }
.hero-card { border-radius: var(--r-3); }
.hero-card .plate { background: transparent; }
@media (min-width: 40rem) { .slide-btn { display: grid; } .slide-title { font-size: var(--fs-18); line-height: var(--lh-18); } .slide-big { font-size: var(--fs-32); line-height: var(--lh-32); } .slide-sub { display: block; font-size: var(--fs-16); line-height: var(--lh-16); } }
@media (min-width: 60rem) {
  .brand-band { padding-block: var(--s-6) 0; }
  .lede-block { grid-template-columns: auto minmax(0, 1fr); align-items: end; gap: var(--s-8); }
  .lede-block .lead { justify-self: end; text-align: right; padding-bottom: var(--s-2); max-width: 60ch; }
  .slides { gap: 0; margin: 0; padding: 0; scroll-padding-inline: 0; border-radius: var(--r-4); box-shadow: var(--shadow-2); }
  .slide { flex-basis: 100%; border-radius: 0; box-shadow: none; aspect-ratio: 2.7; }
  .slide-prev { left: calc(-1 * var(--s-6)); } .slide-next { right: calc(-1 * var(--s-6)); }
  .slide--promo > img { margin-bottom: var(--s-8); }
  .slide--promo { padding-left: var(--s-12); }
  .slide-copy { gap: var(--s-3); }
  .slide-copy .badge { display: inline-flex; }
  .slide-title { font-size: var(--fs-40); line-height: var(--lh-40); }
  .slide-big { display: inline; font-size: inherit; line-height: inherit; }
  .slide-sub { font-size: var(--fs-20); line-height: var(--lh-20); }
  .slide-cta { display: inline-flex; margin-top: var(--s-2); }
  /* the card covers the lower third of the banner so the glass has a photo to blur */
  .hero-card-wrap { margin-top: calc(-1 * (var(--s-24) + var(--s-8))); padding-bottom: var(--s-24); }
  .hero-card .plate-grid { grid-template-columns: minmax(0, 1fr) var(--control-h) minmax(0, 1fr) 9.5rem 9.5rem 11rem; align-items: start; }
  .hero-card .p-date, .hero-card .p-people, .hero-card .p-go { grid-column: auto; margin: 0; }
  .hero-card .p-go { margin-top: calc(var(--lh-16) + var(--s-2)); }
  .hero-card .p-swap { margin-top: calc(var(--lh-16) + var(--s-2)); }
}
/* trust strip */
.trust { display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--s-3); }
@media (min-width: 40rem) { .trust { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: var(--s-4); } }
.trust li { display: grid; grid-template-columns: var(--control-h) minmax(0, 1fr); gap: var(--s-3); align-items: center; }
.trust h3 { font-size: var(--fs-16); line-height: var(--lh-16); }
.trust p { font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); }
@media (min-width: 60rem) { .trust { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: var(--s-6); } }
.section--after-hero { padding-block: var(--s-6) var(--s-8); }
@media (min-width: 60rem) { .section--after-hero { padding-block: var(--s-8); } }
/* route cards: outer r-3, inset s-2, photo r-2 (concentric: 16 - 8 = 8) */
.rcard { position: relative; display: grid; grid-template-rows: auto 1fr; padding: var(--s-2); width: min(72vw, 17.5rem); height: 100%; background: var(--color-surface); border-radius: var(--r-3); box-shadow: var(--shadow-1); transition: box-shadow var(--dur-short) var(--ease-out); }
.rcard:hover, .rcard:focus-within { box-shadow: var(--shadow-2); }
.rcard-img { aspect-ratio: 3 / 2; border-radius: var(--r-2); overflow: hidden; background: var(--color-paper-3); }
.rcard-img img { width: 100%; height: 100%; object-fit: cover; }
.rcard-body { display: grid; grid-template-columns: minmax(0, 1fr) auto; grid-template-areas: "name name" "time time" "price go"; gap: var(--s-1) var(--s-3); padding: var(--s-3) var(--s-2) var(--s-2); align-items: center; }
.rcard-body h3 { grid-area: name; font-size: var(--fs-18); line-height: var(--lh-18); }
.rcard-time { grid-area: time; display: flex; align-items: center; gap: var(--s-2); color: var(--color-muted); font-weight: var(--weight-strong); }
.rcard-price { grid-area: price; margin-top: var(--s-2); }
.rcard-price small { color: var(--color-muted); font-size: var(--fs-14); line-height: var(--lh-14); }
.rcard-price strong { font-size: var(--fs-24); line-height: var(--lh-24); font-weight: var(--weight-display); color: var(--color-ink); font-variant-numeric: tabular-nums; }
.rcard-go { grid-area: go; margin-top: var(--s-2); }
.rcard-go::after { content: ""; position: absolute; inset: 0; border-radius: var(--r-3); }
.rcard-go:focus-visible { outline-offset: calc(-1 * var(--line-strong)); }
.rcard:has(.rcard-go:focus-visible) { outline: var(--line-strong) solid var(--color-focus); outline-offset: var(--line-strong); }
/* destination tiles: r-3 photo, name on a solid chip inset 12 (16 - 12 = 4) */
.dcard { width: 10rem; }
.dcard a { position: relative; display: block; aspect-ratio: 4 / 5; border-radius: var(--r-3); overflow: hidden; background: var(--color-paper-3); box-shadow: var(--shadow-1); text-decoration: none; transition: box-shadow var(--dur-short) var(--ease-out); }
.dcard a:hover { box-shadow: var(--shadow-2); }
.dcard img { width: 100%; height: 100%; object-fit: cover; }
.dcard-name { position: absolute; left: var(--s-3); bottom: var(--s-3); max-width: calc(100% - 2 * var(--s-3)); padding: var(--s-1) var(--s-3); border-radius: var(--r-1); background: var(--color-surface); color: var(--color-ink); font-weight: var(--weight-display); box-shadow: var(--shadow-1); }
.dcard a:focus-visible { outline-offset: var(--line-strong); }
@media (min-width: 60rem) { .dcard { width: 11rem; } }
/* news */
.ncard { width: min(82vw, 20rem); height: 100%; }
.ncard a { display: grid; grid-template-rows: auto 1fr; height: 100%; padding: var(--s-2); text-decoration: none; background: var(--color-surface); border-radius: var(--r-3); box-shadow: var(--shadow-1); transition: box-shadow var(--dur-short) var(--ease-out); }
.ncard a:hover { box-shadow: var(--shadow-2); }
.ncard a:focus-visible { outline-offset: var(--line-strong); }
.ncard-img { display: block; aspect-ratio: 16 / 9; border-radius: var(--r-2); overflow: hidden; background: var(--color-paper-3); }
.ncard-img img { width: 100%; height: 100%; object-fit: cover; }
.ncard-body { display: grid; gap: var(--s-2); align-content: start; padding: var(--s-3) var(--s-2) var(--s-2); }
.ncard h3 { font-size: var(--fs-18); line-height: var(--lh-18); }
.ncard-more { font-weight: var(--weight-strong); color: var(--color-muted); }
.ncard a:hover h3 { text-decoration: underline; text-decoration-thickness: var(--line-strong); text-decoration-color: var(--color-accent-edge); }
@media (min-width: 60rem) { .ncard { width: auto; } }
/* app band on the brand field */
.app { display: grid; gap: var(--s-8); align-items: center; }
.app-text { display: grid; gap: var(--s-4); }
.app-text h2 { color: var(--color-accent-ink); }
.ticks { display: grid; gap: var(--s-2); }
.ticks li { display: flex; align-items: center; gap: var(--s-2); font-weight: var(--weight-strong); min-height: 32px; }
.ticks .ic { padding: var(--s-1); border-radius: var(--r-1); background: var(--color-ink); color: var(--color-accent); stroke-width: 3; }
.app-qr { display: grid; grid-template-columns: 112px minmax(0, 1fr); gap: var(--s-4); align-items: center; }
.app-qr img.qr { width: 112px; height: 112px; background: var(--color-surface); padding: var(--s-2); border-radius: var(--r-2); box-shadow: var(--shadow-1); }
.app-phone { justify-self: center; width: min(100%, 320px); }
.section--yellow :focus-visible { outline-color: var(--color-focus); }
@media (min-width: 60rem) { .app { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); gap: var(--s-16); } .app-phone { justify-self: end; } }
/* rooms mosaic + address cards */
.mosaic { display: grid; gap: var(--s-2); grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-areas: "a a" "b c" "d d"; }
.mosaic .photo:nth-child(1) { grid-area: a; aspect-ratio: 3 / 2; border-radius: var(--r-4); } .mosaic .photo:nth-child(2) { grid-area: b; aspect-ratio: 4 / 3; } .mosaic .photo:nth-child(3) { grid-area: c; aspect-ratio: 4 / 3; } .mosaic .photo:nth-child(4) { grid-area: d; aspect-ratio: 5 / 2; }
@media (min-width: 60rem) {
  .mosaic { grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: 200px 200px; grid-template-areas: "a a a a a a b b b c c c" "a a a a a a d d d d d d"; }
  .mosaic .photo { aspect-ratio: auto !important; }
}
.addrs { display: grid; gap: var(--s-3); margin-top: var(--s-6); grid-template-columns: minmax(0, 1fr); }
.addr { display: grid; grid-template-columns: var(--tap-min) minmax(0, 1fr); gap: var(--s-3); align-items: center; padding: var(--s-3) var(--s-4); background: var(--color-surface); border-radius: var(--r-2); box-shadow: var(--shadow-1); }
.addr h3 { font-size: var(--fs-16); line-height: var(--lh-16); } .addr p { color: var(--color-muted); font-size: var(--fs-14); line-height: var(--lh-14); }
@media (min-width: 40rem) { .addrs { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (min-width: 60rem) { .addrs { grid-template-columns: repeat(3, minmax(0, 1fr)); } }
`;

const body = `${headerV4()}
<main id="main">
<section class="hero" aria-label="Đặt vé">
  <div class="brand-band">
    <div class="container">
      <div class="lede-block"><h1>Đặt vé xe khách Hải Vân</h1><p class="lead">Tự chọn giường hoặc ghế, giữ vé điện tử trên điện thoại.</p></div>
      <div class="hero-banner" data-banner role="region" aria-roledescription="carousel" aria-label="Ưu đãi và thông báo">
        <div class="slides" tabindex="0">
          <a class="slide slide--photo" href="/xe-san-bay"><img src="assets/img/home-hero.jpg" width="1400" height="933" fetchpriority="high" alt="Nhân viên Hải Vân đón khách và đỡ vali lên xe sân bay Tân Sơn Nhất, Vũng Tàu bên bờ biển"></a>
          <a class="slide slide--promo" href="/xe-khach/my-dinh/dien-bien" aria-label="Hà Nội đi Điện Biên, 900.000đ cho 2 vé Luxury, đặt trước 3 ngày">
            <div class="slide-copy"><span class="badge badge--on-fill">Hà Nội đi Điện Biên</span><p class="slide-title"><span class="slide-big">900.000đ</span> cho 2 vé Luxury</p><p class="slide-sub">Đặt trước 3 ngày, tiết kiệm đến 130.000đ.</p><span class="btn btn--ghost slide-cta">Xem ưu đãi</span></div>
            <img src="assets/img/xe-hanoi-dienbien.webp" width="900" height="356" alt="Xe Royal vàng và xe Luxury trắng của Hải Vân chạy tuyến Hà Nội đi Điện Biên">
          </a>
          <a class="slide" href="/xe-san-bay"><img src="assets/img/banner-limousine.jpg" width="1400" height="485" loading="lazy" alt="Đặt xe limousine sân bay Tân Sơn Nhất, TP. Hồ Chí Minh, Vũng Tàu. Hotline 1900 6763."></a>
          <a class="slide" href="/dat-ve-nhanh"><img src="assets/img/banner-app50.jpg" width="1400" height="362" loading="lazy" alt="Tặng bạn 50k khi đặt vé lần đầu qua ứng dụng Hải Vân"></a>
        </div>
        <button class="slide-btn slide-prev" type="button" aria-label="Thông báo trước">${ic('chevron-left')}</button>
        <button class="slide-btn slide-next" type="button" aria-label="Thông báo sau">${ic('chevron-right')}</button>
        <p class="slide-count" aria-hidden="true"><output>1</output>/4</p>
      </div>
    </div>
  </div>
  <div class="container hero-card-wrap">
    <div class="hero-card glass">${searchPanel({ id: 'hs', icons: true })}</div>
  </div>
</section>

<section class="section section--white section--after-hero" aria-labelledby="h-trust">
  <div class="container">
    <h2 class="sr-only" id="h-trust">Vì sao đặt vé với Hải Vân</h2>
    <ul class="trust">${trust}</ul>
  </div>
</section>

<section class="section section--warm" aria-labelledby="h-offers">
  <div class="container">
    ${head('r-offers', 'h-offers', 'Ưu đãi hôm nay', '/khuyen-mai', 'Tất cả ưu đãi', 'Ưu đãi hôm nay', false)}
    ${rail('r-offers', 'Ưu đãi hôm nay', ocards, 'hrail--offers')}
  </div>
</section>

<section class="section section--white" aria-labelledby="h-routes">
  <div class="container">
    ${head('r-routes', 'h-routes', 'Tuyến phổ biến', '/xe-khach', 'Tất cả tuyến', 'Tuyến phổ biến', false)}
    ${rail('r-routes', 'Tuyến phổ biến', rcards, 'hrail--routes')}
  </div>
</section>

<section class="section section--grey" aria-labelledby="h-dest">
  <div class="container">
    ${head('r-dest', 'h-dest', 'Điểm đến', '/diem-den', 'Tất cả điểm đến', 'Điểm đến', false)}
    ${rail('r-dest', 'Điểm đến', dcards, 'hrail--dest')}
  </div>
</section>

<section class="section section--warm" aria-labelledby="h-news">
  <div class="container">
    ${head('r-news', 'h-news', 'Tin tức', '/chung-toi/bao-chi-tin-tuc', 'Tất cả tin', 'Tin tức', true)}
    ${rail('r-news', 'Tin tức', news, 'hrail--grid3')}
  </div>
</section>

<section class="section section--yellow" aria-labelledby="h-app">
  <div class="container app">
    <div class="app-text">
      <h2 id="h-app">Tải ứng dụng Hải Vân</h2>
      <ul class="ticks"><li>${ic('check', 'ic--sm')}Theo dõi lộ trình và vị trí xe</li><li>${ic('check', 'ic--sm')}Không sợ mất vé</li><li>${ic('check', 'ic--sm')}Tích điểm đổi vé, khuyến mãi liên tục</li><li>${ic('check', 'ic--sm')}Khách hàng thân thiết</li></ul>
      <div class="app-qr"><img class="qr" src="assets/img/qrcode_haivan.png" width="112" height="112" loading="lazy" alt="Mã QR tải ứng dụng Hải Vân"><div><p>Hoặc quét mã QR</p><ul class="badges"><li><a href="https://apps.apple.com/app/apple-store/id1440552948"><img src="assets/img/appstore.png" width="140" height="44" loading="lazy" alt="Tải trên App Store"></a></li><li><a href="https://play.google.com/store/apps/details?id=com.havaz_app"><img src="assets/img/playstore.png" width="140" height="44" loading="lazy" alt="Tải trên Google Play"></a></li></ul></div></div>
    </div>
    <img class="app-phone" src="assets/img/app-phone.webp" width="640" height="656" loading="lazy" alt="Màn hình chính ứng dụng Hải Vân: xe sân bay, xe liên tỉnh, tuyến phổ biến">
  </div>
</section>

<section class="section section--white" aria-labelledby="h-rooms">
  <div class="container">
    <div class="head-block"><h2 id="h-rooms">Phòng chờ và quầy vé</h2></div>
    <div class="mosaic">
      <figure class="photo"><img src="assets/img/phong_cho_1.jpg" width="544" height="363" loading="lazy" alt="Phòng chờ Hải Vân: ghế sofa, quầy trà bánh, khách ngồi nghỉ"></figure>
      <figure class="photo"><img src="assets/img/phong_cho_2.jpg" width="544" height="363" loading="lazy" alt="Quầy trà bánh và trái cây trong phòng chờ"></figure>
      <figure class="photo"><img src="assets/img/phong_cho_3.jpg" width="544" height="363" loading="lazy" alt="Khách chờ xe trong phòng chờ có điều hòa"></figure>
      <figure class="photo"><img src="assets/img/phong_ve.jpg" width="815" height="320" loading="lazy" alt="Nhân viên quầy vé Hải Vân hỗ trợ khách"></figure>
    </div>
    <ul class="addrs">${addr}</ul>
  </div>
</section>
</main>
${footer()}
${callFab()}
${loginDialog()}`;

export default {
  title: 'Hãng xe Hải Vân: đặt vé xe khách liên tỉnh, xe sân bay, xe hợp đồng',
  desc: 'Đặt vé xe khách Hải Vân đi Tây Bắc, Vũng Tàu, sân bay Tân Sơn Nhất. Tự chọn giường hoặc ghế, giữ vé trên điện thoại. Hotline 1900 6763.',
  stamp: {
    shape: 'Marquee Hero (home), v4 functional glass', hero: 'Counter (yellow field, display head, banner, glass search card floating over the banner photo)', nav: 'slab (glass-yellow sticky bar: wordmark, five links, hotline, login)', footer: 'mast (wordmark and hotline over a real sitemap)',
    imagery: 'real photographs, MKT banners and vehicle cut-outs from haivan.com and its CMS', signature: 'the glass search card over the banner photo, then solid coloured promo cards and photo rails',
    critique: 'P4 H4 E4 S4 R4 V4 · weakest: S, a promo-first app look is rails of cards by design; v4 swaps black borders for light (shadow-1 to 3) and keeps glass to the header, the search card and the dialog sheet',
    waive: [
      'waive 83 · image-led home by owner brief (app-style booking look); every photograph is a real route, fleet, room or news picture of the Hải Vân page · galleries of the owner\'s own material',
      'waive 78 · section heads at 24 to 32px under a 48px hero display · the display step exists for the home hero only · a booking page is read by scanning',
      'note glass · functional glass by owner brief (v4): backdrop blur only on floating layers (sticky header, search card over the banner, login sheet), at most three on a screen, solid fallback under no-backdrop-filter and prefers-reduced-transparency, no text under 16px on it, ink text 4.5:1 measured over the darkest and the brightest backdrop',
      'dismissed 3 · the trust strip sets the icon beside its title (four items); cards below are photographs or offers with a price',
      'dismissed 23 · the hero is the brand field token under the declared committed posture; the promo palette fills carry real offers only',
      'dismissed 59 · owner brief asks for a faster rhythm: sections sit 96px apart and change ground colour each time',
      'answered F5 · the yellow icon tile is the owner-picked illustrated icon style (lucide stroke on a brand-yellow fill, one weight, r-1 square)',
      'answered F4 · the promo cards each hold one surface-coloured action inside a coloured fill, the screen keeps one yellow primary ("Tìm vé")',
    ],
  },
  css,
  body,
  script: railScript + dialogScript,
};
