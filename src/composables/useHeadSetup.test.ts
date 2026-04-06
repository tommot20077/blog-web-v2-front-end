import { useHeadSetup } from './useHeadSetup';

describe('useHeadSetup', () => {
  it('回傳的 title 包含站名', () => {
    const { title } = useHeadSetup();
    expect(title).toContain('MY BLOG WEB.');
  });

  it('回傳的 description 非空字串', () => {
    const { description } = useHeadSetup();
    expect(description.length).toBeGreaterThan(0);
  });

  it('回傳的 ogTags 包含 og:title', () => {
    const { ogTags } = useHeadSetup();
    const ogTitle = ogTags.find((t) => t.property === 'og:title');
    expect(ogTitle).toBeDefined();
    expect(ogTitle?.content).toContain('MY BLOG WEB.');
  });

  it('回傳的 ogTags 包含 og:description', () => {
    const { ogTags } = useHeadSetup();
    const ogDesc = ogTags.find((t) => t.property === 'og:description');
    expect(ogDesc).toBeDefined();
    expect(ogDesc?.content.length).toBeGreaterThan(0);
  });

  it('回傳的 ogTags 包含 og:type 且值為 website', () => {
    const { ogTags } = useHeadSetup();
    const ogType = ogTags.find((t) => t.property === 'og:type');
    expect(ogType).toBeDefined();
    expect(ogType?.content).toBe('website');
  });

  it('回傳的 jsonLd 包含 @type WebSite', () => {
    const { jsonLd } = useHeadSetup();
    const parsed = JSON.parse(jsonLd);
    const webSite = parsed['@graph']?.find((n: { '@type': string }) => n['@type'] === 'WebSite');
    expect(webSite).toBeDefined();
  });

  it('回傳的 jsonLd 包含 @type Blog', () => {
    const { jsonLd } = useHeadSetup();
    const parsed = JSON.parse(jsonLd);
    const blog = parsed['@graph']?.find((n: { '@type': string }) => n['@type'] === 'Blog');
    expect(blog).toBeDefined();
  });

  it('VITE_SITE_URL 有設定時，siteUrl 使用環境變數', () => {
    vi.stubEnv('VITE_SITE_URL', 'https://custom.example.com');
    const { siteUrl } = useHeadSetup();
    expect(siteUrl).toBe('https://custom.example.com');
    vi.unstubAllEnvs();
  });

  it('VITE_SITE_URL 未設定時，siteUrl fallback 到 window.location.origin', () => {
    vi.stubEnv('VITE_SITE_URL', '');
    const { siteUrl } = useHeadSetup();
    expect(siteUrl).toBe(window.location.origin);
    vi.unstubAllEnvs();
  });

  it('useHead 拋出例外時，非測試環境記錄 console.warn', async () => {
    // mock useHead 強制拋出，確保 catch 一定被觸發
    vi.doMock('@unhead/vue', () => ({
      useHead: vi.fn().mockImplementation(() => { throw new Error('head provider missing'); }),
    }));
    vi.stubEnv('MODE', 'production');
    vi.resetModules();

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const mod = await import('./useHeadSetup');
    mod.useHeadSetup();

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[useHeadSetup]'),
      expect.any(Error),
    );

    warnSpy.mockRestore();
    vi.unstubAllEnvs();
    vi.resetModules();
    vi.doUnmock('@unhead/vue');
  });
});
