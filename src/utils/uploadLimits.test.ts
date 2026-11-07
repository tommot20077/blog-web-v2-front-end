import { describe, it, expect } from 'vitest'
import {
  MAX_ARTICLE_IMAGE_BYTES,
  MAX_AVATAR_BYTES,
  getMaxUploadBytes,
  exceedsUploadLimit,
} from './uploadLimits'

const MB = 1024 * 1024

function fileOfSize(size: number): File {
  // 不真的配置 size 個位元組：覆寫 size 即可模擬大檔
  const file = new File(['x'], 'big.png', { type: 'image/png' })
  Object.defineProperty(file, 'size', { value: size })
  return file
}

describe('上傳大小上限（A6b：文章圖片 20MB、頭像 5MB）', () => {
  it('常數值', () => {
    expect(MAX_ARTICLE_IMAGE_BYTES).toBe(20 * MB)
    expect(MAX_AVATAR_BYTES).toBe(5 * MB)
  })

  it('依用途取上限：內文圖與封面共用文章圖片上限，頭像另計', () => {
    expect(getMaxUploadBytes('ARTICLE_CONTENT')).toBe(20 * MB)
    expect(getMaxUploadBytes('ARTICLE_COVER')).toBe(20 * MB)
    expect(getMaxUploadBytes('AVATAR')).toBe(5 * MB)
  })

  it('剛好等於上限可以送出，多 1 byte 就超過', () => {
    expect(exceedsUploadLimit(fileOfSize(20 * MB), 'ARTICLE_CONTENT')).toBe(false)
    expect(exceedsUploadLimit(fileOfSize(20 * MB + 1), 'ARTICLE_CONTENT')).toBe(true)
    expect(exceedsUploadLimit(fileOfSize(20 * MB + 1), 'ARTICLE_COVER')).toBe(true)
    expect(exceedsUploadLimit(fileOfSize(5 * MB), 'AVATAR')).toBe(false)
    expect(exceedsUploadLimit(fileOfSize(5 * MB + 1), 'AVATAR')).toBe(true)
  })

  it('頭像 6MB 超過，但同樣大小的文章圖片可以', () => {
    expect(exceedsUploadLimit(fileOfSize(6 * MB), 'AVATAR')).toBe(true)
    expect(exceedsUploadLimit(fileOfSize(6 * MB), 'ARTICLE_CONTENT')).toBe(false)
  })
})
