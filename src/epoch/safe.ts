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

function wrap<T>(fn: () => T): Result<T, EpochValidationError> {
  try {
    return { ok: true, value: fn() };
  } catch (e) {
    if (e instanceof EpochValidationError) return { ok: false, error: e };
    throw e;
  }
}

export function safeConvertEpoch(
  epoch: number,
  format?: string,
): Result<EpochToDate, EpochValidationError> {
  return wrap(() => convertEpoch(epoch, format));
}

export function safeConvertDateToEpoch(
  date: Date,
  timezone?: string,
): Result<DateToEpoch, EpochValidationError> {
  return wrap(() => convertDateToEpoch(date, timezone));
}

export function safeConvertEpochToTimezone(
  epoch: number,
  timezone: string,
  format?: string,
): Result<string, EpochValidationError> {
  return wrap(() => convertEpochToTimezone(epoch, timezone, format));
}

export function safeParseToEpoch(
  input: string,
  format?: string,
  timezone?: string,
): Result<DateToEpoch, EpochValidationError> {
  return wrap(() => parseToEpoch(input, format, timezone));
}

export function safeGetDurationBetween(
  fromEpoch: number,
  toEpoch: number,
): Result<ParsedDuration, EpochValidationError> {
  return wrap(() => getDurationBetween(fromEpoch, toEpoch));
}

export function safeGetTimezoneOffset(
  timezone: string,
  epoch?: number,
): Result<TimezoneOffset, EpochValidationError> {
  return wrap(() => getTimezoneOffset(timezone, epoch));
}

export function safeGetEpochNow(): Result<EpochNow, EpochValidationError> {
  return wrap(() => getEpochNow());
}

export function safeGetEpochUnit(
  epoch: number | string,
): Result<EpochUnit, EpochValidationError> {
  return wrap(() => getEpochUnit(epoch));
}
