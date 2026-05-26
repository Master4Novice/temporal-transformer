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
import {
  EpochError,
  EpochValidationError,
} from '../../src/errors/EpochValidationError.js';

const EPOCH_MS = 1622547800000;

describe('safeConvertEpoch', () => {
  test('returns ok:true with value on success', () => {
    const r = safeConvertEpoch(EPOCH_MS);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.epochUnit).toBe('milliseconds');
      expect(r.value.epoch).toBe(EPOCH_MS);
    }
  });

  test('returns ok:false with EpochValidationError on null', () => {
    const r = safeConvertEpoch(null as unknown as number);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error).toBeInstanceOf(EpochValidationError);
      expect(r.error.message).toBe(EpochError.UndefinedOrNull);
    }
  });

  test('returns ok:false on Infinity', () => {
    const r = safeConvertEpoch(Infinity);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      expect(r.error.message).toBe(EpochError.NotANumber);
    }
  });
});

describe('safeConvertDateToEpoch', () => {
  test('returns ok:true on valid date', () => {
    const r = safeConvertDateToEpoch(new Date(EPOCH_MS), 'UTC');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.epochInMilliseconds).toBe(EPOCH_MS);
  });

  test('returns ok:false on invalid date', () => {
    const r = safeConvertDateToEpoch(new Date('invalid'));
    expect(r.ok).toBe(false);
  });

  test('returns ok:false on unknown timezone', () => {
    const r = safeConvertDateToEpoch(new Date(EPOCH_MS), 'Fake/Zone');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe(EpochError.TimezoneError);
  });
});

describe('safeConvertEpochToTimezone', () => {
  test('returns formatted string on success', () => {
    const r = safeConvertEpochToTimezone(EPOCH_MS, 'UTC', 'yyyy-MM-dd');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('2021-06-01');
  });

  test('returns ok:false on bad timezone', () => {
    const r = safeConvertEpochToTimezone(EPOCH_MS, 'Bad/Zone');
    expect(r.ok).toBe(false);
  });
});

describe('safeParseToEpoch', () => {
  test('returns ok:true on valid ISO string', () => {
    const r = safeParseToEpoch('2021-06-01T11:43:20Z', undefined, 'UTC');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.epochInMilliseconds).toBe(EPOCH_MS);
  });

  test('returns ok:false on XSS payload', () => {
    const r = safeParseToEpoch('<script>alert(1)</script>', undefined, 'UTC');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe(EpochError.ParseError);
  });

  test('returns ok:false on empty input', () => {
    const r = safeParseToEpoch('');
    expect(r.ok).toBe(false);
  });

  test('returns ok:false on input exceeding MAX_INPUT_STRING_LENGTH', () => {
    const r = safeParseToEpoch('2'.repeat(500), undefined, 'UTC');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe(EpochError.InputTooLong);
  });
});

describe('safeGetDurationBetween', () => {
  test('returns duration on valid range', () => {
    const r = safeGetDurationBetween(EPOCH_MS, EPOCH_MS + 3600000);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.hours).toBe(1);
  });

  test('returns ok:false on reversed range', () => {
    const r = safeGetDurationBetween(EPOCH_MS + 1000, EPOCH_MS);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.message).toBe(EpochError.RangeError);
  });
});

describe('safeGetTimezoneOffset', () => {
  test('returns offset on valid timezone', () => {
    const r = safeGetTimezoneOffset('Asia/Kolkata');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.value.offset).toBe('+05:30');
      expect(r.value.offsetMinutes).toBe(330);
    }
  });

  test('returns ok:false on unknown timezone', () => {
    const r = safeGetTimezoneOffset('Fake/Zone');
    expect(r.ok).toBe(false);
  });
});

describe('safeGetEpochNow', () => {
  test('returns ok:true under normal conditions', () => {
    const r = safeGetEpochNow();
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value.milliseconds).toBeGreaterThan(0);
  });

  test('returns ok:false on corrupted system clock', () => {
    const realDateNow = Date.now;
    Date.now = () => NaN;
    try {
      const r = safeGetEpochNow();
      expect(r.ok).toBe(false);
      if (!r.ok) expect(r.error.message).toBe(EpochError.ClockOutOfRange);
    } finally {
      Date.now = realDateNow;
    }
  });
});

describe('safeGetEpochUnit', () => {
  test('returns ok:true with correct unit', () => {
    const r = safeGetEpochUnit(EPOCH_MS);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value).toBe('milliseconds');
  });

  test('returns ok:false on bad input', () => {
    const r = safeGetEpochUnit('not a number');
    expect(r.ok).toBe(false);
  });
});
