# Golden Tests — v2.0 Parity Gate

These tests pin the behavior of v1.x so the v2.0 Luxon backend swap can be verified against a fixed contract.

## Two test files, two contracts

### `parity.test.ts`
Tests that **must produce byte-identical output in both v1.x and v2.0**. They assert on:
- Auto-detect epoch unit values
- Object shapes and frozen-status discipline
- Numeric values (epochs, offsets, ms durations)
- Result-type contracts (the safe API)
- Hardcoded-format internal output (where v1.x moment format and v2.0 Luxon format produce the same string)
- Error codes thrown
- Self-consistency (e.g. epoch-seconds and epoch-ms variants resolving to the same human-readable date)

**If any parity test fails on the v2.0 branch, the swap broke a contract that wasn't documented.**

### `breaking-changes.test.ts`
Tests that snapshot **v1.x output that v2.0 is allowed to break**, cross-referenced to `MIGRATION.md` items B1-B6. These tests will **fail in v2.0** — that's the signal that the documented break landed. The v2.0 PR updates these snapshots to the new expected output.

## Running

The golden tests require `TZ=UTC` for deterministic output. The existing top-level `test` script does **not** set TZ, because legacy tests depend on the developer's local timezone. Run the golden suite with:

```bash
npm run test:golden
```

This sets `TZ=UTC` and runs only files under `test/golden/`. A `beforeAll` hook fails fast with a clear message if the TZ env is not UTC.

## Fixtures

All fixed epochs and dates live in `fixtures.ts` — single source of truth. Reach for an existing fixture before adding a new one.
