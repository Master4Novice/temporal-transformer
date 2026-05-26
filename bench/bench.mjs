// Benchmark suite for @master4n/temporal-transformer.
//
// Three baselines per scenario:
//   1. Native JS (new Date / Date.now / arithmetic) — the absolute floor.
//   2. Raw Luxon (DateTime.fromMillis / fromISO / toFormat) — the cost without our wrapper.
//   3. This library — what users actually pay.
//
// Run: npm run bench  (builds first, then executes)
// Outputs to stdout AND writes bench/RESULTS.md so README can link to it.

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DateTime } from 'luxon';
import {
  convertEpoch,
  convertEpochToTimezone,
  parseToEpoch,
  getDurationBetween,
  getEpochUnit,
  getTimezoneOffset,
  isValidEpoch,
  safeConvertEpoch,
} from '../dist/esm/index.js';
import { benchmark, fmtTime, fmtOps, fmtRatio } from './runner.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

const EPOCH_MS = 1622547800000;
const EPOCH_S = 1622547800;
const ISO = '2021-06-01T11:43:20Z';
const FROM_MS = 1609459200000;
const TO_MS = EPOCH_MS;
const LUXON_FMT = 'yyyy-MM-dd HH:mm:ss.SSS';
const TZ = 'Asia/Kolkata';

// ── Scenarios ──────────────────────────────────────────────────────────────

const scenarios = [
  {
    title: 'convert epoch → formatted date',
    description: 'Default-format conversion. Library uses dual-TZ output (local + GMT) plus relative-time computation; baselines do single-TZ ISO output only.',
    rows: [
      {
        label: 'new Date(ms).toISOString()',
        kind: 'baseline',
        fn: () => { new Date(EPOCH_MS).toISOString(); },
      },
      {
        label: 'DateTime.fromMillis(ms).toFormat(...)',
        kind: 'luxon',
        fn: () => { DateTime.fromMillis(EPOCH_MS).toFormat(LUXON_FMT); },
      },
      {
        label: 'convertEpoch(ms)',
        kind: 'library',
        fn: () => { convertEpoch(EPOCH_MS); },
      },
    ],
  },
  {
    title: 'convert epoch → formatted date in specific timezone',
    description: 'Single-TZ formatted output. The wrapper is much thinner here.',
    rows: [
      {
        label: 'DateTime.fromMillis(ms,{zone}).toFormat(...)',
        kind: 'luxon',
        fn: () => { DateTime.fromMillis(EPOCH_MS, { zone: TZ }).toFormat(LUXON_FMT); },
      },
      {
        label: 'convertEpochToTimezone(ms, tz)',
        kind: 'library',
        fn: () => { convertEpochToTimezone(EPOCH_MS, TZ, LUXON_FMT); },
      },
    ],
  },
  {
    title: 'parse ISO 8601 string → epoch',
    description: 'Strict ISO parsing. Library adds input-allowlist + length-cap checks.',
    rows: [
      {
        label: 'new Date(iso).getTime()',
        kind: 'baseline',
        fn: () => { new Date(ISO).getTime(); },
      },
      {
        label: 'DateTime.fromISO(iso).toMillis()',
        kind: 'luxon',
        fn: () => { DateTime.fromISO(ISO).toMillis(); },
      },
      {
        label: 'parseToEpoch(iso, undefined, \'UTC\')',
        kind: 'library',
        fn: () => { parseToEpoch(ISO, undefined, 'UTC'); },
      },
    ],
  },
  {
    title: 'calendar-accurate duration between two epochs',
    description: 'Raw arithmetic is fastest but gives only ms. Luxon computes years/months/days. Library wraps + freezes + builds humanReadable string.',
    rows: [
      {
        label: 'to - from (ms diff only)',
        kind: 'baseline',
        fn: () => { const _x = TO_MS - FROM_MS; void _x; },
      },
      {
        label: 'Luxon DateTime.diff(units)',
        kind: 'luxon',
        fn: () => {
          DateTime.fromMillis(TO_MS).diff(
            DateTime.fromMillis(FROM_MS),
            ['years', 'months', 'days', 'hours', 'minutes', 'seconds', 'milliseconds'],
          ).toObject();
        },
      },
      {
        label: 'getDurationBetween(from, to)',
        kind: 'library',
        fn: () => { getDurationBetween(FROM_MS, TO_MS); },
      },
    ],
  },
  {
    title: 'auto-detect epoch unit (the unique feature)',
    description: 'No direct baseline — auto-detection is what this library uniquely does.',
    rows: [
      {
        label: 'getEpochUnit(ms)',
        kind: 'library',
        fn: () => { getEpochUnit(EPOCH_MS); },
      },
      {
        label: 'getEpochUnit(s) [seconds-scale input]',
        kind: 'library',
        fn: () => { getEpochUnit(EPOCH_S); },
      },
      {
        label: 'getEpochUnit(\'1622547800000\') [string input]',
        kind: 'library',
        fn: () => { getEpochUnit('1622547800000'); },
      },
    ],
  },
  {
    title: 'timezone offset lookup',
    description: 'Cheap operation — measures the validTimezone + Luxon offset call.',
    rows: [
      {
        label: 'DateTime.now().setZone(tz).offset',
        kind: 'luxon',
        fn: () => { DateTime.now().setZone(TZ).offset; },
      },
      {
        label: 'getTimezoneOffset(tz)',
        kind: 'library',
        fn: () => { getTimezoneOffset(TZ); },
      },
    ],
  },
  {
    title: 'safe predicate isValidEpoch',
    description: 'No-throw boolean check. Trivial JS alternative misses the auto-detect range check.',
    rows: [
      {
        label: 'typeof === \'number\' && isFinite && !isNaN',
        kind: 'baseline',
        fn: () => {
          const x = EPOCH_MS;
          const _r = typeof x === 'number' && isFinite(x) && !isNaN(x);
          void _r;
        },
      },
      {
        label: 'isValidEpoch(ms)',
        kind: 'library',
        fn: () => { isValidEpoch(EPOCH_MS); },
      },
    ],
  },
  {
    title: 'Result-style API on error path',
    description: 'safeConvertEpoch wraps a try/catch around the throwing variant. Cost of the error branch.',
    rows: [
      {
        label: 'safeConvertEpoch(null) [error branch]',
        kind: 'library',
        fn: () => { safeConvertEpoch(null); },
      },
      {
        label: 'safeConvertEpoch(ms) [success branch]',
        kind: 'library',
        fn: () => { safeConvertEpoch(EPOCH_MS); },
      },
    ],
  },
];

// ── Execution ──────────────────────────────────────────────────────────────

function envInfo() {
  return {
    node: process.version,
    platform: `${process.platform} ${process.arch}`,
    date: new Date().toISOString(),
  };
}

const env = envInfo();
const results = [];

process.stdout.write(`\n=== @master4n/temporal-transformer benchmarks ===\n`);
process.stdout.write(`Node ${env.node}, ${env.platform}, ${env.date}\n`);
process.stdout.write(`Each scenario: 500ms warmup, 2000ms measurement, batch=200.\n\n`);

for (const scenario of scenarios) {
  process.stdout.write(`── ${scenario.title}\n`);
  const scenarioResults = scenario.rows.map((row) => {
    const r = benchmark(row.label, row.fn);
    return { ...row, ...r };
  });
  const fastest = scenarioResults.reduce((a, b) => (a.meanNs < b.meanNs ? a : b));
  for (const r of scenarioResults) {
    const isLib = r.kind === 'library';
    const ratio = r === fastest ? '   (fastest)' : `  ${fmtRatio(r, fastest)}`;
    process.stdout.write(
      `  ${isLib ? '★' : ' '} ${r.label.padEnd(48)} ${fmtOps(r.opsPerSec).padStart(14)}   ${fmtTime(r.meanNs).padStart(10)}${ratio}\n`,
    );
  }
  process.stdout.write('\n');
  results.push({ scenario, rows: scenarioResults, fastest });
}

// ── Write RESULTS.md ───────────────────────────────────────────────────────

const md = [];
md.push(`# Benchmark Results`);
md.push('');
md.push(`> Generated by \`npm run bench\`. Numbers reflect a single run on the listed environment — your mileage will vary.`);
md.push('');
md.push(`**Environment:** Node ${env.node}, ${env.platform}`);
md.push(`**Date:** ${env.date}`);
md.push(`**Methodology:** 500ms warmup, 2000ms measurement window, 200 calls per sample using \`process.hrtime.bigint()\`. Reported as mean of all samples; ops/sec derived from mean.`);
md.push('');
md.push('Run yourself with:');
md.push('');
md.push('```bash');
md.push('git clone https://github.com/Master4Novice/temporal-transformer.git');
md.push('cd temporal-transformer');
md.push('npm install && npm run bench');
md.push('```');
md.push('');

for (const { scenario, rows, fastest } of results) {
  md.push(`## ${scenario.title}`);
  md.push('');
  md.push(scenario.description);
  md.push('');
  md.push('| Implementation | ops/sec | mean | median | p99 | vs fastest |');
  md.push('|---|---:|---:|---:|---:|---:|');
  for (const r of rows) {
    const isLib = r.kind === 'library';
    const label = isLib ? `**${r.label}**` : `\`${r.label}\``;
    const cmp = r === fastest ? '— (fastest)' : fmtRatio(r, fastest);
    md.push(
      `| ${label} | ${fmtOps(r.opsPerSec)} | ${fmtTime(r.meanNs)} | ${fmtTime(r.medianNs)} | ${fmtTime(r.p99Ns)} | ${cmp} |`,
    );
  }
  md.push('');
}

md.push('## What this means in practice');
md.push('');
md.push('| Use case | Verdict |');
md.push('|---|---|');
md.push('| **Backend ingest / API endpoints** — 100s to 10K timestamps per second | Performance is irrelevant; the library is plenty fast. |');
md.push('| **Per-request formatting** — a handful of calls per HTTP request | Per-call cost is negligible against network/DB latency. |');
md.push('| **Batch processing** — 100K+ timestamps per second | Costs become visible. Prefer raw Luxon or native `Date` in the hot path; use the library at the boundary for validation/auto-detect. |');
md.push('| **Frontend display** — a few timestamps in a UI | Imperceptible. |');
md.push('| **CSV/JSON exports** of millions of rows | Use the auto-detect once to determine the unit, then process in a tight raw-`Date` loop. |');
md.push('');
md.push('The library is a *validation + ergonomics layer*, not a hot-path date primitive. Its value is correctness (auto-detect, security guards, frozen results, Result API), not throughput.');

writeFileSync(join(__dirname, 'RESULTS.md'), md.join('\n') + '\n');
process.stdout.write(`\nResults written to bench/RESULTS.md\n`);
