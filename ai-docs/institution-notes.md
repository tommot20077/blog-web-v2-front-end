# 給未來 Session 的信(Institution Notes)

> 寫於 2026-07-07,由一次性的高階模型 session 立制度時留下。讀者:之後在此 repo 工作的任何模型與 Yuan。

## 這套制度是什麼

2026-07-07 依 `D:\end\institution-authoring-prompt.md` 的骨架,對本 repo 做了一次治理盤點與補洞:
新增 `ai-docs/{judgment,agent-dispatch,task-briefs,maintenance}.md`、修復 `post-bug`/`review-bugs` skill 的 MEMORY.md 懸空引用、在 CLAUDE.md 補上外部 repo 指標/契約真相鏈/歷史檔標註。後端 repo 同日做了對應但獨立的一套。原則:**在既有機器上補洞,不建平行系統**。

## 三件沒人問但最重要的事

1. **本 repo 的飛輪是 0 轉**:`ai-docs/bug-reports/` 空的、`/review-bugs` 沒跑過,但這幾個月一定修過 bug——教訓全蒸發了。從下一個 `fix:` commit 開始跑 `/post-bug`,制度才會活。
2. **契約漂移是本 repo 最大的結構性風險**:`openapi.json` 快照與 `diff.md` 都停在 2026-05-14,後端在 `feature/pre-launch-remediation` 上持續動。上線前必須重抓快照+重比對(`maintenance.md` §2)。跨 repo 契約的單一真相源(如契約倉庫或型別生成)是需要 Yuan 決策的下一步。
3. **root 歷史檔會誤導弱模型**:`todo.md`(858 行)看起來像現行任務清單,其實 4 月起就凍結;決策記錄埋在它第 3-14 行。已在 CLAUDE.md 與 `maintenance.md` §3 標明狀態,但若有人往 `todo.md` 續寫,地圖就失效——新增待辦請走 `pending.md` 或開新的正典位置。

## 這套制度最可能的退化方式(與預防)

- **文件地圖過期**(root 又長新散檔)→ `maintenance.md` §7 健康檢查第 2 條會抓;新散檔一律登記狀態。
- **CLAUDE.md 長胖** → 上限 150 行(§5);新內容一律 ai-docs 新檔 + 一行索引。
- **judgment.md 收進通用常識** → 新條目必須源自本 repo 真實踩雷(bug report),保持「判準+正反例」結構。
- **openapi.json 被手改** → 它是快照,只能整份重抓(`maintenance.md` §4)。

## 待 Yuan 確認的一個決策

2026-07-07 發現 `.gitignore` 原本排除 `/ai-docs/`、`/CLAUDE.md`、`/pending.md`、`/.claude/`——連 CLAUDE.md 本身都不在版控,worktree/clone/CI 裡完全沒有規則。已把這些排除移掉(`todo.md` 維持排除——歷史檔;`/docs/` 也仍被排除,裡面的 superpowers specs/plans 是否進版控由 Yuan 決定),**但尚未 commit**。若本意是不上公開 GitHub,見後端 repo `ai-docs/institution-notes.md` 同節的替代方案。

## 誠實條款:信心最低的產出

1. **文件地圖的狀態判定**——`todo.md`/`diff.md` 標「歷史」是依最後修改日期與內容過期跡象推斷,未逐項向 Yuan 確認;若其中有仍在使用的段落,請 Yuan 修正 `maintenance.md` §3。
2. **agent-dispatch.md 的模型清單**(2026-07 快照)——會過時,檔內已標「用前查證」。
3. **「上線前跑 E2E」的觸發時機**——依 repo 現況(playwright + docker-compose.e2e)推斷,實際節奏需 Yuan 校準。

## 2026-09-04 分支整理紀錄(給下一個 session)

- **main 落後 develop 99 commits,且 main 上有 6 個從未回流的 commit**(`3756219` router guard race、`b1c17d3` CI aggregating job、`1d6c6f6` mail health、`d206dc5` e2e 對齊驗證流程、`9b0b5d1` 驗證流程+Toast 重構、`7c88be6` v2 release)。逐項比對:`1d6c6f6` 的 `MANAGEMENT_HEALTH_MAIL_ENABLED: "false"` develop 已有等價內容;`b1c17d3` 的 aggregating job **develop 沒有**(branch protection 若指向該 job 名稱要注意);`3756219` 的 router guard 修法 develop 走了不同實作(develop 無 `ensureAuthReady`/`authReady` 等識別字)。**release 時不可直接 fast-forward,必須逐項確認**——這輪未動 main。
- `integration/local-e2e` 是 2026-07~08 的本地多分支合併實驗線,已無 develop 沒有的價值:`ef72619`(密碼字元修正)與 develop PR #42 `7683438` 重複,且後者註解更完整(cherry-pick 會衝突,不要搬);`275968c` 的 `.editor-gap-audit.md` 已於本次移入 `ai-docs/2026-07-26-editor-gap-audit.md`。該分支本輪刪除。
- `.worktrees/` 內殘留的舊 checkout(admin-console、article-toc、editor、file-access、pre-launch、tag-links)經 blob 比對確認內容全在 git 物件庫或已在 develop,已刪除。
- **已知測試噪音**(違反 judgment §1「輸出 pristine」,尚未修):全套 `npx vitest run` 會噴 happy-dom 的 `DOMException [AbortError]`/`[NetworkError]`,根因是 `src/composables/useMarkdownRenderer.test.ts:93` 的 XSS 案例含 `<iframe src="https://example.com">`,DOMPurify 解析後 happy-dom 的 frame loader 真的發出 HTTPS 請求,teardown 時被 abort。修法建議:該案例改用 `about:blank` 或關閉 happy-dom frame loading。
- repo 實際路徑已從 `D:\end\workspace\vue\blog-web-v2-front-end` 搬到 `D:\backup\backup\程式\workspace\vue\blog-web-v2-front-end`(後端同樣搬到 `D:\backup\backup\程式\workspace\java\`);CLAUDE.md「External Repositories」與 agent-dispatch.md 的姊妹檔路徑仍是舊的,待 Yuan 確認新路徑是長期位置再一併改。
