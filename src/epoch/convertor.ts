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

export function getEpochUnit(epoch: number | string): EpochUnit {
  return getEpochUnitAndEpochInMiliseconds(epoch).epochUnit;
}

// Allowlist for parseToEpoch input characters: digits, letters (month names),
// whitespace, and date/time punctuation. Rejects HTML, shell metacharacters,
// and any payload that cannot appear in a real date string.
const DATE_INPUT_RE = /^[0-9a-zA-Z\s\-\/:.TZ+,()]+$/;

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

export function getTimezoneList(): string[] {
  const intlList = typeof (Intl as any).supportedValuesOf === 'function'
    ? (Intl as any).supportedValuesOf('timeZone') as string[]
    : [];
  // Defensive copy; UTC and modern canonical names are always present.
  return [...new Set([...intlList, ...MODERN_CANONICAL_ZONES, 'UTC'])];
}

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
