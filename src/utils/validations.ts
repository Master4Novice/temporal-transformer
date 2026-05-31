import {
  EpochError,
  EpochValidationError,
} from '../errors/EpochValidationError.js';
import {
  EpochUnit,
  EpochThreshold,
  MAX_INPUT_STRING_LENGTH,
} from '../types/index.js';
import { DateTime } from 'luxon';

// Cache the IANA timezone list. Intl.supportedValuesOf is a cheap call but
// callers may invoke validTimezone in hot loops; memoize as a Set for O(1)
// membership checks.
let TZ_SET: Set<string> | null = null;
function timezoneSet(): Set<string> {
  if (TZ_SET === null) {
    const list = typeof (Intl as any).supportedValuesOf === 'function'
      ? (Intl as any).supportedValuesOf('timeZone') as string[]
      : [];
    // Always include the canonical aliases that the library uses internally.
    TZ_SET = new Set([...list, 'UTC', 'Etc/GMT', 'Etc/UTC', 'GMT']);
  }
  return TZ_SET;
}

function validateEpoch(epoch: any): number {
  if (epoch === undefined || epoch === null) {
    throw new EpochValidationError(EpochError.UndefinedOrNull);
  }

  if (typeof epoch === 'string') {
    if (epoch.length > MAX_INPUT_STRING_LENGTH) {
      throw new EpochValidationError(EpochError.InputTooLong);
    }
    if (epoch.trim().length === 0) {
      throw new EpochValidationError(EpochError.Empty);
    }
    const parsed = Number(epoch);
    if (isNaN(parsed)) {
      throw new EpochValidationError(EpochError.NotANumber);
    }
    epoch = parsed;
  } else if (typeof epoch !== 'number') {
    throw new EpochValidationError(EpochError.NotANumber);
  }

  if (!isFinite(epoch) || isNaN(epoch)) {
    throw new EpochValidationError(EpochError.NotANumber);
  }

  // Reject fractional epochs. A value like `1622547800.5` is ambiguous: its
  // magnitude says "seconds", but there is no safe, surprise-free way to fold a
  // sub-unit fraction into an integer-unit auto-detection scheme. (The previous
  // behaviour stripped the decimal point and re-detected the unit, turning
  // 1622547800.5 into 16225478005 → a 1970 millisecond timestamp.) Callers
  // should pass whole seconds / ms / µs / ns.
  if (!Number.isInteger(epoch)) {
    throw new EpochValidationError(EpochError.NotAnInteger);
  }
  return epoch;
}

export function getEpochUnitAndEpochInMiliseconds(epoch: any): {
  epochUnit: EpochUnit;
  epochInMilliseconds: number;
} {
  const validEpoch = validateEpoch(epoch);
  const absoluteEpoch: number = Math.abs(validEpoch);
  let epochInMilliseconds: number;
  let epochUnit: EpochUnit;
  if (absoluteEpoch < EpochThreshold.SECONDS) {
    epochInMilliseconds = validEpoch * 1e3;
    epochUnit = EpochUnit.SECONDS;
  } else if (absoluteEpoch < EpochThreshold.MILLI_SECONDS) {
    epochInMilliseconds = validEpoch;
    epochUnit = EpochUnit.MILLI_SECONDS;
  } else if (absoluteEpoch < EpochThreshold.MICRO_SECONDS) {
    epochInMilliseconds = Math.floor(validEpoch / 1e3);
    epochUnit = EpochUnit.MICRO_SECONDS;
  } else if (absoluteEpoch < EpochThreshold.NANO_SECONDS) {
    epochInMilliseconds = Math.floor(validEpoch / 1e6);
    epochUnit = EpochUnit.NANO_SECONDS;
  } else {
    throw new EpochValidationError(EpochError.EpochUnit);
  }

  return { epochUnit, epochInMilliseconds };
}

export function validTimezone(timezone: string): void {
  if (!timezoneSet().has(timezone)) {
    // Last-resort: Luxon's own validation. Intl's list excludes some legacy
    // aliases that Luxon still resolves (e.g. "US/Eastern"). If Luxon accepts
    // it as a valid zone, accept it too.
    const dt = DateTime.now().setZone(timezone);
    if (!dt.isValid) {
      throw new EpochValidationError(EpochError.TimezoneError);
    }
    timezoneSet().add(timezone);
  }
}

/**
 * Safe predicate: returns `true` if the input is a recognized epoch
 * value in any supported unit, `false` otherwise. Never throws.
 *
 * Use this for cheap input validation when you don't need the Result-style API.
 *
 * @example
 * ```ts
 * isValidEpoch(1622547800000); // true
 * isValidEpoch(null);          // false
 * isValidEpoch(Infinity);      // false
 * isValidEpoch('not a num');   // false
 * ```
 */
export function isValidEpoch(epoch: unknown): boolean {
  try {
    getEpochUnitAndEpochInMiliseconds(epoch);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safe predicate: returns `true` if the timezone is a recognized IANA name,
 * `false` otherwise. Never throws.
 *
 * @example
 * ```ts
 * isValidTimezone('UTC');           // true
 * isValidTimezone('Asia/Kolkata');  // true
 * isValidTimezone('Fake/Zone');     // false
 * ```
 */
export function isValidTimezone(timezone: string): boolean {
  try {
    validTimezone(timezone);
    return true;
  } catch {
    return false;
  }
}
