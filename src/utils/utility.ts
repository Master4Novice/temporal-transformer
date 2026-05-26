import { DateTime, Duration } from 'luxon';
import {
  EpochError,
  EpochValidationError,
} from '../errors/EpochValidationError.js';
import { ParsedDuration } from '../types/index.js';

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

  if (diffSeconds <= 60) {
    return `${Math.floor(diffSeconds)} seconds${suffix}`;
  } else if (diffMinutes <= 60) {
    return `${Math.floor(diffMinutes)} minutes${suffix}`;
  } else if (diffHours <= 24) {
    const hours = Math.floor(diffHours);
    const minutes = Math.floor(diffMinutes % 60);
    return `${hours} hours ${minutes} minutes${suffix}`;
  } else if (diffDays <= 30) {
    const days = Math.floor(diffDays);
    const hours = Math.floor(diffHours % 24);
    return `${days} days ${hours} hours${suffix}`;
  } else if (diffMonths <= 12) {
    const months = Math.floor(diffMonths);
    const days = Math.floor(diffDays % 30);
    return `${months} months ${days} days${suffix}`;
  } else {
    const years = Math.floor(diffYears);
    const months = Math.floor((diffDays % 365) / 30);
    return `${years} years ${months} months${suffix}`;
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
