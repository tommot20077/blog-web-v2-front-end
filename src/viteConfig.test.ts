import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

function readViteConfig() {
  return readFileSync('vite.config.ts', 'utf8')
}

describe('Vite dev server proxy', () => {
  it('forwards /api to the local backend with changeOrigin so relative content URLs (e.g. /api/v1/files/{id}/content) resolve in dev', () => {
    const config = readViteConfig()
    expect(config).toMatch(/proxy:\s*\{[\s\S]*?'\/api':\s*\{[\s\S]*?target:\s*'http:\/\/localhost:9010'[\s\S]*?changeOrigin:\s*true/)
  })

  it('documents that apiClient.ts keeps calling VITE_API_BASE_URL directly and does not go through this proxy', () => {
    const config = readViteConfig()
    expect(config).toContain('apiClient.ts')
    expect(config).toContain('VITE_API_BASE_URL')
  })
})
