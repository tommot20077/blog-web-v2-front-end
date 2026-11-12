---
name: git-action
description: Stage, commit, and push changes to the current feature or hotfix branch. Use after completing a logical unit of work to create a well-formed commit following Conventional Commits with Traditional Chinese subject.
---

# Skill: git-action

Stage, commit, and push changes to the current **feature** or **hotfix** branch.
Invoke this skill multiple times during a feature — once per logical change.
When ready for review, run `/open-pr`.

---

## Step 0 — Branch Guard

```bash
git branch --show-current
```

- If on `main` or `develop`: **STOP**.
  - Ask Yuan for a feature branch name.
  - Then run:
    ```bash
    git checkout develop && git checkout -b feature/<name>
    ```
- If on `feature/*` or `hotfix/*`: proceed to Step 1.

---

## Step 1 — Inspect

```bash
git status
git diff
git diff --staged
```

---

## Step 2 — Stage

- Stage **only** task-relevant files. Never `git add -A`.
- Exclude: `.env`, `node_modules/`, `dist/`, credentials, `*.log`.
- If the diff spans unrelated concerns → ask Yuan to split into separate commits.

```bash
git add <specific-files>
```

---

## Step 3 — Commit

遵循 **Conventional Commits v1.0.0**（https://www.conventionalcommits.org/zh-hant/v1.0.0/）。

- **type**: `feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `build` / `ci` / `chore`
- **scope**: 功能領域（`component` / `composable` / `router` / `store` / `api` / `ui` / `editor` / `auth` / `search` / `admin`）或關注面（`mock` / `config` / `types` / `style`）；可組合，如 `auth/composable`
- **Subject**: 繁體中文、祈使語氣、不加句號、不超過 72 字元

### Commit 格式（完整版）

```
<type>(<scope>): <繁體中文 subject>       ← 必填，≤ 72 字元，不加句號

[optional body]                            ← 選用，空一行後說明動機/異動
[optional body continued...]

[optional footer(s)]                       ← 選用，空一行後
Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
BREAKING CHANGE: <說明>                    ← 若有 breaking change
Fixes #<issue-number>                      ← 若關閉 issue
```

### Breaking Change 寫法（二擇一，可同時使用）

在 type 後加 `!`，並於 footer 加 `BREAKING CHANGE:` 說明：

```
feat(router)!: 移除舊版路由結構

BREAKING CHANGE: 所有路由路徑已重新設計，舊 URL 不再有效

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

### Commit 指令模板

```bash
git commit -m "$(cat <<'COMMIT_MSG'
<type>(<scope>): <繁體中文 subject>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
COMMIT_MSG
)"
```

含 body 時：

```bash
git commit -m "$(cat <<'COMMIT_MSG'
<type>(<scope>): <繁體中文 subject>

<動機與異動說明>

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
COMMIT_MSG
)"
```

### Examples

```
feat(editor/component): 新增 Markdown 即時預覽面板

使用 markdown-it + @shikijs/markdown-it 渲染，
watchDebounced 200ms 防抖更新預覽內容。

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>
```

```
fix(auth/composable): 修正 token refresh 時的 race condition
```

```
test(composable): 補充 useWordCount 中英文混合計算測試
```

```
docs(types): 更新 ArticleStatus 型別 JSDoc 說明
```

```
refactor(api/mock): 簡化 mock handler 註冊邏輯
```

---

## Step 4 — Push

```bash
git push -u origin <current-branch>
```

- **Never** force-push.
- **Never** skip hooks (`--no-verify`).

---

## Step 5 — Report

Print:
- Current branch name
- Commit SHA (short)
- Commit subject

Then remind Yuan:

> 提交完成。準備好 Code Review 時，請執行 `/open-pr` 建立 Pull Request。
