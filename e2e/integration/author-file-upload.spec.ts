// G3/G4/G8 純 API 補強（G5 配額超因為要 600MB+ buffer 不實際, defer）
import { test, expect } from '@playwright/test'
import { getCredentials } from '../fixtures/auth'

const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8080'

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
      const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
        data: { identifier: author.email, password: author.password },
      })
      const token = (await loginResp.json()).data.accessToken

      const resp = await request.post(`${BACKEND}/api/v1/files/upload`, {
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
      await request.delete(`${BACKEND}/api/v1/files/${body.data.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
    })
  }

  test('G4: 上傳 .txt 應拒絕 (A0404 不支援的檔案類型)', async ({ request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken

    const resp = await request.post(`${BACKEND}/api/v1/files/upload`, {
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

  /**
   * G5 follow-up: 後端 IT 待補。
   * 位置：(java repo)/blog-module-file
   * 做法：mock UserFacade quota 滿值 → POST /files/upload → 驗 code === 'A0403'
   */
  test('G5: 上傳遇 quota 不足應顯示 toast (mock A0403)', async ({ page, request }) => {
    const author = getCredentials('author');

    // 先用 API 建立 draft 取得 uuid（裸 /editor 路徑不會 render EditorMetaSidebar）
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    });
    const token = (await loginResp.json()).data.accessToken;
    const create = await request.post(`${BACKEND}/api/v1/articles`, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      data: {
        title: `G5 quota test ${Date.now()}`,
        content: 'test',
        summary: '',
        coverImageUrl: null,
        categoryIds: [],
        tagNames: [],
      },
    });
    const uuid = (await create.json()).data.uuid;

    try {
      // mock quota init request（避免打真後端；total 500MB 模擬正常配額）
      await page.route('**/api/v1/users/me/quota', (r) =>
        r.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: '00000', data: { used: 0, total: 524288000 }, message: '' }),
        }),
      );

      // mock 後端回 A0403（FileErrorCode.QUOTA_EXCEEDED）
      await page.route('**/api/v1/files/upload', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ code: 'A0403', message: '儲存空間配額已滿', data: null }),
        }),
      );

      // 登入並進入 editor with uuid
      // 用 router.push 而非 page.goto，避免 full reload 導致 Pinia state 重置 → 路由 guard 誤判未登入
      await page.goto('/login');
      await page.getByTestId('auth-login-field-email').fill(author.email);
      await page.getByTestId('auth-login-field-password').fill(author.password);
      await page.getByTestId('auth-login-submit').click();
      await page.waitForURL((url) => !url.pathname.startsWith('/login'));
      await page.evaluate((u) => {
        const router = (window as unknown as Record<string, { push: (p: string) => Promise<void> }>).__router;
        return router.push(`/editor/${u}`);
      }, uuid);
      await page.waitForURL(`/editor/${uuid}`, { timeout: 5000 });
      await expect(page.getByTestId('editor-title-input')).toBeVisible({ timeout: 10000 });

      // 觸發封面圖上傳
      const fileInput = page.locator('[data-testid="cover-upload-input"]');
      await fileInput.setInputFiles({
        name: 'quota-test.png',
        mimeType: 'image/png',
        buffer: Buffer.from(
          '89504e470d0a1a0a0000000d49484452000000010000000108020000009077' +
            '53de00000010494441545863fbff5f7e0000feff03f900050001a4d3a55a000000004945' +
            '4e44ae426082',
          'hex',
        ),
      });

      // toast 文字曾出現（toContainText 自動 retry）
      await expect(page.getByTestId('toast-message').first()).toContainText(/儲存空間|配額/, {
        timeout: 5000,
      });

      // 封面預覽不應出現
      await expect(page.getByTestId('cover-preview')).toHaveCount(0);
    } finally {
      await request.delete(`${BACKEND}/api/v1/articles/${uuid}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
    }
  });

  test('G8: 上傳後 DELETE /files/{id}, /users/me/files 不再包含', async ({ request }) => {
    const author = getCredentials('author')
    const loginResp = await request.post(`${BACKEND}/api/v1/auth/login`, {
      data: { identifier: author.email, password: author.password },
    })
    const token = (await loginResp.json()).data.accessToken
    const png = Buffer.from(
      '89504e470d0a1a0a0000000d49484452000000010000000108020000009077' +
      '53de00000010494441545863fbff5f7e0000feff03f900050001a4d3a55a000000004945' +
      '4e44ae426082',
      'hex',
    )
    const upload = await request.post(`${BACKEND}/api/v1/files/upload`, {
      headers: { Authorization: `Bearer ${token}` },
      multipart: {
        file: { name: 'g8-test.png', mimeType: 'image/png', buffer: png },
        usageType: 'ARTICLE_COVER',
      },
    })
    const fileId = (await upload.json()).data.id

    const del = await request.delete(`${BACKEND}/api/v1/files/${fileId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    expect((await del.json()).code).toBe('00000')

    const list = await request.get(`${BACKEND}/api/v1/users/me/files`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const files = (await list.json()).data as Array<{ id: string }>
    expect(files.find((f) => f.id === fileId)).toBeUndefined()
  })
})
