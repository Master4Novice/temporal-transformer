// Shared fixtures for golden tests. All values are timezone-independent
// (UTC anchors); tests must run with TZ=UTC for deterministic output.

// Anchor moment: 2021-06-01T11:43:20.000Z
export const EPOCH_S  = 1622547800;
export const EPOCH_MS = 1622547800000;
export const EPOCH_US = 1622547800000000;
export const EPOCH_NS = 1622547800000000000;

// ISO 8601 string corresponding to EPOCH_MS, parsed in UTC.
export const ISO_AT_EPOCH_MS = '2021-06-01T11:43:20Z';

// Human-readable expected output for the anchor moment, in UTC,
// using the format 'YYYY-MM-DD HH:mm:ss' (the hardcoded format inside
// convertDateToEpoch and parseToEpoch). v1.x moment and v2.0 Luxon both
// produce this exact string from their respective format tokens.
export const HUMAN_AT_EPOCH_MS_UTC = '2021-06-01 11:43:20';

// Boundary values
export const EPOCH_ZERO = 0;
export const EPOCH_NEGATIVE_MS = -86400000; // 1969-12-31T00:00:00Z

// Durations
export const ONE_HOUR_MS = 3600 * 1000;
export const ONE_DAY_MS = 24 * ONE_HOUR_MS;

// Common timezones — known to exist in both moment-timezone and Intl
export const TZ_UTC = 'UTC';
export const TZ_KOLKATA = 'Asia/Kolkata';
export const TZ_NEW_YORK = 'America/New_York';

// Asia/Kolkata is non-DST → +05:30 / 330 min in both libs, in all eras.
export const KOLKATA_OFFSET_STRING = '+05:30';
export const KOLKATA_OFFSET_MINUTES = 330;
