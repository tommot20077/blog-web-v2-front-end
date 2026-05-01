// G3/G4/G8 純 API 補強（G5 配額超因為要 600MB+ buffer 不實際, defer）
import { test, expect } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

test.describe('檔案上傳邊界 API (G3/G4/G8)', () => {
  // Minimal hex bytes for 1x1 images
  const FORMATS = [
    {
      ext: 'png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        '89504e470d0a1a0a0000000d49484452000000010000000108020000009077' +
          '53de00000010494441545863fbff5f7e0000feff03f900050001a4d3a55a000000004945' +
          '4e44ae426082',
        'hex',
      ),
    },
    {
      ext: 'webp',
      mimeType: 'image/webp',
      // Smallest valid lossy WebP: RIFF header + WEBP marker + VP8 chunk (1x1 pixel)
      buffer: Buffer.from(
        '52494646' + // "RIFF"
          '24000000' + // file size (36 bytes after this)
          '57454250' + // "WEBP"
          '56503820' + // "VP8 "
          '18000000' + // chunk size (24 bytes)
          '3001009d012a' + // VP8 frame tag + start code
          '01000100' + // width=1, height=1
          '0007c54b3da580fe3fd000fe9d00000',
        'hex',
      ),
    },
    {
      ext: 'gif',
      mimeType: 'image/gif',
      // Smallest valid GIF89a: 1x1 pixel, 1-color palette, single frame
      buffer: Buffer.from(
        '47494638396101000100' + // GIF89a, 1x1
          '8000000000000000' + // GCT: 1 entry (black + transparent)
          '2c000000000100010000' + // Image descriptor
          '02024401003b', // LZW min code size=2, compressed data, trailer
        'hex',
      ),
    },
  ] as const

  for (const { ext, mimeType, buffer } of FORMATS) {
    test(`G3: 上傳 ${ext} 應成功並回 FileUploadResponse`, async ({ request }) => {
      const author = getCredentials('author')
      const loginResp = await request.post('http://localhost:9010/api/v1/auth/login', {
        data: { identifier: author.email, password: author.password },
      })
      const token = (await loginResp.json()).data.accessToken

      const resp = await request.post('http://localhost:9010/api/v1/files/upload', {
        headers: { Authorization: `Bearer ${token}` },
        multipart: {
          file: { name: `g3-test.${ext}`, mimeType, buffer: Buffer.from(buffer) },
          usageType: 'ARTICLE_COVER',
        },
      })
      expect(resp.ok()).toBeTruthy()
      const body = await resp.json()
      expect(body.code).toBe('00000')
      expect(body.data.id).toMatch(/[0-9a-f-]{36}/i)
      expect(body.data.url).toBeTruthy()

      // cleanup
      await request.delete(`http://localhost:9010/api/v1/files/${body.data.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    })
  }

  test('G4: 上傳 .txt 應拒絕 (A0404 不支援的檔案類型)', async ({ request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post('http://localhost:9010/api/v1/auth/login', {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken

    const resp = await request.post('http://localhost:9010/api/v1/files/upload', {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'g4-test.txt', mimeType: 'text/plain', buffer: Buffer.from('hello') },
        usageType: 'ARTICLE_COVER',
      },
    })
    const body = await resp.json()
    expect(body.code).toBe('A0404')
    expect(body.message).toContain('不支援')
  })

  test('G8: 上傳後 DELETE /files/{id}, /users/me/files 不再包含', async ({ request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post('http://localhost:9010/api/v1/auth/login', {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken
    const png = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108020000009077' +
      '53de00000010494441545863fbff5f7e0000feff03f900050001a4d3a55a000000004945' +
      '4e44ae426082',
      'hex',
    )
    const upload = await request.post('http://localhost:9010/api/v1/files/upload', {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'g8-test.png', mimeType: 'image/png', buffer: png },
        usageType: 'ARTICLE_COVER',
      },
    })
    const fileId = (await upload.json()).data.id

    const del = await request.delete(`http://localhost:9010/api/v1/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect((await del.json()).code).toBe('00000')

    const list = await request.get('http://localhost:9010/api/v1/users/me/files', {
      headers: { Authorization: `Bearer ${token}` },
    })
    const files = (await list.json()).data as Array<{ id: string }>
    expect(files.find((f) => f.id === fileId)).toBeUndefined()
  })
})
