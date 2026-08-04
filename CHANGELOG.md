# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.3.2] - 2026-08-04

### Changed

- Hardcode glossary docs origin to `https://ozzyrm.vercel.app` (removed optional `docsBaseUrl` prop from mount APIs)

## [0.3.1] - 2026-08-03

### Added

- Security module: path confinement, datasource sanitization, stamp allowlist, logo `src` scheme filter
- Security documentation under `security/`
- Glossary badges and docs search open [ozzyrm.vercel.app](https://ozzyrm.vercel.app) glossary pages in a new tab
- Open-source contribution tooling: Husky hooks, GitHub Actions CI, CONTRIBUTING / CoC / SECURITY / LICENSE
- Security sink scan (`bun run check:security`) in pre-commit and CI

### Changed

- Glossary links map to `/docs/glossary/{type|attribute}/{key}` on the public docs site (new tab)
- Keep `/test` and `/fixtures` gitignored as internal maintainer playground
- Public CI gate: security sinks + typecheck + build

### Notes

- Combines the previously planned 0.3.0 and 0.4.0 work into a single patch release
- Prior history lived in git commits; formal changelog starts here for OSS releases
