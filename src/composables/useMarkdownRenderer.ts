import { ref, watch, type Ref } from 'vue';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import DOMPurify from 'dompurify';
import type { HighlighterGeneric } from '@shikijs/types'

/** 允許的單一 Shiki 宣告：`--shiki-xxx: #hex` 或單純關鍵字（italic / bold / underline…）。 */
const SHIKI_DECLARATION = /^--shiki-[a-z-]+\s*:\s*(?:#[0-9a-f]{3,8}|[a-z-]+)$/i;

/** 整個 style 值是否僅由 Shiki 宣告構成（不含 url()、position 等任何其他內容）。 */
const isShikiStyleValue = (value: string): boolean => {
  const declarations = value.split(';').map((part) => part.trim()).filter(Boolean);
  return declarations.length > 0 && declarations.every((declaration) => SHIKI_DECLARATION.test(declaration));
};

/**
 * 專屬的 DOMPurify 實例：hook 只掛在這個實例，不影響其他直接使用全域 DOMPurify 的元件。
 * 延遲建立，避免 module 載入時就需要 window。
 */
let purifier: ReturnType<typeof DOMPurify> | null = null;
const getPurifier = () => {
  if (purifier) return purifier;
  const instance = DOMPurify(window);
  instance.addHook('uponSanitizeAttribute', (node, data) => {
    if (data.attrName !== 'style') return;
    const insideShikiBlock = node.closest?.('pre.shiki') != null;
    if (!(insideShikiBlock && isShikiStyleValue(data.attrValue))) {
      data.keepAttr = false;
    }
  });
  purifier = instance;
  return instance;
};

/**
 * useMarkdownRenderer
 * 
 * 將 Markdown 原始字串轉換為安全的 HTML，同時整合 Shiki 程式碼高亮。
 * 
 * 流程：
 *   Markdown string
 *     → markdown-it 解析 (含 Shiki 高亮外掛)
 *     → DOMPurify 消毒 (防 XSS)
 *     → 安全 HTML string
 * 
 * Shiki 為非同步載入，初始化完成前先用 markdown-it 的預設 <pre><code> 渲染，
 * Shiki 就緒後自動重新渲染一次。
 *
 * 消毒策略（決策紀錄 §3，XSS-01 / XSS-02）：
 *   - 不允許 iframe
 *   - style 屬性只保留在 Shiki 程式碼區塊（pre.shiki 及其子元素），且值必須是
 *     Shiki 實際輸出的 `--shiki-*: <色碼|關鍵字>` 宣告；其餘元素一律移除 style
 */
export function useMarkdownRenderer(markdownContent: Ref<string>) {
  const renderedHtml = ref('');
  const isReady = ref(false);

  // 1. 先建立基礎 markdown-it 實例（Shiki 還沒載入之前就能渲染）
  let md = MarkdownIt({
    html: true,       // 允許 Markdown 中的 HTML 標籤（後續由 DOMPurify 消毒）
    linkify: true,     // 自動將 URL 轉為連結
    typographer: true, // 智慧引號等排版增強
  });
  md.use(taskLists, { enabled: true, label: true, labelAfter: true });

  // 2. 立刻做一次初始渲染（無高亮版本），讓使用者不用等 Shiki 載入
  const render = () => {
    const rawHtml = md.render(markdownContent.value || '');
    renderedHtml.value = getPurifier().sanitize(rawHtml, {
      ADD_TAGS: ['input', 's', 'del', 'strike'],  // 允許 task list checkbox、刪除線（iframe 已移除，見檔頭）
      // style 不在此列：DOMPurify 預設允許 style，改由 getPurifier() 的 hook 限縮到 Shiki 區塊
      ADD_ATTR: ['target', 'rel', 'class', 'type', 'checked', 'disabled'],
      ALLOW_DATA_ATTR: false,
    });
  };

  render();

  // 3. 非同步載入 Shiki + @shikijs/markdown-it 外掛
  const initShiki = async () => {
    try {
      const { fromHighlighter } = await import('@shikijs/markdown-it/core');
      const { createHighlighterCore } = await import('shiki/core');
      const { createJavaScriptRegexEngine } = await import('shiki/engine/javascript');
      const [
        githubLight,
        githubDark,
        javascript,
        typescript,
        vue,
        vueHtml,
        html,
        css,
        scss,
        json,
        yaml,
        toml,
        bash,
        shellscript,
        java,
        kotlin,
        sql,
        python,
        go,
        rust,
        dockerfile,
      ] = await Promise.all([
        import('@shikijs/themes/github-light').then((module) => module.default),
        import('@shikijs/themes/github-dark').then((module) => module.default),
        import('@shikijs/langs/javascript').then((module) => module.default),
        import('@shikijs/langs/typescript').then((module) => module.default),
        import('@shikijs/langs/vue').then((module) => module.default),
        import('@shikijs/langs/vue-html').then((module) => module.default),
        import('@shikijs/langs/html').then((module) => module.default),
        import('@shikijs/langs/css').then((module) => module.default),
        import('@shikijs/langs/scss').then((module) => module.default),
        import('@shikijs/langs/json').then((module) => module.default),
        import('@shikijs/langs/yaml').then((module) => module.default),
        import('@shikijs/langs/toml').then((module) => module.default),
        import('@shikijs/langs/bash').then((module) => module.default),
        import('@shikijs/langs/shellscript').then((module) => module.default),
        import('@shikijs/langs/java').then((module) => module.default),
        import('@shikijs/langs/kotlin').then((module) => module.default),
        import('@shikijs/langs/sql').then((module) => module.default),
        import('@shikijs/langs/python').then((module) => module.default),
        import('@shikijs/langs/go').then((module) => module.default),
        import('@shikijs/langs/rust').then((module) => module.default),
        import('@shikijs/langs/dockerfile').then((module) => module.default),
      ])

      const highlighter = await createHighlighterCore({
        themes: [githubLight, githubDark],
        langs: [
          javascript, typescript, vue, vueHtml,
          html, css, scss,
          json, yaml, toml,
          bash, shellscript,
          java, kotlin,
          sql,
          python,
          go, rust,
          dockerfile,
        ],
        engine: createJavaScriptRegexEngine(),
      });

      // 用 CSS Variables 模式，讓深淺色切換只靠 CSS class 即可
      const shikiPlugin = fromHighlighter(highlighter as unknown as HighlighterGeneric<any, any>, {
        themes: {
          light: 'github-light',
          dark: 'github-dark',
        },
        cssVariablePrefix: '--shiki-',
        defaultColor: false,
      });

      // 重新建立 md 實例並掛載 Shiki 外掛
      md = MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
      });
      md.use(taskLists, { enabled: true, label: true, labelAfter: true });
      md.use(shikiPlugin);

      isReady.value = true;

      // Shiki 就緒後重新渲染一次（這次有語法高亮了）
      render();
    } catch (error) {
      console.error('[useMarkdownRenderer] Shiki 載入失敗，將使用無高亮版本：', error);
      isReady.value = true; // 即使失敗也標記為 ready，不阻塞流程
    }
  };

  initShiki();

  // 4. 監聽 Markdown 內容變化，自動重新渲染
  watch(markdownContent, render);

  return {
    /** 已消毒的 HTML 字串，可安全地用於 v-html */
    renderedHtml,
    /** Shiki 是否已載入完成 */
    isReady,
  };
}
