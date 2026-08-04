# Open Source Readiness — OzzyRM

Specification for keeping the **main package** secure, reliable, and contributor-friendly before shipping (e.g. `0.3.2`).

This is the project checklist. Security threat details live under [`security/`](./security/).

## 1. Goals

| Pillar | Meaning for OzzyRM |
|--------|--------------------|
| **Secure** | Clear trust boundaries; fail-closed validation; no XSS sinks; path confinement; coordinated disclosure |
| **Reliable** | Typecheck + build + security sink scan on every PR; local hooks; maintainer-local tests in `/test` |
| **OSS-ready** | License, CoC, contributing guide, issue/PR templates, CI, auditable deps |

## 2. Required repository artifacts

| Artifact | Status target |
|----------|----------------|
| `LICENSE` (MIT) | Required |
| `README.md` | Install + develop + link to docs |
| `CONTRIBUTING.md` | Required |
| `CODE_OF_CONDUCT.md` | Required |
| `SECURITY.md` | Required (points at `security/REPORTING.md`) |
| `CHANGELOG.md` | Keep updated per release |
| `OPEN_SOURCE.md` (this file) | Maintainer checklist |
| `.github/workflows/ci.yml` | Required |
| `.github/ISSUE_TEMPLATE/*` | Required |
| `.github/PULL_REQUEST_TEMPLATE.md` | Required |
| `.github/CODEOWNERS` | Recommended (fill handles) |
| Husky `pre-commit` / `pre-push` | Required |
| Tracked `scripts/` (build + security checks) | Required |
| `/test`, `/fixtures` | **Gitignored** — internal playground / fixtures (maintainer-only) |

## 3. Quality gates (must stay green)

### Local

| Gate | Command | When |
|------|---------|------|
| Security sinks | `bun run check:security` | pre-commit + CI |
| Typecheck | `bun run typecheck` | pre-push + CI |
| Unit tests | `bun test` (local `/test` only) | pre-push when present; not in public CI |
| Build | `bun run build` | CI (+ `prepublishOnly`) |
| Dependency audit | `bun audit` | CI (warn/fail on high+) |

### CI matrix

- OS: `ubuntu-latest`
- Runtime: Bun (pinned via `oven-sh/setup-bun`)
- Triggers: `pull_request`, `push` to `main`

## 4. Trust & contribution limits (summary)

Hard rejects:

- Executing consumer schema files via dynamic import
- Remote config/schema fetch by default
- `postinstall` that downloads code
- Rendering catalog/schema strings as raw HTML without an approved sanitizer

High scrutiny:

- `src/cli/`, `src/security/`, `src/catalog/`, `src/parsers/`, `src/react/server.ts`

Full rules: [`security/OPEN_SOURCE_SECURITY.md`](./security/OPEN_SOURCE_SECURITY.md).

## 5. Supply chain

- Publish only from a trusted maintainer machine (manual `npm publish`)
- Keep `bun.lock` committed
- Consumers should pin `ozzyrm` in their lockfile
- Review `bun audit` before each release ([`security/CHECKLIST.md`](./security/CHECKLIST.md) §B)

## 6. Pre-release checklist (e.g. before `0.3.x`)

- [ ] All §2 artifacts present and linked from README
- [ ] CI green on `main`
- [ ] `bun test` + `bun run build` clean locally
- [ ] `bun audit` reviewed
- [ ] Security checklist §B completed
- [ ] CHANGELOG entry for the release
- [ ] Version bump in `package.json` (semver)
- [ ] Manual `npm publish --access public` from maintainer account
- [ ] Git tag matches published version
- [ ] CODEOWNERS handles filled (if using required reviews)
- [ ] GitHub Security Advisories enabled on the repo

## 7. Nice-to-have (later)

- Optional release workflow only if maintainers explicitly want CI publish later
- `changesets` or similar for changelog automation
- Coverage report upload (optional threshold)
- Scorecard / Dependabot (or Bun-equivalent) for deps

## 8. Non-goals

- Multi-tenant SaaS hardening for untrusted configs (config import remains **high trust**)
- Shipping the Next.js playground as part of the npm tarball (`files` already limits publish to `dist` + CSS)
