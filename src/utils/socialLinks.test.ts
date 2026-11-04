import { describe, it, expect } from 'vitest'
import { isSafeHandle, isHttpUrl, buildSocialUrl, SOCIAL_PLATFORMS } from './socialLinks'

/**
 * 與後端 SafeSocialLinksValidator.isSafeHandle 同一組合格／不合格案例
 * （對應 SafeSocialLinksValidatorTest；前端與後端規則漂移時，這裡要先紅）。
 */
describe('isSafeHandle（與後端同一份規則）', () => {
  const valid: Array<[string, string]> = [
    ['空字串＝未填', ''],
    ['一般帳號名稱', 'octocat'],
    ['前端 E2E 實際送出的 myhandle', 'myhandle'],
    ['單一前導 @', '@user'],
    ['含底線／連字號／點', 'yuan_dev-1.x'],
    ['非 ASCII（中文）', '王小明'],
    ['長度剛好 100', 'a'.repeat(100)],
  ]
  it.each(valid)('合格：%s', (_label, v) => {
    expect(isSafeHandle(v)).toBe(true)
  })

  const invalid: Array<[string, string]> = [
    ['長度 101', 'a'.repeat(101)],
    ['單獨 @', '@'],
    ['重複 @', '@@user'],
    ['中間 @', 'us@er'],
    ['結尾 @', 'user@'],
    ['javascript: scheme', 'javascript:alert(1)'],
    ['大小寫混合 scheme', 'JaVaScRiPt:alert(1)'],
    ['data: scheme', 'data:text/html,x'],
    ['完整網址', 'https://github.com/octocat'],
    ['含路徑的網域', 'github.com/octocat'],
    ['protocol-relative', '//evil.com'],
    ['含冒號', 'a:b'],
    ['含斜線', 'a/b'],
    ['全形冒號（NFKC 後為 :）', '：'],
    ['全形冒號組成的 scheme', 'javascript：alert(1)'],
    ['全形斜線（NFKC 後為 /）', 'a／b'],
    ['含空白', 'my handle'],
    ['前導空白', ' handle'],
    ['結尾空白', 'handle '],
    ['tab', 'a\tb'],
    ['換行', 'a\nb'],
    ['CR', 'a\rb'],
    ['NUL', 'a\u0000b'],
    ['BEL 控制字元', 'a\u0007b'],
    ['NBSP', 'a b'],
    ['Unicode 空白 EM SPACE', 'a b'],
    ['只有空白', ' '],
    ['零寬空白（FORMAT）', 'a​b'],
    ['反斜線', 'a\\b'],
    ['<script>', '<script>'],
    ['含 >', 'a>b'],
    ['含雙引號', 'a"b'],
  ]
  it.each(invalid)('不合格：%s', (_label, v) => {
    expect(isSafeHandle(v)).toBe(false)
  })
})

describe('buildSocialUrl', () => {
  it('github／twitter／linkedin 使用固定前綴', () => {
    expect(buildSocialUrl('github', 'octocat')).toBe('https://github.com/octocat')
    expect(buildSocialUrl('twitter', 'yuan_dev')).toBe('https://x.com/yuan_dev')
    expect(buildSocialUrl('linkedin', 'yuan-lin')).toBe('https://www.linkedin.com/in/yuan-lin')
  })

  it('去掉單一前導 @ 再組網址', () => {
    expect(buildSocialUrl('twitter', '@user')).toBe('https://x.com/user')
  })

  it('handle 以 encodeURIComponent 編碼（中文、點、問號都不會逃出路徑）', () => {
    expect(buildSocialUrl('github', '王小明')).toBe(`https://github.com/${encodeURIComponent('王小明')}`)
    expect(buildSocialUrl('github', 'a?b#c%d')).toBe('https://github.com/a%3Fb%23c%25d')
    expect(buildSocialUrl('github', '..')).not.toBe('https://github.com/..')
  })

  it('不合格 handle 不產生網址（回 null）', () => {
    expect(buildSocialUrl('github', 'javascript:alert(1)')).toBeNull()
    expect(buildSocialUrl('github', 'a/b')).toBeNull()
    expect(buildSocialUrl('github', '@')).toBeNull()
  })

  it('空值（null／undefined／空字串）回 null', () => {
    expect(buildSocialUrl('github', null)).toBeNull()
    expect(buildSocialUrl('github', undefined)).toBeNull()
    expect(buildSocialUrl('github', '')).toBeNull()
  })

  it('未知平台 key 不產生網址', () => {
    expect(buildSocialUrl('mastodon', 'yuan')).toBeNull()
  })

  it('SOCIAL_PLATFORMS 只含三個已知平台', () => {
    expect(Object.keys(SOCIAL_PLATFORMS)).toEqual(['github', 'twitter', 'linkedin'])
  })
})

describe('isHttpUrl', () => {
  it.each(['http://example.com', 'https://example.com/path?q=1', 'HTTPS://Example.com'])('接受 %s', (u) => {
    expect(isHttpUrl(u)).toBe(true)
  })

  it.each([
    'javascript:alert(1)',
    'JaVaScRiPt:alert(1)',
    'data:text/html,x',
    'ftp://example.com',
    'file:///etc/passwd',
    '//example.com',
    'example.com',
    '',
    'http://',
    'https://user:pw@example.com',
    ' https://example.com',
    'https://exa mple.com',
  ])('拒絕 %s', (u) => {
    expect(isHttpUrl(u)).toBe(false)
  })

  it('null／undefined 回 false', () => {
    expect(isHttpUrl(null)).toBe(false)
    expect(isHttpUrl(undefined)).toBe(false)
  })
})
