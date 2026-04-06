import { ref, watch, type Ref } from 'vue';
import MarkdownIt from 'markdown-it';
import taskLists from 'markdown-it-task-lists';
import DOMPurify from 'dompurify';

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
    renderedHtml.value = DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['iframe', 'input', 's', 'del', 'strike'],  // 允許影片、task list checkbox、刪除線
      ADD_ATTR: ['target', 'rel', 'class', 'style', 'type', 'checked', 'disabled'],
      ALLOW_DATA_ATTR: false,
    });
  };

  render();

  // 3. 非同步載入 Shiki + @shikijs/markdown-it 外掛
  const initShiki = async () => {
    try {
      const { fromHighlighter } = await import('@shikijs/markdown-it');
      const { createHighlighter } = await import('shiki');

      const highlighter = await createHighlighter({
        themes: ['github-light', 'github-dark'],
        langs: [
          'javascript', 'typescript', 'vue', 'vue-html',
          'html', 'css', 'scss',
          'json', 'yaml', 'toml',
          'bash', 'shell',
          'java', 'kotlin',
          'sql',
          'markdown',
          'python',
          'go', 'rust',
          'dockerfile',
        ],
      });

      // 用 CSS Variables 模式，讓深淺色切換只靠 CSS class 即可
      const shikiPlugin = fromHighlighter(highlighter, {
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
