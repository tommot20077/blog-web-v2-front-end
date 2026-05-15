#!/usr/bin/env tsx
/**
 * generate-frontend-openapi
 *
 * Reverse-engineers an OpenAPI 3.1 document from the frontend's `src/api/real/`
 * (or any other) service modules using ts-morph, plus an anti-pattern
 * inventory across directories that should NOT call apiClient/axios directly.
 *
 * See docs/plans/2026-05-15-api-contract-realignment-design.md.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseArgs } from 'node:util'

import { generateFrontendOpenApi, scanAntiPatterns } from './lib/generator.js'
import { alignPathParams } from './lib/align.js'

interface CliArgs {
  source?: string
  out?: string
  warnings?: string
  alignWith?: string
  antiPatternOut?: string
  antiPatternDirs?: string
  tsconfig?: string
}

function parseCli(argv: string[]): CliArgs {
  const { values } = parseArgs({
    args: argv,
    options: {
      source: { type: 'string' },
      out: { type: 'string' },
      warnings: { type: 'string' },
      'align-with': { type: 'string' },
      'anti-pattern-out': { type: 'string' },
      'anti-pattern-dirs': { type: 'string' },
      tsconfig: { type: 'string' },
    },
    strict: false,
    allowPositionals: true,
  })
  return {
    source: values.source as string | undefined,
    out: values.out as string | undefined,
    warnings: values.warnings as string | undefined,
    alignWith: values['align-with'] as string | undefined,
    antiPatternOut: values['anti-pattern-out'] as string | undefined,
    antiPatternDirs: values['anti-pattern-dirs'] as string | undefined,
    tsconfig: values.tsconfig as string | undefined,
  }
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath)
  if (dir && !fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

function writeJson(filePath: string, value: unknown): void {
  ensureDir(filePath)
  fs.writeFileSync(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8')
}

async function main(): Promise<void> {
  const args = parseCli(process.argv.slice(2))

  if (!args.source) {
    // Scaffold mode: emit empty OpenAPI 3.1 skeleton when --out is given.
    const skeleton = {
      openapi: '3.1.0',
      info: { title: 'frontend-openapi (empty)', version: '0.0.0' },
      paths: {},
      components: { schemas: {} },
    }
    if (args.out) {
      writeJson(args.out, skeleton)
      console.log(`Wrote empty skeleton to ${args.out}`)
    } else {
      process.stdout.write(JSON.stringify(skeleton, null, 2) + '\n')
    }
    return
  }

  const result = generateFrontendOpenApi({
    sourceDir: args.source,
    tsconfigPath: args.tsconfig,
  })

  let document = result.document
  if (args.alignWith) {
    const backendRaw = fs.readFileSync(args.alignWith, 'utf8')
    const backend = JSON.parse(backendRaw)
    document = alignPathParams(document, backend)
  }

  if (args.out) {
    writeJson(args.out, document)
    console.log(`Wrote OpenAPI document to ${args.out}`)
  }

  if (args.warnings) {
    writeJson(args.warnings, result.warnings)
    console.log(`Wrote warnings to ${args.warnings}`)
  }

  if (args.antiPatternOut) {
    const dirs = (args.antiPatternDirs ?? 'e2e,src/components,src/composables,src/stores')
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0)
    const inventory = scanAntiPatterns({
      baseDir: process.cwd(),
      dirs,
    })
    writeJson(args.antiPatternOut, inventory)
    console.log(`Wrote anti-pattern inventory to ${args.antiPatternOut} (entries=${inventory.length})`)
  }

  // Summary stats
  const operationCount = Object.values(document.paths).reduce(
    (acc, methods) => acc + Object.keys(methods ?? {}).length,
    0,
  )
  const warningByCode: Record<string, number> = {}
  for (const w of result.warnings) {
    warningByCode[w.code] = (warningByCode[w.code] ?? 0) + 1
  }
  const ratio =
    result.scannedFunctions === 0 ? 0 : result.warnings.length / result.scannedFunctions
  console.log('--- generator summary ---')
  console.log(`source:             ${args.source}`)
  console.log(`scanned functions:  ${result.scannedFunctions}`)
  console.log(`operations emitted: ${operationCount}`)
  console.log(`warnings total:     ${result.warnings.length}`)
  console.log(`warnings by code:   ${JSON.stringify(warningByCode)}`)
  console.log(`warning ratio:      ${(ratio * 100).toFixed(1)}%`)
}

// Top-level entrypoint (when invoked via tsx).
main().catch((err) => {
  console.error(err)
  process.exit(1)
})
