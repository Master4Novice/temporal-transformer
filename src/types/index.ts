export enum EpochUnit {
  SECONDS = 'seconds',
  MILLI_SECONDS = 'milliseconds',
  MICRO_SECONDS = 'microseconds',
  NANO_SECONDS = 'nanoseconds',
}

export const EpochThreshold = {
  SECONDS: 1e10,
  MILLI_SECONDS: 1e13,
  MICRO_SECONDS: 1e16,
  NANO_SECONDS: 1e19,
};

export type DurationUnit =
  | 'years'
  | 'months'
  | 'weeks'
  | 'days'
  | 'hours'
  | 'minutes'
  | 'seconds'
  | 'milliseconds';

export type StartEndUnit = 'day' | 'week' | 'month' | 'year';

export interface EpochToDate {
  epoch: number;
  epochUnit: string;
  timezone: string;
  dateTime: string;
  dateTimeInGMT: string;
  relative: string;
}

export interface DateToEpoch {
  epochInSeconds: number;
  epochInMilliseconds: number;
  timezone: string;
  dateTime: string;
  dateTimeInGMT: string;
}

export interface ParsedDuration {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalMilliseconds: number;
  humanReadable: string;
}

export interface EpochNow {
  seconds: number;
  milliseconds: number;
  iso: string;
  timezone: string;
}

export interface TimezoneOffset {
  offset: string;
  offsetMinutes: number;
}

// JavaScript's Date object can represent timestamps in the range
// ±8,640,000,000,000,000 ms (≈ ±100M days from Unix epoch).
// Outside this range, `new Date(ms).toISOString()` throws RangeError.
export const MAX_EPOCH_MS = 8.64e15;
export const MIN_EPOCH_MS = -8.64e15;

// Hard caps to prevent DoS via outsized inputs. These are well above
// any legitimate date string or format string in practice.
export const MAX_INPUT_STRING_LENGTH = 256;
export const MAX_FORMAT_STRING_LENGTH = 256;

// Default format used when callers do not pass one to convertEpoch /
// convertEpochToTimezone. Luxon tokens — see SUPPORTED_FORMAT_TOKENS.
export const DEFAULT_FORMAT = 'yyyy-MM-dd HH:mm:ss.SSS';

// Allowlist of Luxon format tokens the library accepts. Any token outside
// this set throws EpochError.FormatInvalid. The list covers the common
// date/time/zone tokens that any reasonable caller needs.
export const SUPPORTED_FORMAT_TOKENS: ReadonlySet<string> = new Set([
  // Year
  'yyyy', 'yy', 'y',
  // Month (numeric + standalone names)
  'M', 'MM', 'MMM', 'MMMM',
  'L', 'LL', 'LLL', 'LLLL',
  // Day of month
  'd', 'dd',
  // Day of week
  'c', 'cc', 'ccc', 'cccc',
  'E', 'EE', 'EEE', 'EEEE',
  // Hour (24h + 12h)
  'H', 'HH', 'h', 'hh',
  // AM/PM
  'a',
  // Minute, second, fractional second
  'm', 'mm', 's', 'ss', 'S', 'SSS',
  // Zone offsets and names
  'Z', 'ZZ', 'ZZZ', 'ZZZZ', 'ZZZZZ',
  'z',
  // Ordinal day of year, quarter, week
  'o', 'ooo', 'q', 'qq', 'W', 'WW',
]);

// Result-style discriminated union for the safe API surface.
// Generic over E so the runtime error class can be passed without a circular import.
export type Result<T, E = Error> =
  | { ok: true; value: T; error?: never }
  | { ok: false; value?: never; error: E };
