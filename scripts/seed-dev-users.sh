#!/usr/bin/env bash
# Seed E2E test users into the local dev backend.
# Run this once after `npm run dev` is pointed at a real backend.
# Idempotent — re-running is safe (duplicate register returns 409, which is ignored).

set -euo pipefail

BACKEND="${VITE_API_BASE_URL:-http://localhost:8080}"
PASSWORD="Test1234!"

register() {
  local email="$1" username="$2" nickname="$3"
  local status
  status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "${BACKEND}/api/v1/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"${email}\",\"username\":\"${username}\",\"nickname\":\"${nickname}\",\"password\":\"${PASSWORD}\"}")
  if [ "$status" = "200" ] || [ "$status" = "201" ] || [ "$status" = "409" ]; then
    echo "  register ${email} → ${status}"
  else
    echo "  register ${email} → ${status} (unexpected)" >&2
  fi
}

promote() {
  local email="$1" role="$2"
  kubectl exec -n infra-dev deploy/postgres -- \
    psql -U luca -d blog_v2_db -c \
    "UPDATE users SET email_verified=true, role='${role}' WHERE email='${email}'" \
    2>/dev/null && echo "  promoted ${email} → ${role}" \
    || echo "  (kubectl unavailable — promote ${email} manually)" >&2
}

echo "Seeding E2E test users against ${BACKEND}..."

register "reader@test.local" "reader_e2e" "Reader"
promote  "reader@test.local" "USER"

register "author@test.local" "author_e2e" "Author"
promote  "author@test.local" "AUTHOR"

register "admin@test.local" "admin_e2e" "Admin"
promote  "admin@test.local" "ADMIN"

echo "Done. Credentials: password=${PASSWORD}"
