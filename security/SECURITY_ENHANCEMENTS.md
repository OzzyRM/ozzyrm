# Security Enhancements

Prioritized hardening and security feature roadmap for OzzyRM. Items are enhancements relative to the current trusted-host design — not a claim that the library is “insecure by default” for its intended use.

## Priority legend

| Priority | Meaning |
|----------|---------|
| P0 | Fix soon — exploitable in documented CLI/serve flows or clear data leak |
| P1 | Strong hardening for real consumer deployments |
| P2 | Defense in depth / enterprise niceties |
| P3 | Research / optional sandboxing |

---

## P0 — Critical / near-term

### 1. Confine `ozzyrm serve` to root

**Problem:** Static serve that joins `root + pathname` without rejecting `..` allows path traversal.

**Enhancement:**

- Resolve the candidate path, then ensure `resolved === root || resolved.startsWith(root + sep)`.
- Reject absolute pathnames and null bytes.
- Add unit tests for `../etc/passwd`-style requests.
- Return `404`/`403` without leaking filesystem errors.

**Files:** `src/cli/serve.ts`, new tests under `test/` or `src/cli/`.

### 2. Redaction audit for datasource URLs

**Problem:** Prisma internals may expose URLs during parse; future mapping bugs could persist them.

**Enhancement:**

- Central `sanitizeDataSource()` that only allows `provider` (and maybe `name`) into `DocSchema`.
- Snapshot/unit test: fixture schema with `url = env("DATABASE_URL")` → catalog JSON has no `postgresql://` / `mysql://` / password-like substrings.
- Document guarantee in README + this folder.

### 3. Regression tests for XSS-ish strings

**Problem:** Schema identifiers can contain quotes, `<`, `onerror=` etc.

**Enhancement:**

- Fixtures with aggressive names/descriptions.
- Assert UI mount path only uses text nodes (or DOM does not contain raw `<script>` from field names).
- Keep React escaping; add lint rule / code search CI for `dangerouslySetInnerHTML`.

---

## P1 — High value hardening

### 4. Optional project-root allowlist for `include` / `output`

**Config sketch:**

```ts
defineProject({
  security: {
    restrictPathsToCwd: true, // default true in a future major?
  },
  schemas: [prisma({ id: "app", include: ["./prisma"] })],
  output: "./.ozzyrm",
});
```

**Behavior:**

- After `resolve`, require path stays under `cwd`.
- Clear diagnostic: `PATH_OUTSIDE_PROJECT`.
- Escape hatch: `restrictPathsToCwd: false` for monorepo edge cases (documented as elevated trust).

### 5. Validate hot `stamp.js` before import

**Problem:** Dynamic import of `.ozzyrm/stamp.js` trusts file contents.

**Enhancement:**

- Generate deterministic file shape only.
- Before import: read as text, regex/allowlist `export const ozzyrmStamp = <number|string>;`
- Or pass stamp via `fs.readFile` + `JSON.parse` instead of JS module import.

### 6. Resource limits

| Limit | Suggested default | On exceed |
|-------|-------------------|-----------|
| Max schema files per source | 500 | fail with diagnostic |
| Max file size | 2–5 MiB | fail |
| Max models + enums | 5_000 | fail or warn+truncate (prefer fail) |
| Watch debounce floor | ≥ 50 ms | clamp |

Prevents accidental DoS from pathological trees during generate/watch.

### 7. Safe `logoSrc` helper

- Allow `https:`, `http:` (dev), relative `/…`, `data:image/*` optionally.
- Reject `javascript:`, `vbscript:`, etc.
- Document CSP `img-src` recommendations for hosts.

### 8. Security CI job

- `rg` forbidlist: `dangerouslySetInnerHTML`, `innerHTML`, `eval(`, `new Function`
- `bun audit` on release branches
- Serve traversal tests must pass

---

## P2 — Defense in depth

### 9. Content Security Policy notes for hosts

Ship a short host CSP example:

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self'
```

(`'unsafe-inline'` may be needed while styles inject via `<style>` text — enhancement: move to hashed CSS or nonce API.)

### 10. Nonce / hash-friendly style injection

**Today:** `inject-styles.ts` sets `style.textContent = OZZYRM_CSS`.

**Enhancement:** optional `nonce` prop on mount / React wrapper for strict CSP.

### 11. Catalog integrity metadata

- Write `catalog.sha256` or embed `generatedAt` + content hash.
- Optional verify step in `OzzyRMDocsFromConfig` when loading from disk.

### 12. Structured security logging (CLI)

- Log code + path for rejected traversal / outside-cwd — never log file contents that may contain secrets.

### 13. Freeze generated JSON schema (JSON Schema / Zod)

- Runtime Zod parse of catalog before UI mount when loading from disk.
- Reject unexpected keys that could confuse future renderers.

---

## P3 — Advanced / optional

### 14. Worker-thread or subprocess parse sandbox

Run Prisma/SQL parse in a child process with FS allowlist — heavy; only if OzzyRM is embedded in multi-tenant “upload a schema” products (anti-pattern today).

### 15. Capability tokens for remote config

Not recommended. Prefer never fetching remote config.

### 16. Signed releases / npm provenance

- Enable GitHub OIDC npm provenance on publish.
- Document verification for enterprises.

---

## Enhancement tracking table

| ID | Title | Priority | Status |
|----|-------|----------|--------|
| SE-01 | Serve path confinement | P0 | Done |
| SE-02 | Datasource redaction tests | P0 | Done |
| SE-03 | Hostile string UI fixtures | P0 | Planned |
| SE-04 | `restrictPathsToCwd` | P1 | Done (default true) |
| SE-05 | Stamp validate / non-JS stamp | P1 | Done (allowlist before import) |
| SE-06 | Resource limits | P1 | Planned |
| SE-07 | logoSrc scheme allowlist | P1 | Done |
| SE-08 | Security CI forbidlist + audit | P1 | Planned |
| SE-09 | Host CSP docs | P2 | Planned |
| SE-10 | Style nonce support | P2 | Planned |
| SE-11 | Catalog hash | P2 | Planned |
| SE-12 | Safe CLI security logs | P2 | Planned |
| SE-13 | Zod catalog gate | P2 | Planned |
| SE-14 | Parse sandbox | P3 | Idea |
| SE-15 | npm provenance | P3 | Idea |

Update **Status** to `In progress` / `Done` when work lands; link PRs in release notes.

## Design constraints for all enhancements

1. Do not break fail-closed unified/scenario validation.
2. Do not execute Drizzle schema TS as a program.
3. Prefer diagnostics with stable codes over generic `Error`.
4. Keep single-package DX: security flags belong on `defineProject` / documented CLI, not a second package.
5. Document trust changes in [THREAT_MODEL.md](./THREAT_MODEL.md) when defaults change (especially if `restrictPathsToCwd` becomes default `true` in a major).
