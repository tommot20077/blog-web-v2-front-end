---
name: test-fixing
description: Run tests and systematically fix all failing tests using smart error grouping. Use when user asks to fix failing tests, mentions test failures, runs test suite and failures occur, or requests to make tests pass.
---

# Test Fixing

Systematically identify and fix all failing tests using smart grouping strategies.

## When to Use

- Explicitly asks to fix tests ("fix these tests", "make tests pass")
- Reports test failures ("tests are failing", "test suite is broken")
- Completes implementation and wants tests passing
- Mentions CI/CD failures due to tests

## Systematic Approach

### 1. Initial Test Run

Run the full Vitest suite to identify all failing tests:

```bash
npx vitest run --reporter verbose
```

Analyze output for:
- Total number of failures
- Error types and patterns (TypeScript errors, component mount failures, assertion failures)
- Affected files/composables

### 2. Smart Error Grouping

Group similar failures by:
- **Error type**: TypeScript compilation errors, Vite build failures, component mount errors, assertion failures, mock mismatches
- **File/composable**: Same file causing multiple test failures
- **Root cause**: Missing imports, API changes, refactoring impacts

Common Vue/TypeScript failure categories:

| Category | Indicators |
|----------|-----------|
| **TypeScript errors** | Type mismatch, `cannot find module`, missing property — no tests can run |
| **Vite/Build failures** | Import resolution errors, plugin configuration issues |
| **Component mount errors** | Missing provide/inject, router not configured, Pinia not installed |
| **Assertion failures** | `expect(...).toBe(...)` mismatch, wrong element text |
| **Mock mismatches** | API mock not matching expected calls, missing mock handlers |

Prioritize groups by:
- Dependency order (TypeScript → build → mount → mocks → assertions)
- Number of affected tests (highest impact first within the same tier)

### 3. Systematic Fixing Process

For each group (starting with highest impact):

1. **Identify root cause**
    - Read relevant code
    - Check recent changes with `git diff`
    - Understand the error pattern

2. **Implement fix**
    - Use Edit tool for code changes
    - Follow project conventions (see CLAUDE.md)
    - Make minimal, focused changes

3. **Verify fix**
    - Run subset of tests for this group:
      ```bash
      # 特定檔案
      npx vitest run src/composables/useArticle.test.ts

      # 特定目錄
      npx vitest run src/composables/

      # 名稱匹配
      npx vitest run -t "useArticle"
      ```
    - Ensure group passes before moving on

4. **Move to next group**

### 4. Fix Order Strategy

**Infrastructure first — TypeScript errors:**
- Type mismatches, missing imports that prevent any tests from compiling
- Fix these before anything else; nothing runs until compilation succeeds

**Then configuration — Component mount failures:**
- Missing `provide` for router, Pinia store
- Test setup files not configuring global plugins
- Missing mock for composable dependencies

**Then API changes — Mock mismatches:**
- Mock handlers that no longer match updated API signatures
- Missing mock data for new fields

**Finally, logic — Assertion failures:**
- Business logic bugs surfaced by tests
- Edge case handling
- Unexpected reactive state changes

### 5. Final Verification

After all groups are fixed, run the complete test suite to confirm no regressions:

```bash
npx vitest run --reporter verbose
```

Verify:
- All previously failing tests now pass
- No new failures introduced
- Test output is clean (no unexpected warnings or stack traces)

## Best Practices

- Fix one group at a time
- Run focused tests after each fix
- Use `git diff` to understand recent changes
- Look for patterns in failures
- Don't move to next group until current passes
- Keep changes minimal and focused
