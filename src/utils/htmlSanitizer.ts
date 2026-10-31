import DOMPurify from 'dompurify'

/**
 * 共用的 HTML 消毒設定（Markdown 渲染器、留言共用）。
 *
 * 每次 createHtmlSanitizer() 都建立「獨立的 DOMPurify 實例」，hook 只掛在該實例上，
 * 因此 Markdown 渲染器的 Shiki style 例外不會外洩到留言，也不影響全域 DOMPurify。
 *
 * 收緊重點（XSS-01 / XSS-02 與對抗式審查結果）：
 *  - <style> 元素一律移除：DOMPurify 預設允許它，可做全版蓋板 / 點擊劫持 / @import 對外請求
 *  - <form>、<button>、<select>、<textarea>、<iframe> 等互動 / 嵌入元素一律移除，避免釣魚表單
 *  - <input> 只允許 type="checkbox"（task list 用）；其他 type 或缺 type 的 input 整個移除
 *  - action / formaction 屬性移除
 *  - style 屬性預設全部移除；唯有 allowShikiStyle 時，pre.shiki 內且只含 --shiki-* 宣告者保留
 */

/** 一律禁止的標籤（DOMPurify 預設允許其中多數）。 */
const FORBID_TAGS = ['style', 'form', 'button', 'select', 'option', 'optgroup', 'textarea', 'iframe', 'frame', 'frameset', 'object', 'embed']

/**
 * 被禁止時連內容一起丟棄的標籤（DOMPurify 預設只丟 script/style/iframe 等少數）。
 * form 內的 input / button 若以 KEEP_CONTENT 被「拆出」成兄弟節點，會變成脫離 form 的假登入欄位，
 * 因此整個 form 連同內容移除。
 */
const FORBID_CONTENTS = ['form', 'select', 'option', 'optgroup', 'textarea', 'object', 'embed', 'frame', 'frameset']

/** 一律禁止的屬性（表單提交目標）。style 屬性由 hook 依 allowShikiStyle 決定。 */
const FORBID_ATTR = ['action', 'formaction']

/** 允許的單一 Shiki 宣告：`--shiki-xxx: #hex` 或單純關鍵字（italic / bold / underline…）。 */
const SHIKI_DECLARATION = /^--shiki-[a-z-]+\s*:\s*(?:#[0-9a-f]{3,8}|[a-z-]+)$/i

/** 整個 style 值是否僅由 Shiki 宣告構成（不含 url()、position 等任何其他內容）。 */
const isShikiStyleValue = (value: string): boolean => {
  const declarations = value.split(';').map((part) => part.trim()).filter(Boolean)
  return declarations.length > 0 && declarations.every((declaration) => SHIKI_DECLARATION.test(declaration))
}

export interface HtmlSanitizerOptions {
  /** 是否保留 Shiki 程式碼區塊（pre.shiki 及其子元素）上的 --shiki-* style。留言不需要。 */
  allowShikiStyle?: boolean
  /** 額外允許的標籤（例如 Markdown 的 s / del / strike）。 */
  addTags?: string[]
  /** 額外允許的屬性。不可包含 style（style 一律由 hook 控管）。 */
  addAttrs?: string[]
}

export interface HtmlSanitizer {
  sanitize: (html: string) => string
}

/**
 * 建立消毒器。DOMPurify 實例延遲到第一次 sanitize 才建立，避免 module 載入時就需要 window。
 */
export function createHtmlSanitizer(options: HtmlSanitizerOptions = {}): HtmlSanitizer {
  const { allowShikiStyle = false, addTags = [], addAttrs = [] } = options
  let purifier: ReturnType<typeof DOMPurify> | null = null

  const getPurifier = () => {
    if (purifier) return purifier
    const instance = DOMPurify(window)

    instance.addHook('uponSanitizeAttribute', (node, data) => {
      if (data.attrName !== 'style') return
      const insideShikiBlock = allowShikiStyle && node.closest?.('pre.shiki') != null
      if (!(insideShikiBlock && isShikiStyleValue(data.attrValue))) {
        data.keepAttr = false
      }
    })

    // input 只允許 type="checkbox"；其餘（含缺 type，預設為 text）整個元素移除。
    // 在 afterSanitizeAttributes 判斷，此時 type 屬性已經過 DOMPurify 屬性白名單處理。
    instance.addHook('afterSanitizeAttributes', (node) => {
      if (node.nodeName.toLowerCase() !== 'input') return
      if ((node.getAttribute('type') ?? '').trim().toLowerCase() !== 'checkbox') {
        node.parentNode?.removeChild(node)
      }
    })

    purifier = instance
    return instance
  }

  return {
    sanitize(html: string): string {
      return getPurifier().sanitize(html, {
        ADD_TAGS: addTags,
        ADD_ATTR: addAttrs,
        FORBID_TAGS,
        FORBID_ATTR,
        ADD_FORBID_CONTENTS: FORBID_CONTENTS,
        ALLOW_DATA_ATTR: false,
      })
    },
  }
}
