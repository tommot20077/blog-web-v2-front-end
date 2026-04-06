import { describe, it, expect } from 'vitest'
import { uploadFileMock } from './fileMockService'

describe('fileMockService', () => {
  it('上傳成功後回傳含 url 的 FileUploadResponse', async () => {
    const file = new File(['content'], 'test.png', { type: 'image/png' })
    const result = await uploadFileMock(file, 'ARTICLE_CONTENT')
    expect(result.url).toBeTruthy()
    expect(result.url).toMatch(/^https?:\/\//)
    expect(result.id).toBeTruthy()
    expect(result.width).toBe(800)
    expect(result.height).toBe(600)
    expect(result.usageType).toBe('ARTICLE_CONTENT')
  })

  it('不同 usageType 皆可上傳且 usageType 對應正確', async () => {
    const file = new File(['img'], 'cover.jpg', { type: 'image/jpeg' })
    const result = await uploadFileMock(file, 'ARTICLE_COVER')
    expect(result.url).toBeTruthy()
    expect(result.usageType).toBe('ARTICLE_COVER')
  })

  it('回傳的 id 唯一不重複', async () => {
    const file = new File(['x'], 'x.png', { type: 'image/png' })
    const r1 = await uploadFileMock(file, 'ARTICLE_CONTENT')
    const r2 = await uploadFileMock(file, 'ARTICLE_CONTENT')
    expect(r1.id).not.toBe(r2.id)
  })
})
