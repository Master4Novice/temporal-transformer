import { EpochValidationError } from '../errors/EpochValidationError.js';
import {
  convertEpoch,
  convertDateToEpoch,
  convertEpochToTimezone,
  parseToEpoch,
  getDurationBetween,
  getTimezoneOffset,
  getEpochNow,
  getEpochUnit,
} from './convertor.js';
import {
  EpochToDate,
  DateToEpoch,
  ParsedDuration,
  TimezoneOffset,
  EpochNow,
  EpochUnit,
  Result,
} from '../types/index.js';

/**
 * Wrap a throwing call into a Result. Catches only EpochValidationError —
 * unexpected errors (TypeError, OOM, etc.) propagate so real bugs surface.
 */
function wrap<T>(fn: () => T): Result<T, EpochValidationError> {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    if (e instanceof EpochValidationError) return { ok: false, error: e };
    throw e;
  }
}

/**
 * Result-style variant of {@link convertEpoch}. Never throws for validation
 * errors — returns `{ ok: false, error }` instead. Ideal for handling
 * untrusted input (API endpoints, form data, batch jobs).
 *
 * @example
 * ```ts
 * const r = safeConvertEpoch(req.body.timestamp);
 * if (r.ok) {
 *   console.log(r.value.dateTime);
 * } else {
 *   res.status(400).json({ error: r.error.message });
 * }
 * ```
 */
export function safeConvertEpoch(
  epoch: number,
  format?: string,
): Result<EpochToDate, EpochValidationError> {
  return wrap(() => convertEpoch(epoch, format));
}

/** Result-style variant of {@link convertDateToEpoch}. Never throws for validation errors. */
export function safeConvertDateToEpoch(
  date: Date,
  timezone?: string,
): Result<DateToEpoch, EpochValidationError> {
  return wrap(() => convertDateToEpoch(date, timezone));
}

/** Result-style variant of {@link convertEpochToTimezone}. Never throws for validation errors. */
export function safeConvertEpochToTimezone(
  epoch: number,
  timezone: string,
  format?: string,
): Result<string, EpochValidationError> {
  return wrap(() => convertEpochToTimezone(epoch, timezone, format));
}

/** Result-style variant of {@link parseToEpoch}. Never throws for validation errors. */
export function safeParseToEpoch(
  input: string,
  format?: string,
  timezone?: string,
): Result<DateToEpoch, EpochValidationError> {
  return wrap(() => parseToEpoch(input, format, timezone));
}

/** Result-style variant of {@link getDurationBetween}. Never throws for validation errors. */
export function safeGetDurationBetween(
  fromEpoch: number,
  toEpoch: number,
): Result<ParsedDuration, EpochValidationError> {
  return wrap(() => getDurationBetween(fromEpoch, toEpoch));
}

/** Result-style variant of {@link getTimezoneOffset}. Never throws for validation errors. */
export function safeGetTimezoneOffset(
  timezone: string,
  epoch?: number,
): Result<TimezoneOffset, EpochValidationError> {
  return wrap(() => getTimezoneOffset(timezone, epoch));
}

/** Result-style variant of {@link getEpochNow}. Never throws for clock-corruption errors. */
export function safeGetEpochNow(): Result<EpochNow, EpochValidationError> {
  return wrap(() => getEpochNow());
}

/** Result-style variant of {@link getEpochUnit}. Never throws for validation errors. */
export function safeGetEpochUnit(
  epoch: number | string,
): Result<EpochUnit, EpochValidationError> {
  return wrap(() => getEpochUnit(epoch));
}
