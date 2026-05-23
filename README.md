# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).

## Verification

Full-stack red Playwright:

```bash
mkdir -p logs
E2E_FULLSTACK_RED=1 playwright test e2e/fullstack-red 2>&1 | tee logs/fullstack-red-all.log
```

Frontend OpenAPI generator tests:

```bash
mkdir -p logs
npx vitest run -c scripts/vitest.config.ts scripts/generate-frontend-openapi.test.ts 2>&1 | tee logs/generator-contract.log
```
