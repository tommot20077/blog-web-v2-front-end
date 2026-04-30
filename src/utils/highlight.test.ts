import { describe, it, expect } from 'vitest'
import { highlight } from './highlight'

describe('highlight', () => {
  it('空查詢時回傳純文字', () => {
    expect(highlight('Hello World', '')).toBe('Hello World')
  })

  it('匹配文字包裹 mark tag', () => {
    expect(highlight('Hello World', 'World')).toBe('Hello <mark>World</mark>')
  })

  it('不區分大小寫匹配', () => {
    expect(highlight('Hello World', 'hello')).toBe('<mark>Hello</mark> World')
  })

  it('HTML 標籤不應被渲染 — script tag 被移除', () => {
    // DOMPurify ALLOWED_TAGS:[] 移除 script tag，只保留其文字內容 alert(1)
    const malicious = '<script>alert(1)</script>safe text'
    const result = highlight(malicious, 'safe')
    expect(result).not.toContain('<script>')
    expect(result).toContain('<mark>safe</mark>')
  })

  it('img onerror 注入不應保留', () => {
    const malicious = '<img src=x onerror=alert(1)>text'
    const result = highlight(malicious, 'text')
    expect(result).not.toContain('<img')
    expect(result).toContain('<mark>text</mark>')
  })

  it('正規表達式特殊字元正確跳脫', () => {
    expect(highlight('price: $100', '$100')).toBe('price: <mark>$100</mark>')
  })

  it('查詢空白時 HTML tag 被剝除，只保留文字內容', () => {
    const html = '<b>bold</b>'
    const result = highlight(html, '   ')
    expect(result).not.toContain('<b>')
    // DOMPurify ALLOWED_TAGS:[] 移除 tag，只保留文字內容
    expect(result).toBe('bold')
  })
})
