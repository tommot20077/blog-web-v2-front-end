import { execSync } from 'child_process'
import { activateUser } from './fixtures/admin-helpers'

const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8080'
const IS_CI = process.env.E2E_CI === '1'

interface SeedUser {
  email: string
  username: string
  nickname: string
  password: string
  role: 'USER' | 'AUTHOR' | 'ADMIN'
}

const SEED_USERS: SeedUser[] = [
  { email: 'reader@test.local', username: 'reader_e2e', nickname: 'Reader', password: 'Test1234!', role: 'USER' },
  { email: 'author@test.local', username: 'author_e2e', nickname: 'Author', password: 'Test1234!', role: 'AUTHOR' },
  { email: 'admin@test.local', username: 'admin_e2e', nickname: 'Admin', password: 'Test1234!', role: 'ADMIN' },
]

// ── helpers ──────────────────────────────────────────────────────────────────

async function healthCheck() {
  const res = await fetch(`${BACKEND}/actuator/health`).catch(() => null)
  if (!res || !res.ok) {
    throw new Error(
      `Backend health check failed at ${BACKEND}/actuator/health — ` +
      'please start infra and backend before running E2E tests. ' +
      'Or run with E2E_MOCK=1 for mock mode.',
    )
  }
}

async function registerUser(user: SeedUser) {
  const res = await fetch(`${BACKEND}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user.email,
      username: user.username,
      nickname: user.nickname,
      password: user.password,
    }),
  })
  // 400/409 = email already taken; acceptable for idempotent seeding
  if (!res.ok && res.status !== 409 && res.status !== 400) {
    const body = await res.text().catch(() => '')
    console.warn(`Register ${user.email} → ${res.status}: ${body}`)
  }
}

function ensureMinIOBucket() {
  // In CI mode the backend's ApplicationRunner auto-creates the bucket on startup
  if (IS_CI) return
  try {
    execSync(
      `kubectl exec -n infra-dev deploy/minio -- sh -c ` +
      `"mc alias set local http://localhost:9000 luca tommot40 2>/dev/null; ` +
      `mc mb --ignore-existing local/blog-files 2>/dev/null; ` +
      `mc anonymous set public local/blog-files 2>/dev/null"`,
      { stdio: 'pipe' },
    )
  } catch {
    console.warn('Could not ensure MinIO bucket — skipping (file upload tests may fail)')
  }
}

async function apiLogin(email: string, password: string): Promise<string> {
  const res = await fetch(`${BACKEND}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: email, password }),
  })
  const json = await res.json()
  if (!json.data?.accessToken) throw new Error(`Login failed for ${email}: ${JSON.stringify(json)}`)
  return json.data.accessToken
}

async function ensureCategory(token: string, name: string, slug: string): Promise<void> {
  // Check existing categories first (idempotent)
  const listRes = await fetch(`${BACKEND}/api/v1/categories`)
  const listJson = await listRes.json()
  const exists = (listJson.data ?? []).some((c: { slug: string }) => c.slug === slug)
  if (exists) return

  const res = await fetch(`${BACKEND}/api/v1/admin/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ name, slug, description: `${name} articles`, sortOrder: 0 }),
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    console.warn(`Create category ${name} → ${res.status}: ${body}`)
  }
}

async function seedArticle(authorToken: string, adminToken: string, title: string, categorySlug: string) {
  // Check if already exists to keep seeding idempotent
  const listRes = await fetch(`${BACKEND}/api/v1/articles?page=1&size=50`)
  const listJson = await listRes.json()
  const exists = (listJson.data?.records ?? []).some((a: { title: string }) => a.title === title)
  if (exists) return

  // Get category uuid for the slug
  const catRes = await fetch(`${BACKEND}/api/v1/categories`)
  const catJson = await catRes.json()
  const category = (catJson.data ?? []).find((c: { slug: string; uuid: string }) => c.slug === categorySlug)

  const createRes = await fetch(`${BACKEND}/api/v1/articles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authorToken}` },
    body: JSON.stringify({
      title,
      content: `# ${title}\n\nThis is a seeded E2E test article.\n\n\`\`\`js\nconsole.log('hello')\n\`\`\``,
      summary: `Summary for ${title}`,
      categoryIds: category ? [category.uuid] : [],
      tagNames: [categorySlug],
    }),
  })
  const createJson = await createRes.json()
  const uuid = createJson.data?.uuid
  if (!uuid) {
    console.warn(`Create article "${title}" failed: ${JSON.stringify(createJson)}`)
    return
  }

  // Submit for review
  const submitRes = await fetch(`${BACKEND}/api/v1/articles/${uuid}/submit`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${authorToken}` },
  })
  if (!submitRes.ok) {
    const body = await submitRes.text().catch(() => '')
    console.warn(`Submit "${title}" → ${submitRes.status}: ${body}`)
  }

  // Admin publishes
  const publishRes = await fetch(`${BACKEND}/api/v1/articles/${uuid}/publish`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  if (!publishRes.ok) {
    const body = await publishRes.text().catch(() => '')
    console.warn(`Publish "${title}" → ${publishRes.status}: ${body}`)
  }
}

const COMMON_TAGS = [
  'vue', 'react', 'typescript', 'javascript',
  'java', 'spring-boot', 'python',
  'docker', 'kubernetes', 'nodejs',
]

async function seedCommonTags(authorToken: string): Promise<void> {
  console.log('[E2E global-setup] Seeding common tags...')
  // Idempotent: 若 'vue' 已存在 → 視為已 seed 過，跳過
  try {
    const tagCheck = await fetch(`${BACKEND}/api/v1/tags/suggest?q=vue`)
    const tagBody = await tagCheck.json()
    const existing = (tagBody.data ?? []) as Array<string | { name: string }>
    const existingNames = existing.map((t) => (typeof t === 'string' ? t : t.name))
    if (existingNames.includes('vue')) {
      console.log('[E2E global-setup] Common tags already seeded — skipping')
      return
    }
  } catch {
    // 檢查失敗 → 繼續嘗試 seed
  }
  try {
    await fetch(`${BACKEND}/api/v1/articles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${authorToken}` },
      body: JSON.stringify({
        title: 'E2E common tags seed',
        content: 'tag seed only',
        summary: 'seed',
        categoryIds: [],
        tagNames: COMMON_TAGS,
      }),
    })
  } catch {
    console.warn('Could not seed common tags — continuing')
  }
}

// ── main ─────────────────────────────────────────────────────────────────────

export default async function globalSetup() {
  console.log('\n[E2E global-setup] Checking backend health...')
  await healthCheck()
  console.log('[E2E global-setup] Backend is healthy.')

  console.log('[E2E global-setup] Ensuring MinIO bucket...')
  ensureMinIOBucket()

  console.log('[E2E global-setup] Seeding test users...')
  for (const user of SEED_USERS) {
    await registerUser(user)
    activateUser(user.email, user.role)
  }

  console.log('[E2E global-setup] Seeding categories and articles...')
  const adminToken = await apiLogin('admin@test.local', 'Test1234!')
  const authorToken = await apiLogin('author@test.local', 'Test1234!')

  await ensureCategory(adminToken, 'Frontend', 'frontend')
  await ensureCategory(adminToken, 'Backend', 'backend')

  await seedArticle(authorToken, adminToken, 'E2E Test Article — Vue 3 Guide', 'frontend')
  await seedArticle(authorToken, adminToken, 'E2E Test Article — Spring Boot Setup', 'backend')
  await seedArticle(authorToken, adminToken, 'E2E Test Article — TypeScript Tips', 'frontend')
  await seedArticle(authorToken, adminToken, 'E2E Test Article — Docker Basics', 'backend')
  await seedArticle(authorToken, adminToken, 'E2E Test Article — CSS Grid Layout', 'frontend')
  await seedArticle(authorToken, adminToken, 'E2E Test Article — REST API Design', 'backend')
  await seedArticle(authorToken, adminToken, 'E2E Test Article — Vue Router Guide', 'frontend')
  await seedArticle(authorToken, adminToken, 'E2E Test Article — Vite Build Tool', 'frontend')
  await seedArticle(authorToken, adminToken, 'E2E Test Article — PostgreSQL Basics', 'backend')
  await seedArticle(authorToken, adminToken, 'E2E Test Article — Pinia State Management', 'frontend')
  await seedArticle(authorToken, adminToken, 'E2E Test Article — Redis Caching', 'backend')
  await seedArticle(authorToken, adminToken, 'E2E Test Article — TailwindCSS Tips', 'frontend')

  // B-4: seed 常見技術 tag（用單一文章帶 tagNames，後端會 auto-create 不存在的 tag）
  // Idempotent: 若 'vue' tag 已存在跳過 — 避免重跑 setup 累積 draft 文章
  await seedCommonTags(authorToken)

  console.log('[E2E global-setup] Done.')
}
