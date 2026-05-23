import { describe, expect, it } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

const config = fs.readFileSync(path.join(process.cwd(), 'playwright.config.ts'), 'utf8')

describe('Playwright config', () => {
  it('keeps full-stack red tests in a dedicated project with its own testDir', () => {
    expect(config).toContain("name: 'fullstack-red'")
    expect(config).toMatch(/name:\s*'fullstack-red'[\s\S]+testDir:\s*'\.\/e2e\/fullstack-red'/)
  })
})
