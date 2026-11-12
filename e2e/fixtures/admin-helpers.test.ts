import { beforeEach, describe, expect, it, vi } from 'vitest'

const execSyncMock = vi.fn()

vi.mock('child_process', () => ({
  execSync: execSyncMock,
  default: {
    execSync: execSyncMock,
  },
}))

const mockedExecSync = vi.mocked(execSyncMock)

async function loadHelpers() {
  vi.resetModules()
  return import('./admin-helpers')
}

describe('activateUser', () => {
  beforeEach(() => {
    mockedExecSync.mockReset()
    vi.unstubAllEnvs()
  })

  it('tries the local e2e compose postgres before remote dev fallbacks', async () => {
    vi.stubEnv('E2E_CI', '')
    vi.stubEnv('LOCAL_DB_PASSWORD', 'dev-secret')
    mockedExecSync.mockImplementationOnce(() => Buffer.from('UPDATE 1'))

    const { activateUser } = await loadHelpers()

    activateUser('admin@test.local', 'ADMIN')

    expect(mockedExecSync).toHaveBeenCalledTimes(1)
    expect(mockedExecSync).toHaveBeenCalledWith(
      expect.stringContaining('docker compose -f'),
      { stdio: 'pipe' },
    )
    expect(mockedExecSync.mock.calls[0]?.[0]).toContain('exec -T postgres psql -U e2e_user -d blog_e2e')
  })

  it('falls back to a one-shot psql client against the remote dev DB when local kubectl is unavailable', async () => {
    vi.stubEnv('E2E_CI', '')
    vi.stubEnv('LOCAL_DB_PASSWORD', 'dev-secret')
    mockedExecSync
      .mockImplementationOnce(() => {
        throw new Error('compose unavailable')
      })
      .mockImplementationOnce(() => {
        throw new Error('kubectl unavailable')
      })
      .mockImplementationOnce(() => Buffer.from('UPDATE 1'))

    const { activateUser } = await loadHelpers()

    activateUser('admin@test.local', 'ADMIN')

    expect(mockedExecSync).toHaveBeenCalledTimes(3)
    expect(mockedExecSync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('kubectl exec -n infra-dev deploy/postgres'),
      { stdio: 'pipe' },
    )
    expect(mockedExecSync).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining('docker run --rm'),
      { stdio: 'pipe' },
    )
    const fallbackCommand = mockedExecSync.mock.calls[2]?.[0] as string
    expect(fallbackCommand).toContain('postgres:16-alpine')
    expect(fallbackCommand).toContain('PGPASSWORD=dev-secret')
    expect(fallbackCommand).toContain('-h "10.0.0.214"')
    expect(fallbackCommand).toContain('-p "30120"')
    expect(fallbackCommand).toContain('-U "luca" -d "blog_v2_db"')
  })

  it('does not run the remote dev DB fallback when LOCAL_DB_PASSWORD is missing', async () => {
    vi.stubEnv('E2E_CI', '')
    vi.stubEnv('LOCAL_DB_PASSWORD', '')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockedExecSync.mockImplementation(() => {
      throw new Error('kubectl unavailable')
    })

    const { activateUser } = await loadHelpers()

    activateUser('admin@test.local', 'ADMIN')

    expect(mockedExecSync).toHaveBeenCalledTimes(2)
    expect(mockedExecSync.mock.calls[0]?.[0]).toContain('docker compose -f')
    expect(mockedExecSync.mock.calls[1]?.[0]).toContain('kubectl exec -n infra-dev deploy/postgres')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('LOCAL_DB_PASSWORD'))

    warnSpy.mockRestore()
  })
})

describe('resetAuthRateLimits', () => {
  beforeEach(() => {
    mockedExecSync.mockReset()
    vi.unstubAllEnvs()
  })

  it('清掉 Redis 內所有 auth IP 限流計數（register + login）', async () => {
    vi.stubEnv('E2E_CI', '1')
    mockedExecSync.mockImplementationOnce(() => '')

    const { resetAuthRateLimits } = await loadHelpers()

    resetAuthRateLimits()

    const cmd = mockedExecSync.mock.calls[0]?.[0] as string
    expect(cmd).toContain('exec -T redis redis-cli')
    // 後端 key 格式：auth:register:ip:{ip} / auth:login:ip:{ip}，一次清兩組
    expect(cmd).toContain('auth:*:ip:*')
  })

  it('本機（非 CI）compose 失敗時退回 kubectl infra-dev redis', async () => {
    vi.stubEnv('E2E_CI', '')
    mockedExecSync
      .mockImplementationOnce(() => {
        throw new Error('compose unavailable')
      })
      .mockImplementationOnce(() => '')

    const { resetAuthRateLimits } = await loadHelpers()

    resetAuthRateLimits()

    expect(mockedExecSync).toHaveBeenCalledTimes(2)
    const kubectlCmd = mockedExecSync.mock.calls[1]?.[0] as string
    expect(kubectlCmd).toContain('kubectl exec -n infra-dev deploy/redis')
    // 密碼由 pod 自身 env 提供，不在此硬編
    expect(kubectlCmd).toContain('$REDIS_PASSWORD')
    expect(kubectlCmd).toContain('auth:*:ip:*')
  })

  it('CI 模式只走 compose，不嘗試 kubectl', async () => {
    vi.stubEnv('E2E_CI', '1')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockedExecSync.mockImplementationOnce(() => {
      throw new Error('compose down')
    })

    const { resetAuthRateLimits } = await loadHelpers()

    resetAuthRateLimits()

    expect(mockedExecSync).toHaveBeenCalledTimes(1)
    warnSpy.mockRestore()
  })

  it('Redis 不可用時不得讓測試爆掉（限流未達上限時測試仍應能跑）', async () => {
    vi.stubEnv('E2E_CI', '1')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockedExecSync.mockImplementation(() => {
      throw new Error('redis unavailable')
    })

    const { resetAuthRateLimits } = await loadHelpers()

    expect(() => resetAuthRateLimits()).not.toThrow()

    warnSpy.mockRestore()
  })

  it('所有路徑失敗時告警但不中斷測試', async () => {
    vi.stubEnv('E2E_CI', '')
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    mockedExecSync.mockImplementation(() => {
      throw new Error('all down')
    })

    const { resetAuthRateLimits } = await loadHelpers()

    resetAuthRateLimits()

    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('rate limit'))
    warnSpy.mockRestore()
  })
})
