# 文章編輯器：設計稿 vs 實作 落差盤點（唯讀）

日期：2026-07-26　範圍：`src/views/EditorView.vue` 與 `src/components/editor/*`

## 結論先行

總共列出 **12 項**設計稿有、實作缺（或名存實亡）的落差。其中 **3 項是本次盤點意外挖出、比 Yuan 點名的更嚴重**：

1. **編輯器模式切換（Write/Split/Preview）完全被拔掉**——不只是「設計稿有、實作沒做」，而是 `src/composables/useSettings.ts:61` 留了一行寫死的殘留註解「`Note: editorMode key 'blog.edMode' is read by EditorView.vue`」，但 `EditorView.vue` 全檔搜尋 `localStorage`/`blog.edMode` **零命中**——即這行註解本身就是「功能曾經存在、後來被拿掉、註解沒跟著清」的鐵證。Settings 頁的「編輯器模式」「字數計算」「自動儲存」三個設定全部只寫 localStorage，**沒有任何程式碼讀取**，是三個死設定。
2. **內文圖片上傳整套（拖曳/貼上剪貼簿/選檔案 + 對齊 + 內文圖片清單面板）都不存在**，現在的「圖片」按鈕只會插入 `![替代文字](https://)` 文字模板。但後端能力**已確認具備**：`fileService.uploadFile()` 已存在且已被封面圖使用，`FileUsageType` 型別更早已宣告 `'ARTICLE_CONTENT'`（`types/editor.ts:84`）且從未被使用過——這是純前端沒接線，不是後端沒做。
3. **草稿版本歷史 + 還原（Draft history / Restore）UI 完全沒做，但後端 API 與前端 service 層都已經寫好、有測試、只是沒人接上 UI**：`src/api/real/articleVersionService.ts` 完整實作 `list/getDetail/createManual/delete/promote/restore` 六個方法且測試齊全，但全專案除了它自己的 `.test.ts` 外**沒有任何檢視/元件引用它**。`EditorMetaSidebar.vue` 的分頁只剩 `Meta`/`Outline` 兩個 tab，設計稿的第三個 `History` tab不見了。

其餘 9 項多為中小型的「純前端接線」工作，唯一「後端能力未確認」的是文章 Slug 直接編輯欄位。

---

## 落差總表

| # | 功能 | 設計稿出處 | 實作現況 | 後端能力 | 規模 |
|---|------|-----------|---------|---------|------|
| 1 | **編輯器模式切換**（Write 純寫作／Split 分割／Preview 純預覽） | `Merged Sample - Editor.html:316-330`（segmented control，標註 `(repo)` 非新提案）；功能版見 `Blog Prototype.html:2252`（`mode` state, localStorage `blog.edMode`）與 `:2414-2427`（三顆按鈕）、`:2445-2494`（依 mode 條件渲染面板） | **完全沒有**。`EditorView.vue:166-197` 寫死同時顯示 editor-pane + editor-preview，無任何 mode 分支；`useSettings.ts:61` 留有註解宣稱「editorMode 由 EditorView.vue 讀取」，但實際零引用 | 純前端功能，不需後端 | 小～中（純前端：復原三態渲染 + 讀 Settings 預設值） |
| 2 | **內文圖片上傳**（拖曳進編輯器／⌘V 貼上／選擇檔案 + 插入時選對齊方式） | `Blog Prototype.html:2452-2467`（Image 按鈕→popover：對齊選項 + 「選擇檔案…」+「或直接拖拉／⌘V 貼上」）、`:2472-2473`（drop overlay）、`:2483`（onPaste）；`Merged Sample - Editor.html:416-422`（slash-menu 的 Image 項目「Drop or paste from clipboard」，標註 NEW） | **只剩貼網址**。`EditorToolbar.vue:36-37` 的「圖片」按鈕僅 `emit('insert-text', '![替代文字](https://)')`，無檔案選取、無拖放、無貼上事件 | **已具備**。`fileService.uploadFile(file, usageType)`（`src/api/real/fileService.ts:18-26`）已存在且被封面圖使用；`FileUsageType` 型別（`types/editor.ts:84`）已含 `'ARTICLE_CONTENT'`，但全專案搜尋 0 處使用 | 中（純前端接線：popover/拖放/貼上 + 呼叫既有 upload API） |
| 3 | **內文圖片清單面板**（縮圖 + alt + 檔案大小 + 對齊控制 + 移除 + 點縮圖跳轉編輯器行） | `Blog Prototype.html:2541-2570`（`Images · 內文圖片` 區塊，含 `ed-img-list`/`ed-img-item`） | **完全沒有**。`EditorMetaSidebar.vue` 只有 封面圖/分類/標籤/摘要 四個 section，無圖片清單 | 依附功能 #2 的上傳結果，資料面無阻礙 | 中（需新元件 + 圖片-Markdown 對應邏輯） |
| 4 | **草稿版本歷史 + 還原**（History tab，含時間戳、Auto/Manual 標記、diff 摘要、Restore 按鈕） | `Merged Sample - Editor.html:483-486`（`ed-meta-tabs` 第三個 `History` tab，標 `N` new pill）、`:516-553`（`draft-history` 四列示例，含 `.restore` 按鈕） | **完全沒有**。`EditorMetaSidebar.vue:27,109-122` 的 `metaTab` 型別只有 `'meta' \| 'outline'` | **已具備且完整**。`src/api/real/articleVersionService.ts:67-107` 已實作 `list/getDetail/createManual/delete/promote/restore`，並有對應 `articleVersionService.test.ts` 全數通過；但全專案除該 test 外零引用 | 中（純前端：新增 History tab UI + 呼叫既有 service，無需後端工作） |
| 5 | **自動儲存（Autosave）**（每隔一段時間自動存草稿 + 狀態燈號） | `Blog Prototype.html:2429-2432`（`ed-status`：綠燈「已自動儲存 · 剛剛」／黃燈「編輯中…」，標為 `(repo)` 基礎功能）；`Merged Sample - Editor.html:50-72,307-313`（升級版 rich badge，標 NEW） | **完全沒有**。現在只有手動「儲存草稿」按鈕（`EditorView.vue:124-132`），無 setInterval/debounce 自動存檔、無狀態燈號。Settings 頁雖有「自動儲存」開關（`SettingsView.vue:312`），但 `useSettings.ts:64,221` 只寫 localStorage `blog.settings.autosave`，全專案 0 處讀取 | 純前端（呼叫既有 `saveDraft()`，用 debounce/interval 包起來即可） | 小～中 |
| 6 | **Ln/Col 游標位置 + 編輯器底部狀態列**（`Ln 10 · Col 2` / `Markdown · CodeMirror 6`） | `Blog Prototype.html:2488-2491`（`ed-cm-footer`）；`Merged Sample - Editor.html:445-449` | **完全沒有**，`EditorView.vue` 模板無任何 footer 元素 | 純前端（CodeMirror selection 已可取得，`useEditorOutline.ts` 已有 cursor line 追蹤基礎） | 小 |
| 7 | **閱讀時間顯示**（`~ 6 min`） | `Merged Sample - Editor.html:344-346`（pane head 顯示 `1,284 words` / `~ 6 min`） | **邏輯已算好但沒顯示**。`useWordCount.ts:70-75` 已有 `readingTimeMinutes` computed，且已被讀者頁 `ArticleDetail.vue` 使用，但 `EditorView.vue` 只顯示 `wordCount`，未顯示 `readingTimeMinutes` | 純前端（純顯示，邏輯已存在） | 小 |
| 8 | **Slash「/」指令選單**（輸入 `/` 彈出插入 H1/H2/程式碼/Callout/Image/Table 選單） | `Merged Sample - Editor.html:377-430`（`slash-menu`，標註 NEW，非既有 repo 功能） | **完全沒有** | 純前端新元件（需監聽 CodeMirror `/` 輸入事件），無後端需求 | 中 |
| 9 | **Bubble 選取浮動工具列**（劃選文字後浮出 B/I/U/S/Code/Link/Quote） | `Merged Sample - Editor.html:432-442`（`bubble-menu`，標註 NEW） | **完全沒有**（現有 `EditorToolbar.vue` 是固定在頂部的按鈕列，非隨選取浮現） | 純前端新元件，無後端需求 | 中 |
| 10 | **封面圖拖曳上傳** | `Blog Prototype.html:2536-2539`（`cover-upload` 提示「拖曳圖片到這裡」）、`Merged Sample - Editor.html:492-494`（「Drop image · or click to upload」） | **簡化了**：現況只有點擊選檔（`EditorMetaSidebar.vue:140-155`的 `<label>`+隱藏 `<input type=file>`），無 `@drop`/`@dragover` 處理 | 已具備（同 #2 的 upload API） | 小 |
| 11 | **文章 Slug 直接編輯欄位** | `Merged Sample - Editor.html:497-500`（`● Slug` + `<input value="vue3-composables">`） | **完全沒有**。`ArticleFormData`（`types/editor.ts:74-81`）無 `slug` 欄位，UI 也無對應輸入框 | **未確認**——`ai-docs/api-contract.md` 未記載文章建立/更新 payload 是否接受自訂 slug；`articleVersionService.ts` 的 `VersionDetailResponse` 雖有 `slug` 欄位，但那是版本快照的唯讀欄位，不代表建立/更新 API 可寫入 | 大（若後端本來就是自動產生 slug、不開放使用者自訂，則需先跟後端確認契約，可能要後端配合） |
| 12 | **Settings「寫作偏好」三個設定與編輯器互不相通** | `Blog Prototype.html:3503-3519`（設定頁：編輯器預設模式 / 字數統計單位 / 自動儲存開關） | 三個設定的 UI 都已存在（`SettingsView.vue:271-313`），值也確實寫入 `localStorage`（`useSettings.ts:219-221`），但 **`EditorView.vue` 完全不讀取這三把 key**，等於設定頁是假的 | 純前端（把 #1 #5 接上後，自然能讀這幾把 key） | 小（依附 #1 #5 完成後順手補上） |

---

## Yuan 點名的三件事

**1.「切換編輯器模式」在設計稿裡具體是什麼？**
是一個三段式切換鈕：**Write（只顯示編輯器）／Split（左寫右看，預設）／Preview（只顯示預覽）**。原文出處：`Merged Sample - Editor.html:316-330` 的 `.ed-mode` segmented control（該處註解明確標示 `<!-- mode segmented (repo) -->`，代表這是既有 repo 基礎功能，不是這次 mockup 新提的）。更完整的功能版本在 `Blog Prototype.html:2252`：`const [mode, setMode] = uS(() => localStorage.getItem('blog.edMode') || 'split'); // 'write' | 'split' | 'preview'`，並在 `:2445-2494` 依 `mode` 值條件渲染編輯器面板與預覽面板（`mode !== 'preview'` 才顯示編輯器、`mode !== 'write'` 才顯示預覽）。這不是裝飾——是真的會改變版面的功能，而且原本還會存進 `localStorage` 記住使用者上次選擇。目前 `EditorView.vue` 完全沒有這段邏輯，且 `useSettings.ts:61` 留著一行寫死的殘留註解說「這把 key 由 EditorView.vue 讀取」，但實際上讀不到——是目前為止最直接的「功能曾經存在、後來消失」證據。

**2. 圖片上傳在設計稿裡長什麼樣？現在的實作只剩什麼？`fileService.ts` 有沒有上傳方法？**
設計稿（`Blog Prototype.html:2452-2467`）的內文圖片插入是一整套流程：點工具列「Image」按鈕彈出 popover → 選對齊方式（靠左/置中/靠右/滿版）→「選擇檔案…」開檔案選取器；同時編輯器本體支援**直接拖曳圖片進來**（`:2472-2473` 有拖放中的遮罩提示「放開以插入圖片」）以及**⌘V 直接貼上剪貼簿圖片**（`:2483` 的 `onPaste`），還支援多檔一次選取。旁邊的 Meta 側欄另有「Images · 內文圖片」清單面板（`:2541-2570`），列出每張已插入圖片的縮圖、alt、檔案大小、對齊控制與移除按鈕，點縮圖還能跳轉回編輯器對應行。

現在的實作（`EditorToolbar.vue:36-37`）「圖片」按鈕做的事只有一行：`emit('insert-text', '![替代文字](https://)')`——插入一段純文字模板，使用者得自己找圖床貼網址進去。**沒有檔案選取、沒有拖放、沒有貼上、沒有側欄清單。**

`fileService.ts`（`src/api/real/fileService.ts:17-44`）**確實有上傳方法**：`uploadFile(file, usageType)`，打 `POST /api/v1/files/upload`，而且已經在 `EditorMetaSidebar.vue:92` 被封面圖上傳呼叫使用（`usageType: 'ARTICLE_COVER'`）。型別系統裡 `FileUsageType`（`types/editor.ts:84`）本來就宣告了三種用途：`'ARTICLE_CONTENT' | 'ARTICLE_COVER' | 'AVATAR'`，其中 `ARTICLE_CONTENT` 全專案搜尋 **0 處使用**——這代表後端合約早就預留了「內文圖片上傳」這個用途值，前端型別也對齊了，就是編輯器 UI 沒接上去。**結論：這是純前端沒接線，不是後端沒做。**

**3. 還缺哪些——按重要性排序**
1. 編輯器模式切換（#1）——Yuan 已點名，且有明確的「曾經存在」證據（死註解 + localStorage 讀寫源頭都在）
2. 內文圖片上傳整套（#2 + #3）——Yuan 已點名，後端能力已確認具備，純前端工作量
3. 草稿版本歷史 + 還原（#4）——**盤點中意外挖出、Yuan 沒提到但影響最大**：後端 + service 層完整、有測試，只差 UI，是目前落差清單裡「性價比最高」的一項
4. 自動儲存（#5）——與 #1 同源（Settings 三個死設定之一），使用者體感會很明顯（沒有自動存檔风险丟稿）
5. Settings 寫作偏好死設定（#12）——並非獨立缺失，做完 #1 #5 會自然解決
6. Slash 選單、Bubble 選取工具列（#8 #9）——設計稿裡明確標記為 **NEW 提案**（非既有 repo 功能退化），優先度較低
7. 內文圖片清單面板、封面拖曳上傳、Ln/Col 狀態列、閱讀時間顯示（#3 附屬、#10、#6、#7）——體驗細節，規模小
8. Slug 欄位（#11）——優先度最低，且後端契約未確認，動之前要先問後端

---

## 視覺差異（僅摘要，非逐條列）

- 設計稿的頂部 topbar 用 segmented control + pill 狀態徽章的玻璃感視覺語言（`.ed-mode`、`.ed-status.autosave-rich`），現況是純陽春的 flex 按鈕列，無圓角分段容器樣式。
- 設計稿 Meta 側欄用卡片式 `h5` 小標 + 圖示點（`● Cover`），現況用 Tailwind utility class 拼出的樣式，資訊架構一致但視覺質感（陰影、圓角、間距）較樸素。
- Draft history 列表在設計稿有精緻的 hover 態（`.draft-row:hover .restore { opacity: 1 }`），這屬於裝飾層，等 #4 做出來再一併考慮即可，不需要現在單獨處理。
