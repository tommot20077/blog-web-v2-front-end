/**
 * Tests for scripts/generate-frontend-openapi.ts
 *
 * Grouped by task per the implementation plan:
 *   Task 4 — HTTP method + path extraction (5 cases)
 *   Task 5 — query + body extraction (5 cases)
 *   Task 6 — response → JSON schema (5 cases)
 *   Task 7 — anti-pattern + multi-call detection (5 cases)
 *
 * All tests use `generateFromSources` (in-memory ts-morph project) so they run
 * fast and don't depend on the real repo state.
 */
import { describe, expect, it } from 'vitest'
import {
  emptyDocument,
  generateFromSources,
  scanAntiPatterns,
  scanFileForAntiPatterns,
} from './lib/generator.js'
import { alignPathParams } from './lib/align.js'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as os from 'node:os'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * A minimal stub for the apiClient module so ts-morph can resolve `apiClient`
 * imports. Most tests don't actually need this (functions don't have to type-
 * check fully for the AST walk to work), but having it keeps the project
 * "feels real".
 */
const APICLIENT_STUB = {
  filePath: '/virtual/apiClient.ts',
  content: `
declare const apiClient: {
  get: <Req = unknown, Res = unknown>(url: string, config?: { params?: Record<string, unknown> }) => Promise<Res>;
  post: <Req = unknown, Res = unknown>(url: string, body?: unknown, config?: { params?: Record<string, unknown> }) => Promise<Res>;
  put: <Req = unknown, Res = unknown>(url: string, body?: unknown, config?: { params?: Record<string, unknown> }) => Promise<Res>;
  patch: <Req = unknown, Res = unknown>(url: string, body?: unknown, config?: { params?: Record<string, unknown> }) => Promise<Res>;
  delete: <Req = unknown, Res = unknown>(url: string, config?: { params?: Record<string, unknown> }) => Promise<Res>;
};
export default apiClient;
`,
}

function svc(content: string, filePath = '/virtual/svc.ts') {
  return { filePath, content }
}

function pathOp(result: ReturnType<typeof generateFromSources>, p: string, method: string) {
  return result.document.paths[p]?.[method as 'get']
}

// ---------------------------------------------------------------------------
// Task 3 — OpenAPI scaffold
// ---------------------------------------------------------------------------

describe('Task 3 — OpenAPI scaffold', () => {
  it('emits OpenAPI 3.0.3 documents as required by the audit plan', () => {
    expect(emptyDocument().openapi).toBe('3.0.3')
    expect(generateFromSources({ files: [] }).document.openapi).toBe('3.0.3')
  })
})

// ---------------------------------------------------------------------------
// Task 4 — HTTP method + path extraction
// ---------------------------------------------------------------------------

describe('Task 4 — HTTP method + path extraction', () => {
  it('plain string path: emits operation with verbatim path', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function fetchUsers() {
            return apiClient.get('/api/v1/users')
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/users', 'get')
    expect(op).toBeDefined()
    // Task 4 only asserts method + path; orthogonal warnings (e.g. inferred response type)
    // are Task 6's concern. Just verify no PATH-related warning fired.
    const pathWarnings = result.warnings.filter(
      (w) => w.code === 'unresolved-path' || w.code === 'multi-call-wrapper',
    )
    expect(pathWarnings).toEqual([])
  })

  it('template literal with ${ident}: emits {ident} placeholder + path parameter', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function getArticle(uuid: string) {
            return apiClient.get(\`/api/v1/articles/\${uuid}\`)
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/articles/{uuid}', 'get')
    expect(op).toBeDefined()
    const params = op?.parameters ?? []
    const uuidParam = params.find((p) => p.name === 'uuid' && p.in === 'path')
    expect(uuidParam).toBeDefined()
    expect(uuidParam?.required).toBe(true)
  })

  it('unresolved path (function call as URL): warns and excludes operation', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          function buildUrl(): string { return '/x' }
          export function weird() {
            return apiClient.get(buildUrl())
          }
        `),
      ],
    })

    expect(Object.keys(result.document.paths)).toHaveLength(0)
    expect(result.warnings.some((w) => w.code === 'unresolved-path' && w.function === 'weird')).toBe(true)
  })

  it('multi-call wrapper: warns and skips', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export async function multi() {
            await apiClient.get('/a')
            await apiClient.get('/b')
          }
        `),
      ],
    })

    expect(result.warnings.some((w) => w.code === 'multi-call-wrapper' && w.function === 'multi')).toBe(true)
    expect(result.document.paths['/a']).toBeUndefined()
    expect(result.document.paths['/b']).toBeUndefined()
  })

  it('no apiClient call: silently skipped (no warning)', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          export function helper() {
            return 1 + 1
          }
        `),
      ],
    })

    expect(result.warnings).toEqual([])
    expect(Object.keys(result.document.paths)).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Task 5 — query + request body extraction
// ---------------------------------------------------------------------------

describe('Task 5 — query + body extraction', () => {
  it('GET with `{ params: { page, size } }`: extracts query params', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function list() {
            return apiClient.get('/api/v1/articles', { params: { page: 1, size: 20 } })
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/articles', 'get')
    const params = op?.parameters ?? []
    const queryNames = params.filter((p) => p.in === 'query').map((p) => p.name).sort()
    expect(queryNames).toEqual(['page', 'size'])
  })

  it('POST with typed payload variable: emits requestBody schema', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          interface CreateXRequest { name: string; age: number }
          export function create(payload: CreateXRequest) {
            return apiClient.post('/api/v1/x', payload)
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/x', 'post')
    expect(op?.requestBody).toBeDefined()
    const schema = op?.requestBody?.content['application/json'].schema
    expect(schema).toBeDefined()
  })

  it('POST with inline object literal body: emits inline object schema', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function create(name: string, age: number) {
            return apiClient.post('/api/v1/x', { name, age })
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/x', 'post')
    expect(op?.requestBody).toBeDefined()
    const schema = op?.requestBody?.content['application/json'].schema as Record<string, unknown>
    expect(schema.type).toBe('object')
    expect(Object.keys((schema.properties as Record<string, unknown>) ?? {}).sort()).toEqual(['age', 'name'])
  })

  it('DELETE with `{ params }`: emits query params and NO request body', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function remove() {
            return apiClient.delete('/api/v1/x', { params: { force: true } })
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/x', 'delete')
    expect(op?.requestBody).toBeUndefined()
    const queryNames = (op?.parameters ?? []).filter((p) => p.in === 'query').map((p) => p.name)
    expect(queryNames).toContain('force')
  })

  it('GET with non-`{ params }` second arg: warns ambiguous-request', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function strange() {
            return apiClient.get('/api/v1/x', 'not-a-config' as any)
          }
        `),
      ],
    })

    expect(result.warnings.some((w) => w.code === 'ambiguous-request')).toBe(true)
  })

  it('GET with `{ params }` shorthand referencing inline object literal variable: extracts initial keys', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function list(page: number, size: number) {
            const params: Record<string, string> = {
              page: page.toString(),
              size: size.toString(),
            }
            return apiClient.get('/api/v1/articles', { params })
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/articles', 'get')
    expect(op).toBeDefined()
    const queryNames = (op?.parameters ?? [])
      .filter((p) => p.in === 'query')
      .map((p) => p.name)
      .sort()
    expect(queryNames).toEqual(['page', 'size'])
  })

  it('GET with `{ params }` shorthand + later `params.X = …` mutation: unions inline + assigned keys', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function list(page: number, size: number, category: string) {
            const params: Record<string, string> = {
              page: page.toString(),
              size: size.toString(),
            }
            if (category) {
              params.categorySlug = category.toLowerCase()
            }
            return apiClient.get('/api/v1/articles', { params })
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/articles', 'get')
    expect(op).toBeDefined()
    const queryNames = (op?.parameters ?? [])
      .filter((p) => p.in === 'query')
      .map((p) => p.name)
      .sort()
    expect(queryNames).toEqual(['categorySlug', 'page', 'size'])
  })

  it('GET with `{ params }` shorthand where params is an opaque function parameter (Record<string, unknown>): emits query-params-not-resolvable warning', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function search(params: Record<string, unknown>) {
            return apiClient.get('/api/v1/search', { params })
          }
        `),
      ],
    })

    expect(
      result.warnings.some(
        (w) => w.code === 'query-params-not-resolvable' && w.function === 'search',
      ),
    ).toBe(true)
    // No query params extracted.
    const op = pathOp(result, '/api/v1/search', 'get')
    const queryNames = (op?.parameters ?? []).filter((p) => p.in === 'query').map((p) => p.name)
    expect(queryNames).toEqual([])
  })

  it('GET query params with literal-union type emit string enum schema', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function list(sort: 'newest' | 'oldest') {
            return apiClient.get('/api/v1/comments', { params: { sort } })
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/comments', 'get')
    const sort = (op?.parameters ?? []).find((p) => p.in === 'query' && p.name === 'sort')
    expect(sort?.schema).toEqual({ type: 'string', enum: ['newest', 'oldest'] })
  })

  it('DELETE with `{ data }` emits a request body and no ambiguous-request warning', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          interface DeleteAccountRequest { password: string }
          export function remove(data: DeleteAccountRequest) {
            return apiClient.delete('/api/v1/users/me', { data })
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/users/me', 'delete')
    expect(op?.requestBody).toBeDefined()
    expect(result.warnings.some((w) => w.code === 'ambiguous-request')).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Task 6 — response → JSON Schema
// ---------------------------------------------------------------------------

describe('Task 6 — response type → JSON Schema', () => {
  it('explicit Promise<X>: response schema reflects X', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          interface Article { uuid: string; title: string }
          export function getOne(): Promise<Article> {
            return apiClient.get('/api/v1/articles/one')
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/articles/one', 'get')
    const schema = op?.responses['200']?.content?.['application/json'].schema
    expect(schema).toBeDefined()
    // Schema is either inline object with type:'object' or a $ref to Article.
    const json = JSON.stringify(schema)
    expect(json.includes('Article') || json.includes('title')).toBe(true)
  })

  it('inferred return type (no Promise<X>): emits response + response-type-inferred warning', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function getOne() {
            return apiClient.get('/api/v1/x')
          }
        `),
      ],
    })

    expect(result.warnings.some((w) => w.code === 'response-type-inferred' && w.function === 'getOne')).toBe(true)
  })

  it('Promise<X | null>: response schema is nullable', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          interface Article { uuid: string }
          export function maybe(): Promise<Article | null> {
            return apiClient.get('/api/v1/x')
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/x', 'get')
    const schema = op?.responses['200']?.content?.['application/json'].schema as Record<string, unknown>
    expect(schema).toBeDefined()
    // Nullable can be expressed as `nullable: true`, `anyOf: [..., { type: 'null' }]`, or `{ type: ['object', 'null'] }`.
    const j = JSON.stringify(schema)
    expect(j.includes('null')).toBe(true)
  })

  it('Promise<Pick<X, "k">>: utility type is expanded to the picked subset', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          interface Article { uuid: string; title: string; body: string }
          export function picky(): Promise<Pick<Article, 'uuid' | 'title'>> {
            return apiClient.get('/api/v1/x')
          }
        `),
      ],
    })

    const op = pathOp(result, '/api/v1/x', 'get')
    const schema = op?.responses['200']?.content?.['application/json'].schema as Record<string, unknown>
    expect(schema).toBeDefined()
    const props = (schema.properties as Record<string, unknown>) ?? {}
    expect(Object.keys(props).sort()).toEqual(['title', 'uuid'])
  })

  it('Promise<T> with T not declared: unresolvable-schema warning', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          // @ts-ignore — intentionally references missing type
          export function bad(): Promise<Missing> {
            return apiClient.get('/api/v1/x')
          }
        `),
      ],
    })

    expect(
      result.warnings.some(
        (w) =>
          (w.code === 'unresolvable-schema' || w.code === 'response-type-inferred') &&
          w.function === 'bad',
      ),
    ).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Task 7 — anti-pattern inventory
// ---------------------------------------------------------------------------

describe('Task 7 — anti-pattern inventory', () => {
  function withTmp(fn: (dir: string) => void) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'audit-anti-'))
    try {
      fn(dir)
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  }

  it('component directly calls apiClient: one entry with component-direct category', () => {
    withTmp((dir) => {
      const compDir = path.join(dir, 'src', 'components')
      fs.mkdirSync(compDir, { recursive: true })
      const file = path.join(compDir, 'Bad.vue')
      fs.writeFileSync(
        file,
        `<template><div></div></template>\n<script setup>\nimport apiClient from '../api/apiClient'\nawait apiClient.get('/foo')\n</script>\n`,
      )

      const out = scanAntiPatterns({ baseDir: dir, dirs: ['src/components'] })
      expect(out.length).toBe(1)
      expect(out[0].method).toBe('get')
      expect(out[0].category).toBe('component-direct')
    })
  })

  it('Vue <script setup> with direct axios.post: direct-axios category', () => {
    withTmp((dir) => {
      const compDir = path.join(dir, 'src', 'components')
      fs.mkdirSync(compDir, { recursive: true })
      const file = path.join(compDir, 'Direct.vue')
      fs.writeFileSync(
        file,
        `<template><div></div></template>\n<script setup>\nimport axios from 'axios'\naxios.post('/foo', { x: 1 })\n</script>\n`,
      )

      const out = scanAntiPatterns({ baseDir: dir, dirs: ['src/components'] })
      expect(out.length).toBe(1)
      expect(out[0].method).toBe('post')
      expect(out[0].category).toBe('direct-axios')
    })
  })

  it('store directly calls apiClient: store-direct category', () => {
    withTmp((dir) => {
      const storesDir = path.join(dir, 'src', 'stores')
      fs.mkdirSync(storesDir, { recursive: true })
      const file = path.join(storesDir, 'auth.ts')
      fs.writeFileSync(file, `import apiClient from '../api/apiClient'\napiClient.post('/auth/refresh')\n`)

      const out = scanAntiPatterns({ baseDir: dir, dirs: ['src/stores'] })
      expect(out.length).toBe(1)
      expect(out[0].category).toBe('store-direct')
    })
  })

  it('e2e global-setup with direct axios: e2e-direct category', () => {
    withTmp((dir) => {
      const eDir = path.join(dir, 'e2e')
      fs.mkdirSync(eDir, { recursive: true })
      const file = path.join(eDir, 'global-setup.ts')
      fs.writeFileSync(file, `import axios from 'axios'\nawait axios.post('/login')\n`)

      const out = scanAntiPatterns({ baseDir: dir, dirs: ['e2e'] })
      expect(out.length).toBe(1)
      expect(out[0].category).toBe('e2e-direct')
    })
  })

  it('clean directory: empty inventory', () => {
    withTmp((dir) => {
      const cDir = path.join(dir, 'src', 'composables')
      fs.mkdirSync(cDir, { recursive: true })
      fs.writeFileSync(path.join(cDir, 'pure.ts'), 'export function helper() { return 1 }\n')

      const out = scanAntiPatterns({ baseDir: dir, dirs: ['src/composables'] })
      expect(out).toEqual([])
    })
  })

  it('scanFileForAntiPatterns: matches both apiClient and axios calls', () => {
    const found = scanFileForAntiPatterns(
      '/x/src/components/Foo.vue',
      `<template></template>\n<script setup>\nimport apiClient from '../api/apiClient'\napiClient.get('/a')\nimport axios from 'axios'\naxios.delete('/b')\n</script>`,
    )
    expect(found.length).toBe(2)
  })
})

// ---------------------------------------------------------------------------
// Task 8 — path-param alignment with backend OpenAPI
// ---------------------------------------------------------------------------

describe('Task 8 — alignPathParams', () => {
  it('renames frontend path placeholder + parameter name to backend naming', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function get(articleUuid: string) {
            return apiClient.get(\`/api/v1/articles/\${articleUuid}\`)
          }
        `),
      ],
    })

    const backend = {
      openapi: '3.1.0',
      paths: {
        '/api/v1/articles/{uuid}': {
          get: {
            parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }

    const aligned = alignPathParams(result.document, backend)
    expect(Object.keys(aligned.paths)).toContain('/api/v1/articles/{uuid}')
    const op = aligned.paths['/api/v1/articles/{uuid}']?.get
    const pathParam = (op?.parameters ?? []).find((p) => p.in === 'path')
    expect(pathParam?.name).toBe('uuid')
  })

  it('leaves frontend operation untouched when backend has no matching (method, path)', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function get(articleUuid: string) {
            return apiClient.get(\`/api/v1/widgets/\${articleUuid}\`)
          }
        `),
      ],
    })

    const backend = { openapi: '3.1.0', paths: {} }
    const aligned = alignPathParams(result.document, backend)
    expect(Object.keys(aligned.paths)).toEqual(['/api/v1/widgets/{articleUuid}'])
  })

  it('leaves param names alone when names already match backend', () => {
    const result = generateFromSources({
      files: [
        APICLIENT_STUB,
        svc(`
          import apiClient from './apiClient'
          export function get(uuid: string) {
            return apiClient.get(\`/api/v1/comments/\${uuid}\`)
          }
        `),
      ],
    })

    const backend = {
      openapi: '3.1.0',
      paths: {
        '/api/v1/comments/{uuid}': {
          get: {
            parameters: [{ name: 'uuid', in: 'path', required: true, schema: { type: 'string' } }],
            responses: { '200': { description: 'OK' } },
          },
        },
      },
    }
    const aligned = alignPathParams(result.document, backend)
    expect(Object.keys(aligned.paths)).toEqual(['/api/v1/comments/{uuid}'])
  })
})
