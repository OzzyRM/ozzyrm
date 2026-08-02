# Reporting Vulnerabilities

## Prefer private disclosure

If you believe you found a security issue in **ozzyrm** (RCE via config patterns beyond documented trust, path traversal in `serve`, XSS in the docs UI, secret leakage in generated catalogs, supply-chain issues in published artifacts), please **do not** open a public GitHub issue with exploit details before maintainers can patch.

## How to report

1. **Email / private channel** — contact the repository maintainers via the channel listed in the GitHub repo (Security advisory / email in profile). If GitHub Security Advisories are enabled, use **Report a vulnerability**.
2. Include:
   - OzzyRM version / commit SHA
   - Environment (CLI `serve` / `generate`, Next `OzzyRMDocsFromConfig`, etc.)
   - Impact summary (confidentiality / integrity / availability)
   - Minimal reproduction steps
   - Whether a public disclosure date is requested
3. Allow reasonable time for a fix before public write-ups (90 days common default; sooner for actively exploited issues).

## Scope

### In scope

- Path traversal or arbitrary file read/write beyond intended project roots in shipped CLI flows
- XSS or script injection via schema/catalog fields in library UI
- Persistence or logging of database credentials into `.ozzyrm` / UI catalog
- Malicious behavior introduced in the published npm tarball vs tagged source

### Out of scope (usually)

- “I can RCE myself by putting code in `ozzyrm.config.ts`” — **documented trust**
- Host app missing auth on `/docs`
- Issues only in gitignored playgrounds (`test/`, etc.) that are not shipped
- Denial of service via absurdly large schemas without a practical remote trigger
- Vulnerabilities solely in upstream `@prisma/internals` (report upstream; we will bump when fixed)

## Maintainer response targets

| Severity | First response | Fix / advisory aim |
|----------|----------------|--------------------|
| Critical (RCE outside documented config trust, widespread XSS) | 3 business days | Patch release ASAP |
| High (serve traversal, secret leak in JSON) | 5 business days | Patch within 2 weeks |
| Medium | 10 business days | Next minor/patch |
| Low | Best effort | Backlog |

These are targets, not SLAs.

## Safe harbor

Researchers acting in good faith — no privacy violation of third parties, no destruction of data, no coercion — will not face legal threats from project maintainers for technical reports that follow this process.

## Public acknowledgment

With reporter consent, credit appears in release notes and optionally [SECURITY_ENHANCEMENTS.md](./SECURITY_ENHANCEMENTS.md) / changelog.
