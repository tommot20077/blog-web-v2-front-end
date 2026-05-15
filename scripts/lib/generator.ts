/**
 * Frontend OpenAPI generator core.
 *
 * Public API:
 * - generateFrontendOpenApi({ sourceDir, tsconfigPath? })
 * - generateFromSources({ files })  ← used by tests with in-memory files
 * - scanAntiPatterns({ baseDir, dirs })
 * - scanFileForAntiPatterns(filePath, content, baseDir?)
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import {
  Project,
  ScriptTarget,
  ModuleKind,
  Node,
  ts,
  type SourceFile,
  type CallExpression,
  type FunctionLikeDeclaration,
  type Type,
} from 'ts-morph'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type WarningCode =
  | 'unresolved-path'
  | 'response-type-inferred'
  | 'ambiguous-request'
  | 'multi-call-wrapper'
  | 'unresolvable-schema'
  | 'query-params-not-resolvable'

export interface GeneratorWarning {
  file: string
  line: number
  function: string
  code: WarningCode
  detail?: string
}

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete' | 'options' | 'head'

export interface OpenApiOperation {
  operationId?: string
  parameters?: Array<{
    name: string
    in: 'path' | 'query' | 'header' | 'cookie'
    required?: boolean
    schema?: Record<string, unknown>
  }>
  requestBody?: {
    required?: boolean
    content: Record<string, { schema: Record<string, unknown> }>
  }
  responses: Record<
    string,
    { description: string; content?: Record<string, { schema: Record<string, unknown> }> }
  >
  'x-source'?: { file: string; line: number; function: string }
}

export interface OpenApiDocument {
  openapi: '3.1.0'
  info: { title: string; version: string }
  paths: Record<string, Partial<Record<HttpMethod, OpenApiOperation>>>
  components: { schemas: Record<string, Record<string, unknown>> }
}

export interface GenerateResult {
  document: OpenApiDocument
  warnings: GeneratorWarning[]
  scannedFunctions: number
}

export interface InMemorySource {
  filePath: string
  content: string
}

const APICLIENT_METHODS: ReadonlySet<HttpMethod> = new Set([
  'get',
  'post',
  'put',
  'patch',
  'delete',
  'options',
  'head',
])

export function emptyDocument(): OpenApiDocument {
  return {
    openapi: '3.1.0',
    info: { title: 'frontend-openapi', version: '0.0.0' },
    paths: {},
    components: { schemas: {} },
  }
}

// ---------------------------------------------------------------------------
// Public entry points
// ---------------------------------------------------------------------------

export function generateFrontendOpenApi(opts: {
  sourceDir: string
  tsconfigPath?: string
}): GenerateResult {
  const project = createProject({ tsconfigPath: opts.tsconfigPath })
  for (const f of collectTsFiles(opts.sourceDir)) {
    project.addSourceFileAtPath(f)
  }
  return runGenerator(project)
}

export function generateFromSources(opts: { files: InMemorySource[] }): GenerateResult {
  const project = createProject({})
  for (const f of opts.files) {
    project.createSourceFile(f.filePath, f.content, { overwrite: true })
  }
  return runGenerator(project)
}

function createProject(opts: { tsconfigPath?: string }): Project {
  if (opts.tsconfigPath && fs.existsSync(opts.tsconfigPath)) {
    return new Project({
      tsConfigFilePath: opts.tsconfigPath,
      skipAddingFilesFromTsConfig: true,
    })
  }
  return new Project({
    skipFileDependencyResolution: false,
    compilerOptions: {
      target: ScriptTarget.ES2022,
      module: ModuleKind.ESNext,
      moduleResolution: 2 /* Node */,
      strict: true,
      strictNullChecks: true,
      esModuleInterop: true,
      skipLibCheck: true,
      allowJs: false,
      noEmit: true,
      jsx: 1 /* Preserve */,
    },
  })
}

function collectTsFiles(rootDir: string): string[] {
  const result: string[] = []
  if (!fs.existsSync(rootDir)) return result
  const stack: string[] = [rootDir]
  while (stack.length > 0) {
    const cur = stack.pop()!
    let entries
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      const full = path.join(cur, e.name)
      if (e.isDirectory()) {
        stack.push(full)
      } else if (
        e.isFile() &&
        full.endsWith('.ts') &&
        !full.endsWith('.test.ts') &&
        !full.endsWith('.d.ts')
      ) {
        result.push(full)
      }
    }
  }
  return result.sort()
}

// ---------------------------------------------------------------------------
// Generator driver
// ---------------------------------------------------------------------------

interface FunctionCandidate {
  name: string
  fn: FunctionLikeDeclaration
}

function runGenerator(project: Project): GenerateResult {
  const doc = emptyDocument()
  const warnings: GeneratorWarning[] = []
  let scanned = 0

  for (const sf of project.getSourceFiles()) {
    const fp = sf.getFilePath()
    if (fp.endsWith('.test.ts') || fp.endsWith('.d.ts')) continue

    for (const candidate of collectCandidateFunctions(sf)) {
      scanned += 1
      processFunction(candidate, sf, doc, warnings)
    }
  }
  return { document: doc, warnings, scannedFunctions: scanned }
}

function collectCandidateFunctions(sf: SourceFile): FunctionCandidate[] {
  const out: FunctionCandidate[] = []

  for (const fn of sf.getFunctions()) {
    const name = fn.getName() ?? '<anonymous>'
    out.push({ name, fn })
  }

  for (const v of sf.getVariableDeclarations()) {
    const init = v.getInitializer()
    if (!init) continue

    if (Node.isArrowFunction(init) || Node.isFunctionExpression(init)) {
      out.push({ name: v.getName(), fn: init })
      continue
    }

    if (Node.isObjectLiteralExpression(init)) {
      for (const prop of init.getProperties()) {
        if (Node.isMethodDeclaration(prop)) {
          out.push({ name: `${v.getName()}.${prop.getName()}`, fn: prop })
        } else if (Node.isPropertyAssignment(prop)) {
          const value = prop.getInitializer()
          if (value && (Node.isArrowFunction(value) || Node.isFunctionExpression(value))) {
            out.push({ name: `${v.getName()}.${prop.getName()}`, fn: value })
          }
        }
      }
    }
  }

  return out
}

function processFunction(
  candidate: FunctionCandidate,
  sf: SourceFile,
  doc: OpenApiDocument,
  warnings: GeneratorWarning[],
): void {
  const calls = collectApiClientCalls(candidate.fn)
  if (calls.length === 0) {
    return
  }

  const fileRel = relPath(sf.getFilePath())
  const startLine = candidate.fn.getStartLineNumber()

  if (calls.length > 1) {
    warnings.push({
      file: fileRel,
      line: startLine,
      function: candidate.name,
      code: 'multi-call-wrapper',
      detail: `found ${calls.length} apiClient calls; expected exactly 1`,
    })
    return
  }

  const call = calls[0]
  const method = getApiClientMethod(call)
  if (!method) return

  const args = call.getArguments()
  const pathArg = args[0]
  if (!pathArg) {
    warnings.push({
      file: fileRel,
      line: call.getStartLineNumber(),
      function: candidate.name,
      code: 'unresolved-path',
      detail: 'apiClient call missing url argument',
    })
    return
  }

  const pathResult = extractPath(pathArg, candidate.fn)
  if (!pathResult.ok) {
    warnings.push({
      file: fileRel,
      line: pathArg.getStartLineNumber(),
      function: candidate.name,
      code: 'unresolved-path',
      detail: pathResult.reason,
    })
    return
  }

  const op: OpenApiOperation = {
    operationId: candidate.name.replace(/[^A-Za-z0-9_]/g, '_'),
    responses: { '200': { description: 'OK' } },
    'x-source': { file: fileRel, line: startLine, function: candidate.name },
  }

  if (pathResult.pathParams.length > 0) {
    op.parameters = pathResult.pathParams.map((p) => ({
      name: p.name,
      in: 'path' as const,
      required: true,
      schema: tsTypeToSchema(p.type) ?? { type: 'string' },
    }))
  }

  const secondArg = args[1]
  if (secondArg) {
    const reqResult = extractRequest(secondArg, method)
    if (reqResult.kind === 'query') {
      for (const q of reqResult.params) {
        op.parameters ??= []
        op.parameters.push({ name: q.name, in: 'query', required: q.required, schema: q.schema })
      }
      if (reqResult.warning) {
        warnings.push({
          file: fileRel,
          line: secondArg.getStartLineNumber(),
          function: candidate.name,
          code: reqResult.warning.code,
          detail: reqResult.warning.detail,
        })
      }
    } else if (reqResult.kind === 'body') {
      op.requestBody = {
        required: true,
        content: { 'application/json': { schema: reqResult.schema } },
      }
    } else if (reqResult.kind === 'ambiguous') {
      warnings.push({
        file: fileRel,
        line: secondArg.getStartLineNumber(),
        function: candidate.name,
        code: 'ambiguous-request',
        detail: reqResult.reason,
      })
    }
  }

  const respResult = extractResponseSchema(candidate.fn, doc.components.schemas)
  if (respResult.warning) {
    warnings.push({
      file: fileRel,
      line: startLine,
      function: candidate.name,
      code: respResult.warning,
      detail: respResult.detail,
    })
  }
  if (respResult.schema) {
    op.responses['200'] = {
      description: 'OK',
      content: { 'application/json': { schema: respResult.schema } },
    }
  }

  doc.paths[pathResult.path] ??= {}
  doc.paths[pathResult.path][method] = op
}

// ---------------------------------------------------------------------------
// apiClient call detection
// ---------------------------------------------------------------------------

function collectApiClientCalls(fn: FunctionLikeDeclaration): CallExpression[] {
  const out: CallExpression[] = []
  const body = fn.getBody()
  if (!body) return out
  body.forEachDescendant((node) => {
    if (Node.isCallExpression(node)) {
      const expr = node.getExpression()
      if (Node.isPropertyAccessExpression(expr)) {
        const obj = expr.getExpression()
        const name = expr.getName()
        if (Node.isIdentifier(obj) && obj.getText() === 'apiClient' && APICLIENT_METHODS.has(name as HttpMethod)) {
          out.push(node)
        }
      }
    }
  })
  return out
}

function getApiClientMethod(call: CallExpression): HttpMethod | undefined {
  const expr = call.getExpression()
  if (!Node.isPropertyAccessExpression(expr)) return undefined
  const name = expr.getName()
  if (APICLIENT_METHODS.has(name as HttpMethod)) return name as HttpMethod
  return undefined
}

// ---------------------------------------------------------------------------
// Path extraction
// ---------------------------------------------------------------------------

interface PathParam {
  name: string
  type: Type | undefined
}

type PathResult =
  | { ok: true; path: string; pathParams: PathParam[] }
  | { ok: false; reason: string }

function extractPath(arg: Node, fn: FunctionLikeDeclaration): PathResult {
  if (Node.isStringLiteral(arg) || Node.isNoSubstitutionTemplateLiteral(arg)) {
    return { ok: true, path: arg.getLiteralText(), pathParams: [] }
  }

  if (Node.isTemplateExpression(arg)) {
    let out = arg.getHead().getLiteralText()
    const pathParams: PathParam[] = []

    const fnParamNames = new Set(
      fn
        .getParameters()
        .map((p) => p.getName())
        .filter(Boolean),
    )

    const spans = arg.getTemplateSpans()
    for (const span of spans) {
      const expr = span.getExpression()
      const tail = span.getLiteral().getLiteralText()
      if (!Node.isIdentifier(expr)) {
        return {
          ok: false,
          reason: `template literal contains non-identifier expression: ${expr.getText()}`,
        }
      }
      const ident = expr.getText()
      if (!fnParamNames.has(ident)) {
        return {
          ok: false,
          reason: `template identifier "${ident}" is not bound to a function parameter`,
        }
      }
      let paramType: Type | undefined
      try {
        paramType = expr.getType()
      } catch {
        paramType = undefined
      }
      pathParams.push({ name: ident, type: paramType })
      out += `{${ident}}` + tail
    }

    return { ok: true, path: out, pathParams }
  }

  return {
    ok: false,
    reason: `url argument is neither a string literal nor a simple template literal (kind=${arg.getKindName()})`,
  }
}

// ---------------------------------------------------------------------------
// Query / body extraction
// ---------------------------------------------------------------------------

type RequestResult =
  | { kind: 'none' }
  | {
      kind: 'query'
      params: Array<{ name: string; required: boolean; schema: Record<string, unknown> }>
      warning?: { code: WarningCode; detail: string }
    }
  | { kind: 'body'; schema: Record<string, unknown> }
  | { kind: 'ambiguous'; reason: string }

function extractRequest(arg: Node, method: HttpMethod): RequestResult {
  if (Node.isObjectLiteralExpression(arg)) {
    const properties = arg.getProperties()
    const paramsProp = properties.find(
      (p) =>
        (Node.isPropertyAssignment(p) || Node.isShorthandPropertyAssignment(p)) &&
        (p.getName() === 'params' || p.getName() === '"params"'),
    )

    if (paramsProp && Node.isPropertyAssignment(paramsProp)) {
      const paramsInit = paramsProp.getInitializer()
      if (paramsInit && Node.isObjectLiteralExpression(paramsInit)) {
        const queryParams: Array<{
          name: string
          required: boolean
          schema: Record<string, unknown>
        }> = []
        for (const qp of paramsInit.getProperties()) {
          if (Node.isPropertyAssignment(qp) || Node.isShorthandPropertyAssignment(qp)) {
            const name = qp.getName().replace(/^["']|["']$/g, '')
            const type = safeGetType(qp)
            queryParams.push({
              name,
              required: true,
              schema: tsTypeToSchema(type) ?? { type: 'string' },
            })
          }
        }
        return { kind: 'query', params: queryParams }
      }
      // `params` value is an identifier / variable (e.g. `{ params: someVar }`).
      if (paramsInit && Node.isIdentifier(paramsInit)) {
        return resolveIdentifierAsQueryParams(paramsInit, paramsProp)
      }
      // Other expressions (e.g. spread, call): try type inference.
      const paramsType = safeGetType(paramsProp)
      const inferred = inferQueryParamsFromType(paramsType)
      if (inferred && inferred.length > 0) return { kind: 'query', params: inferred }
      return {
        kind: 'query',
        params: [],
        warning: {
          code: 'query-params-not-resolvable',
          detail: `params value is not an object literal or resolvable identifier (kind=${paramsInit?.getKindName() ?? 'unknown'})`,
        },
      }
    }

    if (paramsProp && Node.isShorthandPropertyAssignment(paramsProp)) {
      // `{ params }` shorthand — value is the binding `params`. For shorthand
      // assignments, `getSymbol()` on the name returns the property itself
      // rather than the referenced variable, so we use
      // `getShorthandAssignmentValueSymbol` from the TypeChecker.
      const nameNode = paramsProp.getNameNode()
      const sf = paramsProp.getSourceFile()
      const checker = sf.getProject().getTypeChecker().compilerObject
      const valSym = checker.getShorthandAssignmentValueSymbol(paramsProp.compilerNode)
      const varDecl = findFirstVariableDeclarationFromSymbol(valSym, sf)
      return resolveIdentifierAsQueryParams(nameNode, paramsProp, varDecl)
    }

    if (method === 'get' || method === 'head' || method === 'options' || method === 'delete') {
      return {
        kind: 'ambiguous',
        reason: `${method.toUpperCase()} request has object second arg without \`params\``,
      }
    }
    const bodySchema = objectLiteralToSchema(arg)
    return { kind: 'body', schema: bodySchema }
  }

  // Non-object 2nd arg.
  if (method === 'get' || method === 'head' || method === 'options' || method === 'delete') {
    return {
      kind: 'ambiguous',
      reason: `${method.toUpperCase()} request has non-object second argument`,
    }
  }
  const t = safeGetType(arg)
  const schema = tsTypeToSchema(t) ?? {}
  return { kind: 'body', schema }
}

/**
 * Resolve a `params` identifier (from `{ params }` shorthand or `{ params: identVar }`)
 * to its declaration's keys, augmented with property-assignment writes
 * (`identVar.X = …` / `identVar['X'] = …`) inside the enclosing function.
 *
 * Priority:
 *   1. If declaration is a VariableDeclaration with an ObjectLiteralExpression
 *      initialiser → collect keys + union with assignment writes.
 *   2. Otherwise, fall back to type-based inference (e.g. for typed function
 *      parameters with named members).
 *   3. If neither yields anything → emit `query-params-not-resolvable` warning.
 */
function findFirstVariableDeclarationFromSymbol(
  sym: ts.Symbol | undefined,
  sf: SourceFile,
): Node | undefined {
  const decls = sym?.getDeclarations() ?? []
  for (const d of decls) {
    if (d.kind === ts.SyntaxKind.VariableDeclaration) {
      const wrapped = sf.getDescendantAtStartWithWidth(d.getStart(), d.getWidth())
      if (wrapped && Node.isVariableDeclaration(wrapped)) return wrapped
    }
  }
  return undefined
}

function resolveIdentifierAsQueryParams(
  identNode: Node,
  typeAnchor: Node,
  preResolvedDecl?: Node,
): RequestResult {
  if (!Node.isIdentifier(identNode)) {
    return {
      kind: 'query',
      params: [],
      warning: {
        code: 'query-params-not-resolvable',
        detail: `expected identifier for params binding, got ${identNode.getKindName()}`,
      },
    }
  }

  // Find the declaration: use pre-resolved (for shorthand) or via symbol.
  let varDecl: Node | undefined = preResolvedDecl
  if (!varDecl) {
    const sym = identNode.getSymbol()
    const decls = sym?.getDeclarations() ?? []
    for (const d of decls) {
      if (Node.isVariableDeclaration(d)) {
        varDecl = d
        break
      }
    }
  }

  if (varDecl && Node.isVariableDeclaration(varDecl)) {
    const init = varDecl.getInitializer()
    if (init && Node.isObjectLiteralExpression(init)) {
      // 1. Initial keys.
      const keys = new Map<
        string,
        { required: boolean; schema: Record<string, unknown> }
      >()
      for (const qp of init.getProperties()) {
        if (Node.isPropertyAssignment(qp) || Node.isShorthandPropertyAssignment(qp)) {
          const name = qp.getName().replace(/^["']|["']$/g, '')
          const t = safeGetType(qp)
          keys.set(name, {
            required: true,
            schema: tsTypeToSchema(t) ?? { type: 'string' },
          })
        }
      }
      // 2. Walk enclosing function for `<ident>.X = …` or `<ident>['X'] = …` writes.
      const enclosingFn = identNode.getFirstAncestor(
        (a) =>
          Node.isFunctionDeclaration(a) ||
          Node.isArrowFunction(a) ||
          Node.isFunctionExpression(a) ||
          Node.isMethodDeclaration(a),
      )
      const identName = identNode.getText()
      const scope = enclosingFn ?? varDecl.getSourceFile()
      const body =
        enclosingFn && Node.isFunctionLikeDeclaration(enclosingFn)
          ? enclosingFn.getBody() ?? scope
          : scope
      body.forEachDescendant((node) => {
        if (Node.isBinaryExpression(node)) {
          const op = node.getOperatorToken().getText()
          if (op !== '=') return
          const left = node.getLeft()
          if (Node.isPropertyAccessExpression(left)) {
            const obj = left.getExpression()
            if (Node.isIdentifier(obj) && obj.getText() === identName) {
              const propName = left.getName()
              if (!keys.has(propName)) {
                const t = safeGetType(node.getRight())
                keys.set(propName, {
                  required: false,
                  schema: tsTypeToSchema(t) ?? { type: 'string' },
                })
              }
            }
          } else if (Node.isElementAccessExpression(left)) {
            const obj = left.getExpression()
            const argExpr = left.getArgumentExpression()
            if (
              Node.isIdentifier(obj) &&
              obj.getText() === identName &&
              argExpr &&
              (Node.isStringLiteral(argExpr) || Node.isNoSubstitutionTemplateLiteral(argExpr))
            ) {
              const propName = argExpr.getLiteralText()
              if (!keys.has(propName)) {
                const t = safeGetType(node.getRight())
                keys.set(propName, {
                  required: false,
                  schema: tsTypeToSchema(t) ?? { type: 'string' },
                })
              }
            }
          }
        }
      })
      const params = Array.from(keys.entries()).map(([name, v]) => ({
        name,
        required: v.required,
        schema: v.schema,
      }))
      return { kind: 'query', params }
    }
  }

  // Fallback: type-based inference. Useful for `function f(params: SearchParams)`
  // where the parameter is typed but has no variable initialiser.
  const paramsType = safeGetType(typeAnchor)
  const inferred = inferQueryParamsFromType(paramsType)
  if (inferred && inferred.length > 0) return { kind: 'query', params: inferred }

  return {
    kind: 'query',
    params: [],
    warning: {
      code: 'query-params-not-resolvable',
      detail: `params identifier "${identNode.getText()}" could not be resolved to an object literal or typed interface`,
    },
  }
}

function inferQueryParamsFromType(
  type: Type | undefined,
): Array<{ name: string; required: boolean; schema: Record<string, unknown> }> | undefined {
  if (!type) return undefined
  // Unwrap union (drop null/undefined)
  let t: Type = type
  if (t.isUnion()) {
    const nonNull = t.getUnionTypes().filter((u) => !u.isNull() && !u.isUndefined())
    if (nonNull.length === 1) t = nonNull[0]
    else if (nonNull.length === 0) return []
  }
  if (!(t.isObject() || t.isInterface())) return undefined
  const out: Array<{ name: string; required: boolean; schema: Record<string, unknown> }> = []
  for (const prop of t.getProperties()) {
    const propName = prop.getName()
    const decl = prop.getDeclarations()[0]
    const propType = decl ? prop.getTypeAtLocation(decl) : undefined
    out.push({
      name: propName,
      required: !prop.isOptional(),
      schema: tsTypeToSchema(propType) ?? { type: 'string' },
    })
  }
  return out
}

function objectLiteralToSchema(obj: Node): Record<string, unknown> {
  if (!Node.isObjectLiteralExpression(obj)) return {}
  const properties: Record<string, unknown> = {}
  const required: string[] = []
  for (const p of obj.getProperties()) {
    let name: string | undefined
    let t: Type | undefined
    if (Node.isPropertyAssignment(p) || Node.isShorthandPropertyAssignment(p)) {
      name = p.getName().replace(/^["']|["']$/g, '')
      t = safeGetType(p)
    }
    if (!name) continue
    properties[name] = tsTypeToSchema(t) ?? {}
    required.push(name)
  }
  const result: Record<string, unknown> = { type: 'object', properties }
  if (required.length > 0) result.required = required
  return result
}

// ---------------------------------------------------------------------------
// Response schema
// ---------------------------------------------------------------------------

interface ResponseSchemaResult {
  schema?: Record<string, unknown>
  warning?: WarningCode
  detail?: string
}

function extractResponseSchema(
  fn: FunctionLikeDeclaration,
  schemas: Record<string, Record<string, unknown>>,
): ResponseSchemaResult {
  const returnTypeNode = fn.getReturnTypeNode()
  let warning: WarningCode | undefined
  let detail: string | undefined

  let unwrapped: Type | undefined
  if (returnTypeNode) {
    const t = fn.getReturnType()
    unwrapped = unwrapPromise(t)
    // If the explicit return references an undeclared type, ts-morph yields
    // `any` (or the alias name resolves to itself). Detect that and warn.
    if (unwrapped && unwrapped.isAny()) {
      warning = 'unresolvable-schema'
      detail = `Promise type argument resolved to any: ${returnTypeNode.getText()}`
    }
  } else {
    warning = 'response-type-inferred'
    detail = 'function has no explicit return type'
    try {
      const t = fn.getReturnType()
      unwrapped = unwrapPromise(t)
    } catch {
      unwrapped = undefined
    }
  }

  if (!unwrapped) {
    return {
      warning: warning ?? 'unresolvable-schema',
      detail: detail ?? 'could not resolve response type',
      schema: {},
    }
  }

  if (unwrapped.isVoid() || unwrapped.isUndefined() || unwrapped.isNull()) {
    return { schema: { type: 'null' }, warning, detail }
  }

  const schema = tsTypeToSchema(unwrapped, schemas)
  if (!schema || Object.keys(schema).length === 0) {
    return {
      schema: {},
      warning: warning ?? 'unresolvable-schema',
      detail: detail ?? `unresolvable response type ${unwrapped.getText()}`,
    }
  }
  return { schema, warning, detail }
}

function unwrapPromise(t: Type | undefined): Type | undefined {
  if (!t) return undefined
  const sym = t.getSymbol() ?? t.getAliasSymbol()
  if (sym && sym.getName() === 'Promise') {
    const args = t.getTypeArguments()
    if (args.length > 0) return args[0]
  }
  return t
}

// ---------------------------------------------------------------------------
// TS Type → JSON schema (lightweight)
// ---------------------------------------------------------------------------

function safeGetType(node: Node): Type | undefined {
  try {
    return node.getType()
  } catch {
    return undefined
  }
}

function tsTypeToSchema(
  type: Type | undefined,
  schemas?: Record<string, Record<string, unknown>>,
  seen: Set<string> = new Set(),
): Record<string, unknown> | undefined {
  if (!type) return undefined
  type = unwrapPromise(type) ?? type

  if (type.isString() || type.isStringLiteral()) return { type: 'string' }
  if (type.isNumber() || type.isNumberLiteral()) return { type: 'number' }
  if (type.isBoolean() || type.isBooleanLiteral()) return { type: 'boolean' }
  if (type.isNull()) return { type: 'null' }
  if (type.isUndefined() || type.isVoid()) return { type: 'null' }
  if (type.isAny() || type.isUnknown()) return {}

  if (type.isUnion()) {
    const parts = type.getUnionTypes()
    const hasNull = parts.some((p) => p.isNull() || p.isUndefined())
    const nonNull = parts.filter((p) => !p.isNull() && !p.isUndefined())
    if (nonNull.length === 0) return { type: 'null' }
    if (nonNull.length === 1) {
      const inner = tsTypeToSchema(nonNull[0], schemas, seen) ?? {}
      if (hasNull) {
        // OpenAPI 3.1 prefers union via type array, but `nullable: true` is widely understood.
        return { ...inner, nullable: true }
      }
      return inner
    }
    return {
      anyOf: nonNull
        .map((p) => tsTypeToSchema(p, schemas, seen))
        .filter((s): s is Record<string, unknown> => !!s),
      ...(hasNull ? { nullable: true } : {}),
    }
  }

  if (type.isArray()) {
    const elem = type.getArrayElementType()
    return { type: 'array', items: tsTypeToSchema(elem, schemas, seen) ?? {} }
  }

  if (type.isTuple()) {
    const elems = type.getTupleElements()
    return {
      type: 'array',
      items: { anyOf: elems.map((e) => tsTypeToSchema(e, schemas, seen) ?? {}) },
    }
  }

  if (type.isObject() || type.isInterface() || type.isClassOrInterface()) {
    const aliasSym = type.getAliasSymbol()
    const sym = type.getSymbol() ?? aliasSym
    const name = sym?.getName()
    if (schemas && name && !isBuiltinName(name) && !isAnonName(name)) {
      if (seen.has(name)) return { $ref: `#/components/schemas/${name}` }
      seen.add(name)
      if (!(name in schemas)) {
        schemas[name] = { type: 'object' } // placeholder to break cycles
        schemas[name] = expandObjectType(type, schemas, seen)
      }
      return { $ref: `#/components/schemas/${name}` }
    }
    return expandObjectType(type, schemas, seen)
  }

  return {}
}

function isAnonName(name: string): boolean {
  return name === '__type' || name === '__object' || name === '' || name === 'Anonymous'
}

function isBuiltinName(name: string): boolean {
  return [
    'Date',
    'RegExp',
    'Function',
    'Promise',
    'Error',
    'Map',
    'Set',
    'WeakMap',
    'WeakSet',
    'Array',
  ].includes(name)
}

function expandObjectType(
  type: Type,
  schemas: Record<string, Record<string, unknown>> | undefined,
  seen: Set<string>,
): Record<string, unknown> {
  const properties: Record<string, unknown> = {}
  const required: string[] = []
  for (const prop of type.getProperties()) {
    const propName = prop.getName()
    const decl = prop.getDeclarations()[0]
    const propType = decl ? prop.getTypeAtLocation(decl) : undefined
    const isOptional = prop.isOptional()
    properties[propName] = tsTypeToSchema(propType, schemas, seen) ?? {}
    if (!isOptional) required.push(propName)
  }
  const result: Record<string, unknown> = { type: 'object', properties }
  if (required.length > 0) result.required = required
  return result
}

// ---------------------------------------------------------------------------
// Anti-pattern inventory
// ---------------------------------------------------------------------------

export interface AntiPatternEntry {
  file: string
  line: number
  method: string
  urlSnippet: string
  category:
    | 'component-direct'
    | 'composable-direct'
    | 'store-direct'
    | 'e2e-direct'
    | 'direct-axios'
    | 'other-direct'
}

export function scanAntiPatterns(opts: { baseDir: string; dirs: string[] }): AntiPatternEntry[] {
  const out: AntiPatternEntry[] = []
  for (const rel of opts.dirs) {
    const dir = path.isAbsolute(rel) ? rel : path.join(opts.baseDir, rel)
    if (!fs.existsSync(dir)) continue
    walk(dir, (file) => {
      if (/\.(ts|vue|js|tsx|mjs|cjs)$/.test(file)) {
        const content = fs.readFileSync(file, 'utf8')
        const found = scanFileForAntiPatterns(file, content, opts.baseDir)
        out.push(...found)
      }
    })
  }
  return out
}

function walk(dir: string, fn: (file: string) => void): void {
  const stack = [dir]
  while (stack.length > 0) {
    const cur = stack.pop()!
    let entries
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true })
    } catch {
      continue
    }
    for (const e of entries) {
      const full = path.join(cur, e.name)
      if (e.isDirectory()) stack.push(full)
      else if (e.isFile()) fn(full)
    }
  }
}

export function scanFileForAntiPatterns(
  filePath: string,
  content: string,
  baseDir?: string,
): AntiPatternEntry[] {
  const out: AntiPatternEntry[] = []
  const lines = content.split(/\r?\n/)

  // For .vue files, only consider <script> blocks (template/style can contain examples).
  let scanRanges: Array<{ start: number; end: number }> = []
  if (filePath.endsWith('.vue')) {
    const re = /<script[^>]*>([\s\S]*?)<\/script>/g
    let m: RegExpExecArray | null
    while ((m = re.exec(content)) !== null) {
      const start = content.slice(0, m.index).split(/\r?\n/).length
      const end = start + m[1].split(/\r?\n/).length
      scanRanges.push({ start, end })
    }
  } else {
    scanRanges = [{ start: 1, end: lines.length + 1 }]
  }

  const re = /\b(apiClient|axios)\s*\.\s*(get|post|put|patch|delete|options|head|request)\s*\(([^)]*)/g

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1
    const inRange = scanRanges.some((r) => lineNo >= r.start && lineNo < r.end)
    if (!inRange) continue
    const line = lines[i]
    re.lastIndex = 0
    let m: RegExpExecArray | null
    while ((m = re.exec(line)) !== null) {
      const callee = m[1]
      const method = m[2]
      const snippet = m[3].trim().slice(0, 120)
      out.push({
        file: relPathFrom(baseDir, filePath),
        line: lineNo,
        method,
        urlSnippet: snippet,
        category: categorise(filePath, callee),
      })
    }
  }
  return out
}

function categorise(filePath: string, callee: string): AntiPatternEntry['category'] {
  const norm = filePath.replace(/\\/g, '/')
  if (callee === 'axios') {
    if (/(^|\/)e2e\//.test(norm)) return 'e2e-direct'
    return 'direct-axios'
  }
  if (/\/src\/components\//.test(norm) || norm.endsWith('.vue')) return 'component-direct'
  if (/\/src\/composables\//.test(norm)) return 'composable-direct'
  if (/\/src\/stores\//.test(norm)) return 'store-direct'
  if (/(^|\/)e2e\//.test(norm)) return 'e2e-direct'
  return 'other-direct'
}

function relPath(p: string): string {
  return p.replace(/\\/g, '/')
}

function relPathFrom(baseDir: string | undefined, full: string): string {
  if (!baseDir) return relPath(full)
  try {
    const rel = path.relative(baseDir, full)
    return rel.split(path.sep).join('/')
  } catch {
    return relPath(full)
  }
}
