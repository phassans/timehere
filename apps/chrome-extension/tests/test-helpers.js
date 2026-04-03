// Extracts testable internals from content.js without needing a browser environment.
// We re-declare the pure logic (regex, parseTime, detectTzInContext, filters)
// so tests can run under plain Node.js with zero dependencies.

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

const OFFSET_TO_TZ = {
  [-720]: 'Pacific/Kwajalein', [-660]: 'Pacific/Midway', [-600]: 'Pacific/Honolulu',
  [-570]: 'Pacific/Marquesas', [-540]: 'America/Anchorage', [-480]: 'America/Los_Angeles',
  [-420]: 'America/Denver', [-360]: 'America/Chicago', [-300]: 'America/New_York',
  [-240]: 'America/Halifax', [-210]: 'America/St_Johns', [-180]: 'America/Sao_Paulo',
  [-120]: 'Atlantic/South_Georgia', [-60]: 'Atlantic/Azores',
  0: 'Europe/London', 60: 'Europe/Berlin', 120: 'Europe/Athens',
  180: 'Europe/Moscow', 210: 'Asia/Tehran', 240: 'Asia/Dubai',
  270: 'Asia/Kabul', 300: 'Asia/Karachi', 330: 'Asia/Kolkata',
  345: 'Asia/Kathmandu', 360: 'Asia/Dhaka', 390: 'Asia/Yangon',
  420: 'Asia/Bangkok', 480: 'Asia/Singapore', 525: 'Australia/Eucla',
  540: 'Asia/Tokyo', 570: 'Australia/Darwin', 600: 'Australia/Sydney',
  630: 'Australia/Lord_Howe', 660: 'Pacific/Guadalcanal', 720: 'Pacific/Auckland',
  765: 'Pacific/Chatham', 780: 'Pacific/Apia', 840: 'Pacific/Kiritimati',
};

const TZ_KEYS = Object.keys(TZ_ABBREVS).sort((a, b) => b.length - a.length);

const TIME_RX = /(?:(?:Mon(?:day)?|Tue(?:sday)?|Wed(?:nesday)?|Thu(?:rsday)?|Fri(?:day)?|Sat(?:urday)?|Sun(?:day)?)\s*:\s*)?(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|a|p)?\s*[\x2D\u2013\u2014\u2212]\s*(\d{1,2})(?::(\d{2}))?\s*(a\.?m\.?|p\.?m\.?|a|p)?|(\d{1,2}):(\d{2})\s*(a\.?m\.?|p\.?m\.?|a|p)?|(\d{1,2})\s*(a\.?m\.?|p\.?m\.?|a|p)/gi;

const TZ_RX = new RegExp(
  '\\((?:in\\s+)?(' + TZ_KEYS.join('|') + ')\\)|times?\\s+are\\s+(' + TZ_KEYS.join('|') + ')|\\((' + TZ_KEYS.join('|') + ')\\)',
  'gi'
);

function parseTime(match, lastEndHour24) {
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

function detectTzInContext(text) {
  const t = text || '';
  const fromMatch = (rx) => {
    const m = rx.exec(t);
    return m && m[1] ? (TZ_ABBREVS[m[1].toUpperCase()] || null) : null;
  };
  const explicit =
    fromMatch(new RegExp('\\(\\s*in\\s+(' + TZ_KEYS.join('|') + ')\\s*\\)', 'i')) ||
    fromMatch(new RegExp('\\btimes?\\s+are\\s+(' + TZ_KEYS.join('|') + ')\\b', 'i'));
  if (explicit) return explicit;
  const m = TZ_RX.exec(t);
  TZ_RX.lastIndex = 0;
  if (m) for (let i = 1; i < m.length; i++) if (m[i]) return TZ_ABBREVS[m[i].toUpperCase()] || null;
  const offsetMatch = /\b(?:GMT|UTC)\s*([+-])\s*(\d{1,2})(?::(\d{2}))?\b/i.exec(t);
  if (offsetMatch) {
    const sign = offsetMatch[1] === '+' ? 1 : -1;
    const totalMin = sign * (+offsetMatch[2] * 60 + (+offsetMatch[3] || 0));
    const fromOffset = OFFSET_TO_TZ[totalMin];
    if (fromOffset) return fromOffset;
  }
  const bare = fromMatch(new RegExp('\\b(' + TZ_KEYS.join('|') + ')\\b', 'i'));
  if (bare) return bare;
  return null;
}

function isEmbeddedNumberToken(text, start, end) {
  const prev = start > 0 ? text[start - 1] : ' ';
  const next = end < text.length ? text[end] : ' ';
  return /[A-Za-z0-9]/.test(prev) || /[A-Za-z0-9]/.test(next);
}

const YEAR_AT_RX = /\b\d{4}\s+at\s*$/i;
const DATE_MONTH_RX = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|June?|July?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\b/i;

/** Simulates the year-at filter from wrapNode: returns true if the match should be SKIPPED */
function shouldSkipYearAt(before) {
  return YEAR_AT_RX.test(before) && !DATE_MONTH_RX.test(before);
}

/** Run TIME_RX against text and return all raw matched strings */
function allTimeMatches(text) {
  TIME_RX.lastIndex = 0;
  const results = [];
  let m;
  while ((m = TIME_RX.exec(text)) !== null) {
    results.push({ raw: m[0], index: m.index, match: [...m] });
  }
  return results;
}

module.exports = {
  TIME_RX,
  TZ_RX,
  TZ_ABBREVS,
  TZ_KEYS,
  OFFSET_TO_TZ,
  parseTime,
  detectTzInContext,
  isEmbeddedNumberToken,
  shouldSkipYearAt,
  allTimeMatches,
};
