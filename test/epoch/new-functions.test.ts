import {
  convertEpochToTimezone,
  parseToEpoch,
  getDurationBetween,
  getTimezoneOffset,
  getTimezoneList,
  getEpochNow,
  formatDuration,
} from '../../src/epoch/convertor.js';
import { isValidEpoch, isValidTimezone } from '../../src/utils/validations.js';
import { EpochError, EpochValidationError } from '../../src/errors/EpochValidationError.js';

const EPOCH_MS = 1622547800000; // 2021-06-01 17:43:20 UTC

describe('convertEpochToTimezone', () => {
  it('formats epoch in the given timezone', () => {
    const result = convertEpochToTimezone(EPOCH_MS, 'Asia/Kolkata', 'yyyy-MM-dd HH:mm:ss');
    expect(result).toMatch(/\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/);
  });

  it('accepts seconds-precision epoch', () => {
    const result = convertEpochToTimezone(EPOCH_MS / 1000, 'Etc/GMT', 'yyyy-MM-dd HH:mm:ss');
    expect(result).toMatch(/2021-06-01/);
  });

  it('throws on unknown timezone', () => {
    expect(() => convertEpochToTimezone(EPOCH_MS, 'Mars/OlympusMons')).toThrow(
      new EpochValidationError(EpochError.TimezoneError),
    );
  });
});

describe('parseToEpoch', () => {
  it('parses an ISO 8601 string to epoch', () => {
    const { epochInMilliseconds, epochInSeconds } = parseToEpoch(
      '2021-06-01T11:43:20Z',
      undefined,
      'UTC',
    );
    expect(epochInMilliseconds).toBe(EPOCH_MS);
    expect(epochInSeconds).toBe(Math.floor(EPOCH_MS / 1000));
  });

  it('parses with explicit format and timezone', () => {
    const { epochInMilliseconds } = parseToEpoch('01/06/2021', 'dd/MM/yyyy', 'UTC');
    expect(epochInMilliseconds).toBeGreaterThan(0);
  });

  it('throws ParseError for an empty string', () => {
    expect(() => parseToEpoch('')).toThrow(new EpochValidationError(EpochError.ParseError));
    expect(() => parseToEpoch('   ')).toThrow(new EpochValidationError(EpochError.ParseError));
  });

  it('throws ParseError for an unparseable string', () => {
    expect(() => parseToEpoch('not-a-date', 'yyyy-MM-dd', 'UTC')).toThrow(
      new EpochValidationError(EpochError.ParseError),
    );
  });

  it('throws TimezoneError for unknown timezone', () => {
    expect(() => parseToEpoch('2021-06-01', undefined, 'Fake/Zone')).toThrow(
      new EpochValidationError(EpochError.TimezoneError),
    );
  });

  it('returns correct dateTimeInGMT and dateTime fields', () => {
    const { dateTimeInGMT, timezone } = parseToEpoch('2021-06-01T12:00:00', undefined, 'UTC');
    expect(dateTimeInGMT).toBe('2021-06-01 12:00:00');
    expect(timezone).toBe('UTC');
  });
});

describe('getDurationBetween', () => {
  const ONE_HOUR_MS = 3600 * 1000;
  const ONE_DAY_MS = 24 * ONE_HOUR_MS;

  it('returns correct duration for 2 hours', () => {
    const from = EPOCH_MS;
    const to = EPOCH_MS + 2 * ONE_HOUR_MS;
    const d = getDurationBetween(from, to);
    expect(d.hours).toBe(2);
    expect(d.minutes).toBe(0);
    expect(d.totalMilliseconds).toBe(2 * ONE_HOUR_MS);
  });

  it('returns correct duration for 1 day 3 hours', () => {
    const to = EPOCH_MS + ONE_DAY_MS + 3 * ONE_HOUR_MS;
    const d = getDurationBetween(EPOCH_MS, to);
    expect(d.days).toBe(1);
    expect(d.hours).toBe(3);
  });

  it('sets humanReadable when there is a non-zero duration', () => {
    const d = getDurationBetween(EPOCH_MS, EPOCH_MS + ONE_HOUR_MS);
    expect(d.humanReadable).toContain('hour');
  });

  it('returns 0 seconds humanReadable for zero duration', () => {
    const d = getDurationBetween(EPOCH_MS, EPOCH_MS);
    expect(d.humanReadable).toBe('0 seconds');
    expect(d.totalMilliseconds).toBe(0);
  });

  it('throws RangeError when fromEpoch > toEpoch', () => {
    expect(() => getDurationBetween(EPOCH_MS + 1000, EPOCH_MS)).toThrow(
      new EpochValidationError(EpochError.RangeError),
    );
  });
});

describe('getTimezoneOffset', () => {
  it('returns offset string and offset minutes for Asia/Kolkata', () => {
    const result = getTimezoneOffset('Asia/Kolkata');
    expect(result.offset).toBe('+05:30');
    expect(result.offsetMinutes).toBe(330);
  });

  it('returns +00:00 for UTC', () => {
    const result = getTimezoneOffset('UTC');
    expect(result.offset).toBe('+00:00');
    expect(result.offsetMinutes).toBe(0);
  });

  it('accepts an optional epoch argument', () => {
    const result = getTimezoneOffset('Asia/Kolkata', EPOCH_MS);
    expect(result.offsetMinutes).toBe(330);
  });

  it('throws on unknown timezone', () => {
    expect(() => getTimezoneOffset('Fake/Zone')).toThrow(
      new EpochValidationError(EpochError.TimezoneError),
    );
  });
});

describe('getTimezoneList', () => {
  it('returns a non-empty array of strings', () => {
    const list = getTimezoneList();
    expect(Array.isArray(list)).toBe(true);
    expect(list.length).toBeGreaterThan(0);
  });

  it('includes well-known timezones', () => {
    const list = getTimezoneList();
    expect(list).toContain('UTC');
    expect(list).toContain('America/New_York');
    expect(list).toContain('Asia/Kolkata');
  });
});

describe('getEpochNow', () => {
  it('returns current epoch values', () => {
    const before = Date.now();
    const now = getEpochNow();
    const after = Date.now();

    expect(now.milliseconds).toBeGreaterThanOrEqual(before);
    expect(now.milliseconds).toBeLessThanOrEqual(after);
    expect(now.seconds).toBe(Math.floor(now.milliseconds / 1000));
  });

  it('returns a valid ISO string', () => {
    const { iso } = getEpochNow();
    expect(() => new Date(iso)).not.toThrow();
    expect(new Date(iso).toISOString()).toBe(iso);
  });

  it('returns a valid timezone string', () => {
    const { timezone } = getEpochNow();
    expect(typeof timezone).toBe('string');
    expect(timezone.length).toBeGreaterThan(0);
  });
});

describe('formatDuration', () => {
  it('formats milliseconds less than a second as 0 seconds', () => {
    expect(formatDuration(500)).toBe('0 seconds');
  });

  it('formats exactly 1 second', () => {
    expect(formatDuration(1000)).toBe('1 second');
  });

  it('formats 2 hours 30 minutes', () => {
    const ms = (2 * 3600 + 30 * 60) * 1000;
    expect(formatDuration(ms)).toContain('2 hours');
    expect(formatDuration(ms)).toContain('30 minutes');
  });

  it('handles negative ms by using absolute value', () => {
    expect(formatDuration(-1000)).toBe('1 second');
  });
});

describe('isValidEpoch', () => {
  it('returns true for valid ms epoch', () => {
    expect(isValidEpoch(EPOCH_MS)).toBe(true);
  });

  it('returns true for valid seconds epoch', () => {
    expect(isValidEpoch(1622547800)).toBe(true);
  });

  it('returns false for null', () => {
    expect(isValidEpoch(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isValidEpoch(undefined)).toBe(false);
  });

  it('returns false for a non-numeric string', () => {
    expect(isValidEpoch('not-a-number')).toBe(false);
  });

  it('returns false for Infinity', () => {
    expect(isValidEpoch(Infinity)).toBe(false);
  });

  it('returns false for NaN', () => {
    expect(isValidEpoch(NaN)).toBe(false);
  });
});

describe('isValidTimezone', () => {
  it('returns true for valid timezones', () => {
    expect(isValidTimezone('UTC')).toBe(true);
    expect(isValidTimezone('Asia/Kolkata')).toBe(true);
    expect(isValidTimezone('America/New_York')).toBe(true);
  });

  it('returns false for unknown timezones', () => {
    expect(isValidTimezone('Mars/OlympusMons')).toBe(false);
    expect(isValidTimezone('')).toBe(false);
  });
});
