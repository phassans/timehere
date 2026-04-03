const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const {
  TIME_RX, parseTime, detectTzInContext, isEmbeddedNumberToken,
  shouldSkipYearAt, allTimeMatches, OFFSET_TO_TZ,
} = require('./test-helpers');

// ─── Helpers ────────────────────────────────────────────────────────

/** Returns true if TIME_RX matches anywhere in text */
function matches(text) {
  TIME_RX.lastIndex = 0;
  return TIME_RX.test(text);
}

/** Returns the first raw match string from TIME_RX, or null */
function firstMatch(text) {
  TIME_RX.lastIndex = 0;
  const m = TIME_RX.exec(text);
  return m ? m[0] : null;
}

/** Returns parsed result for the first TIME_RX match */
function firstParsed(text, lastEndHour24) {
  TIME_RX.lastIndex = 0;
  const m = TIME_RX.exec(text);
  if (!m) return null;
  return parseTime([...m], lastEndHour24);
}

// ═══════════════════════════════════════════════════════════════════
//  TIME_RX — Regex matching
// ═══════════════════════════════════════════════════════════════════

describe('TIME_RX — single times with AM/PM', () => {
  it('matches "3pm"', () => assert.equal(firstMatch('Meet at 3pm'), '3pm'));
  it('matches "3 pm"', () => assert.equal(firstMatch('Meet at 3 pm'), '3 pm'));
  it('matches "3PM"', () => assert.equal(firstMatch('Meet at 3PM'), '3PM'));
  it('matches "3 PM"', () => assert.equal(firstMatch('Meet at 3 PM'), '3 PM'));
  it('matches "3am"', () => assert.equal(firstMatch('Wake at 3am'), '3am'));
  it('matches "11pm"', () => assert.equal(firstMatch('Sleep at 11pm'), '11pm'));
  it('matches "12pm"', () => assert.equal(firstMatch('Noon is 12pm'), '12pm'));
  it('matches "12am"', () => assert.equal(firstMatch('Midnight is 12am'), '12am'));
  it('matches "3p"', () => assert.equal(firstMatch('at 3p'), '3p'));
  it('matches "3a"', () => assert.equal(firstMatch('at 3a'), '3a'));
  it('matches "3 a.m."', () => assert.equal(firstMatch('at 3 a.m.'), '3 a.m.'));
  it('matches "3 p.m."', () => assert.equal(firstMatch('at 3 p.m.'), '3 p.m.'));
  it('matches "3 A.M."', () => assert.equal(firstMatch('at 3 A.M.'), '3 A.M.'));
  it('matches "10am"', () => assert.equal(firstMatch('Call at 10am'), '10am'));
  it('matches "10 am"', () => assert.equal(firstMatch('Call at 10 am'), '10 am'));
});

describe('TIME_RX — single times with colon (HH:MM)', () => {
  it('matches "3:00pm"', () => assert.equal(firstMatch('at 3:00pm'), '3:00pm'));
  it('matches "3:30 pm"', () => assert.equal(firstMatch('at 3:30 pm'), '3:30 pm'));
  it('matches "10:30 PM"', () => assert.equal(firstMatch('at 10:30 PM'), '10:30 PM'));
  it('matches "12:00 am"', () => assert.equal(firstMatch('at 12:00 am'), '12:00 am'));
  it('matches "12:00 pm"', () => assert.equal(firstMatch('at 12:00 pm'), '12:00 pm'));
  it('matches "9:45 a.m."', () => assert.equal(firstMatch('at 9:45 a.m.'), '9:45 a.m.'));
  it('matches "11:59 p.m."', () => assert.equal(firstMatch('at 11:59 p.m.'), '11:59 p.m.'));
  it('matches "3:00 P.M."', () => assert.equal(firstMatch('at 3:00 P.M.'), '3:00 P.M.'));
});

describe('TIME_RX — 24-hour format (no AM/PM, with colon)', () => {
  it('matches "15:00"', () => assert.equal(firstMatch('at 15:00'), '15:00'));
  it('matches "08:30"', () => assert.equal(firstMatch('at 08:30'), '08:30'));
  it('matches "00:00"', () => assert.equal(firstMatch('at 00:00'), '00:00'));
  it('matches "23:59"', () => assert.equal(firstMatch('at 23:59'), '23:59'));
  it('matches "13:45"', () => assert.equal(firstMatch('at 13:45'), '13:45'));
});

describe('TIME_RX — time ranges with hyphen', () => {
  it('matches "3-5pm"', () => assert.equal(firstMatch('from 3-5pm'), '3-5pm'));
  it('matches "3 - 5 pm"', () => assert.equal(firstMatch('from 3 - 5 pm'), '3 - 5 pm'));
  it('matches "3pm - 5pm"', () => assert.equal(firstMatch('from 3pm - 5pm'), '3pm - 5pm'));
  it('matches "9am - 5pm"', () => assert.equal(firstMatch('hours 9am - 5pm'), '9am - 5pm'));
  it('matches "9:00am - 5:00pm"', () => assert.equal(firstMatch('hours 9:00am - 5:00pm'), '9:00am - 5:00pm'));
  it('matches "9:30 AM - 10:30 AM"', () => assert.equal(firstMatch('slot 9:30 AM - 10:30 AM'), '9:30 AM - 10:30 AM'));
  it('matches "10:00 - 11:00"', () => assert.equal(firstMatch('slot 10:00 - 11:00'), '10:00 - 11:00'));
});

describe('TIME_RX — ranges with en-dash / em-dash', () => {
  it('matches "3\u20135pm" (en-dash)', () => assert.equal(firstMatch('from 3\u20135pm'), '3\u20135pm'));
  it('matches "3\u20145pm" (em-dash)', () => assert.equal(firstMatch('from 3\u20145pm'), '3\u20145pm'));
  it('matches "9am\u201311am"', () => assert.equal(firstMatch('slot 9am\u201311am'), '9am\u201311am'));
});

describe('TIME_RX — day-prefixed times', () => {
  it('matches "Mon: 3-5pm"', () => assert.equal(firstMatch('Mon: 3-5pm'), 'Mon: 3-5pm'));
  it('matches "Monday: 9am - 5pm"', () => assert.equal(firstMatch('Monday: 9am - 5pm'), 'Monday: 9am - 5pm'));
  it('matches "Tue: 10:00 - 11:00"', () => assert.equal(firstMatch('Tue: 10:00 - 11:00'), 'Tue: 10:00 - 11:00'));
  it('matches "Friday: 1-3pm"', () => assert.equal(firstMatch('Friday: 1-3pm'), 'Friday: 1-3pm'));
  it('matches "Wed: 9:30am - 12:30pm"', () => assert.equal(firstMatch('Wed: 9:30am - 12:30pm'), 'Wed: 9:30am - 12:30pm'));
});

describe('TIME_RX — multiple matches in one string', () => {
  it('finds both times in "9am and 5pm"', () => {
    const ms = allTimeMatches('Meet at 9am and then 5pm');
    assert.equal(ms.length, 2);
    assert.equal(ms[0].raw, '9am');
    assert.equal(ms[1].raw, '5pm');
  });
  it('finds range and single in "9-5pm, then 8pm"', () => {
    const ms = allTimeMatches('Work 9-5pm, dinner at 8pm');
    assert.equal(ms.length, 2);
    assert.equal(ms[0].raw, '9-5pm');
    assert.equal(ms[1].raw, '8pm');
  });
});

describe('TIME_RX — should NOT match (negative cases)', () => {
  it('does not match plain numbers like "42"', () => assert.ok(!matches('I have 42 items')));
  it('does not match years like "2026"', () => assert.ok(!matches('In 2026 we')));
  it('does not match "$10" (price)', () => assert.ok(!matches('costs $10')));
  it('matches "10" from "100" (regex sees 10+trailing 0)', () => assert.ok(matches('scored 100 points')));
  it('does not match "3.5" (decimal)', () => assert.ok(!matches('rated 3.5 stars')));
  it('does not match "v2" (version)', () => assert.ok(!matches('using v2')));
});

// ═══════════════════════════════════════════════════════════════════
//  parseTime — hour/minute extraction and AM/PM inference
// ═══════════════════════════════════════════════════════════════════

describe('parseTime — single times', () => {
  it('parses "3pm" as h1=15', () => {
    const r = firstParsed('at 3pm');
    assert.equal(r.h1, 15);
    assert.equal(r.m1, 0);
    assert.equal(r.isRange, false);
  });
  it('parses "3am" as h1=3', () => {
    const r = firstParsed('at 3am');
    assert.equal(r.h1, 3);
    assert.equal(r.m1, 0);
  });
  it('parses "12pm" as h1=12 (noon)', () => {
    assert.equal(firstParsed('at 12pm').h1, 12);
  });
  it('parses "12am" as h1=0 (midnight)', () => {
    assert.equal(firstParsed('at 12am').h1, 0);
  });
  it('parses "10:30 PM" as h1=22, m1=30', () => {
    const r = firstParsed('at 10:30 PM');
    assert.equal(r.h1, 22);
    assert.equal(r.m1, 30);
  });
  it('parses "10:30 AM" as h1=10, m1=30', () => {
    const r = firstParsed('at 10:30 AM');
    assert.equal(r.h1, 10);
    assert.equal(r.m1, 30);
  });
  it('parses "12:00 am" as h1=0, m1=0', () => {
    const r = firstParsed('at 12:00 am');
    assert.equal(r.h1, 0);
    assert.equal(r.m1, 0);
  });
  it('parses "3 p.m." as h1=15', () => {
    assert.equal(firstParsed('at 3 p.m.').h1, 15);
  });
  it('parses "3 a.m." as h1=3', () => {
    assert.equal(firstParsed('at 3 a.m.').h1, 3);
  });
  it('parses "3p" as h1=15', () => {
    assert.equal(firstParsed('at 3p').h1, 15);
  });
  it('parses "3a" as h1=3', () => {
    assert.equal(firstParsed('at 3a').h1, 3);
  });
});

describe('parseTime — 24-hour format', () => {
  it('parses "15:00" as h1=15', () => {
    const r = firstParsed('at 15:00');
    assert.equal(r.h1, 15);
    assert.equal(r.m1, 0);
  });
  it('parses "08:30" as h1=8 (leading zero = 24h)', () => {
    const r = firstParsed('at 08:30');
    assert.equal(r.h1, 8);
    assert.equal(r.m1, 30);
  });
  it('parses "00:00" as midnight', () => {
    const r = firstParsed('at 00:00');
    assert.equal(r.h1, 0);
    assert.equal(r.m1, 0);
  });
  it('parses "23:59" as h1=23, m1=59', () => {
    const r = firstParsed('at 23:59');
    assert.equal(r.h1, 23);
    assert.equal(r.m1, 59);
  });
});

describe('parseTime — ambiguous single times (no AM/PM, low digits)', () => {
  it('infers "5:00" as PM (17:00) by default', () => {
    // No AM/PM, h1 1-9, no 24h marker → defaults to PM
    assert.equal(firstParsed('at 5:00').h1, 17);
  });
  it('keeps "5:00" as AM (5) when lastEndHour24 > 11 (suppresses PM inference)', () => {
    // When last range ended in PM (>11), ambiguous low hours stay as-is (AM)
    assert.equal(firstParsed('at 5:00', 14).h1, 5);
  });
});

describe('parseTime — ranges', () => {
  it('parses "9am - 5pm" as 9→17', () => {
    const r = firstParsed('from 9am - 5pm');
    assert.equal(r.isRange, true);
    assert.equal(r.h1, 9);
    assert.equal(r.h2, 17);
  });
  it('parses "9:00am - 5:00pm" as 9:00→17:00', () => {
    const r = firstParsed('from 9:00am - 5:00pm');
    assert.equal(r.h1, 9);
    assert.equal(r.m1, 0);
    assert.equal(r.h2, 17);
    assert.equal(r.m2, 0);
  });
  it('parses "3-5pm" — infers start as PM when end has PM and start is 1-5', () => {
    const r = firstParsed('from 3-5pm');
    assert.equal(r.h1, 15);
    assert.equal(r.h2, 17);
  });
  it('parses "9-11am" as 9→11 (AM)', () => {
    const r = firstParsed('from 9-11am');
    assert.equal(r.h1, 9);
    assert.equal(r.h2, 11);
  });
  it('parses "11pm - 1am" — handles wrap with AM/PM', () => {
    const r = firstParsed('from 11pm - 1am');
    assert.equal(r.h1, 23);
    assert.equal(r.h2, 1);
  });
  it('parses "10-11" (no AM/PM, ascending) as-is', () => {
    const r = firstParsed('from 10-11');
    assert.equal(r.isRange, true);
    assert.equal(r.h1, 10);
    assert.equal(r.h2, 11);
  });
  it('parses "9-5" (no AM/PM, end < start) — adds 12 to end', () => {
    const r = firstParsed('from 9-5');
    assert.equal(r.h1, 9);
    assert.equal(r.h2, 17);
  });
  it('parses "1-3" (no AM/PM, both 1-5) — both become PM', () => {
    const r = firstParsed('from 1-3');
    assert.equal(r.h1, 13);
    assert.equal(r.h2, 15);
  });
  it('parses "9:30 AM - 10:30 AM" correctly', () => {
    const r = firstParsed('slot 9:30 AM - 10:30 AM');
    assert.equal(r.h1, 9);
    assert.equal(r.m1, 30);
    assert.equal(r.h2, 10);
    assert.equal(r.m2, 30);
  });
  it('parses "12:00am - 12:00pm" as 0→12', () => {
    const r = firstParsed('from 12:00am - 12:00pm');
    assert.equal(r.h1, 0);
    assert.equal(r.h2, 12);
  });
});

describe('parseTime — day-prefixed ranges', () => {
  it('parses "Mon: 3-5pm" as range 15→17', () => {
    const r = firstParsed('Mon: 3-5pm');
    assert.equal(r.isRange, true);
    assert.equal(r.h1, 15);
    assert.equal(r.h2, 17);
  });
});

// ═══════════════════════════════════════════════════════════════════
//  detectTzInContext — timezone detection from surrounding text
// ═══════════════════════════════════════════════════════════════════

describe('detectTzInContext — explicit cues', () => {
  it('detects "(in PT)"', () => {
    assert.equal(detectTzInContext('Meeting at 3pm (in PT)'), 'America/Los_Angeles');
  });
  it('detects "(in PST)"', () => {
    assert.equal(detectTzInContext('Call at 9am (in PST)'), 'America/Los_Angeles');
  });
  it('detects "times are EST"', () => {
    assert.equal(detectTzInContext('All times are EST'), 'America/New_York');
  });
  it('detects "time are IST"', () => {
    assert.equal(detectTzInContext('time are IST'), 'Asia/Kolkata');
  });
  it('detects "(in CET)"', () => {
    assert.equal(detectTzInContext('Webinar at 14:00 (in CET)'), 'Europe/Berlin');
  });
});

describe('detectTzInContext — parenthesized abbreviations', () => {
  it('detects "(PT)"', () => {
    assert.equal(detectTzInContext('3pm (PT)'), 'America/Los_Angeles');
  });
  it('detects "(EST)"', () => {
    assert.equal(detectTzInContext('5:00 PM (EST)'), 'America/New_York');
  });
  it('detects "(IST)"', () => {
    assert.equal(detectTzInContext('10:30 PM (IST)'), 'Asia/Kolkata');
  });
  it('detects "(JST)"', () => {
    assert.equal(detectTzInContext('Meeting 9am (JST)'), 'Asia/Tokyo');
  });
});

describe('detectTzInContext — bare abbreviations', () => {
  it('detects bare "PT"', () => {
    assert.equal(detectTzInContext('3pm PT'), 'America/Los_Angeles');
  });
  it('detects bare "EST"', () => {
    assert.equal(detectTzInContext('5:00 PM EST'), 'America/New_York');
  });
  it('detects bare "IST"', () => {
    assert.equal(detectTzInContext('10:30 PM IST'), 'Asia/Kolkata');
  });
  it('detects bare "JST"', () => {
    assert.equal(detectTzInContext('9am JST'), 'Asia/Tokyo');
  });
  it('detects bare "SGT"', () => {
    assert.equal(detectTzInContext('2pm SGT'), 'Asia/Singapore');
  });
  it('detects bare "AEST"', () => {
    assert.equal(detectTzInContext('8am AEST'), 'Australia/Sydney');
  });
  it('detects bare "NZST"', () => {
    assert.equal(detectTzInContext('10am NZST'), 'Pacific/Auckland');
  });
});

describe('detectTzInContext — GMT/UTC offset patterns', () => {
  it('detects "GMT+5:30" as Asia/Kolkata', () => {
    assert.equal(detectTzInContext('10:30 PM GMT+5:30'), 'Asia/Kolkata');
  });
  it('detects "UTC+5:30" as Asia/Kolkata', () => {
    assert.equal(detectTzInContext('10:30 PM UTC+5:30'), 'Asia/Kolkata');
  });
  it('detects "GMT-8" as America/Los_Angeles', () => {
    assert.equal(detectTzInContext('3pm GMT-8'), 'America/Los_Angeles');
  });
  it('detects "UTC-5" as America/New_York', () => {
    assert.equal(detectTzInContext('9am UTC-5'), 'America/New_York');
  });
  it('detects "GMT+0" as Europe/London', () => {
    assert.equal(detectTzInContext('noon GMT+0'), 'Europe/London');
  });
  it('detects "UTC+9" as Asia/Tokyo', () => {
    assert.equal(detectTzInContext('meeting UTC+9'), 'Asia/Tokyo');
  });
  it('detects "GMT+5:45" as Asia/Kathmandu', () => {
    assert.equal(detectTzInContext('call at GMT+5:45'), 'Asia/Kathmandu');
  });
  it('detects "UTC-3:30" as America/St_Johns', () => {
    assert.equal(detectTzInContext('event UTC-3:30'), 'America/St_Johns');
  });
  it('detects "GMT+8" as Asia/Singapore', () => {
    assert.equal(detectTzInContext('3pm GMT+8'), 'Asia/Singapore');
  });
  it('detects "UTC+12" as Pacific/Auckland', () => {
    assert.equal(detectTzInContext('meeting UTC+12'), 'Pacific/Auckland');
  });
  it('detects "GMT-10" as Pacific/Honolulu', () => {
    assert.equal(detectTzInContext('surf GMT-10'), 'Pacific/Honolulu');
  });
  it('detects "UTC+3:30" as Asia/Tehran', () => {
    assert.equal(detectTzInContext('call UTC+3:30'), 'Asia/Tehran');
  });
  it('prefers offset over bare "GMT" — "GMT+5:30" → Kolkata not London', () => {
    assert.equal(detectTzInContext('10:30 PM GMT+5:30'), 'Asia/Kolkata');
  });
  it('falls back to bare "GMT" for unknown offset like GMT+99', () => {
    // GMT+99 doesn't match any offset, so bare abbreviation "GMT" wins
    assert.equal(detectTzInContext('at GMT+99'), 'Europe/London');
  });
});

describe('detectTzInContext — priority ordering', () => {
  it('explicit "(in PT)" wins over bare "EST"', () => {
    assert.equal(detectTzInContext('times EST but (in PT)'), 'America/Los_Angeles');
  });
  it('"times are EST" wins over bare "PT"', () => {
    assert.equal(detectTzInContext('3pm PT but times are EST'), 'America/New_York');
  });
});

describe('detectTzInContext — no timezone present', () => {
  it('returns null for "Meet at 3pm tomorrow"', () => {
    assert.equal(detectTzInContext('Meet at 3pm tomorrow'), null);
  });
  it('returns null for empty string', () => {
    assert.equal(detectTzInContext(''), null);
  });
  it('returns null for undefined', () => {
    assert.equal(detectTzInContext(undefined), null);
  });
});

// ═══════════════════════════════════════════════════════════════════
//  shouldSkipYearAt — year-at filter
// ═══════════════════════════════════════════════════════════════════

describe('shouldSkipYearAt — skip bare year + at', () => {
  it('skips "room 2024 at "', () => {
    assert.ok(shouldSkipYearAt('room 2024 at '));
  });
  it('skips "version 2026 at "', () => {
    assert.ok(shouldSkipYearAt('version 2026 at '));
  });
  it('skips "item 1234 at "', () => {
    assert.ok(shouldSkipYearAt('item 1234 at '));
  });
});

describe('shouldSkipYearAt — allow date + year + at', () => {
  it('allows "April 7th, 2026 at "', () => {
    assert.ok(!shouldSkipYearAt('April 7th, 2026 at '));
  });
  it('allows "Jan 1, 2026 at "', () => {
    assert.ok(!shouldSkipYearAt('Jan 1, 2026 at '));
  });
  it('allows "December 25, 2025 at "', () => {
    assert.ok(!shouldSkipYearAt('December 25, 2025 at '));
  });
  it('allows "Feb 14, 2026 at "', () => {
    assert.ok(!shouldSkipYearAt('Feb 14, 2026 at '));
  });
  it('allows "March 3rd, 2026 at "', () => {
    assert.ok(!shouldSkipYearAt('March 3rd, 2026 at '));
  });
  it('allows "July 4, 2026 at "', () => {
    assert.ok(!shouldSkipYearAt('July 4, 2026 at '));
  });
  it('allows "Jun 15, 2025 at "', () => {
    assert.ok(!shouldSkipYearAt('Jun 15, 2025 at '));
  });
  it('allows "Sept 1, 2026 at "', () => {
    assert.ok(!shouldSkipYearAt('Sept 1, 2026 at '));
  });
  it('allows "September 1, 2026 at "', () => {
    assert.ok(!shouldSkipYearAt('September 1, 2026 at '));
  });
  it('allows "Aug 2026 at "', () => {
    assert.ok(!shouldSkipYearAt('Aug 2026 at '));
  });
  it('allows "October 2026 at "', () => {
    assert.ok(!shouldSkipYearAt('October 2026 at '));
  });
  it('allows "Nov 2026 at "', () => {
    assert.ok(!shouldSkipYearAt('Nov 2026 at '));
  });
  it('allows "May 2026 at "', () => {
    assert.ok(!shouldSkipYearAt('May 2026 at '));
  });
});

// ═══════════════════════════════════════════════════════════════════
//  isEmbeddedNumberToken — reject tokens glued to words/numbers
// ═══════════════════════════════════════════════════════════════════

describe('isEmbeddedNumberToken', () => {
  it('rejects when preceded by a letter (e.g., "v3pm")', () => {
    assert.ok(isEmbeddedNumberToken('use v3pm now', 4, 7));
  });
  it('rejects when followed by a letter (e.g., "3pmx")', () => {
    assert.ok(isEmbeddedNumberToken('at 3pmx', 3, 6));
  });
  it('rejects when preceded by a digit (e.g., "3pm" inside "123pm")', () => {
    // TIME_RX would match "3pm" at index 7, prev char at 6 is "2"
    assert.ok(isEmbeddedNumberToken('code 123pm', 7, 10));
  });
  it('allows standalone "3pm"', () => {
    assert.ok(!isEmbeddedNumberToken('at 3pm now', 3, 6));
  });
  it('allows at start of string', () => {
    assert.ok(!isEmbeddedNumberToken('3pm now', 0, 3));
  });
  it('allows at end of string', () => {
    assert.ok(!isEmbeddedNumberToken('at 3pm', 3, 6));
  });
});

// ═══════════════════════════════════════════════════════════════════
//  Full-text integration scenarios
// ═══════════════════════════════════════════════════════════════════

describe('Full-text scenarios', () => {
  it('"Tuesday, April 7th, 2026 at 10:30 PM GMT+5:30" — matches 10:30 PM', () => {
    const ms = allTimeMatches('Tuesday, April 7th, 2026 at 10:30 PM GMT+5:30');
    const timeMatch = ms.find(m => m.raw.includes('10:30'));
    assert.ok(timeMatch, 'Should find a match containing 10:30');
    assert.equal(timeMatch.raw, '10:30 PM');
  });

  it('"Meeting from 9am - 5pm EST on Monday" — matches range', () => {
    const ms = allTimeMatches('Meeting from 9am - 5pm EST on Monday');
    assert.equal(ms.length, 1);
    assert.equal(ms[0].raw, '9am - 5pm');
  });

  it('"Office hours: Mon: 9-11am, Tue: 1-3pm" — finds both ranges', () => {
    const ms = allTimeMatches('Office hours: Mon: 9-11am, Tue: 1-3pm');
    assert.equal(ms.length, 2);
    assert.equal(ms[0].raw, 'Mon: 9-11am');
    assert.equal(ms[1].raw, 'Tue: 1-3pm');
  });

  it('"Call at 3:00 PM (in PT)" — matches the time', () => {
    const ms = allTimeMatches('Call at 3:00 PM (in PT)');
    assert.equal(ms[0].raw, '3:00 PM');
  });

  it('"Webinar 14:00-15:30 CET" — matches the range', () => {
    const ms = allTimeMatches('Webinar 14:00-15:30 CET');
    assert.equal(ms[0].raw.trim(), '14:00-15:30');
  });

  it('"Lunch at noon (12pm)" — matches 12pm', () => {
    const ms = allTimeMatches('Lunch at noon (12pm)');
    assert.equal(ms[0].raw, '12pm');
  });
});

// ═══════════════════════════════════════════════════════════════════
//  Edge cases — TIME_RX
// ═══════════════════════════════════════════════════════════════════

describe('TIME_RX — Unicode minus sign (\u2212) in ranges', () => {
  it('matches "3\u22125pm" (Unicode minus)', () => assert.equal(firstMatch('from 3\u22125pm'), '3\u22125pm'));
  it('matches "9:00am\u221211:00am"', () => assert.equal(firstMatch('slot 9:00am\u221211:00am'), '9:00am\u221211:00am'));
});

describe('TIME_RX — hour boundary values', () => {
  it('matches "0:00" (midnight in 24h)', () => assert.equal(firstMatch('at 0:00 start').trim(), '0:00'));
  it('matches "12:00"', () => assert.equal(firstMatch('at 12:00 noon').trim(), '12:00'));
  it('matches "13:00"', () => assert.equal(firstMatch('at 13:00'), '13:00'));
  it('matches "23:00"', () => assert.equal(firstMatch('at 23:00'), '23:00'));
  it('matches raw "25:00" (regex doesn\'t validate hours)', () => {
    // TIME_RX matches structurally; parseTime + wrapNode reject h > 23
    assert.equal(firstMatch('at 25:00'), '25:00');
  });
});

describe('TIME_RX — dotted AM/PM in ranges', () => {
  it('matches "3 a.m. - 5 p.m."', () => {
    assert.equal(firstMatch('from 3 a.m. - 5 p.m.'), '3 a.m. - 5 p.m.');
  });
  it('matches "9 A.M. - 12 P.M."', () => {
    assert.equal(firstMatch('slot 9 A.M. - 12 P.M.'), '9 A.M. - 12 P.M.');
  });
  it('matches "10:30 a.m. - 11:30 a.m."', () => {
    assert.equal(firstMatch('slot 10:30 a.m. - 11:30 a.m.'), '10:30 a.m. - 11:30 a.m.');
  });
});

describe('TIME_RX — range with only one side having AM/PM, start > 5', () => {
  it('matches "9-5pm" (start > 5, no AM/PM on start)', () => {
    assert.equal(firstMatch('work 9-5pm'), '9-5pm');
  });
  it('matches "8-11am" (start > 5, no AM/PM on start)', () => {
    assert.equal(firstMatch('morning 8-11am'), '8-11am');
  });
  it('matches "9am-11" (AM on start, no AM/PM on end)', () => {
    assert.equal(firstMatch('slot 9am-11'), '9am-11');
  });
});

// ═══════════════════════════════════════════════════════════════════
//  Edge cases — parseTime
// ═══════════════════════════════════════════════════════════════════

describe('parseTime — 12:30am/pm boundary', () => {
  it('parses "12:30am" as h1=0, m1=30 (past midnight)', () => {
    const r = firstParsed('at 12:30am');
    assert.equal(r.h1, 0);
    assert.equal(r.m1, 30);
  });
  it('parses "12:30pm" as h1=12, m1=30 (past noon)', () => {
    const r = firstParsed('at 12:30pm');
    assert.equal(r.h1, 12);
    assert.equal(r.m1, 30);
  });
  it('parses "12:59am" as h1=0, m1=59', () => {
    const r = firstParsed('at 12:59am');
    assert.equal(r.h1, 0);
    assert.equal(r.m1, 59);
  });
});

describe('parseTime — range wrap and noon boundaries', () => {
  it('parses "12pm - 1am" as 12→1', () => {
    const r = firstParsed('from 12pm - 1am');
    assert.equal(r.h1, 12);
    assert.equal(r.h2, 1);
  });
  it('parses "11:30pm - 12:30am" as 23:30→0:30', () => {
    const r = firstParsed('from 11:30pm - 12:30am');
    assert.equal(r.h1, 23);
    assert.equal(r.m1, 30);
    assert.equal(r.h2, 0);
    assert.equal(r.m2, 30);
  });
  it('parses "12am - 6am" as 0→6', () => {
    const r = firstParsed('from 12am - 6am');
    assert.equal(r.h1, 0);
    assert.equal(r.h2, 6);
  });
});

describe('parseTime — range with AM/PM on start only, end > 5', () => {
  it('parses "9am - 11" — end stays at 11 (> 5, no inference)', () => {
    const r = firstParsed('slot 9am-11');
    assert.equal(r.h1, 9);
    assert.equal(r.h2, 11);
  });
  it('parses "9am - 3" — end 1-5 gets PM inference → 15', () => {
    const r = firstParsed('slot 9am-3');
    assert.equal(r.h1, 9);
    assert.equal(r.h2, 15);
  });
});

describe('parseTime — range with AM/PM on end only, start > 5', () => {
  it('parses "9-5pm" — start 9 > 5, no PM inference on start', () => {
    const r = firstParsed('work 9-5pm');
    assert.equal(r.h1, 9);
    assert.equal(r.h2, 17);
  });
  it('parses "8-11am" — start 8 > 5, stays 8', () => {
    const r = firstParsed('morning 8-11am');
    assert.equal(r.h1, 8);
    assert.equal(r.h2, 11);
  });
});

describe('parseTime — no AM/PM ranges, start > 5', () => {
  it('parses "9-11" — ascending, no inference needed', () => {
    const r = firstParsed('slot 9-11');
    assert.equal(r.h1, 9);
    assert.equal(r.h2, 11);
  });
  it('parses "10-6" — end < start, end gets +12 → 18', () => {
    const r = firstParsed('hours 10-6');
    assert.equal(r.h1, 10);
    assert.equal(r.h2, 18);
  });
  it('parses "6-8" — ascending, both > 5, no PM inference', () => {
    const r = firstParsed('slot 6-8');
    assert.equal(r.h1, 6);
    assert.equal(r.h2, 8);
  });
});

describe('parseTime — h > 23 passes through (wrapNode rejects)', () => {
  it('parses "25:00" — h1=25 (structurally valid parse, rejected later)', () => {
    const r = firstParsed('at 25:00');
    assert.equal(r.h1, 25);
  });
  it('parses "99:00" — h1=99', () => {
    const r = firstParsed('at 99:00');
    assert.equal(r.h1, 99);
  });
});

describe('parseTime — dotted AM/PM in ranges', () => {
  it('parses "3 a.m. - 5 p.m." as 3→17', () => {
    const r = firstParsed('from 3 a.m. - 5 p.m.');
    assert.equal(r.h1, 3);
    assert.equal(r.h2, 17);
  });
});

// ═══════════════════════════════════════════════════════════════════
//  Edge cases — detectTzInContext
// ═══════════════════════════════════════════════════════════════════

describe('detectTzInContext — case variations in offsets', () => {
  it('detects "gmt+5:30" (lowercase)', () => {
    assert.equal(detectTzInContext('at gmt+5:30'), 'Asia/Kolkata');
  });
  it('detects "Utc-8" (mixed case)', () => {
    assert.equal(detectTzInContext('3pm Utc-8'), 'America/Los_Angeles');
  });
  it('detects "GMT+05:30" (leading zero in hours)', () => {
    assert.equal(detectTzInContext('at GMT+05:30'), 'Asia/Kolkata');
  });
});

describe('detectTzInContext — UTC+0 vs UTC-0', () => {
  it('detects "UTC+0" as Europe/London', () => {
    assert.equal(detectTzInContext('noon UTC+0'), 'Europe/London');
  });
  it('detects "UTC-0" as Europe/London', () => {
    assert.equal(detectTzInContext('noon UTC-0'), 'Europe/London');
  });
  it('detects "GMT+00:00" as Europe/London', () => {
    assert.equal(detectTzInContext('noon GMT+00:00'), 'Europe/London');
  });
});

describe('detectTzInContext — bare UTC and GMT without offset', () => {
  it('detects bare "UTC" → UTC', () => {
    assert.equal(detectTzInContext('3pm UTC'), 'UTC');
  });
  it('detects bare "GMT" → Europe/London', () => {
    assert.equal(detectTzInContext('3pm GMT'), 'Europe/London');
  });
});

// ═══════════════════════════════════════════════════════════════════
//  Edge cases — shouldSkipYearAt
// ═══════════════════════════════════════════════════════════════════

describe('shouldSkipYearAt — edge cases', () => {
  it('skips "1000 at " (non-year 4-digit number)', () => {
    assert.ok(shouldSkipYearAt('item 1000 at '));
  });
  it('skips with multiple spaces "2026  at "', () => {
    assert.ok(shouldSkipYearAt('event 2026  at '));
  });
  it('does not skip "2026at" (no space — regex requires \\s+)', () => {
    assert.ok(!shouldSkipYearAt('code2026at'));
  });
  it('does not skip text without 4-digit number', () => {
    assert.ok(!shouldSkipYearAt('meet at '));
  });
});

// ═══════════════════════════════════════════════════════════════════
//  OFFSET_TO_TZ — sanity checks
// ═══════════════════════════════════════════════════════════════════

describe('OFFSET_TO_TZ table', () => {
  it('has +330 → Asia/Kolkata', () => assert.equal(OFFSET_TO_TZ[330], 'Asia/Kolkata'));
  it('has -480 → America/Los_Angeles', () => assert.equal(OFFSET_TO_TZ[-480], 'America/Los_Angeles'));
  it('has 0 → Europe/London', () => assert.equal(OFFSET_TO_TZ[0], 'Europe/London'));
  it('has +540 → Asia/Tokyo', () => assert.equal(OFFSET_TO_TZ[540], 'Asia/Tokyo'));
  it('has +345 → Asia/Kathmandu', () => assert.equal(OFFSET_TO_TZ[345], 'Asia/Kathmandu'));
  it('has -210 → America/St_Johns', () => assert.equal(OFFSET_TO_TZ[-210], 'America/St_Johns'));
  it('has +210 → Asia/Tehran', () => assert.equal(OFFSET_TO_TZ[210], 'Asia/Tehran'));
});
