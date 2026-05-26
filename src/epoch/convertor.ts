import { DateTime } from 'luxon';
import {
  getRelativeTimeDifference,
  validateMomentDate,
  formatDuration,
  parseDuration,
} from '../utils/utility.js';
import {
  getEpochUnitAndEpochInMiliseconds,
  validTimezone,
} from '../utils/validations.js';
import {
  EpochToDate,
  DateToEpoch,
  ParsedDuration,
  EpochNow,
  TimezoneOffset,
  EpochUnit,
  MAX_EPOCH_MS,
  MIN_EPOCH_MS,
  MAX_FORMAT_STRING_LENGTH,
  MAX_INPUT_STRING_LENGTH,
  DEFAULT_FORMAT,
  SUPPORTED_FORMAT_TOKENS,
} from '../types/index.js';
import { EpochError, EpochValidationError } from '../errors/EpochValidationError.js';

function assertFormatValid(format: string): void {
  if (format.length > MAX_FORMAT_STRING_LENGTH) {
    throw new EpochValidationError(EpochError.FormatTooLong);
  }
  // Strip Luxon-style 'literal' escapes, then check every alphabetic token
  // against the allowlist. Consecutive runs of the same letter form one token.
  const stripped = format.replace(/'[^']*'/g, '');
  const tokens = stripped.match(/([a-zA-Z])\1*/g) || [];
  for (const token of tokens) {
    if (!SUPPORTED_FORMAT_TOKENS.has(token)) {
      throw new EpochValidationError(EpochError.FormatInvalid);
    }
  }
}

function freeze<T extends object>(o: T): Readonly<T> {
  return Object.freeze(o);
}

function localZone(): string {
  return DateTime.local().zoneName ?? 'UTC';
}

/**
 * Convert an epoch timestamp (any unit) to a human-readable date in the
 * caller's local timezone and GMT, with relative-time context.
 *
 * **Unique feature:** the unit (seconds / milliseconds / microseconds /
 * nanoseconds) is auto-detected from the magnitude — you do not need to
 * tell the library which unit your value is in.
 *
 * @param epoch  - Epoch value in any unit (seconds, ms, µs, or ns).
 * @param format - Optional Luxon format string. Defaults to {@link DEFAULT_FORMAT}.
 *                 Must contain only tokens from {@link SUPPORTED_FORMAT_TOKENS};
 *                 unknown tokens throw {@link EpochError.FormatInvalid}.
 *
 * @returns Frozen {@link EpochToDate} object with both local and GMT renderings.
 *
 * @throws {EpochValidationError} If the input is null, undefined, NaN, Infinity,
 *   a non-numeric string, or outside the recognized epoch magnitude range.
 *
 * @example
 * ```ts
 * convertEpoch(1622547800);    // auto-detects: seconds
 * convertEpoch(1622547800000); // auto-detects: milliseconds
 * convertEpoch(1622547800000, 'yyyy-MM-dd HH:mm:ss');
 * ```
 */
export function convertEpoch(
  epoch: number,
  format: string = DEFAULT_FORMAT,
): EpochToDate {
  assertFormatValid(format);
  const { epochInMilliseconds, epochUnit } =
    getEpochUnitAndEpochInMiliseconds(epoch);
  const timezone = localZone();
  const dateTime = DateTime.fromMillis(epochInMilliseconds, { zone: timezone }).toFormat(format);
  const dateTimeInGMT = DateTime.fromMillis(epochInMilliseconds, { zone: 'UTC' }).toFormat(format);
  const relative = getRelativeTimeDifference(epochInMilliseconds);

  return freeze({ timezone, dateTime, dateTimeInGMT, epochUnit, epoch, relative });
}

/**
 * Convert a JavaScript `Date` object to epoch values in the given timezone.
 *
 * @param date     - Any valid `Date` instance.
 * @param timezone - Optional IANA timezone (e.g. `"America/New_York"`).
 *                   Defaults to the runtime's local timezone.
 * @returns Frozen {@link DateToEpoch} with both epoch and human-readable forms.
 * @throws {EpochValidationError} For invalid dates or unknown timezones.
 *
 * @example
 * ```ts
 * convertDateToEpoch(new Date(), 'Asia/Kolkata');
 * ```
 */
export function convertDateToEpoch(
  date: Date,
  timezone: string = localZone(),
): DateToEpoch {
  validateMomentDate(date);
  validTimezone(timezone);
  const dt = DateTime.fromJSDate(date);
  const epochInMilliseconds = dt.toMillis();
  const epochInSeconds = Math.floor(epochInMilliseconds / 1000);

  const dateTimeInGMT = dt.setZone('UTC').toFormat('yyyy-MM-dd HH:mm:ss');
  const dateTime = dt.setZone(timezone).toFormat('yyyy-MM-dd HH:mm:ss');

  return freeze({
    epochInSeconds,
    epochInMilliseconds,
    dateTimeInGMT,
    dateTime,
    timezone,
  });
}

/**
 * Format an epoch value in a specific IANA timezone. Auto-detects epoch unit.
 *
 * @param epoch    - Epoch in any unit (s / ms / µs / ns).
 * @param timezone - IANA timezone, e.g. `"Asia/Tokyo"`.
 * @param format   - Optional Luxon format string. Defaults to {@link DEFAULT_FORMAT}.
 * @returns The formatted date as a string.
 * @throws {EpochValidationError} For invalid epoch, timezone, or format token.
 *
 * @example
 * ```ts
 * convertEpochToTimezone(1622547800000, 'America/Los_Angeles', 'yyyy-MM-dd HH:mm:ss');
 * // "2021-06-01 04:43:20"
 * ```
 */
export function convertEpochToTimezone(
  epoch: number,
  timezone: string,
  format: string = DEFAULT_FORMAT,
): string {
  assertFormatValid(format);
  validTimezone(timezone);
  const { epochInMilliseconds } = getEpochUnitAndEpochInMiliseconds(epoch);
  return DateTime.fromMillis(epochInMilliseconds, { zone: timezone }).toFormat(format);
}

/**
 * Auto-detect the unit of an epoch value (seconds / milliseconds /
 * microseconds / nanoseconds) without performing the full conversion.
 * Useful for routing logic: classify the input once, then process with
 * a hot-path implementation.
 *
 * @param epoch - Numeric or numeric-string epoch value.
 * @returns The detected {@link EpochUnit}.
 * @throws {EpochValidationError} On invalid or out-of-range input.
 *
 * @example
 * ```ts
 * getEpochUnit(1622547800);          // EpochUnit.SECONDS
 * getEpochUnit(1622547800000);       // EpochUnit.MILLI_SECONDS
 * getEpochUnit(1622547800000000);    // EpochUnit.MICRO_SECONDS
 * getEpochUnit(1622547800000000000); // EpochUnit.NANO_SECONDS
 * ```
 */
export function getEpochUnit(epoch: number | string): EpochUnit {
  return getEpochUnitAndEpochInMiliseconds(epoch).epochUnit;
}

// Allowlist for parseToEpoch input characters: digits, letters (month names),
// whitespace, and date/time punctuation. Rejects HTML, shell metacharacters,
// and any payload that cannot appear in a real date string.
const DATE_INPUT_RE = /^[0-9a-zA-Z\s\-\/:.TZ+,()]+$/;

/**
 * Parse a date string into epoch values, with strict timezone-aware parsing.
 *
 * Security: the input is character-allowlisted before being passed to Luxon
 * (rejects HTML / XSS / shell metacharacters), capped at
 * {@link MAX_INPUT_STRING_LENGTH} characters, and parsed in strict mode
 * (no silent `Date()` fallback).
 *
 * @param input    - Date string to parse.
 * @param format   - Optional Luxon format. If omitted, strict ISO 8601 is used.
 * @param timezone - IANA timezone used to interpret the input. Defaults to local.
 * @returns Frozen {@link DateToEpoch} with both epoch and human-readable forms.
 * @throws {EpochValidationError} {@link EpochError.ParseError} for unparseable
 *   input, {@link EpochError.InputTooLong} for inputs exceeding the length cap,
 *   {@link EpochError.TimezoneError} for an unknown timezone, or
 *   {@link EpochError.FormatInvalid} for an unsupported format token.
 *
 * @example
 * ```ts
 * parseToEpoch('2024-12-25T00:00:00Z');                     // ISO 8601 auto
 * parseToEpoch('25/12/2024', 'dd/MM/yyyy', 'Europe/London'); // strict format
 * ```
 */
export function parseToEpoch(
  input: string,
  format?: string,
  timezone: string = localZone(),
): DateToEpoch {
  if (input == null || typeof input !== 'string') {
    throw new EpochValidationError(EpochError.ParseError);
  }
  if (input.length > MAX_INPUT_STRING_LENGTH) {
    throw new EpochValidationError(EpochError.InputTooLong);
  }
  const trimmed = input.trim();
  if (trimmed.length === 0) {
    throw new EpochValidationError(EpochError.ParseError);
  }
  if (!DATE_INPUT_RE.test(trimmed)) {
    throw new EpochValidationError(EpochError.ParseError);
  }
  if (format !== undefined) {
    assertFormatValid(format);
  }
  validTimezone(timezone);

  const dt = format
    ? DateTime.fromFormat(input, format, { zone: timezone })
    : DateTime.fromISO(input, { zone: timezone });

  if (!dt.isValid) {
    throw new EpochValidationError(EpochError.ParseError);
  }

  return freeze({
    epochInSeconds: Math.floor(dt.toMillis() / 1000),
    epochInMilliseconds: dt.toMillis(),
    dateTimeInGMT: dt.setZone('UTC').toFormat('yyyy-MM-dd HH:mm:ss'),
    dateTime: dt.toFormat('yyyy-MM-dd HH:mm:ss'),
    timezone,
  });
}

/**
 * Compute the calendar-accurate duration between two epochs.
 *
 * Years, months, days etc. are computed via Luxon's calendar-aware diff —
 * not by dividing milliseconds. Both epochs auto-detect their unit.
 *
 * @throws {EpochValidationError} {@link EpochError.RangeError} when
 *   `fromEpoch > toEpoch`.
 *
 * @example
 * ```ts
 * const d = getDurationBetween(1609459200000, 1622547800000);
 * d.humanReadable; // "5 months, 11 hours, 43 minutes, 20 seconds"
 * ```
 */
export function getDurationBetween(
  fromEpoch: number,
  toEpoch: number,
): ParsedDuration {
  const { epochInMilliseconds: fromMs } = getEpochUnitAndEpochInMiliseconds(fromEpoch);
  const { epochInMilliseconds: toMs } = getEpochUnitAndEpochInMiliseconds(toEpoch);
  if (fromMs > toMs) {
    throw new EpochValidationError(EpochError.RangeError);
  }
  return freeze(parseDuration(fromMs, toMs));
}

/**
 * Get the UTC offset for an IANA timezone, DST-aware.
 *
 * @param timezone - IANA timezone name.
 * @param epoch    - Optional epoch (any unit) for a specific point in time.
 *                   When omitted, uses the current moment.
 * @returns Frozen {@link TimezoneOffset} with both string and minute forms.
 * @throws {EpochValidationError} For unknown timezones.
 *
 * @example
 * ```ts
 * getTimezoneOffset('Asia/Kolkata');               // { offset: '+05:30', offsetMinutes: 330 }
 * getTimezoneOffset('America/New_York');           // varies by DST
 * getTimezoneOffset('America/New_York', someEpoch); // DST as of that instant
 * ```
 */
export function getTimezoneOffset(
  timezone: string,
  epoch?: number,
): TimezoneOffset {
  validTimezone(timezone);
  const ms = epoch
    ? getEpochUnitAndEpochInMiliseconds(epoch).epochInMilliseconds
    : Date.now();
  const dt = DateTime.fromMillis(ms, { zone: timezone });
  return freeze({ offset: dt.toFormat('ZZ'), offsetMinutes: dt.offset });
}

// Modern canonical IANA zone names that older ICU bundles still return as
// their legacy alias (Asia/Calcutta, Asia/Saigon, Europe/Kiev, …). Augmenting
// the Intl list with these gives callers a stable list across Node versions.
const MODERN_CANONICAL_ZONES: ReadonlyArray<string> = [
  'Asia/Kolkata',
  'Asia/Ho_Chi_Minh',
  'Asia/Yangon',
  'Europe/Kyiv',
  'Africa/Asmara',
  'Atlantic/Faroe',
  'Pacific/Pohnpei',
  'Pacific/Chuuk',
  'America/Indiana/Indianapolis',
  'America/Atikokan',
];

/**
 * Returns a defensive copy of the supported IANA timezone names. The list is
 * sourced from `Intl.supportedValuesOf('timeZone')` augmented with modern
 * canonical names that older ICU bundles still return as legacy aliases.
 *
 * @returns A fresh array — safe to mutate without affecting subsequent calls.
 */
export function getTimezoneList(): string[] {
  const intlList = typeof (Intl as any).supportedValuesOf === 'function'
    ? (Intl as any).supportedValuesOf('timeZone') as string[]
    : [];
  // Defensive copy; UTC and modern canonical names are always present.
  return [...new Set([...intlList, ...MODERN_CANONICAL_ZONES, 'UTC'])];
}

/**
 * Returns the current moment as epoch values plus ISO 8601 string and the
 * detected local timezone.
 *
 * @returns Frozen {@link EpochNow} with seconds, milliseconds, ISO, timezone.
 * @throws {EpochValidationError} {@link EpochError.ClockOutOfRange} if the
 *   system clock returns a value outside `±MAX_EPOCH_MS` — guards against
 *   clock corruption / sandbox edge cases.
 */
export function getEpochNow(): EpochNow {
  const milliseconds = Date.now();
  if (!isFinite(milliseconds) || milliseconds < MIN_EPOCH_MS || milliseconds > MAX_EPOCH_MS) {
    throw new EpochValidationError(EpochError.ClockOutOfRange);
  }
  return freeze({
    seconds: Math.floor(milliseconds / 1000),
    milliseconds,
    iso: new Date(milliseconds).toISOString(),
    timezone: localZone(),
  });
}

export { formatDuration };
