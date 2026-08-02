# OzzyRM Security

Security documentation for the **ozzyrm** package: threat context, engineering guidelines, planned enhancements, and open-source contribution limits.

OzzyRM is a **local / trusted-host** schema documentation toolkit. It is not a multi-tenant SaaS. Most risk comes from **who can edit config and schema files**, **where files are read/written**, and **how the docs UI is hosted**.

## Documents

| File | Purpose |
|------|---------|
| [THREAT_MODEL.md](./THREAT_MODEL.md) | Trust boundaries, assets, threat actors, attack surfaces |
| [SECURITY_GUIDELINES.md](./SECURITY_GUIDELINES.md) | Engineering panduan (do / don’t) for maintainers and consumers |
| [SECURITY_ENHANCEMENTS.md](./SECURITY_ENHANCEMENTS.md) | Hardening roadmap and prioritized enhancements |
| [OPEN_SOURCE_SECURITY.md](./OPEN_SOURCE_SECURITY.md) | Contribution limits, review gates, disclosure, supply chain |
| [REPORTING.md](./REPORTING.md) | How to report vulnerabilities (maintainers & researchers) |
| [CHECKLIST.md](./CHECKLIST.md) | PR / release / publish security checklist |

## Scope in one page

### In scope

- CLI (`ozzyrm generate` / `watch` / `serve`)
- Runtime `loadCatalog` / `generate` / `watchCatalog`
- Config loading (`ozzyrm.config.ts` dynamic import)
- Parsers (Prisma / Drizzle / SQL) and unified merge validation
- Docs UI (`ozzyrm/ui`, `ozzyrm/react`) including search, glossary, ERD, scenarios
- Generated artifacts under `.ozzyrm/`
- Dependency and release supply chain for the npm package

### Out of scope (consumer responsibility)

- Authentication / authorization of the docs route in the host app
- Network exposure of internal schemas (who can open `/docs`)
- Secrets in the consumer’s Prisma `env("DATABASE_URL")` beyond what OzzyRM persists
- Compromised developer machines used to run CLI against local files

## Security posture (current)

| Area | Posture |
|------|---------|
| Config execution | **High trust** — `import(ozzyrm.config.ts)` runs arbitrary JS/TS module code |
| Schema file read | **Process FS permissions** — `include`/`output` resolve under cwd; `..` / absolute paths allowed |
| Unified / scenarios | **Fail-closed** — `UnifiedSchemaValidationError` with stable diagnostic codes |
| Docs UI XSS | **Generally sound** — React text escaping; no `dangerouslySetInnerHTML` in library UI |
| Prisma datasource URL | **Not persisted** into `DocSchema` (provider-oriented; avoid leaking connection strings) |
| `ozzyrm serve` | **Needs hardening** — path traversal risk if pathname is not confined to root |
| Watch / hot stamp | **Dev convenience** — `stamp.js` dynamic import for Next HMR bridge |

## Quick principles

1. **Treat config + include paths as code execution / FS access** — only trusted maintainers edit them.
2. **Fail closed** on catalog validation; never silently merge conflicting identities.
3. **Render untrusted schema text as text** — never inject HTML from model/field names or descriptions.
4. **Do not ship secrets** in generated JSON or UI catalog payloads.
5. **Open-source PRs that touch parsers, CLI FS, or config load need security review.**

## Related product docs

- [context/OVERVIEW.md](../context/OVERVIEW.md)
- [context/TECHNICAL_INSTRUCTION.md](../context/TECHNICAL_INSTRUCTION.md)
- [context/FEATURES.md](../context/FEATURES.md)
- [README.md](../README.md)
