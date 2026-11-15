/*
 * Trang chủ v2: công tắc "Một chiều / Khứ hồi" trên thẻ đặt vé. Không tự giữ trạng thái: bấm hộ nút "Thêm ngày về" /
 * "Bỏ ngày về" của form [haivan_search] (search.js lo phần còn lại), rồi đọc lại ô ngày về đang hiện hay ẩn.
 * Không có JS thì công tắc ẩn, form vẫn có nút "Thêm ngày về".
 */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('[data-hv2-trip]'), function (sw) {
    var card = sw.closest('.hv2-book-card');
    var form = card && card.querySelector('.hv-search__form--corridor');
    var retbox = form && form.querySelector('.hv-search__retbox');
    if (!retbox) { return; }
    var btns = sw.querySelectorAll('button');
    var sync = function () {
      var on = !retbox.hidden;
      Array.prototype.forEach.call(btns, function (b) { b.setAttribute('aria-pressed', String((b.getAttribute('data-trip') === 'rt') === on)); });
      sw.hidden = form.hidden; // chế độ "tỉnh khác" (form tự do) không có ngày về
    };
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        var want = b.getAttribute('data-trip') === 'rt';
        if (want === !retbox.hidden) { return; }
        var target = form.querySelector(want ? '.hv-search__addret' : '.hv-search__retclear');
        if (target) { target.click(); }
        sync();
      });
    });
    new MutationObserver(sync).observe(form, { subtree: true, attributes: true, attributeFilter: ['hidden'] });
    sync();
  });
})();

/*
 * Trang chủ: các khối hiện dần khi cuộn tới. Chỉ bật khi có IntersectionObserver và người dùng không chọn giảm chuyển động;
 * lớp .hv2-js gắn bằng JS nên không có JS thì nội dung hiện sẵn. Phần tử cùng nhóm hiện so le (60ms, tối đa 6 bậc).
 */
(function () {
  'use strict';
  if (typeof IntersectionObserver !== 'function') { return; }
  if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) { return; }
  var sel = '.hv2-sec .hv2-head, .hv2-svc-card, .hv2-step, .hv2-offer, .hv2-route, .hv2-dest, .hv2-newslist > *, .hv2-lounge, .hv2-story';
  var els = document.querySelectorAll(sel);
  if (!els.length) { return; }
  document.documentElement.classList.add('hv2-js');
  // Hiện xong thì gỡ lớp reveal để phần tử dùng lại transition gốc của nó (vd. hover của dòng tuyến).
  function show(el) {
    if (!el.classList.contains('hv2-reveal') || el.classList.contains('is-in')) { return; }
    el.classList.add('is-in');
    var done = function (ev) {
      if (ev && (ev.target !== el || ev.propertyName !== 'transform')) { return; } // chờ transform (0,7s) xong, không phải opacity (0,6s)
      el.classList.remove('hv2-reveal', 'is-in');
      el.style.removeProperty('--hv2-d');
      el.removeEventListener('transitionend', done);
    };
    el.addEventListener('transitionend', done);
    setTimeout(done, 1500); // không có transitionend (tab nền, bị huỷ): vẫn gỡ
  }
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { show(e.target); io.unobserve(e.target); }
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
  Array.prototype.forEach.call(els, function (el) {
    var item = el.closest('li') || el; // dòng tuyến, điểm đến là <a> trong <li>: đếm thứ tự theo <li>
    var sib = item.parentElement ? Array.prototype.indexOf.call(item.parentElement.children, item) : 0;
    el.style.setProperty('--hv2-d', (Math.min(sib, 5) * 60) + 'ms');
    el.classList.add('hv2-reveal');
    io.observe(el);
  });
  // Tab bàn phím tới phần tử chưa hiện (Firefox/Safari cuộn focus sát mép dưới): hiện ngay.
  document.addEventListener('focusin', function (ev) {
    var r = ev.target.closest && ev.target.closest('.hv2-reveal');
    if (r) { show(r); io.unobserve(r); }
  });
})();
