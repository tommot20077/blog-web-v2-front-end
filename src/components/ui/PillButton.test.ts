import { render, fireEvent } from '@testing-library/vue'
import PillButton from './PillButton.vue'

describe('PillButton', () => {
  // pill variant（預設）
  describe('variant=pill（預設）', () => {
    it('isActive=true 套用背景色 class', () => {
      const { getByRole } = render(PillButton, {
        props: { isActive: true },
        slots: { default: '全部' },
      })
      const btn = getByRole('button')
      expect(btn.className).toContain('bg-[var(--ink)]')
      expect(btn.className).toContain('text-[var(--bg)]')
    })

    it('isActive=false 不套用背景色，套用 hover class', () => {
      const { getByRole } = render(PillButton, {
        props: { isActive: false },
        slots: { default: 'Frontend' },
      })
      const btn = getByRole('button')
      expect(btn.className).not.toContain('bg-[var(--ink)]')
      expect(btn.className).toContain('text-[var(--ink)]')
      expect(btn.className).toContain('hover:bg-black/5')
    })

    it('isActive=false 不使用 opacity-60（BUG-007 修正驗證）', () => {
      const { getByRole } = render(PillButton, {
        props: { isActive: false },
        slots: { default: 'Frontend' },
      })
      const btn = getByRole('button')
      expect(btn.className).not.toContain('opacity-60')
    })
  })

  // size
  describe('size prop', () => {
    it('size=sm 套用 w-8 h-8 rounded-full', () => {
      const { getByRole } = render(PillButton, {
        props: { size: 'sm' },
        slots: { default: '⚡' },
      })
      const btn = getByRole('button')
      expect(btn.className).toContain('w-8')
      expect(btn.className).toContain('h-8')
    })

    it('size=md（預設）套用 px-5 py-2', () => {
      const { getByRole } = render(PillButton, {
        slots: { default: '文字' },
      })
      const btn = getByRole('button')
      expect(btn.className).toContain('px-5')
      expect(btn.className).toContain('py-2')
    })
  })

  // tab variant
  describe('variant=tab', () => {
    it('isActive=true 套用 accent color class', () => {
      const { getByRole } = render(PillButton, {
        props: { variant: 'tab', isActive: true },
        slots: { default: '首頁' },
      })
      const btn = getByRole('button')
      expect(btn.className).toContain('text-[var(--accent)]')
    })

    it('isActive=false 套用 text-main + opacity-80', () => {
      const { getByRole } = render(PillButton, {
        props: { variant: 'tab', isActive: false },
        slots: { default: '文章' },
      })
      const btn = getByRole('button')
      expect(btn.className).toContain('text-[var(--ink)]')
      expect(btn.className).toContain('opacity-80')
      expect(btn.className).not.toContain('opacity-50')
    })
  })

  // disabled
  describe('disabled', () => {
    it('disabled=true 時 button 有 disabled attribute', () => {
      const { getByRole } = render(PillButton, {
        props: { disabled: true },
        slots: { default: '按鈕' },
      })
      expect(getByRole('button')).toBeDisabled()
    })

    it('disabled=true 時點擊不 emit click', async () => {
      const { getByRole, emitted } = render(PillButton, {
        props: { disabled: true },
        slots: { default: '按鈕' },
      })
      await fireEvent.click(getByRole('button'))
      expect(emitted('click')).toBeFalsy()
    })

    it('disabled=false 時點擊 emit click', async () => {
      const { getByRole, emitted } = render(PillButton, {
        props: { disabled: false },
        slots: { default: '按鈕' },
      })
      await fireEvent.click(getByRole('button'))
      expect(emitted('click')).toBeTruthy()
    })
  })

  // slot
  it('渲染 slot 內容', () => {
    const { getByText } = render(PillButton, {
      slots: { default: 'Hello World' },
    })
    expect(getByText('Hello World')).toBeTruthy()
  })
})
