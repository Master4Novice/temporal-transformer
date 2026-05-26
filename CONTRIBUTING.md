# Contributing to @master4n/temporal-transformer

Thanks for considering a contribution. This document is short on purpose — read it once, then get to it.

## Quick start

```bash
git clone https://github.com/Master4Novice/temporal-transformer.git
cd temporal-transformer
npm install

npm test                    # 118 default tests
npm run test:golden         # 74 parity tests (TZ=UTC enforced)
npm run build               # produces dist/ (ESM + CJS)
npm run bench               # ~20s, writes bench/RESULTS.md
```

## What we accept

- **Bug fixes** with a failing test added in the same PR.
- **New features that fit the library's purpose**: epoch ↔ date conversion, IANA timezone work, calendar duration, the Result-API pattern.
- **Performance improvements** with a `before/after` benchmark run.
- **Documentation improvements** — clarifications, recipes, fixing typos.
- **Test coverage improvements** — esp. for edge cases not currently pinned by the golden suite.

## What we don't accept

- Breaking changes outside a major version bump.
- New direct dependencies. Luxon is the only runtime dep, and that line is held.
- API surface growth for niche use cases that can be done in 2 lines of Luxon directly.
- Reintroducing moment.js (the v2.0 migration is final).

## Architectural rules

1. **Public API surface is sacred.** Every exported function signature is a contract. Type-level changes need a major version bump.
2. **All returned objects are `Object.freeze()`'d.** Mutability is not a feature.
3. **No silent defaults.** Every input is validated; every error throws an `EpochValidationError` with a specific `EpochError` code.
4. **Safe variants pair every throwing function.** If you add `xFoo()`, you also add `safeFoo()` returning `Result<T>`.
5. **Tests use TZ-explicit calls** wherever a hardcoded timezone matters. Golden tests enforce `TZ=UTC` via `beforeAll`.

## PR checklist

- [ ] `npm test` passes on Node 18, 20, 22, 24 (CI runs all four)
- [ ] `npm run test:golden` passes (parity gate)
- [ ] `npm run build` is clean
- [ ] New public API has a TypeScript type, a docstring, and a README entry
- [ ] New public API has both throwing and `safeXxx` variants
- [ ] Added tests pin the new behavior — both happy path and at least two error paths
- [ ] Benchmark added or updated if the change affects a hot path
- [ ] CHANGELOG entry in the README's `## Changelog` section

## Versioning

We follow [semver](https://semver.org/) strictly post-v2.0:
- **patch** (`2.0.x`): bug fixes, doc updates, test additions
- **minor** (`2.x.0`): new functions/types/constants — never breaking
- **major** (`x.0.0`): breaking type changes, removed functions, changed defaults

If a PR feels in-between, default to the safer (larger) bump.

## Security issues

See [SECURITY.md](./SECURITY.md). Do not open public issues for vulnerabilities.

## Code of Conduct

Be kind. Disagree with the technical content, not the person. Repeated personal attacks get the contributor blocked from the repo.
