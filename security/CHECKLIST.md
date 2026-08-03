# Security Checklist

Use this checklist for **pull requests**, **releases**, and **consumer integrations**.

## A. Pull request (library)

### Always

- [ ] No new `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function`
- [ ] No new dynamic `import()` of consumer schema files (Drizzle/Prisma/SQL paths)
- [ ] Fail-closed validation preserved for unified + scenarios
- [ ] No datasource URL / secrets written into `DocSchema` or `.ozzyrm/*.json`
- [ ] User-facing strings from schema remain React text (or equivalently escaped)

### If touching CLI / FS / serve

- [ ] Paths cannot escape intended root (`..`, absolute, symlink escape considered)
- [ ] Tests cover rejected traversal / outside-cwd cases
- [ ] Error messages do not dump file contents that may contain secrets

### If touching parsers

- [ ] Drizzle remains AST-only (not executed)
- [ ] SQL/Prisma mapping has fixture or unit coverage for the change
- [ ] Hostile identifiers (`<img>`, quotes) still round-trip safely into catalog

### If touching UI

- [ ] Search/dialogs/overlay do not interpret HTML from catalog
- [ ] `logoSrc` / external URLs documented or scheme-checked
- [ ] Empty states cannot overflow layout in a way that breaks chrome (UX), and still escape text

### If adding dependencies

- [ ] Justification in PR body
- [ ] License compatible with MIT distribution
- [ ] `bun audit` (or npm audit) reviewed for high+ issues
- [ ] No new `postinstall` network scripts

### PR description should include

- [ ] Summary of trust-boundary impact (none / low / high)
- [ ] Test plan
- [ ] Link to relevant `security/` doc section if behavior changes

---

## B. Release / publish

- [ ] Version bump follows semver (security fixes → patch; default trust changes → major)
- [ ] Changelog includes **Security** subsection when applicable
- [ ] `bun run build` clean
- [ ] `bun test` includes security-relevant regressions
- [ ] Audit of production dependencies
- [ ] npm publish from trusted maintainer account only (manual; no CI publish)
- [ ] Tag matches published commit
- [ ] Provenance enabled when available

---

## C. Coordinated vulnerability fix

- [ ] Private branch / advisory draft
- [ ] Minimal fix + regression test
- [ ] Patch release cut
- [ ] Reporter credited (if desired)
- [ ] Public advisory / issue after release (or per embargo)
- [ ] Update [SECURITY_ENHANCEMENTS.md](./SECURITY_ENHANCEMENTS.md) status if it closes an SE-* item

---

## D. Consumer app integrating ozzyrm

- [ ] Docs route behind auth if schema is sensitive
- [ ] `.ozzyrm/` not publicly listed unless intentional
- [ ] Config and `include` paths only edited by trusted engineers
- [ ] No production DB URL required merely to generate docs
- [ ] Generated JSON scanned once for accidental secrets before commit
- [ ] CSP considered on host
- [ ] `ozzyrm` version pinned in lockfile
- [ ] `watch.hot` understood as dev-only trust (stamp import)

---

## E. Quick command helpers

```bash
# forbid common sinks in library source
rg -n "dangerouslySetInnerHTML|innerHTML\s*=|eval\(|new Function" src/

# tests
bun test

# dependency audit (bun)
bun audit
```

Maintainers: treat failures in section A as merge blockers for sensitive paths.
