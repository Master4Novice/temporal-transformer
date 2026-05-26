// v2.0 behavioral pins — these tests assert the new v2.0 output for the
// behaviors that intentionally diverged from v1.x. Cross-referenced to
// MIGRATION.md items B1-B6.
//
// History: in v1.4.0 these tests asserted the v1.x output to document what
// would change. As of v2.0.0 they assert the new behavior — the git diff
// between v1.4.0 and v2.0.0 IS the canonical record of the change.

import {
  convertEpoch,
  convertEpochToTimezone,
  getTimezoneList,
  parseToEpoch,
} from '../../src/epoch/convertor.js';
import {
  EpochError,
  EpochValidationError,
} from '../../src/errors/EpochValidationError.js';
import {
  EPOCH_MS,
  TZ_UTC,
  TZ_KOLKATA,
} from './fixtures.js';

beforeAll(() => {
  if (process.env.TZ !== 'UTC') {
    throw new Error(
      'Golden tests must run with TZ=UTC. Use: npm run test:golden',
    );
  }
});

describe('B1: default format yyyy-MM-dd HH:mm:ss.SSS (3-digit fractional)', () => {
  // v1.x default was 'YYYY-MM-DD HH:mm:ss.SSSSSS' — the 6-digit fractional
  // was always zero-padded fiction because JS Date only has ms precision.
  // v2.0 honours the actual precision boundary.

  test('v2.0 dateTimeInGMT for the anchor epoch has 3 fractional digits', () => {
    const r = convertEpoch(EPOCH_MS);
    expect(r.dateTimeInGMT).toBe('2021-06-01 11:43:20.000');
  });

  test('v2.0 dateTime for the anchor epoch (TZ=UTC) has 3 fractional digits', () => {
    const r = convertEpoch(EPOCH_MS);
    expect(r.dateTime).toBe('2021-06-01 11:43:20.000');
  });

  test('v2.0 convertEpochToTimezone default format has 3 fractional digits', () => {
    expect(convertEpochToTimezone(EPOCH_MS, TZ_UTC)).toBe('2021-06-01 11:43:20.000');
  });
});

describe('B2: format token grammar — Luxon tokens only', () => {
  // v1.x used moment tokens (YYYY-MM-DD). v2.0 throws FormatInvalid on those
  // and requires Luxon equivalents (yyyy-MM-dd).

  test('v2.0 rejects moment-style YYYY-MM-DD with FormatInvalid', () => {
    expect(() => convertEpochToTimezone(EPOCH_MS, TZ_UTC, 'YYYY-MM-DD')).toThrow(
      new EpochValidationError(EpochError.FormatInvalid),
    );
  });

  test('v2.0 accepts the Luxon equivalent yyyy-MM-dd', () => {
    expect(convertEpochToTimezone(EPOCH_MS, TZ_UTC, 'yyyy-MM-dd')).toBe('2021-06-01');
  });

  test('v2.0 accepts the Luxon equivalent yyyy-MM-dd HH:mm:ss', () => {
    expect(convertEpochToTimezone(EPOCH_MS, TZ_KOLKATA, 'yyyy-MM-dd HH:mm:ss'))
      .toBe('2021-06-01 17:13:20');
  });

  test('v2.0 cccc (full weekday) — Tuesday for 2021-06-01', () => {
    expect(convertEpochToTimezone(EPOCH_MS, TZ_UTC, 'cccc')).toBe('Tuesday');
  });

  test('v2.0 rejects moment dddd weekday token', () => {
    expect(() => convertEpochToTimezone(EPOCH_MS, TZ_UTC, 'dddd')).toThrow(
      new EpochValidationError(EpochError.FormatInvalid),
    );
  });
});

describe("B3: literal escape uses 'quotes' in Luxon (was [brackets] in moment)", () => {
  test("v2.0 accepts 'Date:' as a literal", () => {
    expect(convertEpochToTimezone(EPOCH_MS, TZ_UTC, "'Date:' yyyy-MM-dd"))
      .toBe('Date: 2021-06-01');
  });
});

describe('B4: getTimezoneList from Intl + curated modern canonical names', () => {
  test('list size differs from v1.x but includes well-known modern zones', () => {
    const list = getTimezoneList();
    // v2.0 uses Intl.supportedValuesOf (typically ~419) augmented with the
    // MODERN_CANONICAL_ZONES set so callers asking for modern names succeed.
    expect(list.length).toBeGreaterThanOrEqual(300);
    expect(list).toContain('UTC');
    expect(list).toContain('Asia/Kolkata'); // modern canonical, even on older ICU
    expect(list).toContain('America/New_York');
  });
});

describe('B6: moment-specific tokens removed in v2.0', () => {
  test('X (unix seconds) is rejected with FormatInvalid', () => {
    expect(() => convertEpochToTimezone(EPOCH_MS, TZ_UTC, 'X')).toThrow(
      new EpochValidationError(EpochError.FormatInvalid),
    );
  });
  test('x (unix milliseconds) is rejected with FormatInvalid', () => {
    expect(() => convertEpochToTimezone(EPOCH_MS, TZ_UTC, 'x')).toThrow(
      new EpochValidationError(EpochError.FormatInvalid),
    );
  });
  test('Use the dedicated functions for unix epoch instead', () => {
    // Callers should use the existing API rather than format-string output.
    const r = parseToEpoch('2021-06-01T11:43:20Z', undefined, TZ_UTC);
    expect(r.epochInSeconds).toBe(1622547800);
    expect(r.epochInMilliseconds).toBe(1622547800000);
  });
});

// B5 (DST ambiguous-time behavior) is not pinned here — the diff is conceptual
// (Luxon throws on ambiguity, moment guessed), and a single golden assertion
// would not capture the contract well. Library users encountering ambiguous
// local times should wrap parseToEpoch with safeParseToEpoch.
