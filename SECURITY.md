# Security Policy

## Supported Versions

| Version | Supported |
|---|---|
| 2.x | ✅ Active development — security and bug fixes |
| 1.x | ✅ Security backports until **2027-05-25** (`@legacy` dist-tag) |
| < 1.0 | ❌ Not supported |

## Reporting a Vulnerability

**Please do not open a public GitHub issue for security vulnerabilities.** Instead, use one of these private channels:

1. **GitHub Security Advisories** (preferred): https://github.com/Master4Novice/temporal-transformer/security/advisories/new
2. **Email:** a.dwivedispu@gmail.com with subject prefix `[SECURITY temporal-transformer]`

Include in your report:
- The affected version(s)
- A minimal reproduction (code + input)
- The impact you've observed (DoS, data leak, type confusion, etc.)
- Suggested fix, if you have one

We acknowledge reports within **72 hours** and aim to publish a fix within **14 days** for high/critical severity, **30 days** for medium.

## What we treat as a vulnerability

✅ **In scope:**
- Prototype pollution, type confusion, or input handling that bypasses validation
- DoS via outsized inputs that exceed the documented `MAX_INPUT_STRING_LENGTH` / `MAX_FORMAT_STRING_LENGTH` caps
- ReDoS in our regex patterns
- Result-object tampering (frozen-result bypass)
- HTML/XSS payload leakage to stderr or other unintended output
- Format-string parsing that executes arbitrary code or accesses unintended state
- Timezone validation bypass
- Behavior diff between `safeXxx` (no-throw) and `Xxx` (throw) variants for the same input

❌ **Out of scope:**
- Vulnerabilities in transitive dependencies (`luxon`) — report those upstream
- Issues that require a malicious format string passed by trusted developer code (callers who pipe user input into format strings have their own responsibility to escape output for HTML rendering)
- Performance issues that are not amplification attacks (use issues for those)

## Defenses already in place

The library is designed with a zero-trust input model:

- All inputs validated before any library-internal call
- `MAX_INPUT_STRING_LENGTH` (256) and `MAX_FORMAT_STRING_LENGTH` (256) DoS caps
- `parseToEpoch` input goes through a character allowlist before reaching Luxon
- All returned objects are `Object.freeze()`'d
- `getTimezoneList()` returns a defensive copy
- Format-token allowlist (`SUPPORTED_FORMAT_TOKENS`) rejects typos with `FormatInvalid`
- Strict ISO 8601 parsing on `parseToEpoch` (no `js Date()` fallback)
- All regexes are O(n) — no nested quantifiers or backreferences

See [the Security Model section in README.md](./README.md#security-model) for the full threat table.
