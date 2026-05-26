// Parity tests — these MUST produce byte-identical output in v1.x (moment)
// and v2.0 (Luxon). If any of these fail on the v2.0 branch, the backend
// swap broke a contract that wasn't documented in MIGRATION.md.

import {
  convertEpoch,
  convertDateToEpoch,
  parseToEpoch,
  getDurationBetween,
  getTimezoneOffset,
  getTimezoneList,
  getEpochNow,
  getEpochUnit,
  formatDuration,
} from '../../src/epoch/convertor.js';
import { isValidEpoch, isValidTimezone } from '../../src/utils/validations.js';
import {
  safeConvertEpoch,
  safeConvertDateToEpoch,
  safeConvertEpochToTimezone,
  safeParseToEpoch,
  safeGetDurationBetween,
  safeGetTimezoneOffset,
  safeGetEpochNow,
  safeGetEpochUnit,
} from '../../src/epoch/safe.js';
import { EpochError, EpochValidationError } from '../../src/errors/EpochValidationError.js';
import { EpochUnit } from '../../src/types/index.js';
import {
  EPOCH_S, EPOCH_MS, EPOCH_US, EPOCH_NS,
  EPOCH_ZERO, EPOCH_NEGATIVE_MS,
  ONE_HOUR_MS, ONE_DAY_MS,
  ISO_AT_EPOCH_MS, HUMAN_AT_EPOCH_MS_UTC,
  TZ_UTC, TZ_KOLKATA,
  KOLKATA_OFFSET_STRING, KOLKATA_OFFSET_MINUTES,
} from './fixtures.js';

beforeAll(() => {
  if (process.env.TZ !== 'UTC') {
    throw new Error(
      'Golden tests must run with TZ=UTC. Use: npm run test:golden',
    );
  }
});

describe('parity: auto-detect epoch unit', () => {
  test('seconds-scale → EpochUnit.SECONDS', () => {
    expect(convertEpoch(EPOCH_S).epochUnit).toBe(EpochUnit.SECONDS);
    expect(getEpochUnit(EPOCH_S)).toBe(EpochUnit.SECONDS);
  });
  test('ms-scale → EpochUnit.MILLI_SECONDS', () => {
    expect(convertEpoch(EPOCH_MS).epochUnit).toBe(EpochUnit.MILLI_SECONDS);
    expect(getEpochUnit(EPOCH_MS)).toBe(EpochUnit.MILLI_SECONDS);
  });
  test('μs-scale → EpochUnit.MICRO_SECONDS', () => {
    expect(convertEpoch(EPOCH_US).epochUnit).toBe(EpochUnit.MICRO_SECONDS);
    expect(getEpochUnit(EPOCH_US)).toBe(EpochUnit.MICRO_SECONDS);
  });
  test('ns-scale → EpochUnit.NANO_SECONDS', () => {
    expect(convertEpoch(EPOCH_NS).epochUnit).toBe(EpochUnit.NANO_SECONDS);
    expect(getEpochUnit(EPOCH_NS)).toBe(EpochUnit.NANO_SECONDS);
  });
  test('zero epoch resolves to seconds-scale', () => {
    expect(convertEpoch(EPOCH_ZERO).epochUnit).toBe(EpochUnit.SECONDS);
  });
  test('negative epoch is supported (pre-1970)', () => {
    expect(convertEpoch(EPOCH_NEGATIVE_MS).epoch).toBe(EPOCH_NEGATIVE_MS);
  });
});

describe('parity: convertEpoch return shape', () => {
  test('returns object with the expected keys', () => {
    const r = convertEpoch(EPOCH_MS);
    expect(Object.keys(r).sort()).toEqual(
      ['dateTime', 'dateTimeInGMT', 'epoch', 'epochUnit', 'relative', 'timezone'].sort(),
    );
  });
  test('returned object is frozen', () => {
    expect(Object.isFrozen(convertEpoch(EPOCH_MS))).toBe(true);
  });
  test('preserves the input epoch value exactly', () => {
    expect(convertEpoch(EPOCH_MS).epoch).toBe(EPOCH_MS);
  });
  test('seconds-scale and ms-scale inputs resolve to the same dateTimeInGMT', () => {
    // Different inputs, same moment in time → identical formatted output.
    expect(convertEpoch(EPOCH_S).dateTimeInGMT).toBe(convertEpoch(EPOCH_MS).dateTimeInGMT);
  });
  test('relative time is a non-empty human-readable string', () => {
    expect(typeof convertEpoch(EPOCH_MS).relative).toBe('string');
    expect(convertEpoch(EPOCH_MS).relative.length).toBeGreaterThan(0);
  });
});

describe('parity: convertDateToEpoch', () => {
  test('returns frozen object with expected keys', () => {
    const r = convertDateToEpoch(new Date(EPOCH_MS), TZ_UTC);
    expect(Object.isFrozen(r)).toBe(true);
    expect(Object.keys(r).sort()).toEqual(
      ['dateTime', 'dateTimeInGMT', 'epochInMilliseconds', 'epochInSeconds', 'timezone'].sort(),
    );
  });
  test('epochInMilliseconds and epochInSeconds are numerically consistent', () => {
    const r = convertDateToEpoch(new Date(EPOCH_MS), TZ_UTC);
    expect(r.epochInMilliseconds).toBe(EPOCH_MS);
    expect(r.epochInSeconds).toBe(EPOCH_S);
  });
  test('dateTime in UTC equals the well-known anchor string', () => {
    expect(convertDateToEpoch(new Date(EPOCH_MS), TZ_UTC).dateTime).toBe(HUMAN_AT_EPOCH_MS_UTC);
  });
  test('dateTimeInGMT equals the well-known anchor string', () => {
    expect(convertDateToEpoch(new Date(EPOCH_MS), TZ_UTC).dateTimeInGMT).toBe(HUMAN_AT_EPOCH_MS_UTC);
  });
  test('timezone field reflects the requested timezone', () => {
    expect(convertDateToEpoch(new Date(EPOCH_MS), TZ_KOLKATA).timezone).toBe(TZ_KOLKATA);
  });
});

describe('parity: parseToEpoch ISO 8601', () => {
  test('parses well-known anchor ISO string', () => {
    const r = parseToEpoch(ISO_AT_EPOCH_MS, undefined, TZ_UTC);
    expect(r.epochInMilliseconds).toBe(EPOCH_MS);
    expect(r.epochInSeconds).toBe(EPOCH_S);
  });
  test('returns frozen object', () => {
    expect(Object.isFrozen(parseToEpoch(ISO_AT_EPOCH_MS, undefined, TZ_UTC))).toBe(true);
  });
  test('dateTimeInGMT round-trips to the anchor human string', () => {
    expect(parseToEpoch(ISO_AT_EPOCH_MS, undefined, TZ_UTC).dateTimeInGMT).toBe(HUMAN_AT_EPOCH_MS_UTC);
  });
  test('rejects HTML/XSS payload with ParseError', () => {
    expect(() => parseToEpoch('<script>alert(1)</script>', undefined, TZ_UTC)).toThrow(
      new EpochValidationError(EpochError.ParseError),
    );
  });
  test('rejects empty input with ParseError', () => {
    expect(() => parseToEpoch('', undefined, TZ_UTC)).toThrow(
      new EpochValidationError(EpochError.ParseError),
    );
  });
});

describe('parity: getDurationBetween', () => {
  test('zero duration when from === to', () => {
    const d = getDurationBetween(EPOCH_MS, EPOCH_MS);
    expect(d.totalMilliseconds).toBe(0);
    expect(d.humanReadable).toBe('0 seconds');
  });
  test('1 hour difference is reported as hours=1', () => {
    const d = getDurationBetween(EPOCH_MS, EPOCH_MS + ONE_HOUR_MS);
    expect(d.hours).toBe(1);
    expect(d.minutes).toBe(0);
    expect(d.totalMilliseconds).toBe(ONE_HOUR_MS);
  });
  test('1 day 3 hours difference is reported correctly', () => {
    const d = getDurationBetween(EPOCH_MS, EPOCH_MS + ONE_DAY_MS + 3 * ONE_HOUR_MS);
    expect(d.days).toBe(1);
    expect(d.hours).toBe(3);
  });
  test('returned object is frozen', () => {
    expect(Object.isFrozen(getDurationBetween(EPOCH_MS, EPOCH_MS + ONE_HOUR_MS))).toBe(true);
  });
  test('reversed range throws RangeError', () => {
    expect(() => getDurationBetween(EPOCH_MS + 1000, EPOCH_MS)).toThrow(
      new EpochValidationError(EpochError.RangeError),
    );
  });
});

describe('parity: getTimezoneOffset', () => {
  test('Asia/Kolkata offset is +05:30 / 330 minutes (non-DST, stable across libs)', () => {
    const r = getTimezoneOffset(TZ_KOLKATA);
    expect(r.offset).toBe(KOLKATA_OFFSET_STRING);
    expect(r.offsetMinutes).toBe(KOLKATA_OFFSET_MINUTES);
  });
  test('UTC offset is +00:00 / 0 minutes', () => {
    const r = getTimezoneOffset(TZ_UTC);
    expect(r.offset).toBe('+00:00');
    expect(r.offsetMinutes).toBe(0);
  });
  test('returned object is frozen', () => {
    expect(Object.isFrozen(getTimezoneOffset(TZ_KOLKATA))).toBe(true);
  });
  test('unknown timezone throws TimezoneError', () => {
    expect(() => getTimezoneOffset('Fake/Zone')).toThrow(
      new EpochValidationError(EpochError.TimezoneError),
    );
  });
});

describe('parity: getTimezoneList', () => {
  // Note: exact COUNT is a documented breaking change (B4: ~597 → ~419).
  // Parity here is structural — UTC and well-known zones are present.
  test('returns a non-empty array', () => {
    const list = getTimezoneList();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(100);
  });
  test('includes UTC, Asia/Kolkata, America/New_York', () => {
    const list = getTimezoneList();
    expect(list).toContain('UTC');
    expect(list).toContain('Asia/Kolkata');
    expect(list).toContain('America/New_York');
  });
  test('returns a defensive copy — mutation does not leak across calls', () => {
    const a = getTimezoneList();
    const n = a.length;
    a.length = 0;
    expect(getTimezoneList().length).toBe(n);
  });
});

describe('parity: getEpochNow', () => {
  test('returns frozen object with correct keys and types', () => {
    const now = getEpochNow();
    expect(Object.isFrozen(now)).toBe(true);
    expect(Object.keys(now).sort()).toEqual(['iso', 'milliseconds', 'seconds', 'timezone'].sort());
    expect(typeof now.milliseconds).toBe('number');
    expect(typeof now.seconds).toBe('number');
    expect(typeof now.iso).toBe('string');
    expect(typeof now.timezone).toBe('string');
  });
  test('seconds and milliseconds are mathematically consistent', () => {
    const now = getEpochNow();
    expect(now.seconds).toBe(Math.floor(now.milliseconds / 1000));
  });
  test('iso is a valid ISO 8601 UTC string', () => {
    const now = getEpochNow();
    expect(now.iso.endsWith('Z')).toBe(true);
    expect(new Date(now.iso).toISOString()).toBe(now.iso);
  });
  test('throws ClockOutOfRange when Date.now() is NaN', () => {
    const orig = Date.now;
    Date.now = () => NaN;
    try {
      expect(() => getEpochNow()).toThrow(
        new EpochValidationError(EpochError.ClockOutOfRange),
      );
    } finally {
      Date.now = orig;
    }
  });
});

describe('parity: formatDuration', () => {
  test('exactly 1 second', () => {
    expect(formatDuration(1000)).toBe('1 second');
  });
  test('exactly 1 minute', () => {
    expect(formatDuration(60_000)).toBe('1 minute');
  });
  test('exactly 1 hour', () => {
    expect(formatDuration(3_600_000)).toBe('1 hour');
  });
  test('exactly 1 day', () => {
    expect(formatDuration(86_400_000)).toBe('1 day');
  });
  test('sub-second returns "0 seconds"', () => {
    expect(formatDuration(500)).toBe('0 seconds');
  });
  test('uses absolute value for negative input', () => {
    expect(formatDuration(-1000)).toBe('1 second');
  });
});

describe('parity: safe predicates', () => {
  test('isValidEpoch true cases', () => {
    expect(isValidEpoch(EPOCH_MS)).toBe(true);
    expect(isValidEpoch(EPOCH_S)).toBe(true);
    expect(isValidEpoch('1622547800000')).toBe(true);
  });
  test('isValidEpoch false cases', () => {
    expect(isValidEpoch(null)).toBe(false);
    expect(isValidEpoch(undefined)).toBe(false);
    expect(isValidEpoch(Infinity)).toBe(false);
    expect(isValidEpoch(-Infinity)).toBe(false);
    expect(isValidEpoch(NaN)).toBe(false);
    expect(isValidEpoch('not-a-number')).toBe(false);
  });
  test('isValidTimezone', () => {
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidTimezone('Fake/Zone')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
  });
});

describe('parity: error contracts', () => {
  test('convertEpoch on null throws UndefinedOrNull', () => {
    expect(() => convertEpoch(null as unknown as number)).toThrow(
      new EpochValidationError(EpochError.UndefinedOrNull),
    );
  });
  test('convertEpoch on Infinity throws NotANumber', () => {
    expect(() => convertEpoch(Infinity)).toThrow(
      new EpochValidationError(EpochError.NotANumber),
    );
  });
  test('convertEpoch on NaN throws NotANumber', () => {
    expect(() => convertEpoch(NaN)).toThrow(
      new EpochValidationError(EpochError.NotANumber),
    );
  });
  test('convertEpoch on epoch beyond all thresholds throws EpochUnit', () => {
    expect(() => convertEpoch(Number.MAX_VALUE)).toThrow(EpochValidationError);
  });
});

describe('parity: safe API Result<T> contract', () => {
  test('safeConvertEpoch ok branch — { ok: true, value }', () => {
    const r = safeConvertEpoch(EPOCH_MS);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.epochUnit).toBe(EpochUnit.MILLI_SECONDS);
      expect(r.value.epoch).toBe(EPOCH_MS);
    }
  });
  test('safeConvertEpoch error branch — { ok: false, error }', () => {
    const r = safeConvertEpoch(null as unknown as number);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBeInstanceOf(EpochValidationError);
      expect(r.error.message).toBe(EpochError.UndefinedOrNull);
    }
  });
  test('safeConvertDateToEpoch ok branch', () => {
    const r = safeConvertDateToEpoch(new Date(EPOCH_MS), TZ_UTC);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.epochInMilliseconds).toBe(EPOCH_MS);
  });
  test('safeConvertEpochToTimezone error branch on bad timezone', () => {
    const r = safeConvertEpochToTimezone(EPOCH_MS, 'Fake/Zone');
    expect(r.ok).toBe(false);
  });
  test('safeParseToEpoch ok branch on ISO input', () => {
    const r = safeParseToEpoch(ISO_AT_EPOCH_MS, undefined, TZ_UTC);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.epochInMilliseconds).toBe(EPOCH_MS);
  });
  test('safeParseToEpoch error branch on XSS payload (no throw)', () => {
    const r = safeParseToEpoch('<script>alert(1)</script>', undefined, TZ_UTC);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe(EpochError.ParseError);
  });
  test('safeGetDurationBetween error branch on reversed range', () => {
    const r = safeGetDurationBetween(EPOCH_MS + 1000, EPOCH_MS);
    expect(r.ok).toBe(false);
  });
  test('safeGetTimezoneOffset ok branch — value is frozen', () => {
    const r = safeGetTimezoneOffset(TZ_KOLKATA);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.offsetMinutes).toBe(KOLKATA_OFFSET_MINUTES);
      expect(Object.isFrozen(r.value)).toBe(true);
    }
  });
  test('safeGetEpochNow returns frozen value on success', () => {
    const r = safeGetEpochNow();
    expect(r.ok).toBe(true);
    if (r.ok) expect(Object.isFrozen(r.value)).toBe(true);
  });
  test('safeGetEpochUnit ok branch', () => {
    const r = safeGetEpochUnit(EPOCH_S);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe(EpochUnit.SECONDS);
  });
  test('safeGetEpochUnit error branch on bad input', () => {
    const r = safeGetEpochUnit('not a number');
    expect(r.ok).toBe(false);
  });
});
