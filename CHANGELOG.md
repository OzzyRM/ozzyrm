# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Open-source contribution tooling: Husky hooks, GitHub Actions CI, CONTRIBUTING / CoC / SECURITY / LICENSE
- Security sink scan (`bun run check:security`) in pre-commit and CI

### Changed

- Keep `/test` and `/fixtures` gitignored as internal maintainer playground (not part of the public tree)
- Public CI gate: security sinks + typecheck + build (tests run locally when `/test` exists)

## [0.3.0] - 2026-08-02

### Added

- Security module: path confinement, datasource sanitization, stamp allowlist, logo `src` scheme filter
- Security documentation under `security/`

### Notes

- Prior history lived in git commits; formal changelog starts here for OSS releases.
