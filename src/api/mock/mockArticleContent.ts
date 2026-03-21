// 將 mock Markdown 內容獨立抽出來，避免模板字串的反引號跳脫地獄
// 這裡的每個反引號只需要一層 \ 跳脫

const codeTs = '```typescript\ninterface ArticleDetailItem {\n  uuid: string;\n  title: string;\n  content: string; // Markdown 原始字串\n  tags: string[];\n  publishedAt: string;\n}\n\nconst useEnterpriseArchitect = (config: Record<string, unknown>) => {\n  const state = reactive({ readiness: 0, healthy: true });\n\n  const initialize = async () => {\n    // bootstrap core services\n    await loadModules(config);\n    state.readiness = 100;\n  };\n\n  return { state, initialize };\n};\n```';

const codeVue = '```vue\n<script setup lang="ts">\nimport { ref, computed } from \'vue\';\nimport { useMarkdownRenderer } from \'../composables/useMarkdownRenderer\';\n\nconst content = ref(\'# Hello World\');\nconst { renderedHtml } = useMarkdownRenderer(content);\n</script>\n\n<template>\n  <div class="prose" v-html="renderedHtml" />\n</template>\n```';

const codeSql = '```sql\nSELECT a.uuid, a.title, a.published_at,\n       COUNT(al.id) AS like_count\nFROM articles a\nLEFT JOIN article_likes al ON al.article_id = a.id\nWHERE a.status = \'PUBLISHED\'\nGROUP BY a.id\nORDER BY a.published_at DESC\nLIMIT 10 OFFSET 0;\n```';

const codeBash = '```bash\n#!/bin/bash\necho "🚀 Starting development server..."\nnpm install\nnpm run dev -- --port 5000\n```';

const codeJson = '```json\n{\n  "code": 200,\n  "message": "success",\n  "data": {\n    "uuid": "550e8400-e29b-41d4-a716-446655440000",\n    "title": "深入理解 Vue 3 Reactivity",\n    "tags": ["Vue", "Frontend", "TypeScript"]\n  }\n}\n```';

const codeBashSmall = '```bash\nnpm install markdown-it shiki dompurify\n```';

export const mockMarkdownContent = `
# H1 標題測試

## H2 重新定義前端與後端的界線

### H3 核心設計理念

#### H4 細節補充

##### H5 備註層級

###### H6 最小標題

---

## 文字格式

這是一段普通的段落文字。當我們探討現代化工程時，**粗體文字** 與 *斜體文字* 總是不可或缺。你也可以使用 ***粗斜體*** 來強調重點。

如果需要標記刪除線文字，可以使用 ~~這段文字已被刪除~~。

行內程式碼可以用 \`const x = 42\` 這樣的方式來顯示，非常適合在文章中提及變數名稱如 \`ref()\`、\`reactive()\` 或檔案路徑 \`src/composables/useMarkdownRenderer.ts\`。

這裡有一個[超連結到 Vue 官網](https://vuejs.org)，以及一個自動連結的 URL：https://github.com

---

## 引用區塊

> 「真正的優雅，不僅在於視覺的饗宴，更在於底層架構邏輯的一塵不染。」
>
> — 某位不存在的資深架構師

巢狀引用：

> 這是第一層引用
>
> > 這是第二層巢狀引用，用來補充說明上層的觀點。
>
> 回到第一層。

---

## 列表

### 無序列表

- **職責分離 (Separation of Concerns)**：將 UI 渲染與商業邏輯拆分解耦。
- **漸進式增強 (Progressive Enhancement)**：先確保核心功能完美運作。
  - 子項目 A：響應式設計
  - 子項目 B：無障礙設計 (a11y)
    - 更深的項目：ARIA 標籤
- **基礎設施即程式碼 (IaC)**：所有環境都有版本控制。

### 有序列表

1. 先讓它**能動**
2. 再讓它**正確**
3. 最後讓它**快速**

### 任務清單

- [x] 安裝 markdown-it
- [x] 整合 Shiki 語法高亮
- [x] 串接 DOMPurify 消毒
- [ ] 實作 CodeMirror 6 編輯器
- [ ] 建立圖片上傳功能

---

## 程式碼區塊

### TypeScript

${codeTs}

### Vue SFC

${codeVue}

### SQL

${codeSql}

### Bash

${codeBash}

### JSON

${codeJson}

---

## 表格

| 方案 | 首次載入 | 二次載入 | 記憶體佔用 | 適合場景 |
|------|:-------:|:-------:|:---------:|---------|
| CSR | 較慢 | 極快 | 中等 | SPA 應用 |
| SSR | 極快 | 快 | 較高 | SEO 需求 |
| SSG | 極快 | 極快 | 最低 | 部落格/文件 |
| ISR | 極快 | 極快 | 中等 | 混合應用 |

更複雜的表格：

| 套件 | 用途 | 大小 | 我們用了嗎？ |
|------|------|------|:-----------:|
| markdown-it | Markdown → HTML | ~30KB | ✅ |
| shiki | 程式碼高亮 | ~200KB (lazy) | ✅ |
| DOMPurify | XSS 防護 | ~15KB | ✅ |
| CodeMirror 6 | 編輯器核心 | ~150KB | ⏳ 待實作 |
| splitpanes | 分割面板 | ~10KB | ⏳ 待實作 |

---

## 圖片

圖片目前使用 placeholder（未來串接 MinIO）：

![這是一張示意圖的 alt 文字](https://via.placeholder.com/800x400/2D264B/FFFFFF?text=Blog+Cover+Image)

---

## 混合巢狀

> **小提示**：以下是一個在引用區塊內使用列表和程式碼的範例：
>
> 1. 首先安裝套件
> 2. 然後設定 \`vite.config.ts\`
> 3. 最後在元件中引入
>
> ${codeBashSmall}

---

## 中文排版測試

在繁體中文的技術文章中，我們經常會混用中英文。例如：使用 Vue 3 的 Composition API 搭配 TypeScript 來建構企業級應用程式。這段文字包含了中文標點符號「」、（）、——、……等等，用來驗證排版引擎是否能正確處理 CJK 字元與拉丁字元之間的間距。

日文測試：これはテストです。
韓文測試：이것은 테스트입니다.

---

## 小結

這篇測試文章涵蓋了以下 Markdown 語法：

1. **標題** (H1-H6)
2. **文字格式** (粗體、斜體、刪除線、行內程式碼)
3. **引用區塊** (含巢狀)
4. **列表** (有序、無序、任務清單、巢狀)
5. **程式碼區塊** (TypeScript、Vue、SQL、Bash、JSON)
6. **表格** (含對齊)
7. **圖片**
8. **水平分隔線**
9. **超連結**
10. **混合巢狀結構**
11. **CJK 中英混排**

如果以上所有元素都能正確、美觀地渲染，那麼我們的 \`markdown-it\` + \`Shiki\` + \`DOMPurify\` + \`Typography\` 管線就算是通過了完整的壓力測試！🎉
`;
