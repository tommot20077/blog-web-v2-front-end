import { describe, it, expect } from 'vitest'
import { hexToRgb, relativeLuminance, contrastRatio, WCAG_AA_NORMAL_TEXT } from './contrastRatio'

describe('contrastRatio', () => {
  it('黑白對比為 WCAG 定義的最大值 21:1', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 1)
  })

  it('相同顏色對比為最小值 1:1', () => {
    expect(contrastRatio('#123456', '#123456')).toBeCloseTo(1, 5)
  })

  it('與前景/背景順序無關（互換結果相同）', () => {
    expect(contrastRatio('#b91c1c', '#ffffff')).toBeCloseTo(contrastRatio('#ffffff', '#b91c1c'), 5)
  })

  it('支援 3 碼簡寫 hex', () => {
    expect(contrastRatio('#000', '#fff')).toBeCloseTo(21, 1)
  })

  it('已知案例：#b91c1c 對白底約 6.47:1', () => {
    expect(contrastRatio('#b91c1c', '#ffffff')).toBeCloseTo(6.47, 1)
  })

  it('已知案例：#b91c1c 對暗色 --bg-sub(#242426) 僅約 2.39:1（暗色對比不足的現況）', () => {
    expect(contrastRatio('#b91c1c', '#242426')).toBeCloseTo(2.39, 1)
  })
})

describe('relativeLuminance', () => {
  it('純黑相對亮度為 0', () => {
    expect(relativeLuminance(hexToRgb('#000000'))).toBeCloseTo(0, 5)
  })

  it('純白相對亮度為 1', () => {
    expect(relativeLuminance(hexToRgb('#ffffff'))).toBeCloseTo(1, 5)
  })
})

describe('WCAG_AA_NORMAL_TEXT', () => {
  it('一般文字最低對比度門檻為 4.5:1', () => {
    expect(WCAG_AA_NORMAL_TEXT).toBe(4.5)
  })
})
