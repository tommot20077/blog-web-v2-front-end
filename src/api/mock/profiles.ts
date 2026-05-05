export const MOCK_AUTHOR_PROFILES = {
  yuan: {
    nickname: 'Yuan',
    tagline: '台北的前端工程師，偶爾設計，長期思考怎麼把複雜的事寫得更直白',
    avatarSeed: 'yuan-luca',
  },
  han: {
    nickname: 'Han',
    tagline: '寫了 10 年 Java，最近開始投奔 Go',
    avatarSeed: 'han-liu',
  },
  mira: {
    nickname: 'Mira',
    tagline: 'Visual designer turned design engineer',
    avatarSeed: 'mira-huang',
  },
  chen: {
    nickname: 'Chen',
    tagline: '工程師的另一面是讀書與寫信',
    avatarSeed: 'chen-zekai',
  },
} as const;

export const AUTHOR_KEYS = Object.keys(MOCK_AUTHOR_PROFILES) as Array<keyof typeof MOCK_AUTHOR_PROFILES>;

export type AuthorKey = keyof typeof MOCK_AUTHOR_PROFILES;
