/* Nút "Chọn từ thư viện": mở Media của WP và ghi URL ảnh vào ô nhập (selector ở data-hv-media). */
(function ($) {
  'use strict';
  $(document).on('click', '[data-hv-media]', function (e) {
    e.preventDefault();
    var target = $($(this).attr('data-hv-media'));
    var idTarget = $(this).attr('data-hv-media-id');
    var frame = wp.media({ title: 'Chọn ảnh', button: { text: 'Dùng ảnh này' }, library: { type: 'image' }, multiple: false });
    frame.on('select', function () {
      var a = frame.state().get('selection').first().toJSON();
      target.val(a.url).trigger('change');
      if (idTarget) $(idTarget).val(a.id);
    });
    frame.open();
  });
})(jQuery);
