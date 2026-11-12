## Addressing & Roles

*   Always address me as **"Yuan"**.
*   We are **Colleagues**: You bring logic and rigor; I bring business context. We solve problems together.
*   Always response in **Traditional Chinese**. Use English only for code, technical terms, or when quoting documentation.

## Communication Principles

1.  **Ask before acting**: Don't verify invalid assumptions.
2.  **Evidence-based**: Show me logs, documentation, or test outputs to back up claims.

# CRITICAL INSTRUCTION: TDD IS MANDATORY

> **NO CODE WITHOUT TESTS.**
> You MUST write a failing test BEFORE writing any implementation code.
> This is a hard constraint. Do not optimize, do not "just fix it quickly".
> Follow the cycle: **Red -> Green -> Refactor**.

## TDD Implementation Process

1.  **Red**: Write a failing test that defines the desired functionality or bug fix.
    *   Run the test to confirm it fails: `npx vitest run <test-file>`
2.  **Green**: Write the *minimal* amount of code to make the test pass.
    *   Run the test to confirm success.
3.  **Refactor**: Improve the code structure/quality while keeping tests green.

---

## External Repositories

- Backend (Spring Boot modular monolith, API contract counterpart): `D:\end\workspace\java\blog-web-v2`
- Infrastructure (Docker, k3s, deployment configs): `D:\end\workspace\infrastructure`

## API Contract Maintenance

後端行為的真相鏈:`api-reference/openapi.json`(快照)→ [ai-docs/api-contract.md](ai-docs/api-contract.md)(慣例)→ 問 Yuan。
**前端不發明契約**;契約沒有的功能 → mock 進 `api/mock/` + 登記 `pending.md`。同步流程見 [ai-docs/maintenance.md](ai-docs/maintenance.md) §2。
root 的 `todo.md`、`diff.md` 是**歷史檔**,不要依其內容做決策(文件地圖見 maintenance.md §3)。

## Guidelines Index

- Architecture and Design: [ai-docs/architecture.md](ai-docs/architecture.md)
- Code Standards: [ai-docs/code-standards.md](ai-docs/code-standards.md)
- Git Commits: [ai-docs/git-convention.md](ai-docs/git-convention.md)
- Testing Standards: [ai-docs/testing-standards.md](ai-docs/testing-standards.md)
- Design System: [ai-docs/design-system.md](ai-docs/design-system.md)
- API Contract: [ai-docs/api-contract.md](ai-docs/api-contract.md)

## Operating Rules Index(判斷與調度,做任何非平凡任務前先讀前兩份)

- Project Judgment(契約真相鏈、mock 紀律、危險模式訊號): [ai-docs/judgment.md](ai-docs/judgment.md)
- Agent Dispatch(模型調度、升降級、驗證不自驗): [ai-docs/agent-dispatch.md](ai-docs/agent-dispatch.md)
- Task Briefs(subagent 交辦範本 ×5): [ai-docs/task-briefs.md](ai-docs/task-briefs.md)
- Maintenance(晉升飛輪、契約同步、文件地圖、檔案所有權): [ai-docs/maintenance.md](ai-docs/maintenance.md)
- Bug Post-mortems(踩雷紀錄): [ai-docs/bug-reports/INDEX.md](ai-docs/bug-reports/INDEX.md)
- Pending Features(掛起功能登記簿): [pending.md](pending.md)
- Institution Notes(給未來 session 的信): [ai-docs/institution-notes.md](ai-docs/institution-notes.md)
