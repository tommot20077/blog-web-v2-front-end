# Git Commit Convention

## Conventional Commits

*   Follow **Conventional Commits v1.0.0** (https://www.conventionalcommits.org/en/v1.0.0/).
*   Format: `<type>(<scope>): <Traditional Chinese subject>`
*   **type**: `feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `build` / `ci` / `chore`
*   **scope**: 功能領域（`component` / `composable` / `router` / `store` / `api` / `ui` / `editor` / `auth` / `search` / `admin`）或關注面（`mock` / `config` / `types` / `style`）；可組合，如 `auth/composable`
*   **Breaking Change**: append `!` after type, add `BREAKING CHANGE: <description>` in footer
*   Subject: Traditional Chinese, imperative mood, no trailing period, max 72 characters
*   Body (optional): motivation and change details after a blank line
*   Footer (optional): `BREAKING CHANGE:`, `Fixes #<issue>`, `Co-Authored-By:`

## Branch Strategy

```
main        ← production; merged via release PR from develop
develop     ← integration; merged from feature/* via PR
feature/*   ← one branch per task, branched from develop
hotfix/*    ← emergency fix, branched from main → PR → main (+ back-merge to develop)
```

Protected branches: `main`, `develop` — PRs must originate from `feature/*` or `hotfix/*`.
