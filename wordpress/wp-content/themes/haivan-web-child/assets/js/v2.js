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

/*
 * Form nhận báo giá qua Zalo [data-hv2-lead] (inc/v2.php hv2_zalo_lead): ghép các ô đã điền thành tin nhắn, chép vào
 * bộ nhớ tạm, rồi mở OA Zalo theo vùng của lựa chọn đang chọn (data-zalo="bac|nam"). Không lưu hay gửi dữ liệu đi đâu khác.
 */
(function () {
  'use strict';
  Array.prototype.forEach.call(document.querySelectorAll('[data-hv2-lead]'), function (form) {
    var note = form.querySelector('.hv2-leadform-note');
    // Lỗi tự đặt (setCustomValidity) phải xoá khi khách sửa ô, nếu không trình duyệt chặn luôn lần bấm sau.
    form.addEventListener('input', function (e) { if (e.target.setCustomValidity) { e.target.setCustomValidity(''); } });
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      Array.prototype.forEach.call(form.querySelectorAll('input[required]'), function (el) {
        // Ô bắt buộc không được chỉ có dấu cách; số điện thoại cần ít nhất 8 chữ số.
        var ok = el.type === 'tel' ? (el.value.match(/\d/g) || []).length >= 8 : el.value.trim() !== '';
        el.setCustomValidity(ok ? '' : (el.getAttribute('data-label') || ''));
      });
      if (!form.reportValidity()) { return; }
      var lines = [form.getAttribute('data-prefix')];
      var region = form.getAttribute('data-zalo');
      Array.prototype.forEach.call(form.querySelectorAll('[data-label]'), function (el) {
        var label = el.getAttribute('data-label');
        if (el.type === 'radio') {
          if (!el.checked) { return; }
          if (el.getAttribute('data-zalo')) { region = el.getAttribute('data-zalo'); }
          lines.push('- ' + label + ': ' + el.value);
          return;
        }
        if (el.tagName === 'SELECT') {
          var opt = el.options[el.selectedIndex];
          if (opt && opt.getAttribute('data-zalo')) { region = opt.getAttribute('data-zalo'); }
        }
        var v = (el.value || '').trim();
        if (v && el.type === 'date') { var p = v.split('-'); v = p[2] + '/' + p[1] + '/' + p[0]; }
        if (v) { lines.push('- ' + label + ': ' + v); }
      });
      var text = lines.join('\n');
      var url = form.getAttribute('data-zalo-' + region) || form.action;
      var copyBox = form.querySelector('.hv2-leadform-copy');
      var say = function (msg, ok) { if (note) { note.textContent = msg; note.classList.toggle('is-done', ok); } };
      var done = function () { say(form.getAttribute('data-copied'), true); };
      // Không chép được (http, trình duyệt cũ, webview): hiện tin nhắn để khách tự chép, không báo "đã chép" sai.
      var fail = function () {
        say(form.getAttribute('data-fail'), false);
        if (copyBox) { copyBox.value = text; copyBox.hidden = false; copyBox.focus(); copyBox.select(); }
      };
      var copied = navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(text).then(done, fail) : Promise.resolve().then(fail);
      // Mở Zalo ngay trong cú bấm để không bị chặn; nếu vẫn bị chặn thì chỉ chuyển trang sau khi chép xong.
      var win = window.open(url, '_blank');
      if (win) { win.opener = null; } else { copied.then(function () { window.location.href = url; }); }
      if (window.dataLayer) { window.dataLayer.push({ event: 'zalo_lead', form: form.id, region: region }); }
    });
  });
})();
