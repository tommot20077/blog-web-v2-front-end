/**
 * 測試環境守衛：happy-dom 的 Node.prototype.nodeName getter 預設回傳 ''，
 * 而 DOMPurify ≥ 3.4.8 會在載入時快取該 getter 並用它判斷標籤名稱，
 * 導致所有標籤（<h1>、<p>…）被當成未知節點剝除。
 * src/test-setup.ts 以 shim 修正；此測試確保 shim 存在，避免之後被移除而悄悄弄壞所有 sanitize 測試。
 */
import DOMPurify from 'dompurify'

describe('測試環境：DOMPurify 與 happy-dom 相容性', () => {
  it('Node.prototype.nodeName getter 對 Element 回傳實際標籤名稱', () => {
    const getter = Object.getOwnPropertyDescriptor(Node.prototype, 'nodeName')?.get
    expect(getter).toBeTypeOf('function')
    expect(getter!.call(document.createElement('h1'))).toBe('H1')
  })

  it('Node.prototype.nodeName getter 對 Text 節點回傳 #text', () => {
    const getter = Object.getOwnPropertyDescriptor(Node.prototype, 'nodeName')?.get
    expect(getter!.call(document.createTextNode('x'))).toBe('#text')
  })

  it('DOMPurify.sanitize 保留一般白名單標籤（<h1>）', () => {
    expect(DOMPurify.sanitize('<h1>Hello</h1>')).toBe('<h1>Hello</h1>')
  })
})
