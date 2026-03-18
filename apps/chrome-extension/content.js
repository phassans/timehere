(function () {
  const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif";
  const MONO = "'SF Mono',SFMono-Regular,ui-monospace,monospace";
  const SPAN_CSS = 'border-bottom:1.5px dashed #3b82f6;cursor:help;transition:opacity .15s ease,border-bottom-style .15s ease;';
  const TZS = window.TIMEHERE_TIMEZONES || [];
  const TZ_BY_ID = window.TIMEHERE_TZ_BY_ID || {};
  const ABBR_COUNT = TZS.reduce((a, t) => { a[t.abbr] = (a[t.abbr] || 0) + 1; return a; }, {});
  const TZ_ABBREVS = {
    PT: 'America/Los_Angeles', PST: 'America/Los_Angeles', PDT: 'America/Los_Angeles',
    ET: 'America/New_York', EST: 'America/New_York', EDT: 'America/New_York',
    CT: 'America/Chicago', CST: 'America/Chicago', CDT: 'America/Chicago',
    MT: 'America/Denver', MST: 'America/Denver', MDT: 'America/Denver',
    AKT: 'America/Anchorage', HST: 'Pacific/Honolulu',
    GMT: 'Europe/London', WET: 'Europe/Lisbon', CET: 'Europe/Berlin', CEST: 'Europe/Berlin', EET: 'Europe/Athens',
    TRT: 'Europe/Istanbul', MSK: 'Europe/Moscow', WAT: 'Africa/Lagos', EAT: 'Africa/Nairobi', SAST: 'Africa/Johannesburg',
    GST: 'Asia/Dubai', AST: 'Asia/Riyadh', IRST: 'Asia/Tehran', PKT: 'Asia/Karachi',
    IST: 'Asia/Kolkata', SLST: 'Asia/Colombo', BST: 'Asia/Dhaka', NPT: 'Asia/Kathmandu',
    ALMT: 'Asia/Almaty', UZT: 'Asia/Tashkent', ICT: 'Asia/Bangkok', WIB: 'Asia/Jakarta',
    SGT: 'Asia/Singapore', MYT: 'Asia/Kuala_Lumpur', PHT: 'Asia/Manila', HKT: 'Asia/Hong_Kong',
    KST: 'Asia/Seoul', JST: 'Asia/Tokyo', AWST: 'Australia/Perth', ACST: 'Australia/Adelaide', AEST: 'Australia/Sydney',
    NZST: 'Pacific/Auckland', FJT: 'Pacific/Fiji', CHST: 'Pacific/Guam', UTC: 'UTC'
  };
  const DAY_INDEX = { sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6 };
  const DAY_TOKEN_RX = /\b(Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)\.?\b/gi;
  const TIME_RX = /(?:(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)\s*:\s*)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*[\x2D\u2013\u2014\u2212]\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?|(\d{1,2}):(\d{2})\s*(am|pm)?|(\d{1,2})\s*(am|pm)/gi;
  const TZ_KEYS = Object.keys(TZ_ABBREVS).sort((a, b) => b.length - a.length);
  const TZ_RX = new RegExp(
    '\\\\((?:in\\\\s+)?(' + TZ_KEYS.join('|') + ')\\\\)|times?\\\\s+are\\\\s+(' + TZ_KEYS.join('|') + ')|\\\\((' + TZ_KEYS.join('|') + ')\\\\)',
    'gi'
  );
  let timezones = ['America/Los_Angeles', 'Asia/Kolkata'];
  let flipped = false;

  function normalizeTzs(list) {
    const src = Array.isArray(list) ? list : [];
    const clean = src.filter(t => TZ_BY_ID[t]).filter((t, i, a) => a.indexOf(t) === i).slice(0, 4);
    if (!clean.length) clean.push('America/Los_Angeles', 'Asia/Kolkata');
    if (clean.length === 1) clean.push(clean[0] === 'Asia/Kolkata' ? 'America/Los_Angeles' : 'Asia/Kolkata');
    return clean.slice(0, 4);
  }
  function sourceTz() { return timezones[0]; }
  function firstTargetTz() { return timezones[1] || timezones[0]; }
  function targetTzs() { return timezones.slice(1); }
  function tzAbbr(tz) { return TZ_BY_ID[tz]?.abbr || tz.split('/').pop(); }
  function tzTooltipLabel(tz) {
    const m = TZ_BY_ID[tz];
    if (!m) return tz;
    const ambig = ABBR_COUNT[m.abbr] > 1;
    return m.flag + ' ' + m.label + ' (' + m.abbr + (ambig ? ', ' + m.country : '') + ')';
  }

  function toUTC(y, M, d, h, m, iana) {
    let d0 = new Date(Date.UTC(y, M - 1, d, 12, 0));
    const fmt = new Intl.DateTimeFormat('en-CA', { timeZone: iana, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
    for (let i = 0; i < 3; i++) {
      const p = Object.fromEntries(fmt.formatToParts(d0).map(x => [x.type, x.value]));
      if (+p.year === y && +p.month === M && +p.day === d) return new Date(d0.getTime() + ((h * 60 + m) - (+p.hour * 60 + +p.minute)) * 60000);
      d0.setTime(d0.getTime() + (+p.day > d || +p.month > M ? -24 : 24) * 3600000);
    }
    return d0;
  }

  function parseTime(match, lastEndHour24) {
    const g = (i) => (match[i] !== undefined && match[i] !== '') ? parseInt(match[i], 10) : 0;
    const ap = (i) => (match[i] || '').toLowerCase();
    let h1, m1, h2, m2, isRange = false;
    if (match[4] !== undefined && match[4] !== '') {
      isRange = true;
      h1 = g(1); m1 = g(2); const a1 = ap(3); h2 = g(4); m2 = g(5); const a2 = ap(6);
      if (a1 === 'pm' && h1 < 12) h1 += 12; if (a1 === 'am' && h1 === 12) h1 = 0;
      if (a2 === 'pm' && h2 < 12) h2 += 12; if (a2 === 'am' && h2 === 12) h2 = 0;
      if (a2 && !a1 && h1 >= 1 && h1 <= 5) h1 += 12;
      if (a1 && !a2 && h2 >= 1 && h2 <= 5) h2 += 12;
      if (!a1 && !a2) {
        if (h2 < h1) h2 += 12;
        else if (h1 >= 1 && h1 <= 5 && h2 >= 1 && h2 <= 5) { h1 += 12; h2 += 12; }
        else if (lastEndHour24 !== undefined && lastEndHour24 <= 11 && h1 >= 1 && h1 <= 5) { h1 += 12; h2 += 12; }
      }
    } else {
      let a = '';
      if (match[7] !== undefined && match[7] !== '') { h1 = g(7); m1 = g(8); a = ap(9); }
      else { h1 = g(10); m1 = 0; a = ap(11); }
      if (a === 'pm' && h1 < 12) h1 += 12; if (a === 'am' && h1 === 12) h1 = 0;
      const hs = (match[7] || match[10] || '');
      const is24 = (h1 >= 13 && h1 <= 23) || (hs && hs.length >= 2 && hs.startsWith('0'));
      if (!a && h1 >= 1 && h1 <= 9 && !is24 && (lastEndHour24 === undefined || lastEndHour24 <= 11)) h1 += 12;
      h2 = h1; m2 = m1;
    }
    return { h1, m1, h2, m2, isRange };
  }

  function toDayIndex(token) {
    if (!token) return null;
    const k = token.replace('.', '').toLowerCase().slice(0, 3);
    return DAY_INDEX[k] !== undefined ? DAY_INDEX[k] : null;
  }
  function dayIndexFromContext(text, matchStart, raw) {
    const dayPrefix = raw.match(/^\s*(Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)\s*:/i);
    const fromRaw = toDayIndex(dayPrefix ? dayPrefix[1] : null);
    if (fromRaw !== null) return fromRaw;
    const left = text.slice(0, matchStart);
    let m, last = null;
    DAY_TOKEN_RX.lastIndex = 0;
    while ((m = DAY_TOKEN_RX.exec(left)) !== null) last = m[1];
    const fromLeft = toDayIndex(last);
    if (fromLeft !== null) return fromLeft;
    DAY_TOKEN_RX.lastIndex = 0;
    const next = text.slice(matchStart).match(DAY_TOKEN_RX);
    return toDayIndex(next ? next[0] : null);
  }
  function sourceDateParts(srcTz, desiredDayIdx) {
    const now = new Date();
    const fmt = new Intl.DateTimeFormat('en-US', { timeZone: srcTz, year: 'numeric', month: '2-digit', day: '2-digit', weekday: 'short' });
    const nowParts = Object.fromEntries(fmt.formatToParts(now).map(x => [x.type, x.value]));
    const base = new Date(Date.UTC(+nowParts.year, +nowParts.month - 1, +nowParts.day, 12, 0));
    const currIdx = DAY_INDEX[nowParts.weekday.toLowerCase().slice(0, 3)] ?? 0;
    const targetIdx = (desiredDayIdx === null || desiredDayIdx === undefined) ? currIdx : desiredDayIdx;
    base.setUTCDate(base.getUTCDate() + ((targetIdx - currIdx + 7) % 7));
    const dayParts = Object.fromEntries(fmt.formatToParts(base).map(x => [x.type, x.value]));
    return { y: +dayParts.year, M: +dayParts.month, d: +dayParts.day };
  }
  function padClock(clock) { return clock.replace(/^(\d):/, ' $1:'); }

  function convertOne(h1, m1, h2, m2, srcTz, dstTz, srcDayIdx) {
    const { y, M, d } = sourceDateParts(srcTz, srcDayIdx);
    const start = toUTC(y, M, d, h1, m1, srcTz);
    let end = toUTC(y, M, d, h2, m2, srcTz);
    if (end <= start) end.setDate(end.getDate() + 1);
    const tf = new Intl.DateTimeFormat('en-US', { timeZone: dstTz, hour: 'numeric', minute: '2-digit', hour12: true });
    const isRange = h1 !== h2 || m1 !== m2;
    const df = new Intl.DateTimeFormat('en-CA', { timeZone: dstTz, day: '2-digit', month: '2-digit' });
    const crosses = isRange && df.format(start) !== df.format(end);
    const s = padClock(tf.format(start));
    const e = padClock(tf.format(end));
    return { text: isRange ? (s + ' – ' + e) : s, crosses, start, end };
  }

  function detectTzInContext(text) {
    const t = text || '';
    const fromMatch = (rx) => {
      const m = rx.exec(t);
      return m && m[1] ? (TZ_ABBREVS[m[1].toUpperCase()] || null) : null;
    };
    // High-confidence source cues should win over incidental abbreviations.
    const explicit =
      fromMatch(new RegExp('\\(\\s*in\\s+(' + TZ_KEYS.join('|') + ')\\s*\\)', 'i')) ||
      fromMatch(new RegExp('\\btimes?\\s+are\\s+(' + TZ_KEYS.join('|') + ')\\b', 'i'));
    if (explicit) return explicit;
    const m = TZ_RX.exec(t);
    TZ_RX.lastIndex = 0;
    if (m) for (let i = 1; i < m.length; i++) if (m[i]) return TZ_ABBREVS[m[i].toUpperCase()] || null;
    const bare = fromMatch(new RegExp('\\b(' + TZ_KEYS.join('|') + ')\\b', 'i'));
    if (bare) return bare;
    return null;
  }
  function matchedTargetLabel(text, end, labels) {
    for (let i = 0; i < labels.length; i++) {
      const lab = labels[i];
      if (!lab) continue;
      if (new RegExp('\\s+' + lab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(text.slice(end, end + 25))) return lab;
    }
    return null;
  }
  function isEmbeddedNumberToken(text, start, end) {
    const prev = start > 0 ? text[start - 1] : ' ';
    const next = end < text.length ? text[end] : ' ';
    return /[A-Za-z0-9]/.test(prev) || /[A-Za-z0-9]/.test(next);
  }
  function detectLocalSourceTz(textNode, text, matchStart, raw) {
    const contexts = [];
    const lineStart = text.lastIndexOf('\n', matchStart) + 1;
    const lineEndRaw = text.indexOf('\n', matchStart);
    const lineEnd = lineEndRaw === -1 ? text.length : lineEndRaw;
    contexts.push(text.slice(lineStart, lineEnd));
    const localWindowStart = Math.max(0, matchStart - 48);
    const localWindowEnd = Math.min(text.length, matchStart + raw.length + 48);
    contexts.push(text.slice(localWindowStart, localWindowEnd));
    const parent = textNode.parentElement;
    const block = parent?.closest?.('p, li, td, th, blockquote, section, article, div');
    if (block) contexts.push((block.textContent || '').slice(0, 4000));
    if (location.hostname === 'mail.google.com') {
      const emailBlock = parent?.closest?.('.a3s, .ii.gt, .adn.ads');
      if (emailBlock) contexts.push((emailBlock.textContent || '').slice(0, 6000));
    }
    for (let i = 0; i < contexts.length; i++) {
      const ctx = (contexts[i] || '').trim();
      if (!ctx) continue;
      const tz = detectTzInContext(ctx);
      if (tz) return tz;
    }
    return null;
  }

  let host = null;
  let shadow = null;
  let tip = null;
  let btn = null;
  const TOGGLE_CSS = `
    :host { all: initial !important; position: fixed !important; top:0 !important; left:0 !important; width:0 !important; height:0 !important; pointer-events:none !important; z-index:999999 !important; }
    * { box-sizing: border-box; }
    .tf-tip { --bg:#111; --fg:#fff; position:fixed; min-width:260px; max-width:340px; background:var(--bg); color:var(--fg); font:12px/1.35 ${FONT}; border-radius:10px; overflow:hidden; box-shadow:0 8px 24px rgba(0,0,0,.22); white-space:normal; pointer-events:none; opacity:0; transition:opacity 120ms ease; }
    .tf-tip.on { opacity:1; }
    .tf-top { background:#1e2530; display:flex; align-items:center; justify-content:space-between; gap:10px; padding:8px 12px; }
    .tf-mid { background:#111; padding:10px 16px; }
    .tf-row { display:flex; align-items:center; justify-content:space-between; gap:10px; white-space:nowrap; }
    .tf-row + .tf-row { margin-top:8px; }
    .tf-left { display:flex; align-items:center; gap:6px; color:#9ca3af; min-width:0; }
    .tf-time { font-family:${MONO}; letter-spacing:.2px; color:#fff; margin-left:auto; text-align:right; }
    .tf-time.muted { color:#9ca3af; }
    .tf-badge { margin-left:6px; padding:1px 6px; border-radius:999px; font:600 10px/1.2 ${FONT}; background:rgba(232,149,42,0.2); color:#E8952A; }
    .tf-btn { position:fixed; right:24px; bottom:24px; padding:7px 14px; border:none; border-radius:20px; background:#1e2530; color:#fff; font:500 12px/1 ${FONT}; box-shadow:0 2px 8px rgba(0,0,0,.15); cursor:pointer; pointer-events:auto; transition:opacity .15s; user-select:none; }
  `;
  function ensureTogglePill() {
    if (host || !document.body) return;
    host = document.createElement('timehere-root');
    host.id = 'timehere-toggle';
    document.body.appendChild(host);
    shadow = host.attachShadow({ mode: 'open' });
    const sty = document.createElement('style');
    sty.textContent = TOGGLE_CSS;
    shadow.appendChild(sty);
    tip = document.createElement('div');
    tip.className = 'tf-tip';
    shadow.appendChild(tip);
    btn = document.createElement('button');
    btn.id = 'timehere-toggle-btn';
    btn.className = 'tf-btn';
    btn.title = 'Click to toggle timezone view';
    btn.addEventListener('click', flipPage);
    shadow.appendChild(btn);
    updateBtnLabel();
  }
  function removeTogglePill() {
    if (!host) return;
    host.remove();
    host = null;
    shadow = null;
    tip = null;
    btn = null;
  }
  function syncTogglePill() {
    if (document.querySelector('.timehere-span')) ensureTogglePill();
    else removeTogglePill();
  }

  function tooltipHtml(span) {
    if (span.dataset.at === '1') return '<div class="tf-row tf-source">Already in ' + (span.dataset.tl || 'target') + '</div>';
    const d = span.dataset;
    const sd = d.sd !== undefined ? +d.sd : null;
    const src = convertOne(+d.h1, +d.m1, +d.h2, +d.m2, d.sz, d.sz, sd);
    const srcAbbr = tzAbbr(d.sz);
    const targets = targetTzs();
    let html = '<div class="tf-top"><span class="tf-left">on page \u00b7 ' + srcAbbr + '</span><span class="tf-time muted">' + src.text + '</span></div>';
    html += '<div class="tf-mid">';
    targets.forEach(tz => {
      const r = convertOne(+d.h1, +d.m1, +d.h2, +d.m2, d.sz, tz, sd);
      const meta = TZ_BY_ID[tz] || null;
      const flag = meta?.flag || '';
      const abbr = tzAbbr(tz);
      html += '<div class="tf-row"><span class="tf-left">' + flag + ' ' + abbr + '</span><span class="tf-time">' + r.text + (r.crosses ? '<span class="tf-badge">+1d</span>' : '') + '</span></div>';
    });
    html += '</div>';
    return html;
  }
  function positionTip(anchor) {
    if (!tip) return;
    const r = anchor.getBoundingClientRect();
    const gap = 8;
    const below = r.top < tip.offsetHeight + gap + 10;
    tip.className = 'tf-tip';
    tip.style.top = (below ? (r.bottom + gap) : (r.top - tip.offsetHeight - gap)) + 'px';
    let left = r.left + r.width / 2 - tip.offsetWidth / 2;
    left = Math.max(4, Math.min(left, window.innerWidth - tip.offsetWidth - 4));
    tip.style.left = left + 'px';
    tip.classList.add('on');
  }
  function showTooltip(e) {
    if (!tip) return;
    const el = e.target;
    if (!el.classList.contains('timehere-span')) return;
    el.style.borderBottomStyle = 'solid';
    el.style.cursor = 'crosshair';
    tip.innerHTML = tooltipHtml(el);
    positionTip(el);
  }
  function hideTooltip(e) {
    if (e?.target?.classList?.contains('timehere-span')) {
      e.target.style.borderBottomStyle = 'dashed';
      e.target.style.cursor = 'help';
    }
    if (tip) tip.classList.remove('on');
  }

  function isSkipTag(node) {
    let p = node?.parentNode;
    while (p && p.nodeType === 1) {
      const t = p.nodeName;
      if (t === 'INPUT' || t === 'TEXTAREA' || t === 'CODE' || t === 'PRE' || t === 'SCRIPT' || t === 'STYLE' || t === 'TIME' || t === 'TIMEHERE-ROOT') return true;
      if (location.hostname === 'mail.google.com' && (p.classList?.contains('g3') || p.classList?.contains('xW'))) return true;
      if (p.getAttribute?.('contenteditable') === 'true' || p.getAttribute?.('role') === 'textbox' || p.getAttribute?.('aria-hidden') === 'true') return true;
      p = p.parentNode;
    }
    return false;
  }
  function makeSpan(data) {
    const s = document.createElement('span');
    s.className = 'timehere-span';
    s.style.cssText = SPAN_CSS;
    Object.assign(s.dataset, data);
    s.addEventListener('mouseenter', showTooltip);
    s.addEventListener('mouseleave', hideTooltip);
    return s;
  }
  function wrapNode(textNode) {
    const text = textNode.textContent;
    const labels = targetTzs().map(tzAbbr);
    let lastIdx = 0, lastEnd;
    const frag = document.createDocumentFragment();
    TIME_RX.lastIndex = 0;
    let m;
    while ((m = TIME_RX.exec(text)) !== null) {
      const raw = m[0];
      if (isEmbeddedNumberToken(text, m.index, m.index + raw.length)) continue;
      const matched = matchedTargetLabel(text, m.index + raw.length, labels);
      if (matched) {
        frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
        const span = makeSpan({ at: '1', tl: matched });
        span.textContent = raw;
        frag.appendChild(span);
        lastIdx = m.index + raw.length;
        continue;
      }
      const p = parseTime(m, lastEnd);
      lastEnd = p.h2;
      if (p.h1 > 23 || p.h2 > 23) continue;
      const localSrcTz = detectLocalSourceTz(textNode, text, m.index, raw);
      if (!localSrcTz) continue;
      const dayIdx = dayIndexFromContext(text, m.index, raw);
      frag.appendChild(document.createTextNode(text.slice(lastIdx, m.index)));
      const d = { h1: p.h1, m1: p.m1, h2: p.h2, m2: p.m2, sz: localSrcTz, raw };
      if (dayIdx !== null) d.sd = dayIdx;
      const span = makeSpan(d);
      span.textContent = raw;
      frag.appendChild(span);
      lastIdx = m.index + raw.length;
    }
    if (lastIdx === 0) return;
    frag.appendChild(document.createTextNode(text.slice(lastIdx)));
    if (textNode.parentNode && !textNode.parentNode.classList?.contains('timehere-span')) textNode.parentNode.replaceChild(frag, textNode);
  }
  function scan(root) {
    if (!root || root.nodeType !== 1) return;
    try { root.normalize(); } catch (e) {}
    const walk = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const toWrap = [];
    let n;
    while ((n = walk.nextNode())) {
      const txt = n.textContent || '';
      if (!/\d/.test(txt) || txt.trim().length < 2) continue;
      if (isSkipTag(n) || n.parentNode?.classList?.contains('timehere-span')) continue;
      if (TIME_RX.test(txt)) toWrap.push(n);
    }
    toWrap.forEach(node => wrapNode(node));
    const it = document.createNodeIterator(root, NodeFilter.SHOW_ELEMENT, null, false);
    let el;
    while ((el = it.nextNode())) if (el.shadowRoot) scan(el.shadowRoot);
  }

  function inlineText(d, dst) {
    const sd = d.sd !== undefined ? +d.sd : null;
    const r = convertOne(+d.h1, +d.m1, +d.h2, +d.m2, d.sz, dst, sd);
    const raw = d.raw || '';
    const dayPrefix = raw.match(/^\s*(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)\s*:\s*/i);
    return (dayPrefix ? dayPrefix[0] : '') + r.text;
  }
  function toggleLabel() {
    const src = tzAbbr(sourceTz());
    const dst = tzAbbr(firstTargetTz());
    return flipped ? ('Showing ' + dst + ' \u00b7 restore') : (src + ' \u2192 ' + dst);
  }
  function renderFlip() {
    const dst = firstTargetTz();
    document.querySelectorAll('.timehere-span').forEach(span => {
      if (!span.dataset.h1) return;
      if (flipped) { span._orig = span.dataset.raw; span.textContent = inlineText(span.dataset, dst); }
      else span.textContent = span._orig || span.dataset.raw;
    });
  }
  function updateBtnLabel() {
    if (!btn) return;
    btn.innerHTML = toggleLabel();
  }
  function flipPage() {
    flipped = !flipped;
    try { sessionStorage.setItem('timehere-flipped', flipped ? '1' : ''); } catch (e) {}
    const spans = document.querySelectorAll('.timehere-span');
    spans.forEach(s => { s.style.opacity = '0'; });
    if (btn) btn.style.opacity = '0';
    setTimeout(() => {
      renderFlip();
      spans.forEach(s => { s.style.opacity = ''; });
      updateBtnLabel();
      if (btn) btn.style.opacity = '';
    }, 150);
  }

  function applyStorage(o) {
    timezones = normalizeTzs(o.timezones || [o.sourceTz, o.targetTz]);
    updateBtnLabel();
    if (flipped) renderFlip();
  }
  chrome.storage.sync.get({ timezones: null, sourceTz: 'America/Los_Angeles', targetTz: 'Asia/Kolkata' }, (o) => {
    applyStorage(o);
    try {
      if (sessionStorage.getItem('timehere-flipped') === '1') {
        flipped = true;
        renderFlip();
        updateBtnLabel();
      }
    } catch (e) {}
  });
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if (changes.timezones) timezones = normalizeTzs(changes.timezones.newValue);
    else {
      const src = changes.sourceTz?.newValue || sourceTz();
      const tgt = changes.targetTz?.newValue || firstTargetTz();
      timezones = normalizeTzs([src, tgt]);
    }
    updateBtnLabel();
    if (flipped) renderFlip();
  });

  const scanQueue = new Set();
  let scanScheduled = false;
  function flush() {
    scanScheduled = false;
    const nodes = Array.from(scanQueue);
    scanQueue.clear();
    nodes.forEach(scan);
    if (flipped) renderFlip();
    syncTogglePill();
  }
  function enqueue(node) {
    const r = (node && node.nodeType === 3) ? node.parentNode : node;
    if (!r || r.nodeType !== 1) return;
    scanQueue.add(r);
    if (scanScheduled) return;
    scanScheduled = true;
    if (typeof requestIdleCallback === 'function') requestIdleCallback(flush, { timeout: 300 });
    else setTimeout(flush, 60);
  }

  scan(document.body);
  if (flipped) renderFlip();
  syncTogglePill();
  new MutationObserver(muts => {
    muts.forEach(mu => {
      if (mu.type === 'characterData') { enqueue(mu.target); return; }
      enqueue(mu.target);
      mu.addedNodes.forEach(n => {
        if (n.nodeType === 1 && n.nodeName !== 'SCRIPT' && n.nodeName !== 'STYLE') enqueue(n);
        else if (n.nodeType === 3) enqueue(n);
      });
    });
  }).observe(document.body, { childList: true, characterData: true, subtree: true });
})();
