# Open Source Security — Contribution Limits & Approach

How OzzyRM handles **security-related open source contributions**: what is welcome, what is restricted, how reviews work, and how supply chain risk is managed.

## 1. Philosophy

OzzyRM is open source and accepts contributions. Security-sensitive areas are **high-scrutiny**, not closed. We optimize for:

1. **Safe defaults** for a trusted-host docs toolkit
2. **Transparent trust boundaries** (especially config dynamic import)
3. **No drive-by RCE/XSS** via “helpful” features
4. **Coordinated disclosure** for vulnerabilities

We do **not** pretend config import is sandboxed. Contributions that claim to “run untrusted configs safely” without a real isolation design will be rejected.

## 2. Contribution approach (security lens)

| Contribution type | Approach |
|-------------------|----------|
| Bug fix with regression test | Welcome — normal review + checklist |
| Fail-closed validation improvement | Welcome |
| Path confinement / redaction / limits | Welcome — preferred security PRs |
| New parser features | Welcome — must not execute user TS/SQL |
| New UI rendering of descriptions as HTML/Markdown | **Restricted** — needs sanitizer design + security review |
| Dynamic import of user schema files | **Rejected** |
| Remote URL `include` / remote config fetch | **Rejected** by default |
| `postinstall` network download | **Rejected** |
| Dependency major bumps of `@prisma/internals`, React, xyflow | Allowed with changelog + audit notes |
| Expanding `ozzyrm serve` without path tests | **Blocked** until SE-01 addressed |

## 3. Hard restrictions (will reject or request redesign)

### 3.1 Execution

- Do not `import()` / `require()` consumer Drizzle/Prisma schema paths as runnable modules for documentation.
- Do not add `eval`, `new Function`, VM2/isolated-vm “quick sandboxes” without maintainer-led design.
- Do not fetch and `eval` remote config.

### 3.2 Injection

- Do not add `dangerouslySetInnerHTML` for model descriptions, comments, or SQL.
- If Markdown rendering is proposed: mandatory allowlist sanitizer (e.g. hardened markdown pipeline), XSS fixtures, and security owner approval.

### 3.3 Filesystem

- Do not weaken path checks once `restrictPathsToCwd` / serve confinement exists.
- Do not default `output` to locations outside the project.
- Do not add world-writable temp dirs for catalog exchange.

### 3.4 Secrets

- Do not persist datasource URLs, passwords, tokens into `DocSchema` or `.ozzyrm/*.json`.
- Do not add debug flags that dump Prisma `getConfig` secrets to stdout by default.

### 3.5 Social / process

- Do not open public GitHub issues with full weaponized exploits against unfixed serve/traversal bugs — use [REPORTING.md](./REPORTING.md).
- Do not demand CVE assignment as a condition of a small docs typo PR.

## 4. Soft limits (allowed with extra review)

| Topic | Extra requirements |
|-------|-------------------|
| Changing `loadConfigFile` | Threat model note + why dynamic import remains |
| Watch / hot stamp | Prefer non-JS stamp; tests for malicious file content |
| CLI new commands that read FS | Path confinement tests |
| New npm dependencies | Justification, license, `bun audit`, size impact |
| Changing error overlay / portal UI | No HTML injection; copy path stays text |
| Scenario / unified validation changes | Must remain fail-closed; update diagnostics docs |

## 5. Review gates

### 5.1 Automatic expectations for PRs touching sensitive paths

Sensitive paths (see [SECURITY_GUIDELINES.md](./SECURITY_GUIDELINES.md) §4) require:

1. [CHECKLIST.md](./CHECKLIST.md) completed in the PR description
2. At least one maintainer review focused on security
3. Tests for the failure mode being fixed (when applicable)

### 5.2 Recommended CODEOWNERS pattern

When the repo enables CODEOWNERS, suggest:

```text
/security/ @maintainers
/src/catalog/ @maintainers
/src/cli/ @maintainers
/src/parsers/ @maintainers
/src/react/server.ts @maintainers
```

(Adjust GitHub handles when the project formalizes ownership.)

### 5.3 Security review subagent / human

- Human review is authoritative.
- Optional: Cursor `/review-security` or equivalent on the PR branch before merge for sensitive changes.
- Findings must be addressed or explicitly waived with rationale.

## 6. Acceptable security contribution recipes

Good PR titles:

- `fix(cli): confine serve paths to root`
- `test(catalog): assert datasource url not persisted`
- `feat(security): restrict include paths to cwd`
- `chore(ci): forbid dangerouslySetInnerHTML`

Include:

- Threat / impact blurb (3–5 lines)
- Test plan
- Any trust-model change called out for MAJOR vs MINOR semver

## 7. Supply chain approach

1. **Publish:** maintainers-only npm publish; prefer CI with provenance when available.
2. **Lockfiles:** keep `bun.lock` / consumer lockfiles honest; document that apps should pin `ozzyrm`.
3. **Dependencies:** minimize; Prisma internals are necessary evil — track upstream advisories.
4. **Typosquat:** official name is `ozzyrm` only; warn in docs about similarly named packages.
5. **Releases:** security fixes get patch versions; note `Security` section in changelog.

## 8. What contributors should not expect

- OzzyRM will not become a multi-tenant “upload schema, we sandbox it” SaaS without a separate product design.
- OzzyRM will not remove config dynamic import without an equally ergonomic alternative.
- Not every security suggestion becomes default-on in a minor release if it breaks monorepo path layouts — may wait for a major + migration note.

## 9. License and disclosure interaction

- Contributions are under the repository license (MIT unless changed).
- Vulnerability reports are **not** required to be MIT-licensed code — reports can be private.
- Embargoed fixes may land in private forks/branches until disclosure date.

## 10. Summary matrix

| Action | Public PR OK? | Private report? | Needs security owner? |
|--------|---------------|-----------------|------------------------|
| Fix serve traversal + tests | Yes | Optional | Yes |
| Add HTML markdown descriptions | Only with design doc | If exploit exists | Yes |
| Remote include URLs | No | N/A | N/A (reject) |
| Fail-closed scenario codes | Yes | No | No (normal review) |
| Full RCE exploit write-up | No (use reporting) | Yes | Yes |
