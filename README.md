# @master4n/temporal-transformer

[![npm version](https://img.shields.io/npm/v/%40master4n%2Ftemporal-transformer)](https://www.npmjs.com/package/@master4n/temporal-transformer)
[![npm downloads](https://img.shields.io/npm/dm/%40master4n%2Ftemporal-transformer)](https://www.npmjs.com/package/@master4n/temporal-transformer)
[![CI](https://github.com/Master4Novice/temporal-transformer/actions/workflows/ci.yml/badge.svg)](https://github.com/Master4Novice/temporal-transformer/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/npm/l/%40master4n%2Ftemporal-transformer)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue)](https://www.typescriptlang.org/)
[![Node](https://img.shields.io/node/v/%40master4n%2Ftemporal-transformer)](https://nodejs.org/)
[![Bundle](https://img.shields.io/bundlephobia/minzip/%40master4n%2Ftemporal-transformer)](https://bundlephobia.com/package/@master4n/temporal-transformer)
[![Treeshakeable](https://img.shields.io/badge/Treeshakeable-Partial-yellow)](#bundle-size-considerations)
[![Owner](https://img.shields.io/badge/Owner-Master4Novice-orange)](https://github.com/Master4Novice)

**Convert any epoch timestamp to a human-readable date in TypeScript — auto-detects seconds, milliseconds, microseconds, and nanoseconds with zero configuration.** Also converts date strings to epoch, computes calendar-accurate durations, and handles any IANA timezone.

> **v2.0 is out.** Engine swapped from moment.js to [Luxon](https://moment.github.io/luxon/) — same API, ~60% smaller bundle (~71 KB vs ~180 KB), no maintenance-mode dependency. Upgrade with `npm i @master4n/temporal-transformer@2` and run `npx @master4n/temporal-transformer-codemod ./src` to migrate format strings automatically. See [MIGRATION.md](./MIGRATION.md).

---

## Why temporal-transformer?

Working with epoch timestamps in TypeScript is surprisingly painful:

- You don't know if a value is in seconds, milliseconds, microseconds, or nanoseconds until it breaks in production.
- `new Date(epoch)` silently produces wrong dates if the unit is wrong.
- Parsing date strings without a format string is unreliable and locale-dependent.
- Getting the UTC offset for a given timezone requires knowing a timezone library's specific API.

`temporal-transformer` solves all of these in one small, fully-typed package:

```typescript
// No idea what unit this is? No problem.
convertEpoch(1622547800);          // seconds  → "2021-06-01 23:13:20"
convertEpoch(1622547800000);       // millis   → "2021-06-01 23:13:20"
convertEpoch(1622547800000000);    // micros   → "2021-06-01 23:13:20"
convertEpoch(1622547800000000000); // nanos    → "2021-06-01 23:13:20"
```

---

## Features

- **Auto-detects epoch unit** — seconds, milliseconds, microseconds, nanoseconds
- **Epoch → human-readable date** in local timezone and GMT simultaneously
- **Date string → epoch** with explicit format and timezone (strict parsing, no surprises)
- **Calendar-accurate duration** between two timestamps (years, months, days, hours, minutes, seconds)
- **Timezone conversion** — format any epoch in any IANA timezone
- **Timezone utilities** — list all available IANA timezones, get UTC offset for any zone
- **Result-style safe API** — every function has a `safeXxx` variant returning `{ ok, value | error }` instead of throwing
- **Safe predicates** — `isValidEpoch` / `isValidTimezone` that never throw
- **Frozen results** — returned objects are `Object.freeze()`'d to prevent downstream tampering
- **Token allowlist** — format strings are validated against a Luxon-token allowlist; typos throw `FormatInvalid` instead of silently producing garbage
- **Relative time** — "3 hours 15 minutes ago" / "2 days from now"
- **Full TypeScript support** — strict types, enums, and interfaces exported
- **Dual ESM + CJS build** — works in Next.js, Node.js, Vite, webpack
- **Hardened input validation** — DoS-capped string and format lengths, rejects HTML/XSS payloads, `Infinity`, `NaN`, prototype-pollution attempts, and clock-corruption edge cases
- **Powered by Luxon** — immutable, IANA-aware via the `Intl` API, no moment.js, Node 18+

---

## Installation

```bash
npm install @master4n/temporal-transformer
# or
yarn add @master4n/temporal-transformer
# or
pnpm add @master4n/temporal-transformer
```

---

## Quick Start

```typescript
import {
  convertEpoch,
  convertDateToEpoch,
  convertEpochToTimezone,
  parseToEpoch,
  getDurationBetween,
  isValidEpoch,
} from '@master4n/temporal-transformer';

// Convert any epoch to a readable date — unit is auto-detected
const result = convertEpoch(1622547800000);
console.log(result.dateTime);      // "2021-06-01 23:13:20.000000" (local TZ)
console.log(result.dateTimeInGMT); // "2021-06-01 17:43:20.000000"
console.log(result.epochUnit);     // "milliseconds"
console.log(result.relative);      // "3 years 11 months ago"

// Convert a Date object to epoch values
const epoch = convertDateToEpoch(new Date(), 'America/New_York');
console.log(epoch.epochInSeconds);      // e.g. 1748000000
console.log(epoch.epochInMilliseconds); // e.g. 1748000000000

// Parse a date string to epoch (strict, timezone-aware)
const parsed = parseToEpoch('2024-12-25T00:00:00', undefined, 'Asia/Kolkata');
console.log(parsed.epochInMilliseconds);

// Format an epoch in a specific timezone
const formatted = convertEpochToTimezone(1622547800000, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm');
console.log(formatted); // "2021-06-02 02:43"

// Calendar-accurate duration between two timestamps
const duration = getDurationBetween(1609459200000, 1622547800000);
console.log(duration.humanReadable); // "4 months, 15 days, 17 hours, 43 minutes, 20 seconds"

// Safe validation — never throws
console.log(isValidEpoch(1622547800000)); // true
console.log(isValidEpoch('bad value'));   // false
console.log(isValidEpoch(Infinity));      // false
```

---

## API Reference

### `convertEpoch(epoch, format?)`

Converts any epoch value to a human-readable date. **Automatically detects the epoch unit** (seconds / milliseconds / microseconds / nanoseconds).

```typescript
function convertEpoch(epoch: number, format?: string): EpochToDate
```

| Parameter | Type     | Default                        | Description                     |
|-----------|----------|--------------------------------|---------------------------------|
| `epoch`   | `number` | —                              | Epoch value in any unit         |
| `format`  | `string` | `'yyyy-MM-dd HH:mm:ss.SSS'`   | [Luxon format token](https://moment.github.io/luxon/#/formatting?id=table-of-tokens) (validated against `SUPPORTED_FORMAT_TOKENS`) |

**Returns:** [`EpochToDate`](#epochtodate)

```typescript
const result = convertEpoch(1622547800000, 'yyyy-MM-dd');
// { epoch: 1622547800000, epochUnit: 'milliseconds', timezone: 'Asia/Kolkata',
//   dateTime: '2021-06-01', dateTimeInGMT: '2021-06-01', relative: '...' }
```

---

### `convertDateToEpoch(date, timezone?)`

Converts a `Date` object to epoch values (seconds and milliseconds) in the specified timezone.

```typescript
function convertDateToEpoch(date: Date, timezone?: string): DateToEpoch
```

| Parameter  | Type     | Default                  | Description                      |
|------------|----------|--------------------------|----------------------------------|
| `date`     | `Date`   | —                        | Any valid JavaScript `Date`      |
| `timezone` | `string` | System local timezone    | IANA timezone name               |

**Returns:** [`DateToEpoch`](#datetepoch)

```typescript
const result = convertDateToEpoch(new Date('2024-01-15'), 'America/New_York');
// { epochInSeconds: 1705276800, epochInMilliseconds: 1705276800000,
//   dateTime: '2024-01-14 19:00:00', dateTimeInGMT: '2024-01-15 00:00:00',
//   timezone: 'America/New_York' }
```

---

### `convertEpochToTimezone(epoch, timezone, format?)`

Formats an epoch value as a date string in a specific IANA timezone.

```typescript
function convertEpochToTimezone(epoch: number, timezone: string, format?: string): string
```

```typescript
convertEpochToTimezone(1622547800000, 'America/Los_Angeles', 'yyyy-MM-dd HH:mm:ss');
// "2021-06-01 10:43:20"

convertEpochToTimezone(1622547800000, 'Asia/Tokyo');
// "2021-06-02 02:43:20.000000"
```

---

### `getEpochUnit(epoch)`

Returns just the detected unit of an epoch value — useful for routing logic without doing the full conversion.

```typescript
function getEpochUnit(epoch: number | string): EpochUnit
```

```typescript
getEpochUnit(1622547800);          // EpochUnit.SECONDS       === 'seconds'
getEpochUnit(1622547800000);       // EpochUnit.MILLI_SECONDS === 'milliseconds'
getEpochUnit(1622547800000000);    // EpochUnit.MICRO_SECONDS === 'microseconds'
getEpochUnit(1622547800000000000); // EpochUnit.NANO_SECONDS  === 'nanoseconds'
```

---

### `parseToEpoch(input, format?, timezone?)`

Parses a date string into epoch values. Uses **strict parsing** when a format is provided — never silently produces a wrong date.

```typescript
function parseToEpoch(input: string, format?: string, timezone?: string): DateToEpoch
```

| Parameter  | Type                    | Default               | Description                                          |
|------------|-------------------------|-----------------------|------------------------------------------------------|
| `input`    | `string`                | —                     | Date string to parse                                 |
| `format`   | `string` or `undefined` | Auto (ISO 8601)       | [Moment.js format string](https://momentjs.com/docs/#/parsing/string-format/) |
| `timezone` | `string`                | System local timezone | IANA timezone to interpret the date in               |

**Returns:** [`DateToEpoch`](#datetepoch)

**Throws:** `EpochValidationError` with `EpochError.ParseError` if the string cannot be parsed, or `EpochError.TimezoneError` for an unknown timezone.

```typescript
// ISO 8601 auto-parsing
parseToEpoch('2024-12-25T00:00:00Z');

// Explicit format (strict mode — wrong format throws immediately)
parseToEpoch('25/12/2024', 'dd/MM/yyyy', 'Europe/London');

// With timezone context
parseToEpoch('2024-12-25 09:00:00', 'yyyy-MM-dd HH:mm:ss', 'Asia/Kolkata');
```

---

### `getDurationBetween(fromEpoch, toEpoch)`

Computes a **calendar-accurate** duration between two epoch timestamps.

```typescript
function getDurationBetween(fromEpoch: number, toEpoch: number): ParsedDuration
```

**Returns:** [`ParsedDuration`](#parsedduration)

**Throws:** `EpochValidationError` with `EpochError.RangeError` if `fromEpoch > toEpoch`.

```typescript
const d = getDurationBetween(1609459200000, 1748000000000);
console.log(d.years);             // 4
console.log(d.months);            // 5
console.log(d.days);              // 18
console.log(d.humanReadable);     // "4 years, 5 months, 18 days, ..."
console.log(d.totalMilliseconds); // exact diff in ms
```

> **Calendar-accurate:** months and years account for actual calendar boundaries (Feb 28/29, 30/31-day months), not fixed 30.44-day approximations.

---

### `getTimezoneOffset(timezone, epoch?)`

Returns the UTC offset for an IANA timezone, optionally at a specific point in time (useful for DST-aware offsets).

```typescript
function getTimezoneOffset(timezone: string, epoch?: number): TimezoneOffset
```

```typescript
getTimezoneOffset('Asia/Kolkata');
// { offset: '+05:30', offsetMinutes: 330 }

getTimezoneOffset('America/New_York');
// { offset: '-05:00', offsetMinutes: -300 }  (or -04:00 during DST)

// DST-aware: pass the epoch you care about
getTimezoneOffset('America/New_York', 1622547800000);
// { offset: '-04:00', offsetMinutes: -240 }
```

---

### `getTimezoneList()`

Returns the full list of supported IANA timezone names (600+).

```typescript
function getTimezoneList(): string[]
```

```typescript
const zones = getTimezoneList();
zones.includes('Asia/Kolkata');    // true
zones.includes('America/Chicago'); // true
```

---

### `getEpochNow()`

Returns the current moment as epoch values (seconds, milliseconds, ISO string, and detected timezone).

```typescript
function getEpochNow(): EpochNow
```

```typescript
const now = getEpochNow();
// { seconds: 1748000000, milliseconds: 1748000000000,
//   iso: '2025-05-23T10:13:20.000Z', timezone: 'Asia/Kolkata' }
```

---

### `formatDuration(milliseconds)`

Formats a duration in milliseconds as a human-readable string.

```typescript
function formatDuration(milliseconds: number): string
```

```typescript
formatDuration(3661000);   // "1 hour, 1 minute, 1 second"
formatDuration(86400000);  // "1 day"
formatDuration(90061000);  // "1 day, 1 hour, 1 minute, 1 second"
formatDuration(500);       // "0 seconds"
```

---

### `isValidEpoch(epoch)` · `isValidTimezone(timezone)`

Safe predicates that return `boolean` without throwing. Useful for conditional logic and input validation at system boundaries.

```typescript
function isValidEpoch(epoch: unknown): boolean
function isValidTimezone(timezone: string): boolean
```

```typescript
isValidEpoch(1622547800000);   // true
isValidEpoch('1622547800000'); // true  (numeric string)
isValidEpoch(null);            // false
isValidEpoch(Infinity);        // false
isValidEpoch(NaN);             // false

isValidTimezone('UTC');             // true
isValidTimezone('Asia/Kolkata');    // true
isValidTimezone('Not/ATimezone');   // false
```

---

## Types Reference

### `EpochToDate`

```typescript
interface EpochToDate {
  epoch: number;         // original input
  epochUnit: string;     // 'seconds' | 'milliseconds' | 'microseconds' | 'nanoseconds'
  timezone: string;      // IANA timezone used for dateTime
  dateTime: string;      // formatted date in local timezone
  dateTimeInGMT: string; // formatted date in GMT
  relative: string;      // e.g. "3 hours 15 minutes ago"
}
```

### `DateToEpoch`

```typescript
interface DateToEpoch {
  epochInSeconds: number;
  epochInMilliseconds: number;
  timezone: string;
  dateTime: string;      // formatted in the given timezone
  dateTimeInGMT: string;
}
```

### `ParsedDuration`

```typescript
interface ParsedDuration {
  years: number;
  months: number;
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  milliseconds: number;
  totalMilliseconds: number;
  humanReadable: string; // e.g. "1 year, 2 months, 3 days"
}
```

### `EpochNow`

```typescript
interface EpochNow {
  seconds: number;
  milliseconds: number;
  iso: string;      // ISO 8601 UTC string
  timezone: string; // detected local timezone
}
```

### `TimezoneOffset`

```typescript
interface TimezoneOffset {
  offset: string;        // e.g. "+05:30"
  offsetMinutes: number; // e.g. 330
}
```

### `EpochUnit` enum

```typescript
enum EpochUnit {
  SECONDS       = 'seconds',
  MILLI_SECONDS = 'milliseconds',
  MICRO_SECONDS = 'microseconds',
  NANO_SECONDS  = 'nanoseconds',
}
```

### `DurationUnit` type

```typescript
type DurationUnit =
  | 'years' | 'months' | 'weeks' | 'days'
  | 'hours' | 'minutes' | 'seconds' | 'milliseconds';
```

---

## Epoch Unit Auto-Detection

| Absolute value range         | Detected unit | Example value           |
|------------------------------|---------------|-------------------------|
| `< 10,000,000,000`           | seconds       | `1622547800`            |
| `< 10,000,000,000,000`       | milliseconds  | `1622547800000`         |
| `< 10,000,000,000,000,000`   | microseconds  | `1622547800000000`      |
| `< 1e19`                     | nanoseconds   | `1622547800000000000`   |

Negative epochs (dates before Unix epoch, i.e. before 1970-01-01) are fully supported.

---

## Error Handling

All functions throw `EpochValidationError` (extends `Error`) with a message from the `EpochError` enum.

```typescript
import { EpochValidationError, EpochError } from '@master4n/temporal-transformer';

try {
  convertEpoch(null as any);
} catch (err) {
  if (err instanceof EpochValidationError) {
    console.log(err.message); // 'Epoch Is Undefined Or Null'
    console.log(err.name);    // 'EpochValidationError'
  }
}
```

| `EpochError` value | Thrown when                                              |
|--------------------|----------------------------------------------------------|
| `UndefinedOrNull`  | Input is `null` or `undefined`                           |
| `NotANumber`       | Input is not numeric, is `Infinity`, or is `NaN`         |
| `Empty`            | Input is an empty or whitespace-only string              |
| `EpochUnit`        | Epoch value is too large to classify into any unit       |
| `DateError`        | `Date` object passed to `convertDateToEpoch` is invalid  |
| `TimezoneError`    | Timezone string is not a recognized IANA timezone        |
| `ParseError`       | Date string cannot be parsed (in `parseToEpoch`)         |
| `RangeError`       | `fromEpoch > toEpoch` in `getDurationBetween`            |

---

## Result-Style Safe API (unique feature)

Every function has a `safeXxx` counterpart that returns a discriminated `Result<T>` object instead of throwing. This is ideal for code paths handling untrusted input — API endpoints, form validation, batch processors — where `try`/`catch` becomes noise.

```typescript
import { safeConvertEpoch, safeParseToEpoch, safeGetEpochNow } from '@master4n/temporal-transformer';

const result = safeConvertEpoch(req.body.timestamp);
if (result.ok) {
  console.log(result.value.dateTime);   // typed as EpochToDate
} else {
  console.log(result.error.message);    // typed as EpochValidationError
}
```

| Safe variant                  | Wraps                       | Returns                                          |
|-------------------------------|-----------------------------|--------------------------------------------------|
| `safeConvertEpoch`            | `convertEpoch`              | `Result<EpochToDate, EpochValidationError>`      |
| `safeConvertDateToEpoch`      | `convertDateToEpoch`        | `Result<DateToEpoch, EpochValidationError>`      |
| `safeConvertEpochToTimezone`  | `convertEpochToTimezone`    | `Result<string, EpochValidationError>`           |
| `safeParseToEpoch`            | `parseToEpoch`              | `Result<DateToEpoch, EpochValidationError>`      |
| `safeGetDurationBetween`      | `getDurationBetween`        | `Result<ParsedDuration, EpochValidationError>`   |
| `safeGetTimezoneOffset`       | `getTimezoneOffset`         | `Result<TimezoneOffset, EpochValidationError>`   |
| `safeGetEpochNow`             | `getEpochNow`               | `Result<EpochNow, EpochValidationError>`         |
| `safeGetEpochUnit`            | `getEpochUnit`              | `Result<EpochUnit, EpochValidationError>`        |

### The `Result<T>` type

```typescript
type Result<T, E = Error> =
  | { ok: true;  value: T;          error?: never }
  | { ok: false; value?: never;     error: E };
```

The discriminant is `ok`. TypeScript narrows `value` and `error` automatically once you branch on it.

---

## Security Model

`temporal-transformer` treats every input as untrusted. The library has been audited against the OWASP-style threat model below; the test suite [`test/epoch/security.test.ts`](./test/epoch/security.test.ts) pins each defense.

### Threats addressed

| Threat                                       | Defense                                                                  |
|----------------------------------------------|--------------------------------------------------------------------------|
| **Prototype pollution** via `__proto__`      | Object inputs are rejected with `NotANumber` before any property access  |
| **`Infinity`, `-Infinity`, `NaN`**            | Explicit `isFinite` guard, throws `NotANumber`                           |
| **String DoS** (e.g. 1M-char numeric string) | `MAX_INPUT_STRING_LENGTH = 256` → throws `InputTooLong`                  |
| **Format-string DoS** (memory amplification) | `MAX_FORMAT_STRING_LENGTH = 256` → throws `FormatTooLong`                |
| **XSS / HTML in `parseToEpoch`**             | Character allowlist regex rejects payloads before reaching moment        |
| **Stderr leakage of payloads**               | Strict ISO 8601 mode bypasses moment's `js Date()` fallback path         |
| **Timezone injection**                       | `validTimezone` checks input against the IANA name list                  |
| **Result object tampering**                  | All return values are `Object.freeze()`'d                                |
| **Internal array mutation**                  | `getTimezoneList` returns a defensive copy                               |
| **System clock corruption** (`Date.now()`)   | `getEpochNow` validates against `±MAX_EPOCH_MS`, throws `ClockOutOfRange`|
| **Reversed-range duration**                  | `getDurationBetween` throws `RangeError` if `from > to`                  |
| **ReDoS**                                    | All regexes are linear-time (no nested quantifiers, no backreferences)   |

### Known caller responsibilities

- **Format string output is literal**: moment's `[bracketed]` literals in a format string are emitted verbatim. If you pass user-controlled format strings *and* output the result to HTML, you must HTML-escape on output. The library does not interpret format strings as user-supplied content.
- **`convertDateToEpoch(date)` trusts `date.getTime()`**: a `Date` subclass with an overridden `valueOf()`/`getTime()` returns whatever those methods return. Validate `instanceof Date` and untainted construction at your trust boundary if this matters.

### Exported security constants

```typescript
import {
  MAX_EPOCH_MS,              // 8.64e15  — JS Date upper bound
  MIN_EPOCH_MS,              // -8.64e15 — JS Date lower bound
  MAX_INPUT_STRING_LENGTH,   // 256
  MAX_FORMAT_STRING_LENGTH,  // 256
} from '@master4n/temporal-transformer';
```

### Reporting

If you discover a security issue, please open a private advisory on [github.com/Master4Novice/temporal-transformer/security](https://github.com/Master4Novice/temporal-transformer/security/advisories) rather than a public issue. See [SECURITY.md](./SECURITY.md) for the full policy.

---

## Benchmarks

Real numbers, run yourself with `npm run bench`. See [bench/RESULTS.md](./bench/RESULTS.md) for the full report. Headline on Node 24 / Apple Silicon:

| Operation | Native JS | Raw Luxon | This library | Library overhead |
|---|---:|---:|---:|---:|
| `getEpochUnit` (auto-detect) | — | — | **170M ops/s** | the unique feature is essentially free |
| `isValidEpoch` (safe predicate) | 227M ops/s | — | **167M ops/s** | 1.4× — JIT-friendly |
| `convertEpochToTimezone` | — | 183K ops/s | **168K ops/s** | 1.1× — thin wrapper |
| `getDurationBetween` (calendar) | — | 87K ops/s | **92K ops/s** | actually faster than raw Luxon diff |
| `parseToEpoch` (ISO + allowlist) | 7.76M ops/s | 603K ops/s | **219K ops/s** | 35× over native (security cost) |
| `convertEpoch` (dual-TZ + relative) | 2.08M ops/s | 527K ops/s | **25K ops/s** | 82× — does dual-TZ format + relative time |

### What these numbers mean for your code

| Use case | Verdict |
|---|---|
| Backend ingest / API endpoints (10K req/s) | Imperceptible. Use freely. |
| Per-request formatting (handful of calls) | Network/DB latency dominates by 1000×. |
| Batch processing 100K+ rows/second | `convertEpoch` is hot — use `getEpochUnit` once to determine units, then loop with raw `Date`. |
| Frontend display | Imperceptible. |

**Bottom line:** This library is a *validation + ergonomics layer*. Its job is to be correct (auto-detect, security guards, frozen results, Result API) — not to be the fastest format-string emitter. The auto-detect itself is essentially free; the cost is the dual-output convenience and the safety checks.

---

## Comparison with other date libraries

| Feature | `temporal-transformer` | `moment.js` | `dayjs` | `date-fns` | `luxon` | Native `Date` |
|---|---|---|---|---|---|---|
| **Auto-detect epoch unit** | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Result-style safe API** (`{ok, value\|error}`) | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **Frozen results** (immutable by construction) | ✅ | ❌ | ✅ | ✅ | ✅ | n/a |
| **Input length DoS caps** | ✅ | ❌ | ❌ | ❌ | ❌ | n/a |
| **Format-token allowlist** (rejects typos) | ✅ | ❌ | ❌ | ❌ | ❌ | n/a |
| **HTML/XSS payload rejection in parse** | ✅ | ❌ | ❌ | ❌ | ❌ | n/a |
| **IANA timezone support** | ✅ (Intl) | ✅ (bundled) | plugin | plugin | ✅ (Intl) | partial |
| **TypeScript-first** | ✅ | ❌ (`@types/moment`) | ✅ | ✅ | ✅ | ✅ |
| **Tree-shakeable** | partial | ❌ | ✅ | ✅ | partial | n/a |
| **Min+gzip size** | ~25 KB + Luxon | ~290 KB w/tz | ~7 KB | ~13 KB (modular) | ~71 KB | 0 |
| **Maintenance status** | active | maintenance-only | active | active | active | spec |
| **Best for** | Ingesting untrusted, mixed-unit epochs | Legacy codebases | Lightweight client bundles | Functional/modular use | Heavy timezone work | Trivial / known-format use |

### When to pick what

- **Pick `temporal-transformer`** if you process timestamps where the unit isn't known up front, or you handle untrusted input and want the safe Result API.
- **Pick `dayjs`** if bundle size is paramount and you don't need timezone-aware parsing.
- **Pick `date-fns`** if you want a treeshakeable, functional API and you control the input.
- **Pick `luxon` directly** if you already know your epoch unit and need raw speed for timezone formatting at scale.
- **Pick `Date` directly** if your input is always milliseconds, you don't care about timezones beyond UTC, and you live by `toISOString()`.
- **Pick `moment`** only if you're maintaining an existing codebase that depends on it.

---

## Common Recipes

### Convert a Unix timestamp from an API response

```typescript
// API returns epoch in unknown unit — temporal-transformer handles it
const ts = apiResponse.created_at; // could be seconds or ms
const { dateTime, epochUnit } = convertEpoch(ts);
```

### Validate a user-provided timestamp before processing

```typescript
const userInput = req.body.timestamp;
if (!isValidEpoch(userInput)) {
  return res.status(400).json({ error: 'Invalid timestamp' });
}
const { dateTime } = convertEpoch(Number(userInput));
```

### Show how long ago something happened

```typescript
const { relative } = convertEpoch(event.createdAt);
console.log(`Event created ${relative}`); // "Event created 2 days 4 hours ago"
```

### Parse a date string from a form input

```typescript
// User enters "25/12/2024" in a UK-locale date picker
const { epochInMilliseconds } = parseToEpoch('25/12/2024', 'dd/MM/yyyy', 'Europe/London');
```

### Compute how long a job ran

```typescript
const duration = getDurationBetween(job.startedAt, job.finishedAt);
console.log(`Job ran for ${duration.humanReadable}`);
```

---

## Changelog

### 2.0.1

- **Docs:** Repository, homepage, and bug-tracker URLs now point at the new public single-package repos at [Master4Novice/temporal-transformer](https://github.com/Master4Novice/temporal-transformer) and [Master4Novice/temporal-transformer-codemod](https://github.com/Master4Novice/temporal-transformer-codemod) (previously pointed at a private monorepo).
- **Docs:** Added benchmark suite (`npm run bench`) with results published in [bench/RESULTS.md](./bench/RESULTS.md). Headline: `getEpochUnit` ~170M ops/s, `getDurationBetween` slightly faster than raw Luxon diff, `convertEpoch` 82× slower than raw `Date.toISOString()` (cost of dual-TZ + relative-time).
- **Docs:** New comparison matrix vs moment / dayjs / date-fns / luxon / native `Date` with explicit "when to pick what" guidance.
- **Docs:** Added `SECURITY.md`, `CONTRIBUTING.md`, GitHub issue & PR templates.
- **CI:** Workflow now runs on Ubuntu/macOS/Windows × Node 18/20/22/24.
- **No code changes** — behavior identical to v2.0.0.

### 2.0.0

- **Engine swap:** moment + moment-timezone → [Luxon](https://moment.github.io/luxon/). ~60% smaller bundle (~71 KB vs ~180 KB), no maintenance-mode dependency.
- **Breaking:** Format-string grammar is now Luxon syntax. Use `yyyy-MM-dd` instead of `YYYY-MM-DD`, `cccc` instead of `dddd`, `'literal'` instead of `[literal]`, and so on. Run the migration codemod: `npx @master4n/temporal-transformer-codemod ./src`.
- **Breaking:** Default format is now `'yyyy-MM-dd HH:mm:ss.SSS'` (was `'YYYY-MM-DD HH:mm:ss.SSSSSS'`). JS Date has millisecond precision; the 6-digit fractional was always zero-padded fiction.
- **New error:** `EpochError.FormatInvalid` — thrown when a format string contains a token outside the allowlist. Typos like `'YYYY'` (still moment syntax) now surface immediately instead of producing garbage output.
- **New exports:** `DEFAULT_FORMAT`, `SUPPORTED_FORMAT_TOKENS` (the runtime-enforced allowlist).
- **New companion package:** [`@master4n/temporal-transformer-codemod`](https://www.npmjs.com/package/@master4n/temporal-transformer-codemod) — one-shot CLI that rewrites moment-style format strings in your codebase. Handles greedy token matching, `[literal]` → `'literal'` escape conversion (with proper `''` escaping for embedded quotes), and emits warnings for tokens with no Luxon equivalent (`X`, `x`, `Q`).
- **Requirement:** Node 18+ (for `Intl.supportedValuesOf`).
- **Maintenance:** v1.x stays on npm under the `legacy` dist-tag; install with `npm i @master4n/temporal-transformer@legacy`. Security backports continue on `v1.x-maintenance` for 12 months.

See [MIGRATION.md](./MIGRATION.md) for the full upgrade guide.

### 1.4.0

- **Test infrastructure:** Added golden-test baseline (`test/golden/`) pinning v1.x behavior for the v2.0 parity gate. No runtime behavior changes.

### 1.3.0

- **New (unique):** Result-style safe API — every function has a `safeXxx` counterpart returning `{ ok, value | error }` instead of throwing (8 functions, see [Result-Style Safe API](#result-style-safe-api-unique-feature))
- **New:** `getEpochUnit(epoch)` — standalone helper that returns just the detected `EpochUnit`
- **Security:** Frozen result objects (`Object.freeze`) prevent downstream tampering
- **Security:** `MAX_INPUT_STRING_LENGTH` (256) caps DoS via outsized numeric/date strings — throws `InputTooLong`
- **Security:** `MAX_FORMAT_STRING_LENGTH` (256) caps memory-amplification via format strings — throws `FormatTooLong`
- **Security:** `getEpochNow` validates `Date.now()` against `MIN_EPOCH_MS` / `MAX_EPOCH_MS` and throws `ClockOutOfRange` instead of a raw `RangeError` on a corrupted system clock
- **Security:** `getTimezoneList` returns a defensive copy, preventing mutation of the shared internal array
- **Security:** `parseToEpoch` now rejects non-string input early with `ParseError`
- **Security:** Fallback to `'UTC'` when `moment.tz.guess()` returns an empty string
- **New exports:** `Result<T, E>`, `MAX_EPOCH_MS`, `MIN_EPOCH_MS`, `MAX_INPUT_STRING_LENGTH`, `MAX_FORMAT_STRING_LENGTH`, `EpochThreshold`
- **New errors:** `EpochError.InputTooLong`, `EpochError.FormatTooLong`, `EpochError.ClockOutOfRange`
- **Docs:** New [Security Model](#security-model) section enumerating the threat model and defenses

### 1.2.1

- **Security fix:** `parseToEpoch` now validates input against an allowlist of date-safe characters before passing to moment, preventing HTML/XSS payloads from reaching moment's internal parser and appearing in stderr stack traces
- **Security fix:** `parseToEpoch` without an explicit format now uses strict ISO 8601 parsing (`moment.ISO_8601, true`) instead of moment's lenient auto-detection, eliminating the `js Date()` fallback that could behave inconsistently across environments

### 1.2.0

- **New:** `convertEpochToTimezone` — format epoch in any IANA timezone
- **New:** `parseToEpoch` — parse date strings to epoch with strict, timezone-aware parsing
- **New:** `getDurationBetween` — calendar-accurate duration between two epochs
- **New:** `getTimezoneOffset` — get UTC offset (DST-aware) for any IANA timezone
- **New:** `getTimezoneList` — list all supported IANA timezone names
- **New:** `getEpochNow` — current time as seconds, milliseconds, ISO string, and timezone
- **New:** `formatDuration` — format a duration in ms as a human-readable string
- **New:** `isValidEpoch` / `isValidTimezone` — safe boolean predicates (never throw)
- **New types:** `ParsedDuration`, `EpochNow`, `TimezoneOffset`, `DurationUnit`, `StartEndUnit`
- **New exports:** `EpochUnit` enum, `EpochError` enum, `EpochValidationError` class
- **Fix:** `validateEpoch` no longer crashes on `Infinity`, `-Infinity`, `NaN`, or whitespace-only strings
- **Fix:** Empty-string check now trims whitespace before checking length
- **Deps:** Removed redundant `@types/moment`; moved `typescript` and `@types/node` to `devDependencies`; updated `moment-timezone` to `^0.5.46` and `typescript` to `^5.8.3`

### 1.1.1 and earlier

Initial release — `convertEpoch` and `convertDateToEpoch`.

---

## Contributing

Issues and PRs are welcome at [github.com/Master4Novice/temporal-transformer](https://github.com/Master4Novice/temporal-transformer). The companion codemod lives at [github.com/Master4Novice/temporal-transformer-codemod](https://github.com/Master4Novice/temporal-transformer-codemod).

## Credits

Written by [Master4Novice](https://github.com/Master4Novice).

## License

MIT © [Master4Novice](https://github.com/Master4Novice)
