import { DateTime, Duration } from 'luxon';
import {
  EpochError,
  EpochValidationError,
} from '../errors/EpochValidationError.js';
import { ParsedDuration } from '../types/index.js';

function plural(n: number, label: string): string {
  return `${n} ${label}${n === 1 ? '' : 's'}`;
}

export function getRelativeTimeDifference(epochMillis: number): string {
  const currentTimeMillis = Date.now();
  const diffMillis = currentTimeMillis - epochMillis;
  const absDiffMillis = Math.abs(diffMillis);
  const diffSeconds = absDiffMillis / 1000;
  const diffMinutes = diffSeconds / 60;
  const diffHours = diffMinutes / 60;
  const diffDays = diffHours / 24;
  const diffMonths = diffDays / 30;
  const diffYears = diffDays / 365;

  const isFuture = diffMillis < 0;
  const suffix = isFuture ? ' from now' : ' ago';

  // Strict-less-than boundaries: exactly 60s rolls to minutes, exactly
  // 60min to hours, etc. This is the stable bucketing — previously the
  // 1-minute boundary was nondeterministic on fast machines.
  if (diffSeconds < 60) {
    return `${plural(Math.floor(diffSeconds), 'second')}${suffix}`;
  } else if (diffMinutes < 60) {
    return `${plural(Math.floor(diffMinutes), 'minute')}${suffix}`;
  } else if (diffHours < 24) {
    const hours = Math.floor(diffHours);
    const minutes = Math.floor(diffMinutes % 60);
    return `${plural(hours, 'hour')} ${plural(minutes, 'minute')}${suffix}`;
  } else if (diffDays < 30) {
    const days = Math.floor(diffDays);
    const hours = Math.floor(diffHours % 24);
    return `${plural(days, 'day')} ${plural(hours, 'hour')}${suffix}`;
  } else if (diffMonths < 12) {
    const months = Math.floor(diffMonths);
    const days = Math.floor(diffDays % 30);
    return `${plural(months, 'month')} ${plural(days, 'day')}${suffix}`;
  } else {
    const years = Math.floor(diffYears);
    // Cap months at 11 — using 30-day months, the remainder can otherwise
    // round up to 12 near year boundaries (e.g. 4y 364d → "4 years 12 months").
    const months = Math.min(11, Math.floor((diffDays % 365) / 30));
    return `${plural(years, 'year')} ${plural(months, 'month')}${suffix}`;
  }
}

export function validateMomentDate(date: any): void {
  if (!(date instanceof Date)) {
    throw new EpochValidationError(EpochError.DateError);
  }
  const dt = DateTime.fromJSDate(date);
  if (!dt.isValid) {
    throw new EpochValidationError(EpochError.DateError);
  }
}

/**
 * Render a duration (in milliseconds) as a human-readable string.
 * Pluralizes correctly ("1 second" vs "2 seconds") and omits zero parts.
 * Sub-second durations fall back to `"0 seconds"`. Negative input is
 * treated as positive (absolute value).
 *
 * @param milliseconds - Duration in milliseconds.
 * @returns A pluralization-aware string like `"1 hour, 1 minute, 1 second"`.
 *
 * @example
 * ```ts
 * formatDuration(3661000);  // "1 hour, 1 minute, 1 second"
 * formatDuration(86400000); // "1 day"
 * formatDuration(500);      // "0 seconds"  (below 1s resolution)
 * ```
 */
export function formatDuration(milliseconds: number): string {
  const abs = Math.abs(milliseconds);
  const d = Duration.fromMillis(abs).shiftTo(
    'years', 'months', 'days', 'hours', 'minutes', 'seconds',
  );
  const years = Math.floor(d.years);
  const months = Math.floor(d.months);
  const days = Math.floor(d.days);
  const hours = Math.floor(d.hours);
  const minutes = Math.floor(d.minutes);
  const seconds = Math.floor(d.seconds);

  const segments: string[] = [];
  if (years > 0) segments.push(`${years} year${years !== 1 ? 's' : ''}`);
  if (months > 0) segments.push(`${months} month${months !== 1 ? 's' : ''}`);
  if (days > 0) segments.push(`${days} day${days !== 1 ? 's' : ''}`);
  if (hours > 0) segments.push(`${hours} hour${hours !== 1 ? 's' : ''}`);
  if (minutes > 0) segments.push(`${minutes} minute${minutes !== 1 ? 's' : ''}`);
  if (seconds > 0) segments.push(`${seconds} second${seconds !== 1 ? 's' : ''}`);

  return segments.length > 0 ? segments.join(', ') : '0 seconds';
}

export function parseDuration(fromMs: number, toMs: number): ParsedDuration {
  const totalMs = toMs - fromMs;
  const from = DateTime.fromMillis(fromMs, { zone: 'utc' });
  const to = DateTime.fromMillis(toMs, { zone: 'utc' });

  // Luxon's diff with multiple units performs calendar-accurate decomposition.
  const diff = to.diff(from, [
    'years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds',
  ]);
  const o = diff.toObject();
  const years = Math.floor(o.years ?? 0);
  const months = Math.floor(o.months ?? 0);
  const days = Math.floor(o.days ?? 0);
  const hours = Math.floor(o.hours ?? 0);
  const minutes = Math.floor(o.minutes ?? 0);
  const seconds = Math.floor(o.seconds ?? 0);
  const milliseconds = Math.floor(o.milliseconds ?? 0);

  const parts: Array<[number, string]> = [
    [years, 'year'], [months, 'month'], [days, 'day'],
    [hours, 'hour'], [minutes, 'minute'], [seconds, 'second'],
  ];
  const humanReadable =
    parts
      .filter(([v]) => v > 0)
      .map(([v, label]) => `${v} ${label}${v !== 1 ? 's' : ''}`)
      .join(', ') || '0 seconds';

  return { years, months, days, hours, minutes, seconds, milliseconds, totalMilliseconds: totalMs, humanReadable };
}
