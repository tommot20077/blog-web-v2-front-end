import { describe, it, expect } from 'vitest'
import {
  hexToRgb,
  relativeLuminance,
  contrastRatio,
  contrastRatioRgb,
  compositeOver,
  WCAG_AA_NORMAL_TEXT,
} from './contrastRatio'

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

/**
 * compositeOver：標準 alpha "over" 合成公式 out = alpha*src + (1-alpha)*dst，
 * 用來算「半透明色疊在某底色上」實際渲染出的合成色（逐色版計算，不做 gamma 校正——
 * 瀏覽器合成半透明色本身就是在 sRGB 數值空間做線性插值，這與 relativeLuminance()
 * 內部的 gamma 去校正是兩個獨立步驟，不可混淆）。
 */
describe('compositeOver', () => {
  it('alpha=1 時完全覆蓋，回傳 src 本身', () => {
    const src = { r: 239, g: 68, b: 68 }
    const dst = { r: 10, g: 10, b: 10 }
    expect(compositeOver(src, 1, dst)).toEqual(src)
  })

  it('alpha=0 時完全透明，回傳 dst 本身', () => {
    const src = { r: 239, g: 68, b: 68 }
    const dst = { r: 10, g: 10, b: 10 }
    expect(compositeOver(src, 0, dst)).toEqual(dst)
  })

  it('alpha=0.5 時為 src/dst 逐色版平均值', () => {
    const src = { r: 255, g: 0, b: 0 }
    const dst = { r: 0, g: 0, b: 0 }
    const result = compositeOver(src, 0.5, dst)
    expect(result.r).toBeCloseTo(127.5, 5)
    expect(result.g).toBeCloseTo(0, 5)
    expect(result.b).toBeCloseTo(0, 5)
  })

  it('已知案例：--danger-strong(#ef4444) 8% 疊在暗色 --bg(#1d1d1f) 上，合成色約 (45.8,32.1,34.0)', () => {
    const src = hexToRgb('#ef4444')
    const dst = hexToRgb('#1d1d1f')
    const result = compositeOver(src, 0.08, dst)
    expect(result.r).toBeCloseTo(45.8, 1)
    expect(result.g).toBeCloseTo(32.1, 1)
    expect(result.b).toBeCloseTo(34.0, 1)
  })

  it('可鏈式合成兩層半透明色（如 --glass 疊在 --bg 上，再疊 color-mix 紅底）', () => {
    // dark: --glass rgba(36,36,38,0.74) 疊在 --bg #1d1d1f 上
    const glassOverBg = compositeOver({ r: 36, g: 36, b: 38 }, 0.74, hexToRgb('#1d1d1f'))
    expect(glassOverBg.r).toBeCloseTo(34.18, 1)
    expect(glassOverBg.g).toBeCloseTo(34.18, 1)
    expect(glassOverBg.b).toBeCloseTo(36.18, 1)

    // 再疊 10% --danger-strong(#ef4444) 紅底
    const final = compositeOver(hexToRgb('#ef4444'), 0.10, glassOverBg)
    expect(final.r).toBeCloseTo(54.7, 0)
    expect(final.g).toBeCloseTo(37.6, 0)
    expect(final.b).toBeCloseTo(39.4, 0)
  })
})

describe('contrastRatioRgb', () => {
  it('與 contrastRatio(hex, hex) 對相同顏色算出相同結果', () => {
    const a = hexToRgb('#b91c1c')
    const b = hexToRgb('#ffffff')
    expect(contrastRatioRgb(a, b)).toBeCloseTo(contrastRatio('#b91c1c', '#ffffff'), 10)
  })

  it('黑白對比為 21:1', () => {
    expect(contrastRatioRgb({ r: 0, g: 0, b: 0 }, { r: 255, g: 255, b: 255 })).toBeCloseTo(21, 1)
  })

  it('與傳入順序無關', () => {
    const a = { r: 200, g: 30, b: 30 }
    const b = { r: 20, g: 20, b: 20 }
    expect(contrastRatioRgb(a, b)).toBeCloseTo(contrastRatioRgb(b, a), 10)
  })
})
