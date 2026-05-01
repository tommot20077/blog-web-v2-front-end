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
      // Smallest valid VP8L (lossless) WebP: 1x1 pixel, 33 bytes
      // RIFF(4) + file_size(4=25) + WEBP(4) + VP8L(4) + chunk_size(4=13) + signature(1=0x2f) + bitstream(12)
      buffer: Buffer.from(
        '52494646' + // "RIFF"
          '19000000' + // file_size = 25 (total file = 33 bytes)
          '57454250' + // "WEBP"
          '5650384c' + // "VP8L"
          '0d000000' + // chunk size = 13 bytes
          '2f000000' + // VP8L signature (0x2f) + bitstream start
          '1007101111888808' + // VP8L bitstream: 1x1 black pixel
          '08',
        'hex',
      ),
    },
    {
      ext: 'gif',
      mimeType: 'image/gif',
      // Smallest valid GIF89a: 1x1 pixel, 2-entry GCT (6 bytes), single frame, 35 bytes total
      // Header(6) + LSD(7) + GCT(6) + ImageDescriptor(10) + LZW(4) + Trailer(1) + BlockTerminator(1)
      // GCT packed=0x80: GCT flag=1, GCT size=0 => 2^(0+1)=2 entries = 6 bytes
      buffer: Buffer.from(
        '474946383961' + // "GIF89a"
          '01000100' + // LSD: width=1, height=1
          '80' + // LSD packed = 0x80 (GCT present, 2 entries)
          '0000' + // LSD bgcolor=0, pixel_aspect=0
          '000000ffffff' + // GCT: entry 0 = black (000000), entry 1 = white (ffffff)
          '2c000000000100010000' + // Image Descriptor (separator=0x2C, left=0, top=0, w=1, h=1, packed=0)
          '02' + // LZW minimum code size = 2
          '024c01' + // sub-block: size=2, compressed pixel data
          '00' + // block terminator
          '3b', // GIF trailer
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
