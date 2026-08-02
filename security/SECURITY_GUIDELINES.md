# Security Guidelines (Panduan)

Practical rules for **maintainers**, **consumers**, and **AI agents** working on OzzyRM.

## 1. Trust model reminder

OzzyRM runs with the privileges of the Node/Bun process. Editing `ozzyrm.config.ts` or pointing `--config` / `include` at untrusted files is **code/FS trust**, not “just data.”

## 2. Maintainer guidelines (library code)

### 2.1 Never introduce

- `dangerouslySetInnerHTML`, `innerHTML`, `document.write`, or string-built HTML from schema/catalog fields
- `eval`, `new Function`, or executing Drizzle/Prisma schema source as JS
- Silent merge of conflicting unified identities
- Logging of datasource URLs, tokens, or `.env` contents
- Unconfined static file serving (`../` escapes)

### 2.2 Always prefer

- React text children / attributes with escaped values
- Fail-closed validation with `UnifiedSchemaValidationError` + stable `DiagnosticCode`s
- Path resolution that can be confined to project root for serve/generate (when implementing hardening)
- Slugified ids for DOM `id` attributes (`src/ui/lib/section-id.ts`) without treating slugs as a sanitizer for display text
- Explicit types for catalog JSON; no `any`-cast pipelines that skip validation

### 2.3 Parsers

| ORM | Rule |
|-----|------|
| Prisma | Use `@prisma/internals` APIs; map to `DocSchema`; do not copy raw `url` into persisted docs |
| Drizzle | Parse TypeScript via AST only; never `require()` / `import()` user schema entry as side-effectful app code for docs |
| SQL | Parse DDL text; reject or ignore non-DDL constructs that imply execution |

### 2.4 UI

- Search empty states: keep text inside layout bounds (`break-all` / truncate); still escaped
- Dialogs: portal overlays OK; do not execute `href` from untrusted catalog as `javascript:`
- ERD download (`html-to-image`): filter chrome; do not serialize secrets (none should be in DOM)
- `logoSrc`: document as consumer-controlled; validate scheme if adding helpers

### 2.5 CLI

- Default commands operate on cwd project files
- `--config` is powerful — document it as trusted path
- Exit non-zero on validation failure for `generate`
- `watch`: on failure keep last good `.ozzyrm` JSON

### 2.6 Dependencies

- Avoid new native/network clients without strong need
- Prefer well-known UI deps; pin majors in publish
- Run `bun audit` / npm audit before release
- Do not add postinstall scripts that download remote code

## 3. Consumer guidelines (apps using ozzyrm)

### 3.1 Hosting docs

1. Put schema docs behind **authentication** if the schema is not public.
2. Do not expose `.ozzyrm/*.json` on a public CDN unless intentional.
3. Use CSP on the host app (default React escaping + CSP defense in depth).
4. Prefer `OzzyRMDocsFromConfig` on the **server** so catalog build stays off the public client bundle when possible.

### 3.2 Config hygiene

```ts
// trusted maintainers only
export default defineProject({
  schemas: [
    prisma({ id: "app", include: ["./prisma"] }), // stay inside repo
  ],
  output: "./.ozzyrm", // do not point at system dirs
});
```

- Do not load remote config URLs.
- Do not accept end-user uploads as `include` paths in a multi-tenant product.
- Keep `watch.hot` for **local dev**; understand `stamp.js` is imported by the server helper.

### 3.3 Secrets

- Keep `DATABASE_URL` in env / secret manager — not in committed Prisma files for production.
- Verify generated catalog JSON has no connection strings before committing `.ozzyrm/`.
- Treat schema field names like `passwordHash`, `ssn` as sensitive documentation (access control), not as “secrets in OzzyRM storage.”

### 3.4 CI

- Generate docs in CI with least-privilege tokens.
- Do not pass production DB URLs into jobs that only need schema files.
- Review dependency updates that touch `ozzyrm` or `@prisma/internals`.

## 4. Agent / automation guidelines

When coding agents change OzzyRM:

1. Read [THREAT_MODEL.md](./THREAT_MODEL.md) before touching CLI FS, config load, parsers, or serve.
2. Do not “simplify” fail-closed unified/scenario validation into warnings.
3. Do not add HTML rendering of descriptions “for markdown support” without an allowlisted sanitizer design reviewed in [OPEN_SOURCE_SECURITY.md](./OPEN_SOURCE_SECURITY.md).
4. Prefer minimal diffs; security-sensitive files need explicit human review.

Security-sensitive paths (non-exhaustive):

- `src/catalog/load-catalog.ts`
- `src/catalog/watch.ts`
- `src/catalog/generate.ts`
- `src/catalog/merge-unified.ts`
- `src/catalog/resolve-scenarios.ts`
- `src/cli/serve.ts`
- `src/cli/bin.ts`
- `src/parsers/**`
- `src/react/server.ts`
- `src/ui/mount.tsx`
- `src/ui/inject-styles.ts`

## 5. Secure defaults checklist (short)

- [ ] No new XSS sinks
- [ ] No new dynamic `import` of user content except documented config/stamp flows
- [ ] Validation remains fail-closed
- [ ] No secret persistence in `DocSchema`
- [ ] Serve/generate paths cannot escape intended root (once hardened)
- [ ] Tests cover malicious/invalid config shapes where relevant

## 6. Incident-oriented reflexes

If a vulnerability is reported:

1. Follow [REPORTING.md](./REPORTING.md) — do not discuss exploit details in public issues until fixed or disclosed.
2. Patch fail-closed; add a regression test.
3. Cut a patch release; note in changelog under Security.
4. Credit reporter if they want credit.
