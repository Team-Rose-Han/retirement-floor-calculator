// Your Safe Retirement Floor — all the logic. Words and numbers live in config.js.
// Everything runs in the browser. Nothing is sent or stored anywhere.
(function () {
  'use strict';
  var C = window.FLOOR_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  // ---------- fixed assumptions (never adjustable by the student) ----------
  var R = C.realReturn || 0.06, I = R / 12, MULT = C.spendingMultiple || 25;
  var SHORT = C.shortRunwayMonths || 60;

  // ---------- apply config words to the page ----------
  function applyConfig() {
    if (C.toolName) { document.title = C.toolName; $('tool-title').textContent = C.toolName; $('gate-title').textContent = C.toolName; }
    if (C.eyebrow != null) $('eyebrow').textContent = C.eyebrow;
    if (C.tagline) $('tagline').textContent = C.tagline;
    if (C.bullets && C.bullets.length) {
      var ul = $('bullets'); ul.innerHTML = '';
      C.bullets.forEach(function (b) {
        var li = document.createElement('li'), bold = document.createElement('b');
        bold.textContent = b.lead; li.appendChild(bold); li.appendChild(document.createTextNode(' → ' + b.text)); ul.appendChild(li);
      });
    }
    if (C.gateLede) $('gate-lede').textContent = C.gateLede;
    if (C.assumptionsLine) $('assume').textContent = C.assumptionsLine;
    if (C.disclaimer) $('disclaimer').textContent = C.disclaimer;
    if (C.aboveTitle) $('above-title').textContent = C.aboveTitle;
    if (C.aboveLine) $('above-line').textContent = C.aboveLine;
    if (C.fundedTitle) $('funded-title').textContent = C.fundedTitle;
    if (C.shortRunwayLine) $('runway').textContent = C.shortRunwayLine;
    if (C.ssPrefill != null) $('ss').value = Math.round(C.ssPrefill).toLocaleString('en-US');
  }

  // ---------- gate (same as the Money Flywheel Mapper and the Cashflow Planner) ----------
  function embeddedOnAllowedHost() {
    try {
      if (window.self === window.top) return false;
      var ref = document.referrer ? new URL(document.referrer).hostname : '';
      return (C.allowedEmbedHosts || []).some(function (h) { return ref === h || ref.endsWith('.' + h); });
    } catch (e) { return false; }
  }
  function sha256Hex(str) {
    return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }
  function unlocked() {
    if (!C.accessCodeHash) return true;
    try { if (localStorage.getItem('msm_unlocked') === '1') return true; } catch (e) { /* storage blocked */ }
    return embeddedOnAllowedHost();
  }
  function showApp() { $('gate').hidden = true; $('app').hidden = false; render(); }
  function initGate() {
    if (unlocked()) return showApp();
    $('gate').hidden = false;
    postHeight();
    $('gateform').addEventListener('submit', function (e) {
      e.preventDefault();
      var code = $('code').value.trim().toUpperCase(), err = $('gateerr');
      if (!code) return;
      if (!window.crypto || !crypto.subtle) { err.textContent = C.gateNeedsHttps || 'Open this page over https to check the code.'; return; }
      sha256Hex(code).then(function (hex) {
        if (hex === C.accessCodeHash) {
          try { localStorage.setItem('msm_unlocked', '1'); } catch (e2) { /* storage blocked */ }
          showApp();
        } else {
          err.textContent = C.gateWrong || "That code didn't match.";
          $('code').select();
        }
      });
    });
  }

  // ---------- iframe height (so Circle can size the embed) ----------
  function postHeight() {
    try { if (window.parent !== window) window.parent.postMessage({ floorHeight: document.documentElement.scrollHeight }, '*'); } catch (e) { /* not embedded */ }
  }

  // ---------- pure math ----------
  function growth(n) { return Math.pow(1 + I, n); }
  function annuityFactor(n) { return (growth(n) - 1) / I; }
  function target(spend, ss) { return Math.max(0, spend - ss) * 12 * MULT; }
  function roundUp10(x) { return Math.max(0, Math.ceil(x / 10 - 1e-9) * 10); }

  // floor for a given months-to-retirement, balance and target
  function floorFor(T, balance, n) {
    if (n <= 0) return { raw: 0, rounded: 0, funded: true };
    var fv = balance * growth(n);
    var gap = Math.max(0, T - fv);
    var raw = gap * I / (growth(n) - 1);
    return { raw: raw, rounded: roundUp10(raw), funded: gap <= 0, fv: fv, gap: gap };
  }

  function compute(inp) {
    var n = (inp.retire - inp.age) * 12;
    var T = target(inp.spend, inp.ss);
    var f = floorFor(T, inp.saved, n);
    return { n: n, T: T, floor: f.rounded, floorRaw: f.raw, funded: f.funded, benefitsCover: T === 0, shortRunway: n < SHORT };
  }

  // year-by-year projection of a starting amount plus a level monthly contribution
  function project(saved, c, years) {
    var rows = [];
    for (var k = 0; k <= years; k++) {
      var n = k * 12, bal = saved * growth(n) + c * annuityFactor(n);
      rows.push({ k: k, balance: bal, start: saved, contrib: c * n, growth: Math.max(0, bal - saved - c * n) });
    }
    return rows;
  }

  // ---------- DOM ----------
  var el = {
    age: $('age'), ageErr: $('age-err'), saved: $('saved'), spend: $('spend'), retire: $('retire'), retireVal: $('retire-val'),
    retireMin: $('retire-min'), contrib: $('contrib'), ss: $('ss'),
    empty: $('result-empty'), body: $('result-body'), floorNum: $('floor-num'), putting: $('putting'),
    above: $('state-above'), funded: $('state-funded'), below: $('state-below'), fundedLine: $('funded-line'),
    dream: $('dream'), gap: $('gap'), runway: $('runway'),
    grow: $('grow'), chipNow: $('chip-now'), chipFloor: $('chip-floor'), gAge: $('g-age'), gTotal: $('g-total'), gSub: $('g-sub'),
    gStart: $('g-start'), gContrib: $('g-contrib'), gGrowth: $('g-growth'), chartWrap: $('chart-wrap'), chart: $('chart'), tip: $('tip')
  };

  var fmt = function (x) { return '$' + Math.round(x).toLocaleString('en-US'); };
  function money(input) { var v = String(input.value).replace(/[^0-9.]/g, ''); return v === '' ? NaN : parseFloat(v); }
  // format with commas as you type, keeping the caret in place
  function formatLive(input) {
    var raw = input.value, pos = input.selectionStart == null ? raw.length : input.selectionStart;
    var digitsBefore = raw.slice(0, pos).replace(/\D/g, '').length;
    var digits = raw.replace(/\D/g, '').slice(0, 12);
    var formatted = digits ? parseInt(digits, 10).toLocaleString('en-US') : '';
    if (formatted === raw) return;
    input.value = formatted;
    var i = 0, seen = 0;
    while (i < formatted.length && seen < digitsBefore) { if (/\d/.test(formatted.charAt(i))) seen++; i++; }
    try { input.setSelectionRange(i, i); } catch (e) { /* not all inputs support it */ }
  }

  var last = null; // last computed result

  function readInputs() {
    var age = parseInt(el.age.value, 10);
    var ageOk = !isNaN(age) && age >= 18 && age <= 74;
    el.ageErr.hidden = true;
    if (el.age.value !== '' && !ageOk) {
      el.ageErr.hidden = false;
      el.ageErr.textContent = (!isNaN(age) && age >= 75)
        ? 'This tool models a retirement start between 55 and 75. For a start past 75, a session with a fee-only fiduciary advisor is the better tool.'
        : 'Enter an age between 18 and 74.';
    }
    // clamp the slider so retirement can't be at or below the current age
    var minRet = ageOk ? Math.max(55, age + 1) : 55;
    el.retire.min = minRet; el.retireMin.textContent = minRet;
    if (parseInt(el.retire.value, 10) < minRet) el.retire.value = minRet;
    el.retireVal.textContent = el.retire.value;

    var spend = money(el.spend);
    var saved = money(el.saved); if (isNaN(saved)) saved = 0;
    var contrib = money(el.contrib); if (isNaN(contrib)) contrib = 0;
    var ss = money(el.ss); if (isNaN(ss)) ss = 0;
    return { ok: ageOk && !isNaN(spend), age: age, spend: spend, saved: saved, contrib: contrib, ss: ss, retire: parseInt(el.retire.value, 10) };
  }

  function render() {
    var inp = readInputs();
    [el.above, el.funded, el.below, el.runway].forEach(function (x) { x.hidden = true; });
    if (!inp.ok) {
      el.empty.hidden = false; el.body.hidden = true; last = null;
      renderGrow(); postHeight(); return;
    }
    var r = compute(inp);
    last = { inp: inp, r: r };
    el.empty.hidden = true; el.body.hidden = false;
    el.floorNum.textContent = fmt(r.floor);
    el.putting.textContent = fmt(inp.contrib);

    if (r.funded) {
      el.funded.hidden = false;
      el.fundedLine.textContent = r.benefitsCover
        ? (C.benefitsCoverLine || 'Your expected benefits cover your retirement month. Your floor is $0.')
        : (C.fundedLine || "What you've saved will grow past your target on its own. Your floor is $0.");
    } else if (inp.contrib >= r.floor) {
      el.above.hidden = false;
      el.dream.textContent = fmt(inp.contrib - r.floor);
    } else {
      el.below.hidden = false;
      el.gap.textContent = fmt(r.floor - inp.contrib);
    }
    el.runway.hidden = !r.shortRunway;
    renderGrow();
    postHeight();
  }

  // ---------- What it grows into ----------
  var growMode = 'now';
  function axisLabel(v, max) {
    if (max >= 1e6) return '$' + (v / 1e6).toFixed(1) + 'M';
    if (max >= 1e4) return '$' + Math.round(v / 1e3) + 'K';
    return '$' + Math.round(v).toLocaleString('en-US');
  }
  function niceTicks(max) {
    var raw = max / 4, p = Math.pow(10, Math.floor(Math.log(raw) / Math.LN10)), m = raw / p;
    var step = (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p, t = [];
    for (var v = 0; v <= max; v += step) t.push(v);
    return t;
  }

  function renderGrow() {
    if (!last) { el.grow.hidden = true; return; }
    el.grow.hidden = false;
    var inp = last.inp, r = last.r;
    var c = growMode === 'floor' ? r.floor : inp.contrib;
    el.chipNow.setAttribute('aria-pressed', growMode === 'now' ? 'true' : 'false');
    el.chipFloor.setAttribute('aria-pressed', growMode === 'floor' ? 'true' : 'false');
    el.chipNow.textContent = "At what I'm putting in now (" + fmt(inp.contrib) + '/mo)';
    el.chipFloor.textContent = 'At my floor (' + fmt(r.floor) + '/mo)';
    var years = inp.retire - inp.age;
    var rows = project(inp.saved, c, years), end = rows[years];
    el.gAge.textContent = inp.retire; el.gTotal.textContent = fmt(end.balance);
    el.gStart.textContent = fmt(end.start); el.gContrib.textContent = fmt(end.contrib); el.gGrowth.textContent = fmt(end.growth);
    var sub;
    if (r.T === 0) sub = "Your expected benefits cover your retirement month, so there's no target to hit. All of this is extra.";
    else if (end.balance >= r.T) sub = 'That clears your target of ' + fmt(r.T) + ' (' + MULT + 'x your yearly spending, in today’s dollars).';
    else sub = 'Your target is ' + fmt(r.T) + ' (' + MULT + 'x your yearly spending, in today’s dollars).' + (growMode === 'now' ? ' Your floor is the monthly amount that gets you there.' : '');
    el.gSub.textContent = sub;
    drawChart(rows, inp.age, r.T);
  }

  function drawChart(rows, age0, T) {
    var svg = el.chart, ns = 'http://www.w3.org/2000/svg';
    var W = Math.max(280, el.chartWrap.clientWidth || 520), H = 230, padL = 48, padR = 12, padT = 16, padB = 26;
    var css = getComputedStyle(document.documentElement), tok = function (n) { return css.getPropertyValue(n).trim(); };
    var col = [tok('--s1'), tok('--s2'), tok('--s3')], surface = tok('--surface'), lineC = tok('--line'), muted = tok('--muted'), fg = tok('--fg');
    var endBal = rows[rows.length - 1].balance;
    var maxV = Math.max(T, endBal, 1) * 1.08;
    var N = rows.length - 1;
    var x = function (k) { return padL + (W - padL - padR) * k / Math.max(1, N); };
    var y = function (v) { return padT + (H - padT - padB) * (1 - v / maxV); };
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', W); svg.setAttribute('height', H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    function add(tag, attrs, text) { var e = document.createElementNS(ns, tag); for (var a in attrs) e.setAttribute(a, attrs[a]); if (text != null) e.textContent = text; svg.appendChild(e); return e; }

    niceTicks(maxV).forEach(function (t) {
      add('line', { x1: padL, x2: W - padR, y1: y(t), y2: y(t), stroke: lineC, 'stroke-width': 1 });
      add('text', { x: padL - 6, y: y(t) + 4, 'text-anchor': 'end', 'font-size': 11, fill: muted }, axisLabel(t, maxV));
    });

    var layers = [function (r) { return r.start; }, function (r) { return r.start + r.contrib; }, function (r) { return r.balance; }];
    var prev = rows.map(function () { return 0; });
    layers.forEach(function (fn, li) {
      var top = rows.map(fn), d = '';
      rows.forEach(function (r, k) { d += (k ? 'L' : 'M') + x(k).toFixed(1) + ' ' + y(top[k]).toFixed(1) + ' '; });
      for (var k = N; k >= 0; k--) d += 'L' + x(k).toFixed(1) + ' ' + y(prev[k]).toFixed(1) + ' ';
      add('path', { d: d + 'Z', fill: col[li], stroke: surface, 'stroke-width': 2, 'stroke-linejoin': 'round' });
      prev = top;
    });

    if (T > 0) {
      add('line', { x1: padL, x2: W - padR, y1: y(T), y2: y(T), stroke: fg, 'stroke-width': 1.5, 'stroke-dasharray': '4 4' });
      add('text', { x: W - padR, y: y(T) - 6, 'text-anchor': 'end', 'font-size': 11, 'font-weight': 700, fill: fg }, 'Target ' + axisLabel(T, maxV));
    }

    var step = N > 30 ? 10 : N > 12 ? 5 : N > 6 ? 2 : 1;
    rows.forEach(function (r, k) {
      var isLast = k === N;
      if (!isLast && (k % step !== 0 || N - k < step * 0.6)) return;
      add('text', { x: x(k), y: H - 8, 'text-anchor': k === 0 ? 'start' : isLast ? 'end' : 'middle', 'font-size': 11, fill: muted }, (k === 0 ? 'Age ' : '') + (age0 + k));
    });

    // hover / touch layer
    var cross = add('line', { x1: 0, x2: 0, y1: padT, y2: H - padB, stroke: fg, 'stroke-width': 1, opacity: 0 });
    var dot = add('circle', { r: 5, fill: col[2], stroke: surface, 'stroke-width': 2, opacity: 0 });
    function show(clientX) {
      var rect = svg.getBoundingClientRect(), sx = (clientX - rect.left) * W / rect.width;
      var k = Math.max(0, Math.min(N, Math.round((sx - padL) / (W - padL - padR) * N))), r = rows[k];
      cross.setAttribute('x1', x(k)); cross.setAttribute('x2', x(k)); cross.setAttribute('opacity', 1);
      dot.setAttribute('cx', x(k)); dot.setAttribute('cy', y(r.balance)); dot.setAttribute('opacity', 1);
      el.tip.hidden = false;
      el.tip.innerHTML = '<b>Age ' + (age0 + k) + ' · ' + fmt(r.balance) + '</b><br>Starting ' + fmt(r.start) + '<br>Contributions ' + fmt(r.contrib) + '<br>Growth ' + fmt(r.growth);
      var px = x(k) * rect.width / W, py = y(r.balance) * rect.height / H;
      el.tip.style.left = Math.max(84, Math.min(rect.width - 84, px)) + 'px';
      el.tip.style.top = (py < 90 ? py + 14 : py - 84) + 'px';
    }
    function hide() { cross.setAttribute('opacity', 0); dot.setAttribute('opacity', 0); el.tip.hidden = true; }
    svg.onmousemove = function (ev) { show(ev.clientX); };
    svg.onmouseleave = hide;
    svg.ontouchstart = svg.ontouchmove = function (ev) { if (ev.touches && ev.touches.length) show(ev.touches[0].clientX); };
    svg.ontouchend = hide;
  }

  // ---------- events ----------
  el.age.addEventListener('input', render);
  ['saved', 'spend', 'contrib', 'ss'].forEach(function (id) {
    el[id].addEventListener('input', function () { formatLive(el[id]); render(); });
  });
  el.retire.addEventListener('input', render);
  el.chipNow.addEventListener('click', function () { growMode = 'now'; renderGrow(); postHeight(); });
  el.chipFloor.addEventListener('click', function () { growMode = 'floor'; renderGrow(); postHeight(); });
  var resizeTimer;
  window.addEventListener('resize', function () { clearTimeout(resizeTimer); resizeTimer = setTimeout(function () { renderGrow(); postHeight(); }, 120); });
  try { window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', renderGrow); } catch (e) { /* older browsers */ }
  try { new MutationObserver(renderGrow).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] }); } catch (e) { /* older browsers */ }

  // ---------- boot ----------
  if (window.parent !== window) document.body.classList.add('embedded');
  applyConfig();
  initGate();
  window.addEventListener('load', postHeight);
  window.__srn = { compute: compute, project: project }; // exposed for quick checks only; stores nothing
})();
