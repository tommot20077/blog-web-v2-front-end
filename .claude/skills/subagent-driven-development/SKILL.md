---
description: Use when executing implementation plans with independent tasks — dispatches fresh subagent per task with TDD + code review between tasks
---

# Subagent-Driven Development

Fresh subagent per task + TDD enforced in every prompt + review after each task = quality + speed.

## Pre-requisite: Worktree Directory

**Before dispatching any subagent**, confirm the working directory.

If `using-git-worktrees` was called, it will have declared a working directory contract. Record the worktree path:

```bash
# Confirm current worktree root — this is the directory all subagents MUST use
WORKTREE=$(git rev-parse --show-toplevel)
echo "Worktree root: $WORKTREE"
```

**This path is mandatory context for every subagent prompt.** All npm commands,
git operations, and file edits performed by subagents must resolve to files inside
`$WORKTREE`, never the main repository root.

---

## Execution Types

| Type | When to use |
|------|-------------|
| Sequential | Tasks are coupled or order-dependent |
| Parallel | Tasks are independent (different components/composables) |
| Investigation | Multiple unrelated test failures |

---

## Sequential Process

### Step 1 — Load Plan

Read plan file, create task list with `TaskCreate`.

### Step 2 — Dispatch Implementation Subagent (TDD-mandatory)

Include the worktree path as the **first line** of every subagent prompt:

```
Working directory: <WORKTREE_FULL_PATH>
All commands (npm, vitest, git, file edits) MUST be run from this directory.
Do NOT operate on the main repository root.

---

You are implementing Task N: [task name]

Read the plan task carefully. Follow TDD strictly:
  1. Boundary Analysis: produce test scenario table (composable/component, method, scenarios)
  2. RED: write failing test(s), confirm they actually fail with:
       cd <WORKTREE_FULL_PATH> && npx vitest run src/<path>/
  3. GREEN: write minimal implementation to make tests pass, run again to confirm
  4. REFACTOR: clean up while keeping tests green

Do NOT write implementation code before tests exist.

Report back: boundary analysis table, test names + results, files changed.
```

### Step 3 — Review Subagent's Work

Verify TDD was followed:
- Did the report include a boundary analysis table?
- Are test descriptions in Traditional Chinese within `describe`/`it` blocks?
- Did it confirm RED failure before implementing?
- Are all tests green with pristine output?
- Did all file paths belong to `<WORKTREE_FULL_PATH>`?

### Step 4 — Fix Issues

If review finds problems, dispatch a fix subagent with the same working directory header:

```
Working directory: <WORKTREE_FULL_PATH>
All commands MUST be run from this directory.

---

Fix issues from review: [list issues]
Constraints: do NOT skip TDD — if new code is required, write test first.
Report: what changed, test output.
```

### Step 5 — Mark Complete, Next Task

Mark task completed in task list, move to next task, repeat Steps 2–5.

---

## Parallel Investigation Process (failing tests)

When multiple unrelated test failures exist across independent domains:

**Step 1 — Group by independent domain** (different composable or component)

**Step 2 — Dispatch one focused agent per domain, each with the working directory header:**

```
Working directory: <WORKTREE_FULL_PATH>
All commands MUST be run from this directory.

---

Fix failing tests in [area]: [list of failing test names with error messages]

Constraints: do NOT change other areas. Fix root cause — no timeout hacks.
If fix requires new implementation code, follow TDD (write new test first).

Report: root cause, what you changed, test output.
```

**Step 3 — Review summaries for conflicts, then run full suite from the worktree:**

```bash
cd <WORKTREE_FULL_PATH> && npx vitest run
```

---

## Red Flags — Stop and Ask Yuan

- Subagent skipped TDD (report has no boundary analysis / no RED confirmation)
- Subagent report says "tests pass" but no test names listed
- Subagent operated on files outside `<WORKTREE_FULL_PATH>`
- Critical review issue found — fix before proceeding to next task
- Plan has a gap or unclear step

---

## Run Commands Reference

All commands below must be run **from the worktree root** (`$WORKTREE`):

```bash
# All tests
cd <WORKTREE_FULL_PATH> && npx vitest run

# Specific directory
cd <WORKTREE_FULL_PATH> && npx vitest run src/composables/

# Specific file
cd <WORKTREE_FULL_PATH> && npx vitest run src/composables/useArticle.test.ts
```
