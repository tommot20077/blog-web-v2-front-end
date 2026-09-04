/**
 * WCAG 2.x 對比度計算工具。
 *
 * 公式（WCAG 2.1 §1.4.3 附錄定義）：
 * 1. 將 sRGB 各色版（0-255）線性化（去 gamma 校正）
 * 2. 相對亮度 L = 0.2126*R + 0.7152*G + 0.0722*B（R/G/B 為線性化後的值）
 * 3. 對比度 = (L1 + 0.05) / (L2 + 0.05)，其中 L1 為較亮者、L2 為較暗者
 *
 * 參考：https://www.w3.org/TR/WCAG21/#dfn-contrast-ratio
 */

export interface RgbColor {
  r: number
  g: number
  b: number
}

/** 將 3 碼或 6 碼 hex 色碼（可含或不含前導 `#`）轉為 0-255 的 RGB。 */
export function hexToRgb(hex: string): RgbColor {
  const normalized = hex.trim().replace(/^#/, '')
  const full = normalized.length === 3
    ? normalized.split('').map((c) => c + c).join('')
    : normalized

  if (!/^[0-9a-fA-F]{6}$/.test(full)) {
    throw new Error(`Invalid hex color: ${hex}`)
  }

  const num = parseInt(full, 16)
  return { r: (num >> 16) & 255, g: (num >> 8) & 255, b: num & 255 }
}

function srgbChannelToLinear(channel255: number): number {
  const c = channel255 / 255
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
}

/** WCAG 相對亮度（0 = 純黑, 1 = 純白）。 */
export function relativeLuminance(color: RgbColor): number {
  const r = srgbChannelToLinear(color.r)
  const g = srgbChannelToLinear(color.g)
  const b = srgbChannelToLinear(color.b)
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** 計算兩個 hex 色碼之間的 WCAG 對比度（範圍 1:1 ~ 21:1），與傳入順序無關。 */
export function contrastRatio(hexA: string, hexB: string): number {
  const lumA = relativeLuminance(hexToRgb(hexA))
  const lumB = relativeLuminance(hexToRgb(hexB))
  const lighter = Math.max(lumA, lumB)
  const darker = Math.min(lumA, lumB)
  return (lighter + 0.05) / (darker + 0.05)
}

/** WCAG AA 一般文字（非大字級）最低對比度需求。 */
export const WCAG_AA_NORMAL_TEXT = 4.5
