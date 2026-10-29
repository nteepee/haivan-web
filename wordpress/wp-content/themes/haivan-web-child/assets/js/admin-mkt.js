/* Admin banner / ưu đãi: đổi ô xem trước màu khi chọn màu; banner chỉ hiện nhóm ô của kiểu slide đang chọn. */
(function () {
  'use strict';

  Array.prototype.forEach.call(document.querySelectorAll('[data-hv-tone]'), function (sel) {
    var sw = sel.parentNode.querySelector('[data-hv-swatch]');
    if (!sw) return;
    sel.addEventListener('change', function () { sw.className = 'hv-swatch hv-swatch--' + sel.value; });
  });

  var kinds = document.querySelectorAll('input[name="hv_banner_kind"]');
  var types = document.querySelector('select[name="hv_banner_type"]');
  if (!kinds.length) return;
  var imageBox = document.getElementById('postimagediv');
  function current() { var c = document.querySelector('input[name="hv_banner_kind"]:checked'); return c ? c.value : 'image'; }
  function sync() {
    var popup = types && types.value === 'popup';
    if (popup) { Array.prototype.forEach.call(kinds, function (k) { k.checked = k.value === 'image'; }); }
    var kind = current();
    Array.prototype.forEach.call(kinds, function (k) { k.disabled = popup && k.value === 'designed'; });
    Array.prototype.forEach.call(document.querySelectorAll('[data-hv-kind]'), function (box) { box.hidden = box.getAttribute('data-hv-kind') !== kind; });
    if (imageBox) imageBox.hidden = kind !== 'image';
  }
  Array.prototype.forEach.call(kinds, function (k) { k.addEventListener('change', sync); });
  if (types) types.addEventListener('change', sync);
  sync();
})();
