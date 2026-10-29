/*
 * [haivan_search] — JS thuần, không phụ thuộc framework. Hai chế độ trong cùng một thẻ:
 * 1) Tuyến chính (initCorridor): dữ liệu tuyến/điểm/chương trình giảm giá từ JSON inline (hv_booking_config, cùng hợp đồng
 *    REST booking-config). Gửi: <resultsPath>?from=<"tên,lat,lng" mã hoá cả cụm>&to=...&date=DD-MM-YYYY&numberGuest=N&type=2
 *    + tuyen, chieu, diem_di, diem_den, ngay_ve (đúng buildSearchUrl của Next + contract.md). Hàng "Chuyến hôm nay" đọc
 *    apigw GET /api/el/trips (cùng tham số Next: from_location, to_location, numberGuest, date, sort_by=time, sort_mode=asc, type).
 * 2) Tìm theo điểm đi/đến (initFree): danh sách điểm GET apigw /api/places?type=0 (header Domain: haivan.com, chỉ đọc).
 *    Gửi: <resultsPath>?from=<tên>,<lat>,<lng>&to=...&date=DD-MM-YYYY&numberGuest=N, mỗi giá trị qua encodeURIComponent.
 */
(function () {
  'use strict';

  var placesPromise = {}; // url -> Promise<Group[]> (chia sẻ giữa nhiều form trên trang)

  function strip(s) {
    return String(s || '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase();
  }

  function pad(n) { return n < 10 ? '0' + n : String(n); }
  function isoDate(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }

  /** Hôm nay + n tháng, kẹp cuối tháng (31/10 + 4 tháng = 28|29/02, không tràn sang tháng sau). */
  function addMonths(d, n) {
    var y = d.getFullYear();
    var m = d.getMonth() + n;
    var last = new Date(y, m + 1, 0).getDate();
    return new Date(y, m, Math.min(d.getDate(), last));
  }

  function setCookie(name, value) {
    var c = name + '=' + encodeURIComponent(value) + '; path=/; max-age=31536000; SameSite=Lax';
    if (location.protocol === 'https:') c += '; Secure';
    document.cookie = c;
  }

  function normalizeGroups(body) {
    if (!Array.isArray(body)) throw new Error('unexpected places payload');
    var groups = [];
    body.forEach(function (g) {
      if (!g || typeof g.name !== 'string' || !Array.isArray(g.places)) return;
      var places = [];
      g.places.forEach(function (p) {
        if (!p || typeof p.name !== 'string') return;
        var lat = String(p.lat == null ? '' : p.lat).trim();
        var lng = String(p.lng == null ? '' : p.lng).trim();
        if (!isFinite(parseFloat(lat)) || !isFinite(parseFloat(lng))) return;
        places.push({ name: p.name.trim(), lat: lat, lng: lng, key: strip(p.name + ' ' + g.name) });
      });
      if (places.length) groups.push({ name: g.name, places: places });
    });
    return groups;
  }

  function loadPlaces(url) {
    if (!placesPromise[url]) {
      placesPromise[url] = fetch(url, { headers: { Accept: 'application/json', Domain: 'haivan.com' }, credentials: 'omit' })
        .then(function (r) {
          if (!r.ok) throw new Error('places HTTP ' + r.status);
          return r.json();
        })
        .then(normalizeGroups)
        .catch(function (e) {
          delete placesPromise[url]; // cho phép thử lại
          throw e;
        });
    }
    return placesPromise[url];
  }

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }

  function Combo(root, getGroups, labels, onChange) {
    var input = root.querySelector('input');
    var list = root.querySelector('.hv-search__list');
    var self = { selected: null, input: input };
    var options = [];
    var active = -1;

    function close() {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
      input.removeAttribute('aria-activedescendant');
      active = -1;
    }

    function choose(place) {
      self.selected = place;
      input.value = place.name;
      close();
      onChange();
    }

    function highlight(i) {
      options.forEach(function (o, idx) { o.node.classList.toggle('is-active', idx === i); o.node.setAttribute('aria-selected', idx === i ? 'true' : 'false'); });
      active = i;
      if (i >= 0) {
        input.setAttribute('aria-activedescendant', options[i].node.id);
        options[i].node.scrollIntoView({ block: 'nearest' });
      }
    }

    function render() {
      var groups = getGroups();
      list.textContent = '';
      options = [];
      if (groups === 'loading' || groups === 'error') {
        list.appendChild(el('li', 'hv-search__note', groups === 'loading' ? labels.loading : labels.load_error));
      } else {
        var q = strip(input.value.trim());
        // Đã chọn xong thì mở lại danh sách đầy đủ thay vì lọc theo đúng tên đã chọn.
        if (self.selected && input.value === self.selected.name) q = '';
        groups.forEach(function (g) {
          var matches = g.places.filter(function (p) { return !q || p.key.indexOf(q) !== -1; });
          if (!matches.length) return;
          var head = el('li', 'hv-search__group', g.name);
          head.setAttribute('role', 'presentation');
          list.appendChild(head);
          matches.forEach(function (p) {
            var li = el('li', 'hv-search__option', p.name);
            li.id = input.id + '-opt-' + options.length;
            li.setAttribute('role', 'option');
            li.setAttribute('aria-selected', 'false');
            li.addEventListener('mousedown', function (ev) { ev.preventDefault(); choose(p); });
            list.appendChild(li);
            options.push({ node: li, place: p });
          });
        });
        if (!options.length) list.appendChild(el('li', 'hv-search__note', labels.no_match));
      }
      list.hidden = false;
      input.setAttribute('aria-expanded', 'true');
      active = -1;
    }

    input.addEventListener('focus', render);
    input.addEventListener('click', function () { if (list.hidden) render(); });
    input.addEventListener('input', function () {
      if (self.selected) { self.selected = null; onChange(); }
      render();
    });
    input.addEventListener('blur', function () {
      close();
      // Gõ dở mà không chọn: giữ chữ nhưng không coi là đã chọn điểm.
    });
    input.addEventListener('keydown', function (ev) {
      if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
        if (list.hidden) render();
        if (!options.length) return;
        ev.preventDefault();
        var n = options.length;
        highlight(ev.key === 'ArrowDown' ? (active + 1) % n : (active - 1 + n) % n);
      } else if (ev.key === 'Enter' && !list.hidden && active >= 0) {
        ev.preventDefault();
        choose(options[active].place);
      } else if (ev.key === 'Escape') {
        close();
      }
    });

    self.set = function (place) {
      self.selected = place || null;
      input.value = place ? place.name : '';
    };
    self.refresh = function () { if (!list.hidden) render(); };
    return self;
  }

  /** Chế độ tìm theo điểm đi/đến (địa điểm tự do từ apigw places). Trả { focus(), load() } để chuyển chế độ. */
  function initFree(root, cfg, lazy) {
    var L = cfg.labels;
    var form = root.querySelector('.hv-search__form--free');
    var dateInput = form.querySelector('input[name="date"]');
    var guestsInput = form.querySelector('input[name="numberGuest"]');
    var swap = form.querySelector('.hv-search__swap');
    var status = form.querySelector('.hv-search__status');
    var errorBox = form.querySelector('.hv-search__error');
    var groups = 'loading';

    var today = new Date();
    today = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    var max = addMonths(today, cfg.maxMonths);
    dateInput.min = isoDate(today);
    dateInput.max = isoDate(max);
    dateInput.value = isoDate(today);

    function showError(msg, target) {
      errorBox.textContent = msg;
      errorBox.hidden = false;
      if (target) target.focus();
    }
    function clearError() { errorBox.hidden = true; errorBox.textContent = ''; }

    var from, to;
    function onChange() {
      clearError();
      swap.disabled = !(from && to && from.selected && to.selected);
    }
    var getGroups = function () { return groups; };
    from = Combo(form.querySelector('[data-field="from"]'), getGroups, L, onChange);
    to = Combo(form.querySelector('[data-field="to"]'), getGroups, L, onChange);

    function fetchPlaces() {
      groups = 'loading';
      return loadPlaces(cfg.placesUrl).then(
        function (g) { groups = g; from.refresh(); to.refresh(); },
        function () { groups = 'error'; from.refresh(); to.refresh(); }
      );
    }
    // Gọi sớm khi trình duyệt rảnh; focus vào ô nhập sẽ thử lại nếu lần đầu lỗi. Khi form này đang ẩn (chế độ tuyến chính
    // là mặc định) thì chỉ tải khi khách chuyển sang tìm theo điểm đi/đến.
    var started = false;
    function loadOnce() { if (started) return; started = true; fetchPlaces(); }
    if (!lazy) (window.requestIdleCallback || function (f) { return setTimeout(f, 300); })(loadOnce);
    [from.input, to.input].forEach(function (i) {
      i.addEventListener('focus', function () { if (groups === 'error') fetchPlaces(); });
    });

    // Bộ đếm số người: nút −/+ đổi giá trị của chính ô numberGuest (cùng tên tham số, cùng kiểm tra khi gửi).
    var steps = form.querySelectorAll('[data-step]');
    function syncSteps() {
      var n = parseInt(guestsInput.value, 10);
      Array.prototype.forEach.call(steps, function (b) {
        if (b.getAttribute('data-step') === '-1') b.disabled = !(n > 1);
      });
    }
    Array.prototype.forEach.call(steps, function (b) {
      b.addEventListener('click', function () {
        var n = parseInt(guestsInput.value, 10);
        if (!isFinite(n) || n < 1) n = 1;
        guestsInput.value = String(Math.max(1, n + Number(b.getAttribute('data-step'))));
        clearError();
        syncSteps();
      });
    });
    guestsInput.addEventListener('input', syncSteps);
    guestsInput.addEventListener('blur', function () { if (!/^\d+$/.test(guestsInput.value.trim()) || Number(guestsInput.value) < 1) { guestsInput.value = '1'; syncSteps(); } });
    syncSteps();

    swap.addEventListener('click', function () {
      var a = from.selected;
      var b = to.selected;
      from.set(b);
      to.set(a);
      onChange();
    });

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      clearError();
      if (!from.selected) return showError(L.err_from, from.input);
      if (!to.selected) return showError(L.err_to, to.input);

      var m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateInput.value);
      var d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
      if (!d || d.getMonth() !== +m[2] - 1 || d < today || d > max) return showError(L.err_date, dateInput);

      var guests = Number(guestsInput.value);
      if (!/^\d+$/.test(String(guestsInput.value).trim()) || !isFinite(guests) || guests < 1) return showError(L.err_guests, guestsInput);

      function point(p) {
        // Tên có dấu phẩy sẽ làm vỡ bộ ba "tên,lat,lng" ở trang kết quả → thay bằng khoảng trắng.
        var name = p.name.replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
        return encodeURIComponent(name) + ',' + encodeURIComponent(p.lat) + ',' + encodeURIComponent(p.lng);
      }
      var date = pad(d.getDate()) + '-' + pad(d.getMonth() + 1) + '-' + d.getFullYear();
      var url = cfg.resultsPath +
        '?from=' + point(from.selected) +
        '&to=' + point(to.selected) +
        '&date=' + encodeURIComponent(date) +
        '&numberGuest=' + encodeURIComponent(String(guests));

      setCookie('pll_language', cfg.lang);
      window.location.assign(url);
    });

    return { focus: function () { from.input.focus(); }, load: loadOnce };
  }

  /* ====================================================================
   * Chế độ tuyến chính
   * ================================================================== */

  var TZ = 'Asia/Ho_Chi_Minh';
  var BUCKETS = { all: [0, 24 * 60], dawn: [0, 360], morning: [360, 660], noon: [660, 840], afternoon: [840, 1080], evening: [1080, 1440] }; // phút trong ngày, nửa mở [từ, đến) như TIME_BUCKETS của Next
  var MAX_TRIP_PAGES = 15; // apigw trả 10 chuyến/trang (SG-VT cả ngày khoảng 11 trang)
  var tripCache = {}; // khoá tuyến+chiều+điểm+ngày -> { t, counts }

  /** Hôm nay theo giờ Việt Nam, "YYYY-MM-DD" (không phụ thuộc múi giờ máy khách). */
  function vnToday() {
    try {
      var p = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
      if (/^\d{4}-\d{2}-\d{2}$/.test(p)) return p;
    } catch (e) { /* trình duyệt cũ: dùng giờ máy */ }
    return isoDate(new Date());
  }
  function addDays(iso, n) {
    var m = iso.split('-');
    var d = new Date(Date.UTC(+m[0], +m[1] - 1, +m[2] + n));
    return d.getUTCFullYear() + '-' + pad(d.getUTCMonth() + 1) + '-' + pad(d.getUTCDate());
  }
  function validIso(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v) && addDays(v, 0) === v; }
  function toDmy(iso) { var m = iso.split('-'); return m[2] + '-' + m[1] + '-' + m[0]; }
  var WD_VI = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy'];
  var WD_EN = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  var MON_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  /** Ngày hiển thị: vi "Thứ năm, 29/10/2026", en "Thu, 29 Oct 2026" (giá trị gửi đi vẫn là DD-MM-YYYY). */
  function longDate(iso, lang) {
    if (!validIso(iso)) return '';
    var m = iso.split('-');
    var wd = new Date(Date.UTC(+m[0], +m[1] - 1, +m[2])).getUTCDay();
    return lang === 'en' ? WD_EN[wd] + ', ' + (+m[2]) + ' ' + MON_EN[+m[1] - 1] + ' ' + m[0] : WD_VI[wd] + ', ' + m[2] + '/' + m[1] + '/' + m[0];
  }
  function fmt(tpl, a, b) { return String(tpl).replace('%1$s', a).replace('%2$s', b).replace('%d', a).replace('%s', a); }
  /** Chuỗi toạ độ như web cũ: số JSON giữ nguyên các chữ số (21.392683719524). */
  function num(v) { return String(Number(v)); }

  /** GET JSON apigw; hết hạn 12s, lỗi mạng/5xx thử lại 1 lần sau 0,8s, 4xx và huỷ (signal) không thử lại. */
  function getJson(url, signal, attempt) {
    attempt = attempt || 0;
    var ctl = typeof AbortController === 'function' ? new AbortController() : null;
    var timer = ctl ? setTimeout(function () { ctl.abort(); }, 12000) : null;
    if (ctl && signal) signal.addEventListener('abort', function () { ctl.abort(); });
    function retry(err) {
      if (attempt >= 1 || (signal && signal.aborted) || (err && err.status && err.status < 500)) throw err;
      return new Promise(function (ok) { setTimeout(ok, 800); }).then(function () { return getJson(url, signal, attempt + 1); });
    }
    return fetch(url, { headers: { Accept: 'application/json', Domain: 'haivan.com' }, credentials: 'omit', signal: ctl ? ctl.signal : undefined })
      .then(function (r) {
        if (!r.ok) { var e = new Error('HTTP ' + r.status); e.status = r.status; throw e; }
        return r.json();
      })
      .then(function (j) { if (timer) clearTimeout(timer); return j; }, function (e) { if (timer) clearTimeout(timer); return retry(e); });
  }

  /** Cache số chuyến: bộ nhớ trang + sessionStorage 5 phút (try/catch: chế độ riêng tư/đầy bộ nhớ thì bỏ qua). */
  var COUNT_TTL = 5 * 60 * 1000;
  function cacheGet(key) {
    if (tripCache[key] && Date.now() - tripCache[key].t < COUNT_TTL) return tripCache[key].counts;
    try {
      var raw = window.sessionStorage.getItem('hvsc:' + key);
      var o = raw ? JSON.parse(raw) : null;
      if (o && o.counts && Date.now() - o.t < COUNT_TTL) { tripCache[key] = o; return o.counts; }
    } catch (e) { /* bỏ qua */ }
    return null;
  }
  function cacheSet(key, counts) {
    var o = { t: Date.now(), counts: counts };
    tripCache[key] = o;
    try { window.sessionStorage.setItem('hvsc:' + key, JSON.stringify(o)); } catch (e) { /* bỏ qua */ }
  }

  /**
   * Số chuyến hôm nay theo khung giờ. Luôn hỏi numberGuest=1 (số chuyến không phụ thuộc số vé ở mức đếm theo khung).
   * `key` = tuyến + chiều + điểm tìm chuyến thực + ngày (không gồm số vé, không gồm mã điểm trùng toạ độ). `signal` huỷ các request đang chạy.
   */
  var rateBlockedUntil = 0; // sau HTTP 429 từ apigw: nghỉ 60 giây, không gọi thêm
  /** Chạy fn trên từng phần tử với tối đa `limit` lời gọi song song; một lỗi là dừng hẳn (không khởi động thêm). */
  function mapPool(items, limit, fn) {
    return new Promise(function (resolve, reject) {
      var results = new Array(items.length);
      var idx = 0;
      var running = 0;
      var failed = false;
      function next() {
        if (failed) return;
        if (idx >= items.length && running === 0) { resolve(results); return; }
        while (!failed && running < limit && idx < items.length) {
          (function (i) {
            running++;
            fn(items[i]).then(function (r) { results[i] = r; running--; next(); }, function (e) { failed = true; reject(e); });
          })(idx++);
        }
      }
      next();
    });
  }
  function loadToday(cfg, key, from, to, date, signal) {
    var hit = cacheGet(key);
    if (hit) return Promise.resolve(hit);
    if (Date.now() < rateBlockedUntil) { var blocked = new Error('rate limited'); blocked.status = 429; return Promise.reject(blocked); }
    var base = cfg.tripsUrl + '?from_location=' + encodeURIComponent(num(from.lat) + ',' + num(from.lng)) +
      '&to_location=' + encodeURIComponent(num(to.lat) + ',' + num(to.lng)) +
      '&numberGuest=1&date=' + encodeURIComponent(date) + '&sort_by=time&sort_mode=asc&type=2';
    // Huỷ các trang còn lại ngay khi một trang lỗi (nhất là 429) hoặc khoá đổi.
    var local = typeof AbortController === 'function' ? new AbortController() : null;
    if (local && signal) signal.addEventListener('abort', function () { local.abort(); });
    var sig = local ? local.signal : signal;
    return getJson(base, sig).then(function (first) {
      if (!first || !Array.isArray(first.data)) throw new Error('unexpected trips payload');
      var last = Math.min(MAX_TRIP_PAGES, Number(first.meta && first.meta.last_page) || 1);
      var pages = [];
      for (var p = 2; p <= last; p++) pages.push(p);
      return mapPool(pages, 3, function (pg) { return getJson(base + '&page=' + pg, sig); }).then(function (rest) {
        var trips = first.data.slice();
        rest.forEach(function (pg) { if (pg && Array.isArray(pg.data)) trips = trips.concat(pg.data); });
        var counts = { all: trips.length, dawn: 0, morning: 0, noon: 0, afternoon: 0, evening: 0 };
        trips.forEach(function (t) {
          var raw = (t && t.from && t.from.reached_at ? String(t.from.reached_at).slice(11, 16) : '') || (t && t.time) || '';
          var m = /^(\d{1,2}):(\d{2})/.exec(raw);
          if (!m) return;
          var min = +m[1] * 60 + +m[2];
          ['dawn', 'morning', 'noon', 'afternoon', 'evening'].forEach(function (k) { if (min >= BUCKETS[k][0] && min < BUCKETS[k][1]) counts[k]++; });
        });
        cacheSet(key, counts);
        return counts;
      });
    }).catch(function (e) {
      if (local) local.abort(); // dừng các trang đang chạy
      if (e && e.status === 429) rateBlockedUntil = Date.now() + 60000;
      throw e;
    });
  }

  /** Hàng "Chuyến hôm nay": nằm trong thẻ, hoặc dải riêng ngoài thẻ (data-today = id của dải). */
  function findToday(root) {
    var id = root.getAttribute('data-today');
    return (id && document.getElementById(id)) || root.querySelector('.hv-search__today');
  }

  function initCorridor(root, cfg, data, onSwitch) {
    var SC = cfg.sc;
    var lang = cfg.lang === 'en' ? 'en' : 'vi';
    var form = root.querySelector('.hv-search__form--corridor');
    var today = findToday(root);
    var corridors = data.corridors || [];
    var promos = data.promos || [];
    var $ = function (sel, scope) { return (scope || form).querySelector(sel); };
    var routeBtns = form.querySelectorAll('.hv-search__route');
    var fromSel = $('select[name="diem_di"]');
    var toSel = $('select[name="diem_den"]');
    var swap = $('.hv-search__swap');
    var dateIn = $('input[name="date"]');
    var retIn = $('input[name="ngay_ve"]');
    var addBtn = $('.hv-search__addret');
    var retBox = $('.hv-search__retbox');
    var retClear = $('.hv-search__retclear');
    var promoBox = $('.hv-search__promo');
    var guestsSel = $('select[name="numberGuest"]');
    var status = $('.hv-search__status');
    var errorBox = $('.hv-search__error');
    var chips = today.querySelectorAll('.hv-search__chip');
    var chipsBox = today.querySelector('.hv-search__chips');
    var pairEl = today.querySelector('.hv-search__today-pair');
    var noteEl = today.querySelector('.hv-search__today-note');
    var name = function (o) { return (o && (o[lang] || o.vi)) || ''; };
    var byId = {};
    corridors.forEach(function (c) { byId[c.id] = c; });

    var st = { cid: corridors[0].id, dir: 'ab', sel: {}, ret: null };
    function cor() { return byId[st.cid]; }
    function sideFrom() { return st.dir === 'ab' ? 'a' : 'b'; }
    function sideTo() { return st.dir === 'ab' ? 'b' : 'a'; }
    function maxDate() { return addDays(vnToday(), cor().max_days); }
    function retMin() { return addDays(dateIn.value, cor().sleeper ? 1 : 0); }
    function stop(side) {
      var list = cor().stops[side];
      for (var i = 0; i < list.length; i++) if (list[i].id === st.sel[side]) return list[i];
      return list[0];
    }
    /** Điểm tìm chuyến của điểm đón/trả đang chọn: điểm riêng của điểm đó, hoặc điểm của đầu tuyến. */
    function pointOf(side) {
      var s = stop(side);
      return s.point || cor().ends[side].point;
    }

    function showError(msg, target) {
      errorBox.textContent = msg;
      errorBox.hidden = false;
      if (target) target.focus();
    }
    function clearError() { errorBox.hidden = true; errorBox.textContent = ''; }

    function fillSelect(sel, side) {
      var list = cor().stops[side];
      sel.textContent = '';
      list.forEach(function (s) {
        var o = document.createElement('option');
        o.value = s.id;
        o.textContent = name(s);
        sel.appendChild(o);
      });
      sel.value = stop(side).id;
    }

    /** Phút trong ngày hiện tại theo giờ Việt Nam. */
    function vnNowMinutes() {
      try {
        var parts = new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date()).split(':');
        return +parts[0] * 60 + +parts[1];
      } catch (e) { var d = new Date(); return d.getHours() * 60 + d.getMinutes(); }
    }
    function hhmm(v) { var m = /^(\d{2}):(\d{2})$/.exec(v || ''); return m ? +m[1] * 60 + +m[2] : null; }
    /** Ngày về `iso` có thể đủ điều kiện chương trình không: ngày đi áp dụng, thứ trong tuần, đặt trước (giờ xuất bến chưa biết nên chỉ loại khi chắc chắn không còn chuyến nào đủ). */
    function promoFitsDate(p, iso) {
      if (p.travel_from && iso < p.travel_from) return false;
      if (p.travel_to && iso > p.travel_to) return false;
      if (p.weekdays && p.weekdays.length) {
        var wd = new Date(Date.UTC(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))).getUTCDay() || 7; // 1 = thứ hai … 7 = chủ nhật
        if (p.weekdays.indexOf(wd) === -1) return false;
      }
      if (iso === vnToday() && p.book_ahead_minutes) {
        var end = p.hours ? hhmm(p.hours.to) : 24 * 60;
        if (end !== null && vnNowMinutes() + p.book_ahead_minutes > end) return false;
      }
      return true;
    }
    /** Chương trình khứ hồi áp được cho ngày về đang chọn (chưa chọn: có ngày nào trong khoảng cho phép đủ điều kiện thì hiện). */
    function promoFitsReturn(p) {
      if (st.ret !== null && validIso(st.ret)) return promoFitsDate(p, st.ret);
      var d = retMin();
      var end = maxDate();
      for (var i = 0; i < 70 && d <= end; i++, d = addDays(d, 1)) if (promoFitsDate(p, d)) return true;
      return false;
    }
    /** Nhãn chương trình khứ hồi đang chạy cho tuyến, chiều VỀ và ngày về hiện tại; không có thì ẩn (không bịa ưu đãi). */
    function renderPromo() {
      var retDir = st.dir === 'ab' ? 'ba' : 'ab';
      var hit = null;
      for (var i = 0; i < promos.length && !hit; i++) {
        var p = promos[i];
        if (p.type === 'roundtrip' && p.corridor === st.cid && (p.direction === 'both' || p.direction === retDir) && promoFitsReturn(p)) hit = p;
      }
      if (hit) { promoBox.textContent = name(hit.label); promoBox.hidden = false; } else { promoBox.textContent = ''; promoBox.hidden = true; }
    }

    var dateText = $('.hv-search__field--cdate .hv-search__datetext');
    var retText = $('.hv-search__field--cret .hv-search__datetext');
    /** Chữ ngày dễ đọc phủ lên ô date gốc (ô gốc vẫn là bộ chọn ngày và nhãn truy cập). */
    function syncDateText() {
      dateText.textContent = longDate(dateIn.value, lang);
      retText.textContent = longDate(retIn.value, lang);
    }
    function renderReturn() {
      var open = st.ret !== null;
      addBtn.hidden = open;
      retBox.hidden = !open;
      if (open) {
        retIn.min = retMin();
        retIn.max = maxDate();
        if (!validIso(st.ret) || st.ret < retIn.min) st.ret = retIn.min;
        if (st.ret > retIn.max) st.ret = retIn.max;
        retIn.value = st.ret;
      }
      syncDateText();
      renderPromo();
    }

    function renderDates() {
      var t = vnToday();
      dateIn.min = t;
      dateIn.max = maxDate();
      if (!validIso(dateIn.value) || dateIn.value < t) dateIn.value = t;
      if (dateIn.value > dateIn.max) dateIn.value = dateIn.max;
      syncDateText();
      renderReturn();
    }

    function renderPlaces() {
      fillSelect(fromSel, sideFrom());
      fillSelect(toSel, sideTo());
      pairEl.textContent = fmt(SC.pair, name(cor().ends[sideFrom()]), name(cor().ends[sideTo()]));
    }

    function render() {
      Array.prototype.forEach.call(routeBtns, function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-corridor') === st.cid ? 'true' : 'false'); });
      renderPlaces();
      renderDates();
      renderPromo();
      clearError();
      scheduleToday();
    }

    function selectCorridor(cid) {
      if (!byId[cid]) return;
      st.cid = cid;
      st.dir = 'ab';
      st.sel = { a: cor().default_stop.a, b: cor().default_stop.b };
      render();
    }

    /* ---- Hàng "Chuyến hôm nay" ---- */
    var timer = null;
    var ctl = null; // huỷ các trang đang tải khi khoá đổi
    var visible = typeof IntersectionObserver !== 'function'; // không có IntersectionObserver: coi như đang thấy
    var pending = true;
    function setChips(counts, mode) {
      // mode: 'loading' | 'ok' | 'error'
      chipsBox.setAttribute('aria-busy', mode === 'loading' ? 'true' : 'false');
      Array.prototype.forEach.call(chips, function (c) {
        var k = c.getAttribute('data-bucket');
        var n = counts ? counts[k] : null;
        var label = c.getAttribute('data-label');
        c.querySelector('.hv-search__count').textContent = counts && n > 0 ? String(n) : '';
        // Đang tải: khoá hết; lỗi: mở hết (vẫn bấm tìm được); có số liệu: khung 0 chuyến bị khoá, "Cả ngày" luôn mở.
        c.disabled = mode === 'loading' || (mode === 'ok' && k !== 'all' && !(n > 0));
        c.setAttribute('aria-label', counts ? label + ', ' + fmt(n === 1 ? SC.trip_1 : SC.trip_n, n) : label);
      });
    }
    /** Khoá cache: tuyến + chiều + điểm tìm chuyến thực (hai điểm đón cùng toạ độ dùng chung) + ngày. */
    function todayKey(from, to, date) {
      return [st.cid, st.dir, num(from.lat), num(from.lng), num(to.lat), num(to.lng), date].join('|');
    }
    function loadTodayNow() {
      if (document.hidden) { pending = true; return; } // tab ẩn: không gọi apigw, tiếp tục khi quay lại
      pending = false;
      var from = pointOf(sideFrom());
      var to = pointOf(sideTo());
      var date = vnToday();
      if (ctl) ctl.abort();
      ctl = typeof AbortController === 'function' ? new AbortController() : null;
      var mine = ctl;
      var key = todayKey(from, to, date);
      var cached = cacheGet(key);
      if (cached) { showCounts(cached); return; }
      setChips(null, 'loading');
      noteEl.textContent = SC.loading;
      loadToday(cfg, key, from, to, date, ctl ? ctl.signal : undefined).then(
        function (counts) { if (mine === ctl) showCounts(counts); },
        function (e) {
          if (mine !== ctl || (mine && mine.signal.aborted)) return; // đã đổi khoá: bỏ kết quả cũ
          setChips(null, 'error');
          noteEl.textContent = SC.load_error;
        }
      );
    }
    function showCounts(counts) {
      setChips(counts, 'ok');
      noteEl.textContent = counts.all > 0 ? '' : SC.none_today; // có chuyến: số đã nằm trên chip "Cả ngày"
    }
    /** Đổi biểu mẫu: chờ 400ms yên rồi mới tải, và chỉ khi hàng chip đang trong khung nhìn. */
    function scheduleToday() {
      clearTimeout(timer);
      if (ctl) { ctl.abort(); ctl = null; } // huỷ ngay các trang đang tải của khoá cũ
      pending = true;
      timer = setTimeout(function () { if (visible && !document.hidden) loadTodayNow(); }, 400);
    }
    if (typeof IntersectionObserver === 'function') {
      new IntersectionObserver(function (entries) {
        visible = entries.some(function (e) { return e.isIntersecting; });
        if (visible && pending && !(today.closest('[data-hv-today-section]') || today).hidden) { clearTimeout(timer); timer = setTimeout(loadTodayNow, 0); }
      }, { rootMargin: '200px 0px' }).observe(today);
    }

    /* ---- Gửi ---- */
    function point(p) {
      // Tên có dấu phẩy làm vỡ bộ ba "tên,lat,lng" ở trang kết quả (parsePoint) → thay bằng khoảng trắng.
      var n = String(p.name).replace(/,/g, ' ').replace(/\s+/g, ' ').trim();
      return encodeURIComponent(n + ',' + num(p.lat) + ',' + num(p.lng)); // y hệt buildSearchUrl: cả cụm được mã hoá.
    }
    /** opts: { date (iso), bucket } — chip "Chuyến hôm nay" tìm ngày hôm nay và mang khung giờ chọn sang trang kết quả. */
    function submit(opts) {
      clearError();
      var t = vnToday();
      var date = (opts && opts.date) || dateIn.value;
      if (!validIso(date) || date < t || date > maxDate()) return showError(fmt(SC.err_date, cor().max_days), dateIn);
      var guests = Number(guestsSel.value);
      if (!(guests >= 1 && guests <= 9)) return showError(SC.err_guests, guestsSel);
      var ret = st.ret;
      if (ret !== null) {
        var min = addDays(date, cor().sleeper ? 1 : 0);
        if (opts && opts.date) {
          if (!validIso(ret) || ret < min || ret > maxDate()) ret = null; // chip: bỏ ngày về không còn hợp lệ so với ngày hôm nay
        } else if (!validIso(ret) || ret < min || ret > maxDate()) {
          return showError(cor().sleeper ? SC.err_return_sl : SC.err_return, retIn);
        }
      }
      var f = pointOf(sideFrom());
      var to = pointOf(sideTo());
      var q = [
        'from=' + point(f),
        'to=' + point(to),
        'date=' + toDmy(date),
        'numberGuest=' + guests,
        'type=2',
        'tuyen=' + encodeURIComponent(st.cid),
        'chieu=' + st.dir,
        'diem_di=' + encodeURIComponent(stop(sideFrom()).id),
        'diem_den=' + encodeURIComponent(stop(sideTo()).id)
      ];
      if (ret) q.push('ngay_ve=' + toDmy(ret));
      if (opts && opts.bucket && opts.bucket !== 'all') q.push('gio=' + encodeURIComponent(opts.bucket));
      setCookie('pll_language', cfg.lang);
      window.location.assign(cfg.resultsPath + '?' + q.join('&'));
    }

    /* ---- Sự kiện ---- */
    Array.prototype.forEach.call(routeBtns, function (b) {
      b.addEventListener('click', function () { selectCorridor(b.getAttribute('data-corridor')); });
    });
    fromSel.addEventListener('change', function () { st.sel[sideFrom()] = fromSel.value; clearError(); scheduleToday(); });
    toSel.addEventListener('change', function () { st.sel[sideTo()] = toSel.value; clearError(); scheduleToday(); });
    swap.addEventListener('click', function () { st.dir = st.dir === 'ab' ? 'ba' : 'ab'; render(); });
    [dateIn, retIn].forEach(function (inp) {
      inp.addEventListener('input', syncDateText);
      // Bấm vào chữ ngày là mở bộ chọn ngày (không chỉ biểu tượng lịch).
      inp.addEventListener('click', function () { if (typeof inp.showPicker === 'function') { try { inp.showPicker(); } catch (e) { /* đang mở hoặc không hỗ trợ */ } } });
    });
    dateIn.addEventListener('change', function () { clearError(); renderDates(); });
    retIn.addEventListener('change', function () { clearError(); st.ret = retIn.value || retMin(); renderReturn(); });
    addBtn.addEventListener('click', function () {
      // Mặc định ngày về = ngày đi + 2 (giường nằm: +1), kẹp trong [tối thiểu, tối đa] như web đối chiếu.
      st.ret = addDays(dateIn.value, cor().sleeper ? 1 : 2);
      renderReturn();
      retIn.focus();
    });
    retClear.addEventListener('click', function () { st.ret = null; renderReturn(); addBtn.focus(); });
    guestsSel.addEventListener('change', function () { clearError(); scheduleToday(); });
    form.addEventListener('submit', function (ev) { ev.preventDefault(); submit(null); });
    Array.prototype.forEach.call(chips, function (c) {
      c.addEventListener('click', function () { submit({ date: vnToday(), bucket: c.getAttribute('data-bucket') }); });
    });
    var toFree = $('[data-switch="free"]');
    if (toFree) toFree.addEventListener('click', function () { onSwitch('free'); });

    // Ngày VN có thể đổi khi trang mở qua đêm: làm mới giới hạn khi quay lại tab.
    document.addEventListener('visibilitychange', function () {
      if (document.hidden || form.hidden) return;
      renderDates();
      if (pending && visible) { clearTimeout(timer); timer = setTimeout(loadTodayNow, 0); } // tab quay lại: tải phần đang chờ
    });

    selectCorridor(st.cid);
    return {
      focus: function () { var b = form.querySelector('.hv-search__route[aria-pressed="true"]'); if (b) b.focus(); },
      refresh: function () { renderDates(); scheduleToday(); }
    };
  }

  function init(root) {
    if (root.getAttribute('data-hv-ready')) return;
    root.setAttribute('data-hv-ready', '1');
    var cfg;
    try { cfg = JSON.parse(root.getAttribute('data-hv-search')); } catch (e) { return; }
    var data = null;
    var dataEl = root.querySelector('.hv-search__data');
    if (dataEl && cfg.sc) {
      try { data = JSON.parse(dataEl.textContent); } catch (e) { data = null; }
    }
    var corridorMode = !!(data && data.corridors && data.corridors.length);
    var free = initFree(root, cfg, corridorMode);
    if (!corridorMode) return;

    var corridorForm = root.querySelector('.hv-search__form--corridor');
    var freeForm = root.querySelector('.hv-search__form--free');
    var today = findToday(root);
    var corridor = initCorridor(root, cfg, data, switchMode);
    function switchMode(mode) {
      var toFree = mode === 'free';
      corridorForm.hidden = toFree;
      (today.closest('[data-hv-today-section]') || today).hidden = toFree; // dải ngoài thẻ: ẩn cả khối
      freeForm.hidden = !toFree;
      root.setAttribute('data-mode', toFree ? 'free' : 'corridor');
      if (toFree) { free.load(); free.focus(); } else { corridor.refresh(); corridor.focus(); }
    }
    var back = freeForm.querySelector('[data-switch="corridor"]');
    if (back) back.addEventListener('click', function () { switchMode('corridor'); });
  }

  function boot() {
    var nodes = document.querySelectorAll('[data-hv-search]');
    for (var i = 0; i < nodes.length; i++) init(nodes[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
