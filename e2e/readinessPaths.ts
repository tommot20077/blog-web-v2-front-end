/**
 * 真後端 E2E 的 readiness 路徑，依序嘗試，任一 2xx 即視為就緒。
 *
 * - 新後端：actuator 搬到 management port，主 port 只提供 /readyz
 * - 舊後端：主 port 仍是 /actuator/health/readiness
 * CI 會 checkout 後端預設分支建 image，兩種都可能出現（與 docker-compose.e2e.yml 的 healthcheck 一致）。
 */
export const BACKEND_READINESS_PATHS = ['/readyz', '/actuator/health/readiness'] as const
