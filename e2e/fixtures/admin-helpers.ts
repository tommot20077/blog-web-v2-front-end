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

function buildVerificationTokenSql(email: string): string {
  return [
    'SELECT vt.token FROM verification_tokens vt',
    'JOIN users u ON u.id = vt.user_id',
    `WHERE u.email = ${sqlLiteral(email)} AND vt.type = 'EMAIL_VERIFICATION'`,
    'ORDER BY vt.id DESC LIMIT 1',
  ].join(' ')
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
  const localComposeCommand = `docker compose -f "${COMPOSE_FILE}" exec -T postgres psql -U e2e_user -d blog_e2e -c "${sql}"`
  const commands = IS_CI
    ? [localComposeCommand]
    : [
        localComposeCommand,
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

/**
 * 清除 Redis 內的 auth IP 限流計數（register + login）。
 *
 * <p>後端對 auth 端點設有 per-IP 限流：register 每 60 分鐘 10 次
 * （REGISTER_IP_MAX）、login 每 15 分鐘 20 次（LOGIN_IP_MAX）。E2E 的所有
 * 請求來自同一個 IP（compose 網路的 gateway，如 172.22.0.1），故整個套件
 * 共用同一組計數器。</p>
 *
 * <p><b>這是目前 CI e2e-integration job 失敗的根因</b>：套件約 66 處登入
 * 呼叫、4.7 分鐘內跑完（遠短於 15 分鐘窗口），跑到第 13 個測試左右即撞上
 * LOGIN_IP_MAX，其後每個要登入的測試都拿到 A0113、以
 * `Cannot read properties of null (reading 'accessToken')` 收場。
 * 全套件層級的修法需 Yuan 決策（見設計文件 §2.1），本 helper 先讓會註冊
 * 的 spec 能獨立成立。</p>
 *
 * <p>限流本身的行為應由獨立的 test case 覆蓋（見設計文件 §4.2），
 * 不要靠「剛好撞到上限」來測。</p>
 *
 * <p>與 activateUser 同樣採多段管線：CI 走 e2e compose 的 redis；本地
 * compose 不可用時退回 kubectl infra-dev 的 redis（密碼由 pod 自身
 * $REDIS_PASSWORD 提供，不在此硬編）。</p>
 *
 * <p>失敗不拋錯：限流未達上限時測試本來就能跑，不該因為清不掉而中斷；
 * 但全數路徑皆失敗時發出告警，避免「靜默 no-op」讓累積的計數繼續擋人。</p>
 */
export function resetAuthRateLimits(): void {
  // 同時清 register 與 login 兩組計數（兩者皆為 per-IP，且 E2E 全部同 IP）
  const pattern = 'auth:*:ip:*'
  // Lua 字串用單引號，整段 EVAL 以雙引號包給 shell。
  const composeScript = `for _,k in ipairs(redis.call('keys', ARGV[1])) do redis.call('del', k) end`
  const localComposeCommand =
    `docker compose -f "${COMPOSE_FILE}" exec -T redis redis-cli -a e2e_pass ` +
    `--no-auth-warning EVAL "${composeScript}" 0 "${pattern}"`

  // kubectl 版本以 sh -c 包裹好讓 $REDIS_PASSWORD 由 pod 內 env 展開；
  // 外層用單引號，故 Lua 字串改用雙引號，避免與腳本內的引號打架。
  const kubectlScript = `for _,k in ipairs(redis.call("keys", ARGV[1])) do redis.call("del", k) end`
  const kubectlCommand =
    `kubectl exec -n infra-dev deploy/redis -- sh -c ` +
    `'redis-cli -a "$REDIS_PASSWORD" --no-auth-warning EVAL "${kubectlScript}" 0 "${pattern}"'`

  const commands = IS_CI ? [localComposeCommand] : [localComposeCommand, kubectlCommand]

  for (const cmd of commands) {
    try {
      execSync(cmd, { stdio: 'pipe' })
      return
    } catch {
      // 換下一條管線試。限流未達上限時測試仍可正常執行，故不中斷。
    }
  }

  console.warn('Could not reset auth rate limits — skipping (re-run may hit per-IP limits)')
}

/**
 * 取得指定 email 的信箱驗證 token。
 *
 * <p>用於「註冊 → 信箱驗證 → 登入」旅程的 E2E：compose 內沒有 SMTP 服務，
 * 但 token 於註冊當下即寫入 verification_tokens，故直接查表取得，
 * 等同使用者從驗證信連結取得 token。做法比照後端 AuthE2E。</p>
 *
 * <p>與 activateUser 走同一組 psql 管線（CI 走 e2e compose 的 postgres；
 * 本地依序退回 kubectl / 遠端 dev DB）。使用 psql 的 -t -A 讓輸出為
 * 純值、不含表格框線與欄位標題。</p>
 *
 * @param email 註冊時使用的 email
 * @returns 該 email 最新一筆的信箱驗證 token
 * @throws 找不到 token 時拋錯 —— 不回空字串，避免測試帶著空 token 假性往下跑
 */
export function fetchVerificationToken(email: string): string {
  const sql = buildVerificationTokenSql(email)
  const remoteFallback = IS_CI ? null : remoteDevPsqlClientCommand(sql)
  const localComposeCommand = `docker compose -f "${COMPOSE_FILE}" exec -T postgres psql -U e2e_user -d blog_e2e -t -A -c "${sql}"`
  const commands = IS_CI
    ? [localComposeCommand]
    : [
        localComposeCommand,
        `kubectl exec -n infra-dev deploy/postgres -- psql -U luca -d blog_v2_db -t -A -c "${sql}"`,
        ...(remoteFallback ? [remoteFallback.replace(' -c ', ' -t -A -c ')] : []),
      ]

  for (const cmd of commands) {
    try {
      const out = execSync(cmd, { stdio: 'pipe', encoding: 'utf-8' })
      const token = String(out).trim()
      if (token) {
        return token
      }
    } catch {
      // Try the next lookup path.
    }
  }

  throw new Error(
    `Could not fetch verification token for ${email}. ` +
      'Is the e2e stack up and did registration succeed?',
  )
}
