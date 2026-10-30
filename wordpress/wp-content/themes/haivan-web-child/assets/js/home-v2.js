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
