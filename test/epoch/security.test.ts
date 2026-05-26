import {
  convertEpoch,
  convertEpochToTimezone,
  parseToEpoch,
  getEpochUnit,
  getEpochNow,
  getTimezoneList,
} from '../../src/epoch/convertor.js';
import {
  EpochError,
  EpochValidationError,
} from '../../src/errors/EpochValidationError.js';
import {
  MAX_INPUT_STRING_LENGTH,
  MAX_FORMAT_STRING_LENGTH,
} from '../../src/types/index.js';

describe('input length guards (DoS protection)', () => {
  test('rejects numeric string exceeding MAX_INPUT_STRING_LENGTH', () => {
    const longNum = '1'.repeat(MAX_INPUT_STRING_LENGTH + 1);
    expect(() => convertEpoch(longNum as unknown as number)).toThrow(
      new EpochValidationError(EpochError.InputTooLong),
    );
  });

  test('accepts numeric string at exactly MAX_INPUT_STRING_LENGTH', () => {
    const okNum = '1622547800000';
    expect(okNum.length).toBeLessThanOrEqual(MAX_INPUT_STRING_LENGTH);
    expect(() => convertEpoch(okNum as unknown as number)).not.toThrow();
  });

  test('parseToEpoch rejects input exceeding MAX_INPUT_STRING_LENGTH', () => {
    const longInput = '2'.repeat(MAX_INPUT_STRING_LENGTH + 1);
    expect(() => parseToEpoch(longInput, undefined, 'UTC')).toThrow(
      new EpochValidationError(EpochError.InputTooLong),
    );
  });

  test('parseToEpoch rejects non-string input', () => {
    expect(() => parseToEpoch(123 as unknown as string)).toThrow(
      new EpochValidationError(EpochError.ParseError),
    );
    expect(() => parseToEpoch(null as unknown as string)).toThrow(
      new EpochValidationError(EpochError.ParseError),
    );
  });
});

describe('format string length guard', () => {
  test('convertEpoch rejects format exceeding MAX_FORMAT_STRING_LENGTH', () => {
    const longFormat = '[X]'.repeat(MAX_FORMAT_STRING_LENGTH);
    expect(() => convertEpoch(1622547800000, longFormat)).toThrow(
      new EpochValidationError(EpochError.FormatTooLong),
    );
  });

  test('convertEpochToTimezone rejects oversized format', () => {
    const longFormat = 'Y'.repeat(MAX_FORMAT_STRING_LENGTH + 1);
    expect(() =>
      convertEpochToTimezone(1622547800000, 'UTC', longFormat),
    ).toThrow(new EpochValidationError(EpochError.FormatTooLong));
  });

  test('parseToEpoch rejects oversized format', () => {
    const longFormat = 'Y'.repeat(MAX_FORMAT_STRING_LENGTH + 1);
    expect(() => parseToEpoch('2024-01-01', longFormat, 'UTC')).toThrow(
      new EpochValidationError(EpochError.FormatTooLong),
    );
  });
});

describe('result immutability (defense against caller tampering)', () => {
  test('convertEpoch result is frozen', () => {
    const r = convertEpoch(1622547800000);
    expect(Object.isFrozen(r)).toBe(true);
    expect(() => {
      'use strict';
      (r as { dateTime: string }).dateTime = 'MUTATED';
    }).toThrow();
  });

  test('parseToEpoch result is frozen', () => {
    const r = parseToEpoch('2021-06-01T11:43:20Z', undefined, 'UTC');
    expect(Object.isFrozen(r)).toBe(true);
  });

  test('getEpochNow result is frozen', () => {
    expect(Object.isFrozen(getEpochNow())).toBe(true);
  });
});

describe('getTimezoneList returns defensive copy', () => {
  test('mutating returned list does not affect subsequent calls', () => {
    const first = getTimezoneList();
    const originalLength = first.length;
    first.length = 0;
    const second = getTimezoneList();
    expect(second.length).toBe(originalLength);
  });
});

describe('getEpochNow handles a corrupted system clock', () => {
  test('throws ClockOutOfRange when Date.now() exceeds JS Date max', () => {
    const realDateNow = Date.now;
    Date.now = () => 8.64e15 + 1;
    try {
      expect(() => getEpochNow()).toThrow(
        new EpochValidationError(EpochError.ClockOutOfRange),
      );
    } finally {
      Date.now = realDateNow;
    }
  });

  test('throws ClockOutOfRange on NaN clock', () => {
    const realDateNow = Date.now;
    Date.now = () => NaN;
    try {
      expect(() => getEpochNow()).toThrow(
        new EpochValidationError(EpochError.ClockOutOfRange),
      );
    } finally {
      Date.now = realDateNow;
    }
  });
});

describe('getEpochUnit standalone helper', () => {
  test('returns correct unit for each magnitude', () => {
    expect(getEpochUnit(1622547800)).toBe('seconds');
    expect(getEpochUnit(1622547800000)).toBe('milliseconds');
    expect(getEpochUnit(1622547800000000)).toBe('microseconds');
    expect(getEpochUnit(1622547800000000000)).toBe('nanoseconds');
  });

  test('throws on invalid input', () => {
    expect(() => getEpochUnit(null as unknown as number)).toThrow(
      EpochValidationError,
    );
    expect(() => getEpochUnit(Infinity)).toThrow(EpochValidationError);
  });
});
