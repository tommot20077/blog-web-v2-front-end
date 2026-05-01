import { execSync } from 'child_process'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const COMPOSE_FILE = path.join(__dirname, '..', '..', 'docker-compose.e2e.yml')
const IS_CI = process.env.E2E_CI === '1'

/**
 * 啟用 user：set email_verified=true, status='ACTIVE', role=given role.
 *
 * <p>CI 走 docker compose exec postgres，本地走 kubectl exec infra-dev/postgres。</p>
 *
 * @param email user 的 email
 * @param role 要設定的角色（USER / AUTHOR / ADMIN）
 */
export function activateUser(email: string, role: string): void {
  const sql = `UPDATE users SET email_verified=true, status='ACTIVE', role='${role}' WHERE email='${email}'`
  const cmd = IS_CI
    ? `docker compose -f "${COMPOSE_FILE}" exec -T postgres psql -U e2e_user -d blog_e2e -c "${sql}"`
    : `kubectl exec -n infra-dev deploy/postgres -- psql -U luca -d blog_v2_db -c "${sql}"`
  try {
    execSync(cmd, { stdio: 'pipe' })
  } catch {
    console.warn(`Could not activate ${email} — skipping`)
  }
}
