import { describe, expect, it } from 'vitest'
import { findExternalImages } from './externalImages'

/**
 * 正式環境 CSP 的 img-src 只放行 'self' blob:（nginx.conf，Yuan 2026-11-07 決定外部圖片刻意不放行），
 * 內文含外部圖片時讀者端會破圖，編輯器要先警告作者。
 */
describe('findExternalImages', () => {
  it('偵測 markdown 的外部圖片（http / https）', () => {
    expect(findExternalImages('![a](https://img.example.com/a.png)')).toEqual(['https://img.example.com/a.png'])
    expect(findExternalImages('![a](http://img.example.com/a.png)')).toEqual(['http://img.example.com/a.png'])
  })

  it('markdown 圖片帶 title、尖括號、alt 為空', () => {
    expect(findExternalImages('![](https://x.com/a.png "標題")')).toEqual(['https://x.com/a.png'])
    expect(findExternalImages('![a](<https://x.com/a b.png>)')).toEqual(['https://x.com/a b.png'])
  })

  it('偵測 HTML <img src>（雙引號、單引號、無引號、大小寫）', () => {
    expect(findExternalImages('<img src="https://x.com/a.png">')).toEqual(['https://x.com/a.png'])
    expect(findExternalImages("<img alt='a' src='https://x.com/b.png' />")).toEqual(['https://x.com/b.png'])
    expect(findExternalImages('<IMG SRC=https://x.com/c.png>')).toEqual(['https://x.com/c.png'])
  })

  it('protocol-relative（//host/…）也算外部', () => {
    expect(findExternalImages('![a](//cdn.example.com/a.png)')).toEqual(['//cdn.example.com/a.png'])
  })

  it('同源相對路徑不算外部（/api/v1/files/{id}/content、相對檔名）', () => {
    expect(findExternalImages('![a](/api/v1/files/abc/content)')).toEqual([])
    expect(findExternalImages('<img src="/api/v1/files/abc/content">')).toEqual([])
    expect(findExternalImages('![a](images/a.png)')).toEqual([])
  })

  it('blob: 與 data: 不算外部', () => {
    expect(findExternalImages('![a](blob:http://localhost/1234)')).toEqual([])
    expect(findExternalImages('![a](data:image/png;base64,AAAA)')).toEqual([])
    expect(findExternalImages('<img src="data:image/png;base64,AAAA">')).toEqual([])
  })

  it('指定 origin 時，同源的絕對網址不算外部', () => {
    const md = '![a](https://90030.xyz/api/v1/files/abc/content)'
    expect(findExternalImages(md, 'https://90030.xyz')).toEqual([])
    expect(findExternalImages(md, 'https://other.example')).toEqual(['https://90030.xyz/api/v1/files/abc/content'])
  })

  it('超連結（非圖片）不算', () => {
    expect(findExternalImages('[文字](https://x.com/a.png)')).toEqual([])
    expect(findExternalImages('<a href="https://x.com">x</a>')).toEqual([])
  })

  it('程式碼區塊與行內程式碼中的範例不算', () => {
    expect(findExternalImages('```md\n![a](https://x.com/a.png)\n```')).toEqual([])
    expect(findExternalImages('~~~\n<img src="https://x.com/a.png">\n~~~')).toEqual([])
    expect(findExternalImages('範例：`![a](https://x.com/a.png)`')).toEqual([])
  })

  it('參考式圖片 ![alt][ref] 搭配 [ref]: url', () => {
    expect(findExternalImages('![a][r1]\n\n[r1]: https://x.com/a.png')).toEqual(['https://x.com/a.png'])
    expect(findExternalImages('![a][r1]\n\n[r1]: /api/v1/files/1/content')).toEqual([])
  })

  it('多張時逐一回傳（含重複出現）', () => {
    const md = '![a](https://x.com/a.png)\n文字\n<img src="https://y.com/b.png">\n![c](/api/v1/files/1/content)\n![a](https://x.com/a.png)'
    expect(findExternalImages(md)).toEqual(['https://x.com/a.png', 'https://y.com/b.png', 'https://x.com/a.png'])
  })

  it('空字串回傳空陣列', () => {
    expect(findExternalImages('')).toEqual([])
  })
})
