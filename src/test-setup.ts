import '@testing-library/jest-dom/vitest'

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
