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

  it('falls back to a one-shot psql client against the remote dev DB when local kubectl is unavailable', async () => {
    vi.stubEnv('E2E_CI', '')
    vi.stubEnv('LOCAL_DB_PASSWORD', 'dev-secret')
    mockedExecSync
      .mockImplementationOnce(() => {
        throw new Error('kubectl unavailable')
      })
      .mockImplementationOnce(() => Buffer.from('UPDATE 1'))

    const { activateUser } = await loadHelpers()

    activateUser('admin@test.local', 'ADMIN')

    expect(mockedExecSync).toHaveBeenCalledTimes(2)
    expect(mockedExecSync).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining('kubectl exec -n infra-dev deploy/postgres'),
      { stdio: 'pipe' },
    )
    expect(mockedExecSync).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining('docker run --rm'),
      { stdio: 'pipe' },
    )
    const fallbackCommand = mockedExecSync.mock.calls[1]?.[0] as string
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

    expect(mockedExecSync).toHaveBeenCalledTimes(1)
    expect(mockedExecSync.mock.calls[0]?.[0]).toContain('kubectl exec -n infra-dev deploy/postgres')
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('LOCAL_DB_PASSWORD'))

    warnSpy.mockRestore()
  })
})
