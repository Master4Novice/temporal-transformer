import {
  convertEpoch,
  convertEpochToTimezone,
  parseToEpoch,
} from '../../src/epoch/convertor.js';
import {
  EpochError,
  EpochValidationError,
} from '../../src/errors/EpochValidationError.js';
import { SUPPORTED_FORMAT_TOKENS } from '../../src/types/index.js';

const EPOCH_MS = 1622547800000;

describe('SUPPORTED_FORMAT_TOKENS allowlist', () => {
  test('is a non-empty Set of strings', () => {
    expect(SUPPORTED_FORMAT_TOKENS.size).toBeGreaterThan(20);
    for (const t of SUPPORTED_FORMAT_TOKENS) expect(typeof t).toBe('string');
  });

  test('contains the canonical Luxon date/time tokens', () => {
    for (const t of ['yyyy', 'MM', 'dd', 'HH', 'mm', 'ss', 'SSS', 'ZZ']) {
      expect(SUPPORTED_FORMAT_TOKENS.has(t)).toBe(true);
    }
  });

  test('does NOT contain moment-style tokens', () => {
    for (const t of ['YYYY', 'YY', 'DD', 'dddd', 'X', 'x', 'Q', 'A']) {
      expect(SUPPORTED_FORMAT_TOKENS.has(t)).toBe(false);
    }
  });
});

describe('assertFormatValid (via convertEpoch)', () => {
  test('accepts a fully-supported Luxon format', () => {
    expect(() => convertEpoch(EPOCH_MS, 'yyyy-MM-dd HH:mm:ss')).not.toThrow();
  });

  test('accepts a format with literal escape', () => {
    expect(() => convertEpoch(EPOCH_MS, "'Date:' yyyy-MM-dd")).not.toThrow();
  });

  test('rejects moment YYYY with FormatInvalid', () => {
    expect(() => convertEpoch(EPOCH_MS, 'YYYY-MM-DD')).toThrow(
      new EpochValidationError(EpochError.FormatInvalid),
    );
  });

  test('rejects moment dddd with FormatInvalid', () => {
    expect(() => convertEpoch(EPOCH_MS, 'dddd')).toThrow(
      new EpochValidationError(EpochError.FormatInvalid),
    );
  });

  test('rejects a single invalid token mixed with valid ones', () => {
    expect(() => convertEpoch(EPOCH_MS, 'yyyy-MM-dd X')).toThrow(
      new EpochValidationError(EpochError.FormatInvalid),
    );
  });

  test('does not flag tokens inside literal blocks', () => {
    // Even though 'YYYY' is invalid, it's inside the literal block here.
    expect(() => convertEpoch(EPOCH_MS, "'YYYY is not a token' yyyy")).not.toThrow();
  });

  test('still enforces MAX_FORMAT_STRING_LENGTH', () => {
    const longFormat = 'y'.repeat(300);
    expect(() => convertEpoch(EPOCH_MS, longFormat)).toThrow(
      new EpochValidationError(EpochError.FormatTooLong),
    );
  });
});

describe('assertFormatValid (via convertEpochToTimezone)', () => {
  test('rejects moment format token', () => {
    expect(() => convertEpochToTimezone(EPOCH_MS, 'UTC', 'YYYY')).toThrow(
      new EpochValidationError(EpochError.FormatInvalid),
    );
  });
});

describe('assertFormatValid (via parseToEpoch)', () => {
  test('rejects moment-style explicit format', () => {
    expect(() => parseToEpoch('2021-06-01', 'YYYY-MM-DD', 'UTC')).toThrow(
      new EpochValidationError(EpochError.FormatInvalid),
    );
  });

  test('accepts Luxon-style explicit format', () => {
    const r = parseToEpoch('2021-06-01', 'yyyy-MM-dd', 'UTC');
    expect(r.epochInMilliseconds).toBeGreaterThan(0);
  });
});
