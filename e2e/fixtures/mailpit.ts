/**
 * E2E 郵件服務（mailpit）讀信工具。
 *
 * <p>後端 A1 決策後 verification_tokens 只存 SHA-256，明文 token 只在寄信當下出現在信件連結裡，
 * 無法再從 DB 取得。E2E 堆疊的後端把信寄到 compose 內的 mailpit，測試透過它的 HTTP API
 * 讀信並解析連結，等同使用者從信箱取得 token。</p>
 */

const DEFAULT_MAILPIT_URL = process.env.MAILPIT_URL || 'http://localhost:8025'

/** 從信件內容取出 /verify-email?token=... 的 token；沒有（例如密碼重設信）回 null */
export function extractVerificationToken(content: string): string | null {
  const match = /\/verify-email\?token=([^\s"'<>&)]+)/.exec(content)
  if (!match) return null
  try {
    return decodeURIComponent(match[1])
  } catch {
    return match[1]
  }
}

export interface FetchMailTokenOptions {
  baseUrl?: string
  timeoutMs?: number
  intervalMs?: number
  fetchImpl?: typeof fetch
  sleep?: (ms: number) => Promise<void>
  now?: () => number
}

/**
 * 輪詢 mailpit，取得寄給指定 email 的信箱驗證信中的 token。
 *
 * @throws 逾時仍沒有含驗證連結的信時拋錯（附 email、mailpit 位址、逾時秒數與最後一次錯誤）；
 *   不回空字串，避免測試帶著空 token 假性往下跑
 */
export async function fetchVerificationTokenFromMail(
  email: string,
  options: FetchMailTokenOptions = {},
): Promise<string> {
  const baseUrl = (options.baseUrl ?? DEFAULT_MAILPIT_URL).replace(/\/+$/, '')
  const timeoutMs = options.timeoutMs ?? 20_000
  const intervalMs = options.intervalMs ?? 500
  const fetchImpl = options.fetchImpl ?? fetch
  const sleep = options.sleep ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms)))
  const now = options.now ?? Date.now

  const deadline = now() + timeoutMs
  let lastProblem = '尚未收到寄給此信箱的信'

  while (true) {
    try {
      const query = encodeURIComponent(`to:"${email}"`)
      const searchResp = await fetchImpl(`${baseUrl}/api/v1/search?query=${query}`)
      if (!searchResp.ok) {
        lastProblem = `搜尋信件回應 HTTP ${searchResp.status}`
      } else {
        const messages = ((await searchResp.json()) as { messages?: Array<{ ID: string }> }).messages ?? []
        lastProblem = messages.length === 0 ? '尚未收到寄給此信箱的信' : '已有信件但不含 /verify-email 連結'
        for (const message of messages) {
          const msgResp = await fetchImpl(`${baseUrl}/api/v1/message/${message.ID}`)
          if (!msgResp.ok) {
            lastProblem = `讀取信件 ${message.ID} 回應 HTTP ${msgResp.status}`
            continue
          }
          const body = (await msgResp.json()) as { Text?: string; HTML?: string }
          const token = extractVerificationToken(`${body.Text ?? ''}\n${body.HTML ?? ''}`)
          if (token) return token
        }
      }
    } catch (err) {
      lastProblem = `無法連線 mailpit：${err instanceof Error ? err.message : String(err)}`
    }

    if (now() >= deadline) break
    await sleep(intervalMs)
  }

  throw new Error(
    `Could not fetch verification email token for ${email} from mailpit at ${baseUrl} ` +
      `within ${timeoutMs / 1000}s (${lastProblem}). ` +
      'Is the e2e stack up (mailpit service, backend SPRING_MAIL_HOST=mailpit) and did registration succeed?',
  )
}
