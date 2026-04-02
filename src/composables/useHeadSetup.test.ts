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
});
