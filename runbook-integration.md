# Integration Runbook

Step-by-step guide to run the full frontend + real backend stack locally.

**Assumption**: K3s infra is already running with Postgres, Redis, MinIO, and other services on NodePorts 30120–30131.

---

## 1. Start the backend

```bash
# From the blog-web-v2 backend repo
./mvnw -pl blog-start spring-boot:run \
  -Dspring-boot.run.arguments="
    --spring.datasource.url=jdbc:postgresql://localhost:30120/blog_v2_db
    --spring.datasource.username=luca
    --spring.datasource.password=<DB_PASSWORD>
    --spring.data.redis.host=localhost
    --spring.data.redis.port=30121
    --minio.endpoint=http://localhost:30122
    --minio.access-key=<MINIO_KEY>
    --minio.secret-key=<MINIO_SECRET>
  "
```

## 2. Verify the backend is up

```bash
curl http://localhost:8080/actuator/health
# Expected: {"status":"UP"}

curl http://localhost:8080/v3/api-docs | jq '.info'
# Expected: title "Blog V2 API", 48 operations
```

## 3. Seed three test users

```bash
cd <frontend-repo>
bash scripts/seed-dev-users.sh
```

This registers `reader@test.local`, `author@test.local`, `admin@test.local` with password `Test1234!` and promotes them to the correct roles via `kubectl exec`.

## 4. Start the frontend

```bash
cd <frontend-repo>
npm run dev
# Opens http://localhost:5500 pointing at http://localhost:8080
```

Verify in the browser DevTools Network tab:
- `GET /api/v1/articles?page=1&size=6` (not `pageNum`)
- `GET /api/admin/articles/pending` (no `/v1/` prefix)

## 5. Run E2E tests against real backend

```bash
npm run test:e2e
# Starts Vite on port 5501 with VITE_USE_MOCK=false
# Runs global-setup.ts (health-check + re-seed users)
# Then runs all Playwright specs
```

For quick UI-only checks with mock data:

```bash
npm run test:e2e:mock
# E2E_MOCK=1: skips global-setup, VITE_USE_MOCK=true
```

## 6. Run unit + route tests

```bash
npm run test
# 90 test files, 752 tests (all vitest)
# Coverage: branches/functions/lines ≥ 75%, statements ≥ 70%
```

## 7. Teardown

Stop the Vite dev server (`Ctrl+C`) and the Spring Boot process (`Ctrl+C`). The K3s infra keeps running unless you manually scale it down.

---

## Manual smoke test checklist

After `npm run dev`:

- [ ] Register a new user → redirected to `/login`, success toast
- [ ] Login as `author@test.local` / `Test1234!` → navbar shows greeting
- [ ] Browse `/articles` → articles load with pagination
- [ ] Click an article → detail page loads with rendered Markdown
- [ ] Go to `/editor` → create a draft, save → URL changes to `/editor/{uuid}`
- [ ] Submit for review → toast "已送出審核"
- [ ] Login as `admin@test.local` → go to `/admin/review` → pending article visible
- [ ] Publish the article → article appears at `/articles`
- [ ] Logout → navbar back to "登入 / 註冊"

---

## Known limitations / deferred items

- `GET /api/v1/articles/{uuid}/edit` does not exist on backend; frontend calls `GET /api/v1/articles/{uuid}` instead (§2.8 workaround).
- Backend `/api/v1/admin/*` paths are `/api/admin/*` (no `v1`); frontend adjusted in §2.1.
- `website` / `socialLinks` profile fields removed from frontend (§2.5A); backend still accepts them — follow-up when UI is re-added.
- Token-dependent E2E tests (`auth-verify-email.spec.ts`, `auth-reset-password.spec.ts`) run only in mock mode (`npm run test:e2e:mock`).
