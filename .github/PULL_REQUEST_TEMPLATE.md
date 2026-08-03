# Contributing to OzzyRM

Thanks for helping improve OzzyRM. Please follow the checklist in this template so maintainers can review quickly.

## Summary

<!-- What does this PR change and why? -->

## Type of change

- [ ] Bug fix
- [ ] New feature
- [ ] Docs / examples
- [ ] Chore / CI / tooling
- [ ] Security hardening

## Test plan

- [ ] `bun run typecheck`
- [ ] `bun run build` (if touching build, CSS, or exports)
- [ ] `bun test` when you have local `/test` (maintainer playground; not required for public PRs)
- [ ] Added / updated regression tests when fixing a bug or trust boundary (maintainers)
## Security (required if touching CLI, parsers, catalog, security, or react/server)

- [ ] No new `dangerouslySetInnerHTML` / `innerHTML` / `eval` / `new Function`
- [ ] No dynamic import of consumer schema files
- [ ] Fail-closed validation preserved (unified / scenarios)
- [ ] No datasource URLs / secrets written into catalog JSON
- [ ] Paths cannot escape intended root when touching FS / serve
- [ ] Trust-boundary impact: none / low / high — _describe briefly_

See [`security/CHECKLIST.md`](../security/CHECKLIST.md).

## Dependencies

- [ ] No new dependency **or** justified in summary + license OK + `bun audit` checked
