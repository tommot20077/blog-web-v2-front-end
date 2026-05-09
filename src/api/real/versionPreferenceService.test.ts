import { describe, it, expect, vi, beforeEach } from 'vitest'
import apiClient from '../apiClient'
import {
  versionPreferenceService,
  type VersionPreferenceConfig,
  type UpdateVersionPreferenceRequest,
} from './versionPreferenceService'

vi.mock('../apiClient')

describe('real versionPreferenceService', () => {
  beforeEach(() => vi.clearAllMocks())

  it('get 呼叫 GET /me/preferences/version 並回傳設定', async () => {
    const config: VersionPreferenceConfig = {
      enabled: { value: true, source: 'USER' },
      retain: { value: 20, source: 'DEFAULT' },
      intervalSeconds: { value: 60, source: 'USER' },
      diffChars: { value: 200, source: 'DEFAULT' },
    }
    vi.mocked(apiClient.get).mockResolvedValue(config)

    const res = await versionPreferenceService.get()
    const enabled: boolean = res.enabled!.value
    const retain: number = res.retain!.value

    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/me/preferences/version')
    expect(enabled).toBe(true)
    expect(retain).toBe(20)
    expect(res).toEqual(config)
  })

  it('update 呼叫 PUT /me/preferences/version with body 並回傳設定', async () => {
    const request: UpdateVersionPreferenceRequest = {
      enabled: true,
      retain: 20,
      intervalSeconds: 60,
      diffChars: 200,
    }
    const config: VersionPreferenceConfig = {
      enabled: { value: true, source: 'USER' },
      retain: { value: 20, source: 'USER' },
      intervalSeconds: { value: 60, source: 'USER' },
      diffChars: { value: 200, source: 'USER' },
    }
    vi.mocked(apiClient.put).mockResolvedValue(config)

    const res = await versionPreferenceService.update(request)

    expect(apiClient.put).toHaveBeenCalledWith('/api/v1/me/preferences/version', request)
    expect(res).toEqual(config)
  })

  it('reset 呼叫 DELETE /me/preferences/version/{key} 並回傳設定', async () => {
    const config: VersionPreferenceConfig = {
      enabled: { value: true, source: 'DEFAULT' },
    }
    vi.mocked(apiClient.delete).mockResolvedValue(config)

    const res = await versionPreferenceService.reset('enabled')

    expect(apiClient.delete).toHaveBeenCalledWith('/api/v1/me/preferences/version/enabled')
    expect(res).toEqual(config)
  })
})
