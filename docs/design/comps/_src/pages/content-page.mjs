import { header, footer, callFab, ic } from '../lib.mjs';

const nav = ['Về Hải Vân', 'An toàn và chất lượng', 'Phát triển bền vững', 'Đánh giá của khách hàng', 'Đối tác', 'Tin tức', 'Tuyển dụng'];
const subnav = nav.map((n, i) => `<li><a href="#"${i === 0 ? ' aria-current="page"' : ''}>${n}</a></li>`).join('');

const css = `
.crumbs { display: flex; flex-wrap: wrap; gap: var(--s-2); font-size: var(--fs-14); line-height: var(--lh-14); color: var(--color-muted); padding-block: var(--s-4); }
.crumbs a { display: inline-flex; align-items: center; min-height: var(--tap-min); }
.crumbs li { display: flex; align-items: center; min-height: var(--tap-min); }
.crumbs li + li::before { content: "/"; margin-right: var(--s-2); }
.crumbs ol { display: flex; flex-wrap: wrap; gap: var(--s-2); align-items: center; }
.doc-grid { display: grid; gap: var(--s-8); }
.doc-grid > * { min-width: 0; }
.page-head { display: grid; gap: var(--s-6); padding-bottom: var(--s-12); }
.page-head h1 { max-width: none; }
.page-head .photo3 { display: grid; gap: var(--gap-card); grid-template-columns: repeat(2, minmax(0, 1fr)); grid-template-areas: "a a" "b c"; }
.page-head .photo3 .photo { aspect-ratio: 4 / 3; border-radius: var(--r-lg); }
.page-head .photo3 .photo:nth-child(1) { grid-area: a; aspect-ratio: 3 / 2; } .page-head .photo3 .photo:nth-child(2) { grid-area: b; } .page-head .photo3 .photo:nth-child(3) { grid-area: c; }
@media (min-width: 60rem) { .page-head .photo3 { grid-template-columns: repeat(12, minmax(0, 1fr)); grid-template-rows: repeat(2, 16rem); grid-template-areas: "a a a a a a a b b b b b" "a a a a a a a c c c c c"; } .page-head .photo3 .photo { aspect-ratio: auto !important; } }
.subnav { display: flex; overflow-x: auto; gap: var(--s-1); border-bottom: var(--line) solid var(--color-rule); scrollbar-width: none; }
.subnav a { display: inline-flex; align-items: center; min-height: var(--control-h); padding-inline: var(--s-4); white-space: nowrap; font-weight: var(--weight-strong); text-decoration: none; border-bottom: var(--line-strong) solid transparent; }
.subnav a:hover { background: var(--color-accent-soft); } .subnav a:active { background: var(--color-accent); }
.subnav a[aria-current="page"] { font-weight: var(--weight-display); border-bottom-color: var(--color-ink); background: var(--color-surface); }
.doc { display: grid; gap: var(--s-16); min-width: 0; }
.doc h1 { max-width: none; }
.read { font-size: var(--fs-18); line-height: var(--lh-18); display: grid; gap: var(--s-4); }
.read p { max-width: 68ch; }
.block { display: grid; gap: var(--s-6); }
.block h2 { font-size: var(--fs-h2); }
.service { display: grid; gap: var(--s-4); padding-block: var(--s-6); border-top: var(--line-strong) solid var(--color-ink); }
.service h3 { font-size: var(--fs-24); line-height: var(--lh-24); }
.service .photo { aspect-ratio: 3 / 2; }
.service ul.bul { display: grid; gap: var(--s-2); padding-left: var(--s-6); list-style: disc; }
.soft-art { background: var(--color-accent-soft); display: grid; place-items: center; padding: var(--s-6); }
.soft-art img { max-height: 280px; width: auto; }
@media (min-width: 60rem) {
  .doc-grid { grid-template-columns: minmax(0, 3fr) minmax(0, 9fr); gap: var(--s-16); align-items: start; }
  .subnav { flex-direction: column; overflow: visible; border-bottom: 0; border-top: var(--line-strong) solid var(--color-ink); gap: 0; }
  .subnav a { width: 100%; border-bottom: var(--line) solid var(--color-rule); }
  .subnav a[aria-current="page"] { background: var(--color-accent-soft); }
  .service { grid-template-columns: minmax(0, 5fr) minmax(0, 7fr); gap: var(--s-8); align-items: start; }
  .service--flip .photo, .service--flip .soft-art { order: 2; }
  .service--flip { grid-template-columns: minmax(0, 7fr) minmax(0, 5fr); }
}
`;

const body = `${header({ current: 'Chúng tôi' })}
<main id="main">
<div class="container">
  <nav aria-label="Đường dẫn"><ol class="crumbs"><li><a href="/">Trang chủ</a></li><li><a href="/chung-toi/gioi-thieu">Chúng tôi</a></li><li aria-current="page">Về Hải Vân</li></ol></nav>
  <header class="page-head">
        <h1>Về Hải Vân</h1>
        <div class="photo3">
          <figure class="photo"><img src="assets/img/ve_hai_van_1.jpg" width="544" height="363" fetchpriority="high" alt="Xe giường nằm Hải Vân màu đen trước tòa nhà"></figure>
          <figure class="photo"><img src="assets/img/ve_hai_van_2.jpg" width="544" height="363" alt="Đoàn xe Hải Vân xếp hàng tại bến"></figure>
          <figure class="photo"><img src="assets/img/phuong_tien_5.jpg" width="815" height="400" alt="Xe khách Hải Vân màu trắng bên đường"></figure>
        </div>
  </header>
  <div class="doc-grid">
    <nav aria-label="Chúng tôi"><ul class="subnav">${subnav}</ul></nav>
    <article class="doc">

      <section class="block" aria-labelledby="h-why">
        <h2 id="h-why">Tại sao chọn Hải Vân</h2>
        <div class="read prose">
          <p>Thành lập năm 1994, sau hơn 3 thập kỷ, hiện Hải Vân đã trở thành một trong những Công ty vận tải hành khách hàng đầu tại Việt Nam ở phân khúc cao cấp, với hơn 1.000 nhân viên. Hải Vân có trụ sở chính tại Hà Nội và mạng lưới cung cấp dịch vụ rộng khắp cả nước. Với sứ mệnh cung cấp dịch vụ vận tải đẳng cấp, tử tế và đáng tin cậy cho mọi khách hàng, chúng tôi không chỉ thường xuyên cập nhật xu hướng vận tải mới nhất trên thế giới để ứng dụng, cho ra đời những sản phẩm, dịch vụ độc đáo, mà còn luôn đầu tư nghiên cứu, thấu hiểu để đáp ứng tốt nhất mọi nhu cầu của mọi khách hàng.</p>
          <p>Với Hải Vân, hạnh phúc là được phục vụ khách hàng mọi lúc, mọi nơi, mọi yêu cầu một cách hoàn hảo. Chúng tôi mời bạn trải nghiệm dịch vụ đặc biệt của Hải Vân!</p>
        </div>
      </section>

      <section class="block" aria-labelledby="h-services">
        <h2 id="h-services">Dịch vụ của chúng tôi</h2>
        <div>
          <article class="service"><figure class="photo"><img src="assets/img/phong_cho_1.jpg" width="544" height="363" loading="lazy" alt="Phòng chờ Hải Vân với ghế sofa, đồ ăn nhẹ và truyền hình"></figure>
            <div class="read"><h3>Xe tuyến đường dài</h3><p>Hải Vân cam kết cung cấp dịch vụ xe tuyến đẳng cấp với chi phí hợp lý để mọi khách hàng đều có cơ hội trải nghiệm. Chúng tôi là nhà xe duy nhất tại Việt Nam cung cấp dịch vụ phòng chờ sang trọng cho khách hàng với đầy đủ dịch vụ như phòng chờ thương gia của dịch vụ hàng không, từ ghế ngồi, đồ ăn nhẹ tự chọn, cho đến truyền hình và wifi. Niềm tự hào của Hải Vân còn nằm ở những chiếc ghế hết sức đặc biệt trên dòng xe Hoàng gia, được nghiên cứu, thiết kế tối ưu nhằm mang đến sự thoải mái, thư giãn nhất cho khách hàng, với chất liệu da cao cấp thường chỉ được sử dụng cho siêu xe. Ở loại hình vận tải này, Hải Vân hiện giữ số 1 về thị phần vận tải liên tỉnh phía Bắc, với 70% thị phần tuyến Lào Cai – Sapa; số 1 về quy mô phương tiện và tần suất xe khu vực phía Bắc với hơn 100 xe vận hành trên 9 tỉnh phía bắc, phục vụ 150 lượt xe/ngày. Tổng số khách mà Hải Vân vận chuyển lên đến 2 Triệu lượt khách/năm.</p></div></article>
          <article class="service service--flip"><figure class="photo"><img src="assets/img/phuong_tien_4.jpg" width="815" height="400" loading="lazy" alt="Xe đen Hải Vân dùng cho thuê theo giờ"></figure>
            <div class="read"><h3>Xe cho thuê</h3><p>Để có chuyến đi như ý, bạn có thể đặt trước một chiếc xe có tài xế cho các chuyến đi trong thành phố hoặc giữa các thành phố. Chúng tôi cung cấp dịch vụ linh hoạt với nhiều lựa chọn, như đặt theo giờ hoặc thậm chí vài tháng. Hệ thống xe của chúng tôi rất đa dạng, từ xe nhỏ 7 chỗ đến xe khách lớn 45 chỗ và liên tục có những chính sách ưu đãi cho khách hàng đi theo nhóm, giúp giảm thiểu chi phí và tạo sự thuận tiện cho các bạn. Hãy để Hải Vân phục vụ bạn theo cách chu đáo và tử tế nhất!</p></div></article>
          <article class="service"><figure class="photo"><img src="assets/img/home-hero-720.jpg" width="720" height="480" loading="lazy" alt="Nhân viên Hải Vân mở cửa xe limousine đón khách"></figure>
            <div class="read"><h3>Xe sân bay</h3><p>Với tốc độ tăng trưởng hai con số của thị trường du lịch hàng không Việt Nam, Hải Vân quyết định tham gia thị trường dịch vụ đưa đón từ sân bay đến trung tâm các thành phố lớn. Hiện tại, HAIVAN là công ty tư nhân ĐẦU TIÊN và DUY NHẤT nhận được giấy phép của chính phủ để chạy thử dịch vụ này tại tất cả các sân bay lớn tại Việt Nam. Dịch vụ này lần đầu tiên được giới thiệu vào tháng 4 năm 2019 tại sân bay Tân Sơn Nhất, Thành phố Hồ Chí Minh và sẽ đến sân bay Nội Bài, Hà Nội vào tháng 6 năm 2020 và các sân bay trên cả nước vào năm 2022</p></div></article>
        </div>
      </section>

      <section class="block" aria-labelledby="h-values">
        <h2 id="h-values">Giá trị cốt lõi</h2>
        <p class="read prose"><span>Hải Vân thiết lập dựa trên ba giá trị cốt lõi, bao gồm con người, công nghệ và phương tiện.</span></p>
        <div>
          <article class="service"><figure class="photo"><img src="assets/img/lai-xe.jpg" width="900" height="618" loading="lazy" alt="Tài xế Hải Vân trong đồng phục đứng trước hàng xe"></figure>
            <div class="read"><h3>Con người</h3><p>Với những kinh nghiệm đã tích lũy hơn 25 năm qua, Hải Vân phát triển bộ tiêu chuẩn đào tạo để trang bị cho người lái xe những kiến thức cần thiết nhất, hiểu biết khách hàng một cách sâu sắc để phục vụ khách hàng tốt hơn. Chúng tôi nghiên cứu từng chi tiết về trải nghiệm của khách hàng trong suốt hành trình, để không ngừng cải thiện dịch vụ của mình theo thời gian, giữ vững vị thế dẫn đầu.</p></div></article>
          <article class="service service--flip"><div class="photo soft-art"><img src="assets/img/app-phone.webp" width="640" height="656" loading="lazy" alt="Ứng dụng Hải Vân trên điện thoại"></div>
            <div class="read"><h3>Công nghệ</h3><p>Hải Vân nhận thấy cải thiện quy trình vận hành và chất lượng dịch vụ là yếu tố sống còn, vì vậy chúng tôi chú trọng việc đầu tư, ứng dụng công nghệ trong mọi hoạt động để quản trị hiệu quả và không ngừng mang lại cho khách hàng những trải nghiệm thuận tiện, như đặt vé qua app một cách dễ dàng, quản lý dữ liệu khách hàng thân thiết, tích lũy và đổi điểm thưởng…</p></div></article>
          <article class="service"><figure class="photo"><img src="assets/img/tien_ich_3.jpg" width="544" height="363" loading="lazy" alt="Hai dãy giường nằm có rèm che trên xe Hải Vân"></figure>
            <div class="read"><h3>Phương tiện</h3><p>Hải Vân tập trung vào việc duy trì hệ thống phương tiện hiện đại, đáp ứng tiêu chuẩn chất lượng vận tải bằng cách tiếp tục nâng cấp và cải thiện ba khía cạnh sau:</p>
              <ul class="bul"><li>Hệ thống giải trí để nâng cấp trải nghiệm của khách hàng.</li><li>Hệ thống giám sát an toàn xe để cải thiện khả năng giám sát và giúp lái xe hành động nhanh chóng trong trường hợp khẩn cấp.</li><li>Hệ thống giám sát an toàn tài xế để theo dõi tình trạng sức khỏe của tài xế</li></ul>
              <p>Những khía cạnh này thể hiện cam kết của chúng tôi trong việc mang đến cho khách hàng sự thoải mái, tiện lợi và quan trọng nhất là sự an toàn.</p></div></article>
        </div>
      </section>
    </article>
  </div>
</div>

<section class="section section--dark" aria-labelledby="h-app">
  <div class="container app">
    <div class="app-text">
      <h2 id="h-app">Tải ứng dụng Hải Vân</h2>
      <div class="app-qr"><img class="qr" src="assets/img/qrcode_haivan.png" width="112" height="112" loading="lazy" alt="Mã QR tải ứng dụng Hải Vân"><div><p>Hoặc quét mã QR</p><ul class="badges"><li><a href="https://apps.apple.com/app/apple-store/id1440552948"><img src="assets/img/appstore.png" width="140" height="44" loading="lazy" alt="Tải trên App Store"></a></li><li><a href="https://play.google.com/store/apps/details?id=com.havaz_app"><img src="assets/img/playstore.png" width="140" height="44" loading="lazy" alt="Tải trên Google Play"></a></li></ul></div></div>
    </div>
    <img class="app-phone" src="assets/img/app-phone.webp" width="640" height="656" loading="lazy" alt="Màn hình chính ứng dụng Hải Vân">
  </div>
</section>
</main>
${footer()}
${callFab()}`;

export default {
  title: 'Về HAIVAN: giới thiệu Hải Vân, thành lập 1994 | Hải Vân',
  desc: 'Hải Vân thành lập năm 1994, hãng xe khách cao cấp với hơn 1.000 nhân viên: xe tuyến đường dài, xe cho thuê, xe sân bay.',
  copy: true,
  stamp: {
    shape: 'Long Document (content page)', hero: 'Banner (title and three real fleet photographs)', imagery: 'real fleet, waiting-room, driver and app photographs', signature: 'the three-photo strip and the split service rows',
    copy: true,
    critique: 'P4 H4 E4 S4 R4 V3 · weakest: V, a prose page keeps one reading column; photographs break each service block so the text never runs a full screen',
    waive: [
      'waive 83 · image-led content page by owner brief; every photograph shows the Hải Vân xe, phòng chờ, tài xế hoặc ứng dụng mà đoạn văn mô tả · the photo grid is the content of this page, one real picture beside each text block',
      'dismissed 77 · a long document page, its three sections hold the owner text blocks of the Về Hải Vân page',
      'waive 78 · section heads at 32px under a 40px page head · the owner scale ends at 40px so h1 is 40 and h2 is 32 · a reading page needs calm heads',
    ],
  },
  css,
  body,
};
