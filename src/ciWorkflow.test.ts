import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

describe('frontend CI workflow', () => {
  it('real-backend E2E tests use the e2e backend port', () => {
    const workflow = readFileSync('.github/workflows/ci.yml', 'utf8')
    const realBackendE2eStep = workflow.match(
      /- name: Run E2E tests \(real backend\)[\s\S]*?(?=\n\n      - name:|\n      - uses:|$)/,
    )?.[0]

    expect(realBackendE2eStep).toContain('VITE_API_BASE_URL: http://localhost:9010')
  })
})
