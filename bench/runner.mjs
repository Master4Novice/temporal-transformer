// Self-contained benchmark harness — no external deps. Uses process.hrtime.bigint()
// for nanosecond resolution and batched timing to amortize clock overhead.

import { hrtime } from 'node:process';

/**
 * Run a benchmark.
 *
 * @param {string} name
 * @param {() => void} fn       The operation to measure.
 * @param {object} [opts]
 * @param {number} [opts.warmupMs=500]  Warmup duration before timed samples start.
 * @param {number} [opts.runMs=2000]    Total measurement duration.
 * @param {number} [opts.batchSize=200] Calls per sample. Larger amortizes clock overhead;
 *                                       smaller gives more samples for percentile stability.
 * @returns {{name: string, opsPerSec: number, meanNs: number, medianNs: number, p99Ns: number, samples: number, iterations: number}}
 */
export function benchmark(name, fn, opts = {}) {
  const { warmupMs = 500, runMs = 2000, batchSize = 200 } = opts;

  // Warm up: trigger JIT, fill caches, settle inline caches.
  const warmupEnd = Date.now() + warmupMs;
  while (Date.now() < warmupEnd) {
    for (let i = 0; i < batchSize; i++) fn();
  }

  // Measure.
  const samples = [];
  const runEnd = Date.now() + runMs;
  while (Date.now() < runEnd) {
    const start = hrtime.bigint();
    for (let i = 0; i < batchSize; i++) fn();
    const elapsed = hrtime.bigint() - start;
    samples.push(Number(elapsed) / batchSize); // per-call ns
  }

  samples.sort((a, b) => a - b);
  const mean = samples.reduce((s, x) => s + x, 0) / samples.length;
  const median = samples[Math.floor(samples.length / 2)];
  const p99 = samples[Math.floor(samples.length * 0.99)];

  return {
    name,
    opsPerSec: 1e9 / mean,
    meanNs: mean,
    medianNs: median,
    p99Ns: p99,
    samples: samples.length,
    iterations: samples.length * batchSize,
  };
}

const NS_PER_US = 1000;
const NS_PER_MS = 1_000_000;

export function fmtTime(ns) {
  if (ns < NS_PER_US) return `${ns.toFixed(0)} ns`;
  if (ns < NS_PER_MS) return `${(ns / NS_PER_US).toFixed(2)} µs`;
  return `${(ns / NS_PER_MS).toFixed(3)} ms`;
}

export function fmtOps(opsPerSec) {
  if (opsPerSec >= 1e6) return `${(opsPerSec / 1e6).toFixed(2)}M ops/s`;
  if (opsPerSec >= 1e3) return `${(opsPerSec / 1e3).toFixed(0)}K ops/s`;
  return `${opsPerSec.toFixed(0)} ops/s`;
}

export function fmtRatio(slow, fast) {
  const r = slow.meanNs / fast.meanNs;
  return r >= 1 ? `${r.toFixed(1)}× slower` : `${(1 / r).toFixed(1)}× faster`;
}
