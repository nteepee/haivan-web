/*
 * Trang chủ (tăng cường, trang vẫn dùng được khi không có JS):
 *  1) banner: nút trước/sau (vòng lại) + bộ đếm "1/3"; vuốt và cuộn snap là của CSS;
 *  2) rail: mũi tên cuộn, vô hiệu ở hai đầu, tắt lớp mờ mép phải khi tới cuối;
 *  3) popup banner: hiện sau khi trình duyệt rảnh, 1 lần/24 giờ (cookie hv_popup_seen), không hiện trên
 *     điện thoại trừ khi banner bật "hiện trên điện thoại".
 */
(function () {
  'use strict';
  var each = function (list, fn) { Array.prototype.forEach.call(list, fn); };
  var reduce = function () { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; };
  var behavior = function () { return reduce() ? 'auto' : 'smooth'; };

  each(document.querySelectorAll('[data-hv-carousel]'), function (root) {
    var slides = root.querySelector('[data-hv-slides]');
    var count = root.querySelector('[data-hv-count]');
    if (!slides) return;
    // Chỉ tính slide đang hiển thị (slide chỉ-có-ảnh-điện-thoại bị ẩn trên desktop).
    function items() { return Array.prototype.filter.call(slides.children, function (el) { return el.offsetWidth > 0; }); }
    function index() {
      var list = items();
      var pos = slides.scrollLeft;
      var best = 0;
      list.forEach(function (el, i) { if (Math.abs(el.offsetLeft - slides.offsetLeft - pos) < Math.abs(list[best].offsetLeft - slides.offsetLeft - pos)) best = i; });
      return best;
    }
    function go(dir) {
      var list = items();
      if (!list.length) return;
      var next = (index() + dir + list.length) % list.length;
      slides.scrollTo({ left: list[next].offsetLeft - slides.offsetLeft, behavior: behavior() });
    }
    each(root.querySelectorAll('[data-hv-slide]'), function (btn) {
      btn.addEventListener('click', function () { go(parseInt(btn.getAttribute('data-hv-slide'), 10) || 1); });
    });
    if (count) {
      var total = root.querySelector('.hv-slide-count');
      var update = function () {
        var n = items().length;
        count.textContent = String(index() + 1);
        if (total && total.lastChild && n) total.lastChild.textContent = '/' + n;
      };
      slides.addEventListener('scroll', update, { passive: true });
      window.addEventListener('resize', update);
      update();
    }
  });

  each(document.querySelectorAll('.hv-rail-wrap'), function (wrap) {
    var rail = wrap.querySelector('.hv-hrail');
    if (!rail) return;
    var ctrls = document.querySelector('.hv-rail-ctrls[data-for="' + rail.id + '"]');
    var prev = ctrls && ctrls.querySelector('.hv-rail-prev');
    var next = ctrls && ctrls.querySelector('.hv-rail-next');
    if (ctrls) ctrls.hidden = false;
    function sync() {
      var end = rail.scrollLeft + rail.clientWidth >= rail.scrollWidth - 4;
      wrap.toggleAttribute('data-end', end);
      if (prev) prev.disabled = rail.scrollLeft < 4;
      if (next) next.disabled = end;
    }
    [prev, next].forEach(function (btn, i) {
      if (!btn) return;
      btn.addEventListener('click', function () { rail.scrollBy({ left: (i ? 1 : -1) * rail.clientWidth * 0.8, behavior: behavior() }); });
    });
    rail.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  });

  var tpl = document.getElementById('hv-popup-tpl');
  if (!tpl || typeof HTMLDialogElement === 'undefined') return;
  function seen() { return /(?:^|;\s*)hv_popup_seen=/.test(document.cookie); }
  function show() {
    if (seen()) return;
    var phone = window.matchMedia('(max-width: 39.9375em)').matches;
    if (phone && tpl.getAttribute('data-mobile') !== '1') return;
    var dlg = tpl.content.firstElementChild.cloneNode(true);
    document.body.appendChild(dlg);
    dlg.addEventListener('close', function () { dlg.remove(); });
    dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close(); });
    var secure = location.protocol === 'https:' ? '; Secure' : '';
    document.cookie = 'hv_popup_seen=' + encodeURIComponent(tpl.getAttribute('data-id') || '1') + '; path=/; max-age=' + 24 * 60 * 60 + '; SameSite=Lax' + secure;
    dlg.showModal();
  }
  function later() { if (window.requestIdleCallback) window.requestIdleCallback(show, { timeout: 4000 }); else setTimeout(show, 2500); }
  if (document.readyState === 'complete') later(); else window.addEventListener('load', later);
})();
