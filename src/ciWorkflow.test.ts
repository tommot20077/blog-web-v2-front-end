import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'

function readWorkflow() {
  return readFileSync('.github/workflows/ci.yml', 'utf8')
}

function workflowJob(name: string): string {
  const workflow = readWorkflow().replace(/\r\n/g, '\n')
  const marker = `  ${name}:\n`
  const start = workflow.indexOf(marker)

  if (start === -1) {
    return ''
  }

  const afterStart = workflow.slice(start + marker.length)
  const nextJob = afterStart.search(/\n  [a-zA-Z0-9_-]+:\n/)

  return marker + (nextJob === -1 ? afterStart : afterStart.slice(0, nextJob))
}

function workflowStep(job: string, name: string): string {
  const normalizedJob = job.replace(/\r\n/g, '\n')
  return normalizedJob.match(new RegExp(`- name: ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s\\S]*?(?=\\n      - name:|\\n      - uses:|$)`))?.[0] ?? ''
}

describe('frontend CI workflow', () => {
  it('cancels superseded branch runs and uses least-privilege contents access', () => {
    const workflow = readWorkflow()

    expect(workflow).toContain('workflow_dispatch:')
    expect(workflow).toContain('permissions:')
    expect(workflow).toContain('contents: read')
    expect(workflow).toContain('concurrency:')
    expect(workflow).toContain('group: ${{ github.workflow }}-${{ github.ref }}')
    expect(workflow).toContain('cancel-in-progress: true')
  })

  it('keeps every job bounded by an explicit timeout', () => {
    const jobs = [
      'unit-and-component-tests',
      'build',
      'coverage',
      'e2e-tests',
      'e2e-integration',
    ]

    for (const jobName of jobs) {
      expect(workflowJob(jobName), `${jobName} should have timeout-minutes`).toMatch(/timeout-minutes:\s*\d+/)
    }
  })

  it('unit, build, coverage, and mock e2e jobs use Node 20 with npm ci', () => {
    for (const jobName of ['unit-and-component-tests', 'build', 'coverage', 'e2e-tests']) {
      const job = workflowJob(jobName)
      expect(job).toContain('actions/setup-node@v4')
      expect(job).toContain('node-version: 20')
      expect(job).toContain("cache: 'npm'")
      expect(job).toContain('npm ci')
    }
  })

  it('coverage job uploads the coverage artifact with bounded retention', () => {
    const coverage = workflowJob('coverage')

    expect(coverage).toContain('npm run test:coverage')
    expect(coverage).toContain('actions/upload-artifact@v4')
    expect(coverage).toContain('name: coverage-report')
    expect(coverage).toContain('path: coverage/')
    expect(coverage).toContain('retention-days: 14')
  })

  it('build job runs the production build as a required CI gate', () => {
    const build = workflowJob('build')

    expect(build).toContain('npm run build')
    expect(build).toContain('timeout-minutes: 15')
  })

  it('mock E2E job runs in mock mode and uploads Playwright reports', () => {
    const e2e = workflowJob('e2e-tests')

    expect(e2e).toContain('npx playwright install --with-deps chromium')
    expect(e2e).toContain('npm run test:e2e:mock')
    expect(e2e).toContain('CI: true')
    expect(e2e).toContain('name: playwright-report')
    expect(e2e).toContain('path: playwright-report/')
  })

  it('browser E2E jobs wait for unit tests and the production build gate', () => {
    const requiredGates = 'needs: [unit-and-component-tests, build]'

    expect(workflowJob('e2e-tests')).toContain(requiredGates)
    expect(workflowJob('e2e-integration')).toContain(requiredGates)
  })

  it('real-backend E2E checks out and builds the backend before running browser tests', () => {
    const integration = workflowJob('e2e-integration')

    expect(integration).toContain('repository: tommot20077/blog-web-v2')
    expect(integration).toContain('path: backend')
    expect(integration).toContain('java-version: \'21\'')
    expect(integration).toContain('cache: maven')
    expect(integration).toContain('./mvnw -B clean package -DskipTests --no-transfer-progress')
    expect(integration).toContain('docker build -t blog-backend:e2e .')
  })

  it('real-backend E2E tests use the e2e backend port', () => {
    const realBackendE2eStep = workflowStep(
      workflowJob('e2e-integration'),
      'Run E2E tests (real backend)',
    )

    expect(realBackendE2eStep).toContain('VITE_API_BASE_URL: http://localhost:9010')
  })

  it('real-backend E2E captures stack logs on failure and always tears down containers', () => {
    const integration = workflowJob('e2e-integration')
    const captureLogs = workflowStep(integration, 'Capture E2E stack logs')
    const uploadLogs = workflowStep(integration, 'Upload E2E stack logs')
    const tearDown = workflowStep(integration, 'Tear down E2E stack')

    expect(captureLogs).toContain('if: failure()')
    expect(captureLogs).toContain('docker compose -f docker-compose.e2e.yml logs --no-color')
    expect(uploadLogs).toContain('if: failure()')
    expect(uploadLogs).toContain('name: e2e-stack-logs')
    expect(uploadLogs).toContain('path: e2e-artifacts/')
    expect(tearDown).toContain('if: always()')
    expect(tearDown).toContain('docker compose -f docker-compose.e2e.yml down -v')
  })

  it('real-backend E2E disables mail health because CI has no SMTP credentials', () => {
    const compose = readFileSync('docker-compose.e2e.yml', 'utf8')
    const backendStart = compose.indexOf('  backend:')
    const backendEnd = compose.indexOf('    depends_on:', backendStart)
    const backendService = compose.slice(backendStart, backendEnd)

    expect(backendService).toContain('MANAGEMENT_HEALTH_MAIL_ENABLED: "false"')
  })

  it('production build tsconfig excludes test-only files', () => {
    const tsconfig = readFileSync('tsconfig.app.json', 'utf8')

    expect(tsconfig).toContain('"exclude"')
    expect(tsconfig).toContain('"src/**/*.test.ts"')
    expect(tsconfig).toContain('"src/**/*.spec.ts"')
    expect(tsconfig).toContain('"src/test-utils/**"')
  })
})
