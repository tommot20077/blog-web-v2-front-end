import '@testing-library/jest-dom/vitest'

// happy-dom 的 Node.prototype.nodeName 是個永遠回傳 '' 的 stub（各子類別各自覆寫）。
// DOMPurify ≥ 3.4.8 於載入時快取 Node.prototype 的 nodeName getter 來判斷標籤名稱，
// 在 happy-dom 下會讓所有標籤被當成未知節點剝除（<h1>Hello</h1> → "Hello"）。
// 真實瀏覽器不受影響；此 shim 只修正測試環境，讓 getter 委派給子類別的實作。
// 必須在 DOMPurify 被 import 之前執行（setupFiles 先於測試檔載入）。
// 守衛測試：src/test-env-nodename.test.ts
{
  const original = Object.getOwnPropertyDescriptor(Node.prototype, 'nodeName')
  if (original?.get && original.get.call(document.createElement('div')) === '') {
    Object.defineProperty(Node.prototype, 'nodeName', {
      configurable: true,
      enumerable: original.enumerable,
      get(this: Node) {
        for (let proto = Object.getPrototypeOf(this); proto && proto !== Node.prototype; proto = Object.getPrototypeOf(proto)) {
          const getter = Object.getOwnPropertyDescriptor(proto, 'nodeName')?.get
          if (getter) return getter.call(this)
        }
        return original.get!.call(this)
      },
    })
  }
}

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute('data-theme')
})

// mock window.scrollTo（happy-dom 不完整支援）
vi.stubGlobal('scrollTo', vi.fn())

// mock window.matchMedia
vi.stubGlobal('matchMedia', vi.fn((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: vi.fn(),
  removeListener: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
})))
