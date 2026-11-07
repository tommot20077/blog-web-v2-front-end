import { describe, it, expect } from 'vitest'
import {
  MAX_ARTICLE_CONTENT_LENGTH,
  MAX_ARTICLE_TITLE_LENGTH,
  MAX_ARTICLE_SUMMARY_LENGTH,
  MAX_NICKNAME_LENGTH,
  MAX_REJECT_REASON_LENGTH,
  MAX_TAG_ICON_LENGTH,
  MAX_TAG_DESCRIPTION_LENGTH,
  CONTENT_WARN_RATIO,
  exceedsLength,
  isNearLimit,
  isTagColor,
} from './inputLimits'

describe('inputLimits 常數（對齊 openapi.json 快照）', () => {
  it('上限值與快照 maxLength 一致', () => {
    expect(MAX_ARTICLE_CONTENT_LENGTH).toBe(200000)
    expect(MAX_ARTICLE_TITLE_LENGTH).toBe(120)
    expect(MAX_ARTICLE_SUMMARY_LENGTH).toBe(500)
    expect(MAX_NICKNAME_LENGTH).toBe(50)
    expect(MAX_REJECT_REASON_LENGTH).toBe(500)
    expect(MAX_TAG_ICON_LENGTH).toBe(100)
    expect(MAX_TAG_DESCRIPTION_LENGTH).toBe(200)
    expect(CONTENT_WARN_RATIO).toBe(0.9)
  })
})

describe('exceedsLength', () => {
  it('剛好等於上限不算超過', () => {
    expect(exceedsLength('a'.repeat(50), 50)).toBe(false)
  })
  it('多 1 個字元即超過', () => {
    expect(exceedsLength('a'.repeat(51), 50)).toBe(true)
  })
})

describe('isNearLimit', () => {
  it('未達 90% 不提示；達 90% 起提示', () => {
    expect(isNearLimit(179999, 200000)).toBe(false)
    expect(isNearLimit(180000, 200000)).toBe(true)
  })
})

describe('isTagColor', () => {
  it.each(['#000000', '#FFFFFF', '#aBc123'])('%s 合法', (v) => {
    expect(isTagColor(v)).toBe(true)
  })
  it.each(['', '#fff', '000000', '#GGGGGG', '#1234567', 'red', ' #112233'])('"%s" 不合法', (v) => {
    expect(isTagColor(v)).toBe(false)
  })
})
