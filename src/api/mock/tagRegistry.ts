export const MOCK_TAG_REGISTRY = {
  frontend: ['Vue 3', 'React', 'TypeScript', 'CSS', 'Animation', 'Tailwind', 'Vite'],
  backend: ['Spring', 'PostgreSQL', 'Redis', 'Microservices', 'Performance', 'Go'],
  design: ['Design System', 'Typography', 'Color', 'Motion'],
  practice: ['Testing', 'TDD', 'CI/CD'],
  life: ['Books', 'Productivity', 'Remote Work', 'Career'],
} as const;

export const TAG_CATEGORY_KEYS = Object.keys(MOCK_TAG_REGISTRY) as Array<keyof typeof MOCK_TAG_REGISTRY>;

export const ALL_MOCK_TAGS: readonly string[] = Object.values(MOCK_TAG_REGISTRY).flat();

export type TagCategoryKey = keyof typeof MOCK_TAG_REGISTRY;
