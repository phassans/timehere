const TZS = window.TIMEHERE_TIMEZONES || [];
const byId = window.TIMEHERE_TZ_BY_ID || {};
const getOffsetLabel = window.TIMEHERE_OFFSET_LABEL || (() => 'UTC+0');
const REGION_ORDER = ['Americas', 'Europe & Africa', 'Middle East', 'Asia & Pacific', 'UTC'];
const rowsEl = document.getElementById('rows');
const addBtn = document.getElementById('addBtn');
const pickerEl = document.getElementById('picker');
const searchEl = document.getElementById('search');
const optionsEl = document.getElementById('options');
let list = ['America/Los_Angeles', 'Asia/Kolkata'];
let dragFrom = -1;
let optionIndex = -1;
let optionButtons = [];

function normalizeList(arr) {
  const src = Array.isArray(arr) ? arr : [];
  const cleaned = src.filter(id => byId[id]).filter((id, i, a) => a.indexOf(id) === i).slice(0, 4);
  if (!cleaned.length) cleaned.push('America/Los_Angeles', 'Asia/Kolkata');
  if (cleaned.length === 1) cleaned.push(cleaned[0] === 'Asia/Kolkata' ? 'America/Los_Angeles' : 'Asia/Kolkata');
  return cleaned.slice(0, 4);
}

function save() { chrome.storage.sync.set({ timezones: list }); }
function shortLabel(label) {
  return String(label || '').replace(/\s+Standard Time$/i, '').replace(/\s+Time$/i, '');
}
function fmtTimeRange(start, end, tzId) {
  const tf = new Intl.DateTimeFormat('en-US', { timeZone: tzId, hour: 'numeric', minute: '2-digit', hour12: true });
  return tf.format(start) + ' \u2013 ' + tf.format(end);
}

function renderRows() {
  rowsEl.innerHTML = '';
  list.forEach((id, idx) => {
    const tz = byId[id];
    const offset = getOffsetLabel(id);
    const row = document.createElement('div');
    row.className = 'row';
    row.draggable = true;
    row.dataset.idx = idx;
    row.innerHTML =
      '<span class="drag">⠿</span>' +
      '<span class="meta"><span class="name">' + tz.flag + ' ' + shortLabel(tz.label) + '</span><span class="offset">' + offset + '</span></span>' +
      '<span class="srcSlot"></span>' +
      '<button class="remove" title="Remove">×</button>';
    if (idx === 0) {
      const src = document.createElement('span');
      src.className = 'sourcePill';
      src.textContent = 'source';
      row.querySelector('.srcSlot').appendChild(src);
    }
    row.querySelector('.remove').onclick = () => {
      if (list.length <= 2) return;
      list.splice(idx, 1);
      rerenderAndSave();
    };
    row.addEventListener('dragstart', () => { dragFrom = idx; });
    row.addEventListener('dragover', (e) => e.preventDefault());
    row.addEventListener('drop', () => {
      if (dragFrom === idx || dragFrom < 0) return;
      const [moved] = list.splice(dragFrom, 1);
      list.splice(idx, 0, moved);
      rerenderAndSave();
    });
    rowsEl.appendChild(row);
  });
  addBtn.disabled = list.length >= 4;
}

function toUtcAtToday(hour, minute, srcTz) {
  const now = new Date();
  const day = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
    timeZone: srcTz, year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(now).map(x => [x.type, x.value]));
  const y = +day.year, M = +day.month, d = +day.day;
  let base = new Date(Date.UTC(y, M - 1, d, 12, 0));
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: srcTz, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false
  });
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(fmt.formatToParts(base).map(x => [x.type, x.value]));
    if (+p.year === y && +p.month === M && +p.day === d) return new Date(base.getTime() + ((hour * 60 + minute) - (+p.hour * 60 + +p.minute)) * 60000);
    base.setTime(base.getTime() + (+p.day > d || +p.month > M ? -24 : 24) * 3600000);
  }
  return base;
}

function renderPreview() {
  const previewEl = document.getElementById('preview');
  if (!previewEl) return;
  const src = byId[list[0]];
  const start = toUtcAtToday(8, 0, src.id);
  const end = toUtcAtToday(11, 0, src.id);
  const sourceRange = fmtTimeRange(start, end, src.id);
  const srcDayShort = new Intl.DateTimeFormat('en-US', { timeZone: src.id, weekday: 'short' }).format(start);
  const topLeft = 'on page \u00b7 ' + src.flag + ' ' + src.abbr;
  let firstCross = null;
  const targets = list.slice(1).map(id => {
    const tz = byId[id];
    const range = fmtTimeRange(start, end, tz.id);
    const dayStart = new Intl.DateTimeFormat('en-US', { timeZone: tz.id, weekday: 'short' }).format(start);
    const dayEnd = new Intl.DateTimeFormat('en-US', { timeZone: tz.id, weekday: 'short' }).format(end);
    const crosses = dayStart !== dayEnd;
    if (crosses && !firstCross) firstCross = { dayStart, dayEnd };
    return '<div class="line"><span class="left"><span>' + tz.flag + '</span><span class="abbr">' + tz.abbr + '</span></span>' +
      '<span class="time">' + range + (crosses ? '<span class="badge">+1d</span>' : '') + '</span></div>';
  });
  const sourceDayFmt = new Intl.DateTimeFormat('en-US', { timeZone: src.id, weekday: 'short', month: 'short', day: 'numeric' });
  const footDate = firstCross ? (firstCross.dayStart + ' \u2192 ' + firstCross.dayEnd) : sourceDayFmt.format(start);
  previewEl.innerHTML =
    '<div class="topBand"><span>' + topLeft + '</span><span class="time muted">' + sourceRange + '</span></div>' +
    '<div class="middleBand">' +
      (targets.length ? targets.join('') : '<div class="line"><span class="left"><span class="abbr">No target timezone</span></span></div>') +
    '</div>' +
    '<div class="bottomBand"><span class="brandMini"><span class="logoDot"></span><span>TimeHere</span></span><span>' + footDate + '</span></div>';
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function highlight(text, query) {
  const raw = String(text);
  const q = (query || '').trim();
  if (!q) return esc(raw);
  const i = raw.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return esc(raw);
  return esc(raw.slice(0, i)) + '<mark>' + esc(raw.slice(i, i + q.length)) + '</mark>' + esc(raw.slice(i + q.length));
}

function renderOptions(filter) {
  const f = (filter || '').trim().toLowerCase();
  const choices = TZS.filter(t => !list.includes(t.id)).filter(t => {
    const city = t.id.split('/').pop().replace(/_/g, ' ');
    const offset = getOffsetLabel(t.id);
    const hay = [t.label, city, t.country, t.abbr, offset, t.region, t.id].join(' ').toLowerCase();
    return !f || hay.includes(f);
  });
  const byRegion = {};
  choices.forEach(c => {
    if (!byRegion[c.region]) byRegion[c.region] = [];
    byRegion[c.region].push(c);
  });
  optionsEl.innerHTML = '';
  optionButtons = [];
  REGION_ORDER.forEach(region => {
    const listInRegion = byRegion[region] || [];
    if (!listInRegion.length) return;
    const hdr = document.createElement('div');
    hdr.className = 'opt region';
    hdr.innerHTML = '<strong>' + esc(region) + '</strong>';
    optionsEl.appendChild(hdr);
    listInRegion.forEach(t => {
      const offset = getOffsetLabel(t.id);
      const city = t.id.split('/').pop().replace(/_/g, ' ');
      const b = document.createElement('button');
      b.className = 'opt';
      b.dataset.tz = t.id;
      b.innerHTML =
        '<span>' + t.flag + ' ' + highlight(t.label, f) + '</span> ' +
        '<span style="color:#6b7280">(' + highlight(t.abbr, f) + ')</span> ' +
        '<span style="color:#6b7280">' + highlight(offset, f) + '</span> ' +
        '<span style="color:#9ca3af">' + highlight(city, f) + '</span>';
      b.onclick = () => selectTimezone(t.id);
      optionsEl.appendChild(b);
      optionButtons.push(b);
    });
  });
  optionIndex = optionButtons.length ? 0 : -1;
  syncActiveOption();
}

function selectTimezone(id) {
  if (list.length >= 4) return;
  list.push(id);
  pickerEl.hidden = true;
  searchEl.value = '';
  rerenderAndSave();
}
function syncActiveOption() {
  optionButtons.forEach((b, i) => {
    b.style.background = i === optionIndex ? '#eef2ff' : '';
  });
}

function rerenderAndSave() {
  list = normalizeList(list);
  renderRows();
  renderPreview();
  qcConvert();
  save();
}

addBtn.onclick = () => {
  pickerEl.hidden = !pickerEl.hidden;
  if (!pickerEl.hidden) {
    renderOptions('');
    searchEl.focus();
  }
};
searchEl.oninput = () => renderOptions(searchEl.value);
searchEl.onkeydown = (e) => {
  if (pickerEl.hidden || !optionButtons.length) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    optionIndex = Math.min(optionButtons.length - 1, optionIndex + 1);
    syncActiveOption();
    optionButtons[optionIndex].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'ArrowUp') {
    e.preventDefault();
    optionIndex = Math.max(0, optionIndex - 1);
    syncActiveOption();
    optionButtons[optionIndex].scrollIntoView({ block: 'nearest' });
  } else if (e.key === 'Enter') {
    e.preventDefault();
    const btn = optionButtons[optionIndex];
    if (btn) selectTimezone(btn.dataset.tz);
  } else if (e.key === 'Escape') {
    pickerEl.hidden = true;
  }
};

/* ── Quick Convert ─────────────────────────────────────── */
const QC_RX = /(?:(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)\s*:?\s*)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|a|p)?\s*[\x2D\u2013\u2014\u2212]\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|a|p)?|(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?|a|p)?|(\d{1,2})\s*(a\.?m\.?|p\.?m\.?|a|p)?/i;
const qcInput = document.getElementById('qcInput');
const qcResult = document.getElementById('qcResult');

function qcParseTime(match) {
  const g = (i) => (match[i] !== undefined && match[i] !== '') ? parseInt(match[i], 10) : 0;
  const ap = (i) => { const v = (match[i] || '').toLowerCase().replace(/\./g, ''); return v === 'a' ? 'am' : v === 'p' ? 'pm' : v; };
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
    }
  } else {
    let a = '';
    if (match[7] !== undefined && match[7] !== '') { h1 = g(7); m1 = g(8); a = ap(9); }
    else { h1 = g(10); m1 = 0; a = ap(11); }
    if (a === 'pm' && h1 < 12) h1 += 12; if (a === 'am' && h1 === 12) h1 = 0;
    const hs = (match[7] || match[10] || '');
    const is24 = (h1 >= 13 && h1 <= 23) || (hs && hs.length >= 2 && hs.startsWith('0'));
    if (!a && h1 >= 1 && h1 <= 9 && !is24) h1 += 12;
    h2 = h1; m2 = m1;
  }
  return { h1, m1, h2, m2, isRange };
}

function qcConvert() {
  const raw = qcInput.value.trim();
  if (!raw) { qcResult.innerHTML = ''; return; }
  const m = raw.match(QC_RX);
  if (!m) { qcResult.innerHTML = '<span class="qc-hint">Try something like 3:30 PM or 9-11am</span>'; return; }
  const { h1, m1, h2, m2, isRange } = qcParseTime(m);
  if (h1 > 23 || h2 > 23 || m1 > 59 || m2 > 59) { qcResult.innerHTML = '<span class="qc-hint">Invalid time</span>'; return; }
  const srcId = list[0];
  const src = byId[srcId];
  const start = toUtcAtToday(h1, m1, srcId);
  let end = toUtcAtToday(h2, m2, srcId);
  if (isRange && end <= start) end.setDate(end.getDate() + 1);
  const tf12 = (tz) => new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit', hour12: true });
  const srcTime = isRange ? (tf12(srcId).format(start) + ' \u2013 ' + tf12(srcId).format(end)) : tf12(srcId).format(start);
  let html = '<div class="qc-src">' + src.flag + ' ' + shortLabel(src.label) + ' \u00b7 ' + srcTime + '</div>';
  const targets = list.slice(1);
  if (!targets.length) { qcResult.innerHTML = html + '<span class="qc-hint">Add a target timezone above</span>'; return; }
  const df = (tz) => new Intl.DateTimeFormat('en-CA', { timeZone: tz, day: '2-digit', month: '2-digit' });
  targets.forEach(id => {
    const tz = byId[id];
    const time = isRange ? (tf12(id).format(start) + ' \u2013 ' + tf12(id).format(end)) : tf12(id).format(start);
    const crosses = isRange && df(id).format(start) !== df(id).format(end);
    html += '<div class="qc-dst"><span class="qc-flag">' + tz.flag + '</span><span class="qc-abbr">' + tz.abbr + '</span><span class="qc-time">' + time + (crosses ? '<span class="qc-badge">+1d</span>' : '') + '</span></div>';
  });
  qcResult.innerHTML = html;
}
qcInput.addEventListener('input', qcConvert);

chrome.storage.sync.get({ timezones: null, sourceTz: 'America/Los_Angeles', targetTz: 'Asia/Kolkata' }, (o) => {
  list = normalizeList(o.timezones || [o.sourceTz, o.targetTz]);
  renderRows();
  renderPreview();
});
