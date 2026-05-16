export type MockApiFailureBody = Record<string, unknown>
export type MockApiFailurePattern = string | RegExp

export type MockApiFailure = {
  urlPattern: MockApiFailurePattern
  body: MockApiFailureBody
  status: number
}

const failures: MockApiFailure[] = []

function escapeRegExpChar(char: string): string {
  return /[.*+?^${}()|[\]\\]/.test(char) ? `\\${char}` : char
}

function globToRegExp(pattern: string): RegExp {
  let source = ''

  for (const char of pattern) {
    source += char === '*' ? '.*' : escapeRegExpChar(char)
  }

  return new RegExp(`^${source}$`)
}

function matchesPattern(pattern: MockApiFailurePattern, url: string): boolean {
  if (pattern instanceof RegExp) {
    pattern.lastIndex = 0
    return pattern.test(url)
  }

  return globToRegExp(pattern).test(url)
}

export function mockApiFailure(
  urlPattern: MockApiFailurePattern,
  body: MockApiFailureBody = { code: 'E_MOCK', message: 'Mock failure', data: null },
  status = 500,
): void {
  failures.push({ urlPattern, body, status })
}

export function getMockApiFailure(url: string): MockApiFailure | null {
  return failures.find(failure => matchesPattern(failure.urlPattern, url)) ?? null
}

export function createMockApiFailureError(failure: MockApiFailure): Error {
  const message = typeof failure.body.message === 'string' ? failure.body.message : 'Mock failure'
  const error = new Error(message) as Error & {
    response?: {
      status: number
      data: MockApiFailureBody
    }
  }
  error.response = {
    status: failure.status,
    data: failure.body,
  }
  return error
}

export function resetMockApiFailures(): void {
  failures.length = 0
}
