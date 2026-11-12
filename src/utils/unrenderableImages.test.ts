import { describe, expect, it } from 'vitest'
import { findUnrenderableImages } from './unrenderableImages'

/**
 * 正式環境 CSP 的 img-src 只放行 'self' blob:（nginx.conf，Yuan 2026-11-07 決定外部圖片刻意不放行；
 * data: 同樣不放行），內文含外部或內嵌（data:）圖片時讀者端會破圖，編輯器要先警告作者。
 */
describe('findUnrenderableImages', () => {
  it('偵測 markdown 的外部圖片（http / https）', () => {
    expect(findUnrenderableImages('![a](https://img.example.com/a.png)')).toEqual(['https://img.example.com/a.png'])
    expect(findUnrenderableImages('![a](http://img.example.com/a.png)')).toEqual(['http://img.example.com/a.png'])
  })

  it('markdown 圖片帶 title、尖括號、alt 為空', () => {
    expect(findUnrenderableImages('![](https://x.com/a.png "標題")')).toEqual(['https://x.com/a.png'])
    expect(findUnrenderableImages('![a](<https://x.com/a b.png>)')).toEqual(['https://x.com/a b.png'])
  })

  it('偵測 HTML <img src>（雙引號、單引號、無引號、大小寫）', () => {
    expect(findUnrenderableImages('<img src="https://x.com/a.png">')).toEqual(['https://x.com/a.png'])
    expect(findUnrenderableImages("<img alt='a' src='https://x.com/b.png' />")).toEqual(['https://x.com/b.png'])
    expect(findUnrenderableImages('<IMG SRC=https://x.com/c.png>')).toEqual(['https://x.com/c.png'])
  })

  it('protocol-relative（//host/…）也算外部', () => {
    expect(findUnrenderableImages('![a](//cdn.example.com/a.png)')).toEqual(['//cdn.example.com/a.png'])
  })

  it('同源相對路徑不算外部（/api/v1/files/{id}/content、相對檔名）', () => {
    expect(findUnrenderableImages('![a](/api/v1/files/abc/content)')).toEqual([])
    expect(findUnrenderableImages('<img src="/api/v1/files/abc/content">')).toEqual([])
    expect(findUnrenderableImages('![a](images/a.png)')).toEqual([])
  })

  it('blob: 不算（CSP 放行 blob:）', () => {
    expect(findUnrenderableImages('![a](blob:http://localhost/1234)')).toEqual([])
  })

  it('data: 內嵌圖片也算（CSP img-src 不放行 data:）：markdown 與 HTML', () => {
    expect(findUnrenderableImages('![a](data:image/png;base64,AAAA)')).toEqual(['data:image/png;base64,AAAA'])
    expect(findUnrenderableImages('<img src="data:image/png;base64,AAAA">')).toEqual(['data:image/png;base64,AAAA'])
    expect(findUnrenderableImages('![a](DATA:image/svg+xml;base64,BBBB)')).toEqual(['DATA:image/svg+xml;base64,BBBB'])
  })

  it('外部與 data: 混合時依出現順序都回傳', () => {
    const md = '![a](data:image/png;base64,AAAA)\n![b](https://x.com/b.png)'
    expect(findUnrenderableImages(md)).toEqual(['data:image/png;base64,AAAA', 'https://x.com/b.png'])
  })

  it('指定 origin 時，同源的絕對網址不算外部', () => {
    const md = '![a](https://90030.xyz/api/v1/files/abc/content)'
    expect(findUnrenderableImages(md, 'https://90030.xyz')).toEqual([])
    expect(findUnrenderableImages(md, 'https://other.example')).toEqual(['https://90030.xyz/api/v1/files/abc/content'])
  })

  it('超連結（非圖片）不算', () => {
    expect(findUnrenderableImages('[文字](https://x.com/a.png)')).toEqual([])
    expect(findUnrenderableImages('<a href="https://x.com">x</a>')).toEqual([])
  })

  it('程式碼區塊與行內程式碼中的範例不算', () => {
    expect(findUnrenderableImages('```md\n![a](https://x.com/a.png)\n```')).toEqual([])
    expect(findUnrenderableImages('~~~\n<img src="https://x.com/a.png">\n~~~')).toEqual([])
    expect(findUnrenderableImages('範例：`![a](https://x.com/a.png)`')).toEqual([])
  })

  it('參考式圖片 ![alt][ref] 搭配 [ref]: url', () => {
    expect(findUnrenderableImages('![a][r1]\n\n[r1]: https://x.com/a.png')).toEqual(['https://x.com/a.png'])
    expect(findUnrenderableImages('![a][r1]\n\n[r1]: /api/v1/files/1/content')).toEqual([])
  })

  it('多張時逐一回傳（含重複出現）', () => {
    const md = '![a](https://x.com/a.png)\n文字\n<img src="https://y.com/b.png">\n![c](/api/v1/files/1/content)\n![a](https://x.com/a.png)'
    expect(findUnrenderableImages(md)).toEqual(['https://x.com/a.png', 'https://y.com/b.png', 'https://x.com/a.png'])
  })

  it('空字串回傳空陣列', () => {
    expect(findUnrenderableImages('')).toEqual([])
  })
})
