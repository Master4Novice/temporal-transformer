# Migrating from v1.x to v2.0

`@master4n/temporal-transformer@2.0.0` swaps its internal date engine from `moment.js` + `moment-timezone` to [Luxon](https://moment.github.io/luxon/). The public API surface is **identical** — every function, type, error code, constant, and safe variant from v1.x still exists with the same signature.

What changed is **the format-string grammar**, the **default format**, and a handful of behavioral edge cases. This file enumerates each break and shows you the upgrade path.

---

## TL;DR — three steps

```bash
# 1. Update the dependency
npm install @master4n/temporal-transformer@2

# 2. Run the codemod on your source tree (this rewrites format strings)
npx @master4n/temporal-transformer-codemod ./src

# 3. Test. Most code now works unchanged.
```

If you cannot upgrade today, pin to v1.x:

```bash
npm install @master4n/temporal-transformer@legacy
```

The `legacy` dist-tag points to `v1.4.0` (the last moment-backed release). Security backports continue on `v1.x-maintenance` for 12 months.

---

## Why v2.0?

| Metric | v1.x | v2.0 |
|---|---|---|
| Engine | moment + moment-timezone | luxon |
| Bundle size (min) | ~180 KB | ~71 KB |
| Maintenance status | moment is officially in maintenance mode | luxon is actively maintained by the same authors |
| TZ database source | bundled with moment-timezone | the runtime's `Intl` API |
| Default-output format | `YYYY-MM-DD HH:mm:ss.SSSSSS` (6-digit fractional fiction) | `yyyy-MM-dd HH:mm:ss.SSS` (3-digit, JS Date precision) |

---

## Breaking changes

### B1 — Default format

| | |
|---|---|
| **v1.x** | `'YYYY-MM-DD HH:mm:ss.SSSSSS'` |
| **v2.0** | `'yyyy-MM-dd HH:mm:ss.SSS'` |

**Why:** JavaScript `Date` has millisecond precision. The 6-digit fractional was always `'000000'`. Luxon's `S` token caps at 3 digits, which matches the actual precision.

```ts
convertEpoch(1622547800000).dateTimeInGMT
// v1.x: '2021-06-01 11:43:20.000000'
// v2.0: '2021-06-01 11:43:20.000'
```

If your code compares default-format output as a string, update the snapshot or pass the format explicitly. The codemod **does** translate the default format if it appears in your callers' code.

---

### B2 — Format token grammar

v1.x used **moment.js** tokens. v2.0 uses **Luxon** tokens. The library now rejects unknown tokens with `EpochError.FormatInvalid`.

Token translation table:

| moment v1.x | Luxon v2.0 | Meaning |
|---|---|---|
| `YYYY` | `yyyy` | 4-digit year |
| `YY` | `yy` | 2-digit year |
| `MM` | `MM` | 2-digit month — **unchanged** |
| `MMM` | `LLL` | Short month name (Jan) |
| `MMMM` | `LLLL` | Full month name (January) |
| `DD` | `dd` | 2-digit day of month |
| `D` | `d` | day of month |
| `dddd` | `cccc` | Full weekday name (Tuesday) |
| `ddd` | `ccc` | Short weekday name (Tue) |
| `HH` | `HH` | 24-hour (unchanged) |
| `hh` | `hh` | 12-hour (unchanged) |
| `mm` | `mm` | minute (unchanged) |
| `ss` | `ss` | second (unchanged) |
| `SSSSSS`, `SSSSS`, `SSSS` | `SSS` | Fractional seconds — capped at 3 |
| `SSS` | `SSS` | Fractional seconds (unchanged) |
| `A` | `a` | AM/PM |
| `Z` | `ZZ` | Offset like `+05:30` |

The codemod handles all entries in this table automatically. Run it once and your callers move to v2.0 syntax in one diff.

---

### B3 — Literal escape syntax

| | |
|---|---|
| **v1.x** | `[literal text]` |
| **v2.0** | `'literal text'` (single quotes; doubled to escape `'`) |

```ts
// v1.x
convertEpochToTimezone(epoch, 'UTC', '[Date:] YYYY-MM-DD');
// v2.0
convertEpochToTimezone(epoch, 'UTC', "'Date:' yyyy-MM-dd");
```

The codemod converts `[...]` → `'...'` and doubles any embedded apostrophes (`[don't]` → `'don''t'`).

---

### B4 — `getTimezoneList()` source

v1.x returned moment-timezone's bundled list (~597 zones). v2.0 returns the runtime's `Intl.supportedValuesOf('timeZone')` list (~419 zones on older Node ICU bundles) **plus a curated set of modern canonical IANA names** that older ICU still returns as legacy aliases (e.g. `Asia/Kolkata` is always present even when ICU only knows it as `Asia/Calcutta`).

**Impact:** If your code iterates the list to render a picker, the order and count differ. If your code validates user input against the list, well-known names still resolve via the secondary Luxon-backed check in `validTimezone`.

---

### B5 — DST ambiguous-time behavior

v1.x (moment) silently picked one interpretation for ambiguous local times (e.g. the "fall back" overlap when 02:30 happens twice). v2.0 (Luxon) throws on truly ambiguous parses.

If your code parses local times near DST transitions, wrap calls in `safeParseToEpoch` and handle the error case explicitly.

---

### B6 — Removed moment-only tokens

`X` (unix seconds), `x` (unix milliseconds), `Q` (quarter), `GGGG`, `gggg`, `W`, `WW`, `Wo`, and similar moment-only tokens are **not** in the v2.0 allowlist. They throw `EpochError.FormatInvalid`.

Use the dedicated API instead:

```ts
// v1.x
convertEpochToTimezone(epoch, 'UTC', 'X')      // '1622547800'
convertEpochToTimezone(epoch, 'UTC', 'x')      // '1622547800000'

// v2.0
parseToEpoch(input).epochInSeconds              // 1622547800
parseToEpoch(input).epochInMilliseconds         // 1622547800000
// or:
convertEpoch(epoch).epoch                       // original input preserved
```

The codemod **does not** auto-translate these — it leaves the format string unchanged and emits a stderr warning so you can decide what to do per call.

---

## What does NOT change

Everything else. As a sanity-check, all of the following stay identical between v1.x and v2.0:

- Every function signature
- Every TypeScript type (`EpochToDate`, `DateToEpoch`, `ParsedDuration`, `EpochNow`, `TimezoneOffset`, `Result<T>`)
- Every error code (`EpochError.*`) and the `EpochValidationError` class
- The auto-detect epoch unit logic (seconds/ms/µs/ns)
- The safe Result-style API (8 wrappers)
- `Object.freeze()` on every returned object
- Input length caps (`MAX_INPUT_STRING_LENGTH`, `MAX_FORMAT_STRING_LENGTH`)
- All security defenses (allowlist for `parseToEpoch` input, prototype-pollution defense, etc.)
- `EpochThreshold` magnitude boundaries
- Numeric output (`epochInSeconds`, `epochInMilliseconds`, `offsetMinutes`, etc.)
- `getRelativeTimeDifference` output strings (pure JS, never used moment)
- `formatDuration` output for any given millisecond input

If any of these change for your code, that's a bug — please file an issue.

---

## Codemod cheat sheet

```bash
# Preview without modifying
npx @master4n/temporal-transformer-codemod --dry ./src

# Apply
npx @master4n/temporal-transformer-codemod ./src

# Multiple paths
npx @master4n/temporal-transformer-codemod ./src ./test ./scripts
```

The codemod rewrites format-string literals (StringLiteral / Literal AST nodes) inside calls to these functions:

- `convertEpoch(epoch, format)`
- `convertEpochToTimezone(epoch, tz, format)`
- `parseToEpoch(input, format, tz)`
- `safeConvertEpoch`, `safeConvertEpochToTimezone`, `safeParseToEpoch`

It does **not** rewrite:

- Dynamic format strings (template literals, identifier references) — those need a manual review.
- Format strings inside member-expression calls on objects that happen to have the same method name — only the bare identifier form is matched.
- `X`, `x`, `Q`, and other untranslatable tokens — these are left as-is with a stderr warning.

---

## Maintenance window for v1.x

| Tag | Version | Status |
|---|---|---|
| `latest` | `@master4n/temporal-transformer@2.x` | Active development |
| `legacy` | `@master4n/temporal-transformer@1.4.0` | Security-only backports until **2027-05-25** |

After the 12-month window the `legacy` tag will not receive further updates.

---

## Reporting issues

If the codemod miscompiles a format string, or v2.0 breaks something not listed here, open an issue at [github.com/Master4Novice/temporal-transformer/issues](https://github.com/Master4Novice/temporal-transformer/issues) with a minimal repro.
