# Contributing to OzzyRM

Thanks for contributing. OzzyRM is an open-source schema documentation toolkit (Prisma, Drizzle, raw SQL). Please read this before opening a PR.

## Quick start

```bash
bun install
bun run typecheck
bun run build
# optional (maintainer-local /test):
# bun test
```

Requirements:

- [Bun](https://bun.sh) (CI uses the latest stable Bun)
- Node is not required for library build beyond what Bun provides

### Playground (optional, gitignored)

`test/` and `fixtures/` are **internal** — not committed. Maintainers use them locally:

```bash
cd test
bun install   # runs link:local
bun run dev
```

## Workflow

1. Open an issue (or discuss on an existing one) for non-trivial changes
2. Fork + branch from `main` (`feat/…`, `fix/…`, `docs/…`, `chore/…`)
3. Keep PRs focused — one concern per PR when possible
4. Fill the PR template (summary, test plan, security checklist when relevant)
5. Ensure local hooks + CI are green

### Local git hooks (Husky)

After `bun install`, Husky installs hooks automatically (`prepare`):

| Hook | Runs |
|------|------|
| **pre-commit** | `bun run check:security` (forbidden sinks in `src/`) |
| **pre-push** | `typecheck`; runs `bun test` only if local `/test` exists |

Skip only when you have a strong reason (`HUSKY=0`); CI still enforces the same gates.

## What we accept

| Area | Guidance |
|------|----------|
| Bug fixes + regression tests | Welcome |
| Parser / catalog / fail-closed validation | Welcome |
| Docs, examples, typo fixes | Welcome |
| New UI that renders schema text as HTML/Markdown | Restricted — needs sanitizer design |
| Dynamic `import()` of consumer schema files | Rejected |
| Remote URL `include` / config fetch | Rejected by default |
| New `postinstall` network scripts | Rejected |

Security-sensitive paths need extra review — see [`security/OPEN_SOURCE_SECURITY.md`](./security/OPEN_SOURCE_SECURITY.md) and [`security/CHECKLIST.md`](./security/CHECKLIST.md).

## Code standards

- TypeScript strict; match existing module layout (`catalog`, `parsers`, `cli`, `security`, `ui`, `react`)
- Prefer small, focused functions; fail closed on validation
- No `dangerouslySetInnerHTML`, `eval`, or `new Function` in library source
- User-facing schema strings stay React text (escaped)
- New dependencies: justify in the PR, MIT-compatible license, run `bun audit`
- Use Bun for scripts and tests (`bun test`, not Jest)

## Tests

Unit tests and the Next playground live under gitignored `/test` (maintainer-only). Public CI does not require them.

```bash
bun test              # when /test exists locally
bun run test:security
```

## Commit messages

Prefer conventional commits:

```text
feat(catalog): fail closed on duplicate enum identity
fix(cli): confine serve paths to root
docs(security): clarify stamp allowlist
chore(ci): tighten security sink checks
```

## Release / publish

Maintainers only. Do not publish from forks.

- Semver: security fixes → patch; trust-model changes → major when needed
- Publish **manually** from a trusted maintainer machine (`npm publish --access public`)
- `prepublishOnly` runs the local CI gate (`check:security` + typecheck + build) before publish
- Tag the release commit after a successful publish

## Need help?

- Product / architecture context: [`context/`](./context/)
- Security: [`SECURITY.md`](./SECURITY.md), [`security/`](./security/)
- Open-source readiness checklist: [`OPEN_SOURCE.md`](./OPEN_SOURCE.md)
