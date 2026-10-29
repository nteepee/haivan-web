/*
 * JS toàn site (nhỏ, không phụ thuộc):
 *  1. Cookie affiliate utm_source / aff_sid (30 ngày, path=/, SameSite=Lax) — chỉ ghi giá trị thật.
 *  2. Trạng thái đăng nhập trên header qua /api/hv/auth/session (cùng origin, BFF Next).
 *     Endpoint lỗi/404 (WP chạy độc lập) → giữ nút "Đăng nhập".
 *  3. Menu mobile, dropdown, đổi ngôn ngữ (đặt cookie pll_language).
 *  4. Bảng trong nội dung: bật mờ mép trái/phải (data-more-left/right) khi còn nội dung cuộn ngang.
 *  5. Header: data-scrolled="true" khi cuộn quá 8px (CSS đổi vàng đặc → kính vàng).
 *  6. Nút gọi nổi ẩn khi thẻ tìm vé đang trong màn hình (không đè ô ngày, nút +/−, nút Tìm vé).
 *  7. Ảnh trong bài tải lỗi thì ẩn (không để khung trắng).
 *  8. Mục lục bài: thu gọn trên điện thoại, tô mục đang đọc.
 */
(function () {
  'use strict';
  var cfg = window.HV_SITE || {};
  var secure = location.protocol === 'https:' ? '; Secure' : '';

  /* 1. Affiliate ------------------------------------------------------- */
  try {
    var params = new URLSearchParams(location.search);
    ['utm_source', 'aff_sid'].forEach(function (name) {
      var v = (params.get(name) || '').trim();
      // Bỏ giá trị rỗng / chuỗi "null" / "undefined" (lỗi ghi cookie của web cũ làm bẩn dữ liệu).
      if (!v || v.length > 200 || /^(null|undefined)$/i.test(v)) return;
      document.cookie = name + '=' + encodeURIComponent(v) + '; path=/; max-age=' + 30 * 24 * 60 * 60 + '; SameSite=Lax' + secure;
    });
  } catch (e) { /* trình duyệt cũ: bỏ qua */ }

  /* 2. Đăng nhập / Tài khoản ------------------------------------------- */
  var prefix = cfg.prefix || '';
  var t = cfg.i18n || {};

  function mk(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function loginHref() {
    return prefix + '/tai-khoan/dang-nhap?next=' + encodeURIComponent(location.pathname + location.search);
  }

  function renderAccount(host) {
    var wrap = mk('div', 'hv-account');
    var btn = mk('button', 'hv-btn hv-btn--ghost hv-btn--sm hv-account__btn', t.account || 'Tài khoản');
    btn.type = 'button';
    btn.setAttribute('aria-haspopup', 'true');
    btn.setAttribute('aria-expanded', 'false');
    var menu = mk('ul', 'hv-account__menu');
    menu.hidden = true;
    menu.id = 'hv-account-menu';
    btn.setAttribute('aria-controls', 'hv-account-menu');
    [
      [t.profile, prefix + '/tai-khoan/thong-tin-ca-nhan'],
      [t.offers, prefix + '/tai-khoan/uu-dai'],
      [t.loyalty || 'Khách hàng thân thiết', prefix + '/tai-khoan/khach-hang-than-thiet'],
      [t.trips, prefix + '/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh']
    ].forEach(function (it) {
      var li = mk('li');
      var a = mk('a', null, it[0]);
      a.href = it[1];
      li.appendChild(a);
      menu.appendChild(li);
    });
    var out = mk('li', 'hv-account__logout');
    var ob = mk('button', null, t.logout || 'Đăng xuất');
    ob.type = 'button';
    var err = mk('li', 'hv-account__error');
    err.setAttribute('role', 'alert');
    err.hidden = true;
    ob.addEventListener('click', function () {
      ob.disabled = true;
      err.hidden = true;
      fetch(cfg.logoutUrl || '/api/hv/auth/logout', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'X-HV-Req': '1', 'Content-Type': 'application/json' },
        body: '{}'
      }).then(function (res) {
        // Chỉ coi là đã đăng xuất khi BFF trả 2xx; 403 (sai Origin), 5xx... giữ người dùng ở lại và báo lỗi.
        if (!res.ok) { throw new Error('logout ' + res.status); }
        location.assign(prefix || '/');
      }).catch(function () {
        ob.disabled = false;
        err.textContent = t.logoutFailed || 'Không đăng xuất được, vui lòng thử lại.';
        err.hidden = false;
      });
    });
    out.appendChild(ob);
    menu.appendChild(out);
    menu.appendChild(err);
    btn.addEventListener('click', function () {
      var open = menu.hidden;
      menu.hidden = !open;
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (ev) {
      if (!wrap.contains(ev.target)) { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape') { menu.hidden = true; btn.setAttribute('aria-expanded', 'false'); }
    });
    wrap.appendChild(btn);
    wrap.appendChild(menu);
    host.textContent = '';
    host.appendChild(wrap);
  }

  function initAccount() {
    var hosts = document.querySelectorAll('[data-hv-account]');
    if (!hosts.length) return;
    // Link đăng nhập luôn mang next = trang hiện tại, kể cả khi endpoint session không có.
    Array.prototype.forEach.call(hosts, function (h) {
      var a = h.querySelector('a[data-hv-login]');
      if (a) a.href = loginHref();
    });
    if (!window.fetch) return;
    var ctrl = window.AbortController ? new AbortController() : null;
    var timer = ctrl ? setTimeout(function () { ctrl.abort(); }, 4000) : null;
    fetch(cfg.sessionUrl || '/api/hv/auth/session', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: ctrl ? ctrl.signal : undefined
    })
      .then(function (res) {
        if (!res.ok) throw new Error('session ' + res.status);
        var ct = res.headers.get('content-type') || '';
        if (ct.indexOf('json') === -1) throw new Error('session not json');
        return res.json();
      })
      .then(function (s) {
        if (s && s.loggedIn === true) {
          Array.prototype.forEach.call(hosts, renderAccount);
          // Bảng menu điện thoại: "Đăng nhập" thành "Tài khoản" (Chuyến đi của tôi).
          Array.prototype.forEach.call(document.querySelectorAll('[data-hv-login-mobile]'), function (a) {
            a.textContent = t.account || 'Tài khoản';
            a.href = prefix + '/tai-khoan/chuyen-di-cua-toi/xe-lien-tinh';
          });
        }
      })
      .catch(function () { /* 404/mạng lỗi: hiển thị chưa đăng nhập */ })
      .then(function () { if (timer) clearTimeout(timer); });
  }

  /* 3. Menu, dropdown & ngôn ngữ ----------------------------------------- */
  function initNav() {
    var header = document.querySelector('.hv-header');
    if (!header) return;
    var burger = header.querySelector('[data-hv-burger]');
    var panel = document.getElementById('hv-main-menu');
    var dds = Array.prototype.slice.call(header.querySelectorAll('[data-hv-dd]'));
    var quiet = false; // Esc trả tiêu điểm về mục cha mà không mở lại dropdown

    function setBurger(open) {
      if (!burger || !panel) return;
      panel.hidden = !open;
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', burger.getAttribute(open ? 'data-label-close' : 'data-label-open') || '');
    }
    function setDd(a, open) {
      var box = document.getElementById(a.getAttribute('aria-controls'));
      if (!box) return;
      box.hidden = !open;
      a.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    function closeDds(except) {
      dds.forEach(function (a) { if (a !== except) setDd(a, false); });
    }

    if (burger) burger.addEventListener('click', function () { setBurger(panel.hidden); });
    dds.forEach(function (a) {
      // Cảm ứng: lần chạm đầu mở dropdown, lần hai đi tới trang của mục cha. Chuột: rê chuột đã mở sẵn nên bấm đi tới trang cha. Không có JS: luôn đi tới trang cha.
      a.addEventListener('click', function (ev) {
        if (a.getAttribute('aria-expanded') !== 'true') {
          ev.preventDefault();
          closeDds(a);
          setDd(a, true);
        }
      });
      var item = a.parentNode;
      item.addEventListener('mouseenter', function () { if (window.matchMedia('(hover: hover)').matches) { closeDds(a); setDd(a, true); } });
      item.addEventListener('mouseleave', function () { if (window.matchMedia('(hover: hover)').matches) setDd(a, false); });
      // Bàn phím: Tab tới mục cha thì mở dropdown, Tab tiếp đi vào các mục con; Esc đóng.
      item.addEventListener('focusin', function (ev) { if (!quiet && ev.target === a && a.matches(':focus-visible')) { closeDds(a); setDd(a, true); } });
      item.addEventListener('focusout', function (ev) { if (!item.contains(ev.relatedTarget)) setDd(a, false); });
    });
    document.addEventListener('click', function (ev) {
      if (!header.contains(ev.target)) { closeDds(null); setBurger(false); }
    });
    document.addEventListener('keydown', function (ev) {
      if (ev.key !== 'Escape') return;
      var openDd = dds.filter(function (a) { return a.getAttribute('aria-expanded') === 'true'; })[0];
      if (openDd) { setDd(openDd, false); quiet = true; openDd.focus(); quiet = false; }
      if (panel && !panel.hidden) { setBurger(false); burger.focus(); }
    });
    Array.prototype.forEach.call(document.querySelectorAll('[data-hv-lang]'), function (a) {
      a.addEventListener('click', function () {
        document.cookie = 'pll_language=' + encodeURIComponent(a.getAttribute('data-hv-lang')) + '; path=/; max-age=31536000; SameSite=Lax' + secure;
      });
    });
  }

  /* 4. Bảng cuộn ngang ------------------------------------------------- */
  function initTables() {
    Array.prototype.forEach.call(document.querySelectorAll('.hv-table-wrap'), function (wrap) {
      var box = wrap.querySelector('.hv-table-scroll');
      if (!box) return;
      function sync() {
        wrap.toggleAttribute('data-more-left', box.scrollLeft > 4);
        wrap.toggleAttribute('data-more-right', box.scrollLeft + box.clientWidth < box.scrollWidth - 4);
      }
      box.addEventListener('scroll', sync, { passive: true });
      window.addEventListener('resize', sync);
      sync();
    });
  }

  /* 5. Header đặc → kính khi cuộn --------------------------------------- */
  function initScrolled() {
    var header = document.querySelector('.hv-header');
    if (!header) return;
    var on = null;
    function update() {
      var next = window.scrollY > 8;
      if (next === on) return; // chỉ ghi DOM khi vượt ngưỡng
      on = next;
      header.setAttribute('data-scrolled', next ? 'true' : 'false');
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* 6. Nút gọi nổi tránh thẻ tìm vé ------------------------------------- */
  function initFab() {
    var fab = document.querySelector('.hv-call-fab');
    var forms = document.querySelectorAll('.hv-search');
    if (!fab || !forms.length || !window.IntersectionObserver) return;
    var inView = new Set();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) inView.add(e.target); else inView.delete(e.target); });
      fab.setAttribute('data-hidden', inView.size ? 'true' : 'false');
    });
    Array.prototype.forEach.call(forms, function (f) { io.observe(f); });
  }

  /* 7. Ẩn ảnh trong bài tải lỗi (host báo chí/Google/Facebook đã chết, tệp upload mất): khung trắng rỗng còn tệ hơn không có ảnh -- */
  function initBrokenImages() {
    function hide(img) {
      img.hidden = true;
      var p = img.parentNode;
      // Liên kết/khung chỉ chứa mỗi ảnh đó cũng ẩn theo.
      if (p && /^(A|FIGURE|SPAN)$/.test(p.tagName) && !p.textContent.trim() && p.querySelectorAll('img:not([hidden])').length === 0) p.hidden = true;
    }
    Array.prototype.forEach.call(document.querySelectorAll('.hv-entry img'), function (img) {
      if (img.complete && img.naturalWidth === 0 && (img.currentSrc || img.src)) hide(img);
      else img.addEventListener('error', function () { hide(img); }, { once: true });
    });
  }

  /* 8. Mục lục bài: hộp trong bài thu gọn ở khổ điện thoại; tô mục đang đọc (aria-current) ở cả hai bản. Không có JS: hộp luôn mở, liên kết neo vẫn chạy. */
  function initToc() {
    var boxes = document.querySelectorAll('.hv-toc--inline .hv-toc__box');
    if (window.matchMedia && window.matchMedia('(max-width: 39.99rem)').matches) {
      Array.prototype.forEach.call(boxes, function (d) { d.open = false; });
    }
    var links = Array.prototype.slice.call(document.querySelectorAll('[data-hv-toc] a[href^="#"]'));
    if (!links.length || !window.IntersectionObserver) return;
    var heads = [];
    links.forEach(function (a) {
      var el = document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1)));
      if (el && heads.indexOf(el) === -1) heads.push(el);
    });
    heads.sort(function (x, y) { return x.compareDocumentPosition(y) & 4 ? -1 : 1; });
    var seen = new Set();
    function mark() {
      var cur = null;
      heads.forEach(function (h) { if (!cur && seen.has(h)) cur = h; });
      if (!cur) return; // giữ mục cuối cùng khi không có tiêu đề nào trong vùng quan sát
      links.forEach(function (a) {
        if (a.getAttribute('href') === '#' + cur.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
      });
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) seen.add(e.target); else seen.delete(e.target); });
      mark();
    }, { rootMargin: '-72px 0px -65% 0px' });
    heads.forEach(function (h) { io.observe(h); });
  }

  function boot() { initNav(); initAccount(); initTables(); initScrolled(); initFab(); initBrokenImages(); initToc(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
