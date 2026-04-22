import { execSync } from 'child_process'

const BACKEND = process.env.VITE_API_BASE_URL || 'http://localhost:8080'

interface SeedUser {
  email: string
  username: string
  nickname: string
  password: string
  role?: 'AUTHOR' | 'ADMIN'
}

const SEED_USERS: SeedUser[] = [
  { email: 'reader@test.local', username: 'reader_e2e', nickname: 'Reader', password: 'Test1234!' },
  { email: 'author@test.local', username: 'author_e2e', nickname: 'Author', password: 'Test1234!', role: 'AUTHOR' },
  { email: 'admin@test.local', username: 'admin_e2e', nickname: 'Admin', password: 'Test1234!', role: 'ADMIN' },
]

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
  if (!res.ok && res.status !== 409) {
    const body = await res.text().catch(() => '')
    console.warn(`Register ${user.email} → ${res.status}: ${body}`)
  }
}

function promoteUser(email: string, role: 'AUTHOR' | 'ADMIN') {
  try {
    execSync(
      `kubectl exec -n infra-dev deploy/postgres -- ` +
      `psql -U luca -d blog_v2_db -c ` +
      `"UPDATE users SET email_verified=true, role='${role}' WHERE email='${email}'"`,
      { stdio: 'pipe' },
    )
  } catch {
    console.warn(`Could not promote ${email} to ${role} via kubectl — skipping (user may already be correct role)`)
  }
}

async function verifyEmail(email: string) {
  try {
    execSync(
      `kubectl exec -n infra-dev deploy/postgres -- ` +
      `psql -U luca -d blog_v2_db -c ` +
      `"UPDATE users SET email_verified=true WHERE email='${email}'"`,
      { stdio: 'pipe' },
    )
  } catch {
    console.warn(`Could not verify email for ${email} via kubectl — skipping`)
  }
}

export default async function globalSetup() {
  console.log('\n[E2E global-setup] Checking backend health...')
  await healthCheck()
  console.log('[E2E global-setup] Backend is healthy.')

  console.log('[E2E global-setup] Seeding test users...')
  for (const user of SEED_USERS) {
    await registerUser(user)
    verifyEmail(user.email)
    if (user.role) {
      promoteUser(user.email, user.role)
    }
  }
  console.log('[E2E global-setup] Seed complete.')
}
