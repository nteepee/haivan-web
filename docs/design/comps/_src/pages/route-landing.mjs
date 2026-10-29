import { header, footer, callFab, ic } from '../lib.mjs';
import { searchPanel, panelCss, faqList } from '../parts.mjs';

const why = [
  ['moon', 'Đi đêm, sáng tới nơi', 'Rời bến buổi tối, tới nơi sáng hôm sau.'],
  ['bed-double', 'Ba hạng giường nằm', 'Economy, Luxury, Royal Cabin.'],
  ['armchair', 'Tự chọn giường', 'Vé điện tử về điện thoại.'],
  ['banknote', 'Giá rõ từng giường', 'Không phụ thu khi đặt trực tuyến.'],
  ['shield-check', 'Không nhồi nhét', 'Mỗi khách một giường, không bán ghế phụ.'],
  ['heart-pulse', 'Trung chuyển bệnh viện', 'Miễn phí tới các bệnh viện Hà Nội.'],
].map(([i, t, l]) => `<li class="why">${ic(i)}<div><h3>${t}</h3><p>${l}</p></div></li>`).join('');

// SAMPLE DATA: departure times are illustrative; the live list comes from the booking API.
const trips = [['19:30', 'Economy'], ['20:00', 'Luxury'], ['20:30', 'Royal Cabin']].map(([t, c], i) => {
  const arr = (h, m) => { const d = (h * 60 + m + 11 * 60) % 1440; return String(Math.floor(d / 60)).padStart(2, '0') + ':' + String(d % 60).padStart(2, '0'); };
  const [h, m] = t.split(':').map(Number);
  return `<article class="trip"><div class="trip-main">
    <div class="trip-when"><span class="time">${t}</span><span class="dur">11 giờ</span></div>
    <div class="trip-route"><p class="stop">Bến xe Mỹ Đình</p><p class="stop stop--end"><b>${arr(h, m)}</b>Bến xe khách Điện Biên Phủ</p></div>
    <div class="trip-meta"><span class="tag">${c}</span><span class="tag tag--in">${ic('check')}Còn chỗ</span></div>
    <div class="trip-act"><a class="btn" href="/xe-khach/tim-chuyen">Chọn giường</a></div>
  </div></article>`;
}).join('');

const classes = [
  ['Economy', 'class-economy.jpg', 815, 400, 'Xe giường nằm Eco của Hải Vân', false, ['Điều hòa', 'Giường da, chăn gối', 'Cổng sạc USB tại giường']],
  ['Luxury', 'xe-luxury.webp', 900, 436, 'Xe Luxury trắng của Hải Vân', true, ['Rèm che riêng tư', 'Màn hình riêng', 'Bàn nhỏ để đồ']],
  ['Royal Cabin', 'xe-royal.webp', 900, 436, 'Xe Royal Cabin vàng của Hải Vân', true, ['Cabin riêng rộng', 'Chăn ga gối trắng', 'Màn hình và bảng điều khiển']],
].map(([n, f, w, h, alt, cut, am]) => `<li class="ccard"><div class="ccard-img${cut ? ' ccard-img--cut' : ''}"><img src="assets/img/${f}" width="${w}" height="${h}" loading="lazy" alt="${alt}"></div><div class="ccard-body"><h3>${n}</h3><ul class="ticks">${am.map((a) => `<li>${ic('check', 'ic--sm')}${a}</li>`).join('')}</ul><a class="btn btn--sm btn--ghost" href="/xe-khach/tim-chuyen">Xem lịch ${n}</a></div></li>`).join('');

const places = [
  ['Phòng chờ 01 Nguyễn Hoàng', 'Mỹ Đình, Hà Nội, cạnh Bến xe Mỹ Đình'],
  ['Bến xe Mỹ Đình', '20 Phạm Hùng, Từ Liêm, Hà Nội'],
  ['Văn phòng Hải Vân Điện Biên', '300 Nguyễn Hữu Thọ, Mường Thanh, Điện Biên Phủ'],
  ['Bến xe khách Điện Biên Phủ', '79 Quốc lộ 12, Điện Biên Phủ'],
  ['Bản Phủ và Mường Chà', 'Một số chuyến, gọi 1900 6763 để xác nhận'],
].map(([a, b]) => `<li class="addr">${ic('map-pin')}<div><h3>${a}</h3><p>${b}</p></div></li>`).join('');

const cargo = [['truck', 'Gửi nhanh trong ngày', 'Tới nơi sau 4 đến 12 tiếng.'], ['package', 'Kiện nhỏ tới hàng tấn', 'Đội xe tải khai thác tới 8 tấn.'], ['building-2', 'Nhận hàng tại Mỹ Đình', 'Tại 01 Nguyễn Hoàng.']]
  .map(([i, t, l]) => `<li class="why">${ic(i)}<div><h3>${t}</h3><p>${l}</p></div></li>`).join('');

const help = [['hand-heart', 'Không bỏ lại ai phía sau', 'Vé miễn phí cho bệnh nhân.'], ['graduation-cap', 'Tiếp sức mùa thi', 'Thẻ đồng hành cho học sinh Mộc Châu, Sơn La.'], ['heart-pulse', 'Xe trung chuyển bệnh viện', 'Miễn phí tới 10 bệnh viện.']]
  .map(([i, t, l]) => `<li class="why">${ic(i)}<div><h3>${t}</h3><p>${l}</p></div></li>`).join('');

const faqShow = [
  ['Chờ xe ở Hà Nội tại đâu cho thoải mái?', 'Phòng chờ 01 Nguyễn Hoàng ngay cạnh Bến xe Mỹ Đình có điều hòa, chỗ ngồi, trà bánh và trái cây.'],
  ['Xe có nhồi nhét hay bán ghế phụ không?', 'Không. Mỗi khách một giường đã đánh số trên sơ đồ.'],
  ['Xuống Hà Nội khám bệnh có xe trung chuyển không?', 'Có, miễn phí từ 01 Nguyễn Hoàng tới các bệnh viện lớn. Đăng ký với tổng đài hoặc lái xe khi đặt vé.'],
  ['Làm sao biết đúng điểm đón và điểm trả của tôi?', 'Chỉ chọn điểm có trong chuyến bạn đặt. Cần xác nhận thì gọi 1900 6763.'],
];
const faqMore = [
  ['Tôi có thể đổi hoặc huỷ vé không?', 'Có. Vào Chuyến đi của tôi để đổi hoặc huỷ theo chính sách hiện hành.'],
  ['Xe Hà Nội đi Điện Biên chạy mất bao lâu?', 'Khoảng 11 giờ, tuỳ giao thông và thời gian nghỉ dọc đường.'],
  ['Có gửi hàng theo tuyến này không?', 'Có. Nhắn Zalo hoặc gọi tổng đài để báo loại hàng, khối lượng và nơi nhận.'],
  ['Vì sao loại xe và giá khác nhau giữa các chuyến?', 'Mỗi chuyến chạy một hạng xe, giá chính xác hiện trên từng giường khi mở sơ đồ.'],
];

const css = `${panelCss}
/* hero: soft-yellow banner with the route's own bus, booking plate hung over its lower edge */
.rhero-band { background: var(--color-accent-soft); }
.rhero-grid { display: grid; gap: var(--s-6); grid-template-columns: minmax(0, 1fr); align-items: center; padding-block: var(--s-6) var(--s-12); }
@media (min-width: 60rem) { .rhero-grid { padding-block: var(--s-12) var(--s-16); } .rhero-art img { max-width: 600px; }  }
.rhero-text { display: grid; gap: var(--s-3); align-content: center; }
.rhero-text .lead { color: var(--color-ink); }
.facts { display: grid; grid-template-columns: repeat(3, auto); gap: var(--s-6); justify-content: start; margin-top: var(--s-2); }
.facts dt { font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); font-weight: var(--weight-strong); }
.facts dd { margin: 0; font-size: var(--fs-24); line-height: var(--lh-24); font-weight: var(--weight-display); color: var(--color-ink); font-variant-numeric: tabular-nums; }
.facts div { display: grid; gap: 0; grid-template-areas: "v" "l"; }
.facts dd { grid-area: v; } .facts dt { grid-area: l; }
.rhero-art img { width: 100%; max-width: 560px; margin-inline: auto; }
.rplate-wrap { margin-bottom: var(--s-16); position: relative; z-index: var(--z-raised); margin-top: calc(-1 * var(--s-6)); }
.rplate { background: var(--color-surface); border: var(--line-strong) solid var(--color-ink); border-radius: var(--r-lg); overflow: hidden; }
.rplate .plate { border: 0; border-radius: 0; }
@media (min-width: 60rem) {
  .rhero-grid { grid-template-columns: minmax(0, 6fr) minmax(0, 6fr); gap: var(--s-16); }
  .rplate .plate-grid { grid-template-columns: minmax(0, 1fr) var(--control-h) minmax(0, 1fr) 9.5rem 9.5rem 11rem; align-items: start; }
  .rplate .p-date, .rplate .p-people, .rplate .p-go { grid-column: auto; margin: 0; }
  .rplate .p-go, .rplate .p-swap { margin-top: calc(var(--lh-14) + var(--s-2)); }
}
/* offers */
.offers { display: grid; gap: var(--gap-card); }
.offer { display: grid; grid-template-columns: minmax(0, 1fr); background: var(--color-surface); border: var(--line) solid var(--color-rule); border-radius: var(--r-md); overflow: hidden; }
.offer-img { background: var(--color-accent-soft); display: grid; place-items: center; padding: var(--s-4); }
.offer-img img { width: 100%; max-width: 360px; }
.offer-body { display: grid; gap: var(--s-2); padding: var(--card-pad); align-content: start; }
.offer-body h3 { font-size: var(--fs-24); line-height: var(--lh-24); }
.offer-body .lead2 { color: var(--color-muted); }
.offer .disclose { border-top: var(--line) solid var(--color-rule); }
.offer .disclose > summary { padding-inline: var(--card-pad); }
.offer .disclose ul { padding: 0 var(--card-pad) var(--card-pad); display: grid; gap: var(--s-2); color: var(--color-text); }
@media (min-width: 60rem) { .offers { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
.sample-note { margin-top: var(--s-3); color: var(--color-muted); font-size: var(--fs-14); line-height: var(--lh-14); }
/* why */
.split { display: grid; gap: var(--s-8); }
.split-photo { aspect-ratio: 4 / 3; }
.whys { display: grid; border-top: var(--line-strong) solid var(--color-ink); }
.why { display: grid; grid-template-columns: var(--icon-size) minmax(0, 1fr); gap: var(--s-4); padding-block: var(--s-3); border-bottom: var(--line) solid var(--color-rule); align-items: start; }
.why .ic { margin-top: var(--s-1); }
.why h3 { font-size: var(--fs-18); line-height: var(--lh-18); font-weight: var(--weight-display); }
.why p { color: var(--color-muted); }
@media (min-width: 60rem) { .split { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: var(--s-16); align-items: start; } .split-photo { aspect-ratio: auto; height: 100%; min-height: 420px; } }
/* interior strip */
.strip { display: grid; gap: var(--gap-card); grid-template-columns: repeat(3, minmax(0, 1fr)); margin-top: var(--s-6); }
.strip .photo { aspect-ratio: 4 / 3; }
/* route map on ink */
.map-wrap { overflow-x: auto; padding-bottom: var(--s-2); display: grid; align-content: center; min-height: 20rem; }
.map-wrap img { min-width: 640px; width: 100%; }
/* community */
.help { display: grid; gap: var(--s-1); padding-block: var(--s-4); }
.help h3 { font-size: var(--fs-18); line-height: var(--lh-18); }
.help p { color: var(--color-muted); }
/* callback */
.callback { display: grid; gap: var(--s-3); max-width: 28rem; }
.callback-note { color: var(--color-muted); font-size: var(--fs-14); line-height: var(--lh-14); }
.more-faq { margin-top: var(--s-4); }
.two { display: grid; gap: var(--s-8); }
@media (min-width: 60rem) { .two { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--s-16); align-items: start; } }
`;

const body = `${header()}
<main id="main">
<section class="rhero" aria-labelledby="h1">
  <div class="rhero-band"><div class="container rhero-grid">
    <div class="rhero-text">
      <h1 id="h1">Đặt vé xe Hà Nội đi Điện Biên</h1>
      <p class="lead">Xe giường nằm chạy đêm, sáng mai tới Điện Biên.</p>
      <dl class="facts"><div><dt>Giá từ</dt><dd class="num">485.000đ</dd></div><div><dt>Thời gian</dt><dd class="num">11 giờ</dd></div><div><dt>Quãng đường</dt><dd class="num">500 km</dd></div></dl>
    </div>
    <div class="rhero-art"><img src="assets/img/xe-hanoi-dienbien.webp" width="900" height="356" fetchpriority="high" alt="Hai xe giường nằm Hải Vân chạy tuyến Hà Nội, Điện Biên: xe vàng Royal và xe trắng"></div>
  </div></div>
  <div class="container rplate-wrap"><div class="rplate">${searchPanel({ id: 'rs', from: 'Bến xe Mỹ Đình', to: 'Bến xe Điện Biên' })}</div></div>
</section>

<section class="section" aria-labelledby="h-offers">
  <div class="container">
    <div class="head-block"><h2 id="h-offers">Ưu đãi đang chạy</h2></div>
    <div class="offers">
      <article class="offer"><div class="offer-img"><img src="assets/img/xe-luxury.webp" width="900" height="436" loading="lazy" alt="Xe Luxury Hải Vân"></div><div class="offer-body"><h3>Luxury 450.000đ, Royal 600.000đ một vé</h3><p class="lead2">Đi 2 người hoặc khứ hồi, đặt trước 3 ngày.</p></div>
        <details class="disclose"><summary>Điều kiện áp dụng${ic('chevron-down')}</summary><ul><li>Thanh toán trước bằng mã QR ngay khi đặt.</li><li>Tối đa 4 vé ưu đãi mỗi số điện thoại trên một chuyến.</li><li>Vé ưu đãi không hoàn tiền, đổi chuyến hoặc ngày gọi 1900 6763.</li><li>Trẻ dưới 5 tuổi nằm chung với người lớn miễn phí.</li></ul></details></article>
      <article class="offer"><div class="offer-img"><img src="assets/img/class-economy.jpg" width="815" height="400" loading="lazy" alt="Xe giường nằm Economy Hải Vân"></div><div class="offer-body"><h3>Economy 250.000đ một vé</h3><p class="lead2">Đặt trước 7 ngày. Nhóm 4 người: 200.000đ một vé.</p></div>
        <details class="disclose"><summary>Điều kiện áp dụng${ic('chevron-down')}</summary><ul><li>Áp dụng xe Economy 44 giường.</li><li>Giá đã gồm VAT. Cần hóa đơn công ty gọi 1900 6763.</li></ul></details></article>
    </div>
  </div>
</section>

<section class="section section--band" aria-labelledby="h-sched">
  <div class="container">
    <div class="head-block"><h2 id="h-sched">Giờ chạy và giá vé</h2></div>
    <div class="trips">${trips}</div>
    <p class="sample-note">Giá hiện trên từng giường. Bản mẫu: giờ chạy chỉ minh hoạ.</p>
  </div>
</section>

<section class="section" aria-labelledby="h-why">
  <div class="container split">
    <figure class="photo split-photo"><img src="assets/img/lai-xe.jpg" width="900" height="618" loading="lazy" alt="Tài xế Hải Vân đứng trước hàng xe limousine"></figure>
    <div><div class="head-block"><h2 id="h-why">Lên Tây Bắc chu đáo hơn</h2></div><ul class="whys">${why}</ul></div>
  </div>
</section>

<section class="section section--band" aria-labelledby="h-class">
  <div class="container">
    <div class="head-block"><h2 id="h-class">Xe giường nằm Hà Nội đi Điện Biên</h2></div>
    <ul class="rail rail--grid rail--3" tabindex="0" aria-label="Ba hạng xe">${classes}</ul>
    <div class="strip"><figure class="photo"><img src="assets/img/tien_ich_3.jpg" width="544" height="363" loading="lazy" alt="Hai dãy giường nằm có rèm che trên xe Luxury"></figure><figure class="photo"><img src="assets/img/tien_ich_1.jpg" width="544" height="363" loading="lazy" alt="Màn hình riêng và nước uống tại giường"></figure><figure class="photo"><img src="assets/img/tien_ich_2.jpg" width="544" height="363" loading="lazy" alt="Cổng sạc USB tại giường"></figure></div>
  </div>
</section>

<section class="section section--dark" aria-labelledby="h-map">
  <div class="container">
    <div class="head-block"><h2 id="h-map">Các điểm dừng trên tuyến</h2></div>
    <div class="map-wrap" tabindex="0" role="region" aria-label="Sơ đồ tuyến Yên Nghĩa, Điện Biên, Bản Phủ, Mường Lay"><img src="assets/img/route-map-tay-bac.webp" width="1886" height="428" loading="lazy" alt="Sơ đồ tuyến từ Yên Nghĩa hoặc Xuân Mai qua Hòa Bình, Tuần Giáo tới Điện Biên, Mường Chà, Mường Lay và Bản Phủ"></div>
  </div>
</section>

<section class="section" aria-labelledby="h-places">
  <div class="container two">
    <div>
      <div class="head-block"><h2 id="h-places">Phòng chờ và bến xe</h2></div>
      <ul class="addrs addrs--one">${places}</ul>
    </div>
    <div class="mosaic mosaic--route">
      <figure class="photo"><img src="assets/img/phong_cho_1.jpg" width="544" height="363" loading="lazy" alt="Phòng chờ Hải Vân với ghế sofa và quầy trà bánh"></figure>
      <figure class="photo"><img src="assets/img/phong_cho_2.jpg" width="544" height="363" loading="lazy" alt="Trà bánh và trái cây trong phòng chờ"></figure>
      <figure class="photo"><img src="assets/img/phong_cho_3.jpg" width="544" height="363" loading="lazy" alt="Khách ngồi chờ xe trong phòng chờ"></figure>
    </div>
  </div>
</section>

<section class="section section--band" aria-labelledby="h-cargo">
  <div class="container two">
    <div><div class="head-block"><h2 id="h-cargo">Gửi hàng cùng chuyến xe</h2></div><ul class="whys">${cargo}</ul><p class="rooms-call"><a class="btn btn--ghost" href="tel:19006763">${ic('phone')}Gọi 1900 6763</a></p></div>
    <div><div class="head-block"><h2 id="h-help">Hải Vân và bà con Điện Biên</h2></div><ul class="whys">${help}</ul></div>
  </div>
</section>

<section class="section section--band" aria-labelledby="h-faq">
  <div class="container two">
    <div><div class="head-block"><h2 id="h-faq">Câu hỏi thường gặp</h2></div>
      </div>
    <div>${faqList(faqShow)}
      <details class="disclose more-faq"><summary>Xem thêm câu hỏi${ic('chevron-down')}</summary>${faqList(faqMore)}</details></div>
  </div>
</section>

<section class="section" aria-labelledby="h-call">
  <div class="container two">
    <div class="head-block"><h2 id="h-call">Để Hải Vân gọi lại cho bạn</h2><p class="lead">Đang vội thì bấm gọi thẳng 1900 6763.</p></div>
    <form class="callback" data-endpoint="" action="#" method="post">
      <div class="field"><label for="cb-name">Họ và tên</label><input class="input" id="cb-name" name="name" autocomplete="name"></div>
      <div class="field"><label for="cb-phone">Số điện thoại</label><input class="input" id="cb-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel"></div>
      <button class="btn btn--lg" type="submit">Gửi yêu cầu</button>
      <p class="callback-note">Bản mẫu, chưa gửi đi.</p>
    </form>
  </div>
</section>

<section class="section section--dark" aria-labelledby="h-app">
  <div class="container app">
    <div class="app-text">
      <h2 id="h-app">Giữ vé điện tử trên điện thoại</h2>
      <div class="app-qr"><img class="qr" src="assets/img/qrcode_haivan.png" width="112" height="112" loading="lazy" alt="Mã QR tải ứng dụng Hải Vân"><div><p>Quét mã QR, hoặc chọn cửa hàng</p><ul class="badges"><li><a href="https://apps.apple.com/app/apple-store/id1440552948"><img src="assets/img/appstore.png" width="140" height="44" loading="lazy" alt="Tải trên App Store"></a></li><li><a href="https://play.google.com/store/apps/details?id=com.havaz_app"><img src="assets/img/playstore.png" width="140" height="44" loading="lazy" alt="Tải trên Google Play"></a></li></ul></div></div>
    </div>
    <img class="app-phone" src="assets/img/app-phone.webp" width="640" height="656" loading="lazy" alt="Màn hình chính ứng dụng Hải Vân">
  </div>
</section>
</main>
${footer()}
${callFab()}`;

export default {
  title: 'Đặt vé xe Hà Nội đi Điện Biên | Giường nằm Hải Vân',
  desc: 'Đặt vé xe Hải Vân từ Hà Nội đi Điện Biên: giá từ 485.000đ, 11 giờ, xe giường nằm chạy đêm. Xem lịch chạy, chọn giường, giữ vé trên điện thoại.',
  stamp: {
    shape: 'Marquee Hero (route landing)', hero: 'Banner (route banner with its own bus, compact booking plate overlapping)', imagery: 'real fleet, interior, waiting-room and route-map assets from haivan.com',
    signature: 'the Hà Nội to Điện Biên bus and the real stop map on ink',
    critique: 'P4 H4 E4 S5 R4 V3 · weakest: V, ten owner blocks must stay so rows, cards, split and ink band alternate instead of repeating one skeleton',
    waive: [
      'waive 83 · image-led route page by owner brief; every picture is a real vehicle, interior, waiting room or route map of the Hà Nội to Điện Biên line · galleries of the owner\'s own material',
      'waive 78 · section heads at 32px under a 40px hero head · the owner scale ends at 40px so h1 is 40 and h2 is 32 · a route page is read by scanning',
      'waive 44c · Banner posture, the offers section starts above the fold by design · a route page is a reference page that opens straight onto its booking plate and offers',
      'waive 59 · sections sit 96px apart at 1440 · owner brief for the v3 app-style look asks for a faster rhythm; the ground colour changes between sections so the break is still read',
      'waive 77 · one full-width route diagram, 258px tall at 1440 · the diagram is a single real asset whose aspect ratio sets its height',
      'answered F20 · the large tile spans both rows beside two stacked tiles, so no tile stands alone',
      'dismissed 59 · the owner brief keeps ten route blocks, so the page has more sections than the count a template would carry; they alternate rows, cards, split and ink band',
      'dismissed 3 · the why rows set the icon beside the title and the class cards are photographs, so none is an icon tile above a heading',
    ],
  },
  css,
  body,
};
