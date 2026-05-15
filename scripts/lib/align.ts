/**
 * Path-param alignment: for every frontend `(method, path)` that has the same
 * `(method, pattern)` on the backend side, rename frontend path params to use
 * backend's naming. Backend is canonical.
 *
 * "Same pattern" means: equal after replacing every `{xxx}` placeholder with
 * `*`. So `/x/{a}/y/{b}` matches backend `/x/{u}/y/{v}` even when names differ.
 */
import type { OpenApiDocument, HttpMethod, OpenApiOperation } from './generator.js'

interface BackendOperation {
  parameters?: Array<{
    name: string
    in: string
  }>
}

interface BackendDoc {
  paths?: Record<string, Record<string, BackendOperation>>
}

const PLACEHOLDER_RE = /\{([^}]+)\}/g

function patternKey(pathStr: string): string {
  return pathStr.replace(PLACEHOLDER_RE, '{*}')
}

function extractPlaceholders(pathStr: string): string[] {
  const out: string[] = []
  let m: RegExpExecArray | null
  PLACEHOLDER_RE.lastIndex = 0
  while ((m = PLACEHOLDER_RE.exec(pathStr)) !== null) {
    out.push(m[1])
  }
  return out
}

export function alignPathParams(frontend: OpenApiDocument, backendRaw: unknown): OpenApiDocument {
  const backend = (backendRaw ?? {}) as BackendDoc
  if (!backend.paths) return frontend

  // Build backend index: pattern → method → { path, params }
  const backendIndex = new Map<
    string,
    Record<string, { path: string; placeholders: string[]; params: BackendOperation['parameters'] }>
  >()
  for (const [bPath, bMethods] of Object.entries(backend.paths)) {
    const key = patternKey(bPath)
    const placeholders = extractPlaceholders(bPath)
    let bucket = backendIndex.get(key)
    if (!bucket) {
      bucket = {}
      backendIndex.set(key, bucket)
    }
    for (const [m, op] of Object.entries(bMethods)) {
      bucket[m.toLowerCase()] = {
        path: bPath,
        placeholders,
        params: op?.parameters,
      }
    }
  }

  const newPaths: OpenApiDocument['paths'] = {}

  for (const [fPath, fMethods] of Object.entries(frontend.paths)) {
    const fKey = patternKey(fPath)
    const fPlaceholders = extractPlaceholders(fPath)
    const bucket = backendIndex.get(fKey)

    for (const [methodLower, op] of Object.entries(fMethods)) {
      if (!op) continue
      const m = methodLower as HttpMethod
      const aligned = alignSingle(fPath, fPlaceholders, op, bucket?.[methodLower])
      newPaths[aligned.path] ??= {}
      newPaths[aligned.path][m] = aligned.operation
    }
  }

  return { ...frontend, paths: newPaths }
}

function alignSingle(
  fPath: string,
  fPlaceholders: string[],
  fOp: OpenApiOperation,
  bMatch:
    | {
        path: string
        placeholders: string[]
        params: BackendOperation['parameters']
      }
    | undefined,
): { path: string; operation: OpenApiOperation } {
  if (!bMatch || bMatch.placeholders.length !== fPlaceholders.length) {
    return { path: fPath, operation: fOp }
  }

  // Build positional rename map: ith placeholder in frontend → ith in backend.
  const rename = new Map<string, string>()
  for (let i = 0; i < fPlaceholders.length; i++) {
    if (fPlaceholders[i] !== bMatch.placeholders[i]) {
      rename.set(fPlaceholders[i], bMatch.placeholders[i])
    }
  }

  if (rename.size === 0) {
    return { path: fPath, operation: fOp }
  }

  // Rewrite path string
  const newPath = fPath.replace(PLACEHOLDER_RE, (_full, name: string) => {
    return `{${rename.get(name) ?? name}}`
  })

  // Rewrite parameters
  const newParams = (fOp.parameters ?? []).map((p) => {
    if (p.in === 'path' && rename.has(p.name)) {
      return { ...p, name: rename.get(p.name)! }
    }
    return p
  })

  return {
    path: newPath,
    operation: { ...fOp, parameters: newParams.length > 0 ? newParams : fOp.parameters },
  }
}
