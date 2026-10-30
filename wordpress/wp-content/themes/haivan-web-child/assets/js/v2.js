/*
 * Thành phần JS dùng chung của v2. Bộ lọc [data-hv2-filter="#danh-sách"]: nút data-key lọc các mục li[data-group];
 * data-key rỗng = hiện tất cả. Không có JS thì bộ lọc ẩn, mọi mục vẫn hiện.
 */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('[data-hv2-filter]'), function (bar) {
    var list = document.querySelector(bar.getAttribute('data-hv2-filter'));
    if (!list) { return; }
    var btns = bar.querySelectorAll('button');
    bar.hidden = false;
    Array.prototype.forEach.call(btns, function (b) {
      b.addEventListener('click', function () {
        var key = b.getAttribute('data-key');
        Array.prototype.forEach.call(btns, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
        Array.prototype.forEach.call(list.querySelectorAll('[data-group]'), function (li) {
          li.hidden = key !== '' && li.getAttribute('data-group') !== key;
        });
      });
    });
  });
})();
