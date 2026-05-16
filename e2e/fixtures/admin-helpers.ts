import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const COMPOSE_FILE = path.join(__dirname, '..', '..', 'docker-compose.e2e.yml')
const IS_CI = process.env.E2E_CI === '1'

function quoteArg(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`
}

function sqlLiteral(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function buildActivationSql(email: string, role: string): string {
  return `UPDATE users SET email_verified=true, status='ACTIVE', role=${sqlLiteral(role)} WHERE email=${sqlLiteral(email)}`
}

function remoteDevPsqlClientCommand(sql: string): string | null {
  const password = process.env.LOCAL_DB_PASSWORD
  if (!password) {
    return null
  }

  const host = process.env.LOCAL_DB_HOST || '10.0.0.214'
  const port = process.env.LOCAL_DB_PORT || '30120'
  const database = process.env.LOCAL_DB_NAME || 'blog_v2_db'
  const username = process.env.LOCAL_DB_USERNAME || 'luca'

  return [
    'docker run --rm',
    '-e',
    quoteArg(`PGPASSWORD=${password}`),
    'postgres:16-alpine',
    'psql',
    '-h',
    quoteArg(host),
    '-p',
    quoteArg(port),
    '-U',
    quoteArg(username),
    '-d',
    quoteArg(database),
    '-c',
    quoteArg(sql),
  ].join(' ')
}

/**
 * 啟用 user：set email_verified=true, status='ACTIVE', role=given role.
 *
 * <p>CI 走 docker compose exec postgres；本地優先走 kubectl exec infra-dev/postgres，
 * kubectl 不可用時改用一次性 psql client 連遠端 dev DB，不啟動本地 DB service。</p>
 *
 * @param email user 的 email
 * @param role 要設定的角色（USER / AUTHOR / ADMIN）
 */
export function activateUser(email: string, role: string): void {
  const sql = buildActivationSql(email, role)
  const remoteFallback = IS_CI ? null : remoteDevPsqlClientCommand(sql)
  const commands = IS_CI
    ? [`docker compose -f "${COMPOSE_FILE}" exec -T postgres psql -U e2e_user -d blog_e2e -c "${sql}"`]
    : [
        `kubectl exec -n infra-dev deploy/postgres -- psql -U luca -d blog_v2_db -c "${sql}"`,
        ...(remoteFallback ? [remoteFallback] : []),
      ]

  for (const cmd of commands) {
    try {
      execSync(cmd, { stdio: 'pipe' })
      return
    } catch {
      // Try the next activation path.
    }
  }

  if (!IS_CI && !remoteFallback) {
    console.warn('LOCAL_DB_PASSWORD is not set; remote dev DB fallback skipped')
  }
  console.warn(`Could not activate ${email} — skipping`)
}
