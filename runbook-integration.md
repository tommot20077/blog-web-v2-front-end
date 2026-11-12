# Integration Runbook

Step-by-step guide to run the full frontend + real backend stack locally.

**Assumption**: K3s infra is already running with Postgres, Redis, MinIO, and other services on NodePorts 30120–30131.

---

## 1. Start the backend

```bash
# From the blog-web-v2 backend repo
./mvnw -pl blog-start spring-boot:run -Dspring-boot.run.profiles=dev
```

Uses `application-dev.yaml` — all infra endpoints and credentials are pre-configured.
Backend listens on **port 9010**.

## 2. Verify the backend is up

```bash
# 新後端（actuator 已搬到 management port）：主 port 只提供 /readyz；舊後端：/actuator/health
curl -f http://localhost:9010/readyz || curl -f http://localhost:9010/actuator/health
# Expected: {"status":"UP"}

curl http://localhost:9010/v3/api-docs | jq '.info'
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
- `GET /api/v1/admin/articles/pending?page=1&size=1`; pending count comes from the paged response `total`

## 5. Run E2E tests against real backend

```bash
npm run test:e2e
# Starts Vite on port 5500 with VITE_USE_MOCK=false
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

## 8. 重新抓取 OpenAPI 快照（`api-reference/openapi.json`）

後端 SEC-21（2026-11-04）起，正式環境預設關閉 springdoc，只有 dev／demo profile 或環境變數 `SPRINGDOC_ENABLED=true` 才會提供 `/v3/api-docs`。**不要從正式站抓快照。**

做法與 CI 的 e2e-integration 相同（`docker-compose.e2e.yml` 已設 `SPRINGDOC_ENABLED: "true"`）：

```bash
# 後端 repo：打包 jar 並建 image
mvn -q package -DskipTests -pl blog-start -am
docker build -t blog-backend:e2e .

# 前端 repo：起堆疊、等後端健康、抓快照（格式：2 空白縮排、保留中文）
docker compose -f docker-compose.e2e.yml -p openapi-snap up -d
# 新後端只有 /readyz，舊後端只有 /actuator/health：任一成功即視為健康
until curl -sf http://localhost:9010/readyz > /dev/null || curl -sf http://localhost:9010/actuator/health > /dev/null; do sleep 5; done
curl -s http://localhost:9010/v3/api-docs \
  | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin), ensure_ascii=False, indent=2))" \
  > api-reference/openapi.json
docker compose -f docker-compose.e2e.yml -p openapi-snap down -v
```

- 後端啟動後若因 Elasticsearch 逾時而退出（本機負載高時偶發），`docker compose -p openapi-snap start backend` 再起一次即可。
- 快照只能整份重抓，不手改內容（`ai-docs/maintenance.md` §4）。抓完照 §2 比對受影響的 service 與型別。

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
- Admin paths use `/api/v1/admin/*`; pending count is derived from the pending articles page `total`.
- `website` / `socialLinks` profile fields removed from frontend (§2.5A); backend still accepts them — follow-up when UI is re-added.
- Token-dependent E2E tests (`auth-verify-email.spec.ts`, `auth-reset-password.spec.ts`) run only in mock mode (`npm run test:e2e:mock`).
