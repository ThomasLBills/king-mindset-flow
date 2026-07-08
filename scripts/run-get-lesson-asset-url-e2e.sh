#!/usr/bin/env bash
# Runs the get-lesson-asset-url edge-function E2E tests only when the
# service-role key is available. In Lovable Cloud sandboxes and any CI job
# where SUPABASE_SERVICE_ROLE_KEY is not injected, the script exits 0 with a
# clear "SKIPPED" message so pipelines stay green without silently missing
# coverage.
#
# Usage:
#   ./scripts/run-get-lesson-asset-url-e2e.sh
#
# Env:
#   SUPABASE_SERVICE_ROLE_KEY  (required to run the authenticated tier)
#   SUPABASE_URL / VITE_SUPABASE_URL
#   SUPABASE_ANON_KEY / VITE_SUPABASE_PUBLISHABLE_KEY
#
# Exit codes:
#   0  passed OR intentionally skipped
#   1  test failure
#   2  misconfiguration (partial env: service key present but URL/anon missing)

set -u -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"
cd "${PROJECT_ROOT}"

FN_NAME="get-lesson-asset-url"
TEST_FILE="supabase/functions/${FN_NAME}/index.test.ts"
LABEL="[${FN_NAME} E2E]"

if [[ ! -f "${TEST_FILE}" ]]; then
  echo "${LABEL} FAILED — test file not found: ${TEST_FILE}"
  exit 1
fi

# Load .env for URL/anon fallbacks without leaking values into logs.
if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

URL_VAL="${SUPABASE_URL:-${VITE_SUPABASE_URL:-}}"
ANON_VAL="${SUPABASE_ANON_KEY:-${VITE_SUPABASE_PUBLISHABLE_KEY:-}}"
SVC_VAL="${SUPABASE_SERVICE_ROLE_KEY:-}"

if [[ -z "${SVC_VAL}" ]]; then
  echo "${LABEL} SKIPPED — SUPABASE_SERVICE_ROLE_KEY not set."
  echo "${LABEL}   The authenticated E2E tier (authorized download, draft 403,"
  echo "${LABEL}   rate-limit 429, TTL expiry) requires a service-role key that"
  echo "${LABEL}   is not exposed in Lovable Cloud sandboxes."
  echo "${LABEL}   Provide SUPABASE_SERVICE_ROLE_KEY in CI to enable these tests."
  exit 0
fi

if [[ -z "${URL_VAL}" || -z "${ANON_VAL}" ]]; then
  echo "${LABEL} MISCONFIGURED — SUPABASE_SERVICE_ROLE_KEY is set but"
  echo "${LABEL}   SUPABASE_URL / SUPABASE_ANON_KEY (or their VITE_ equivalents)"
  echo "${LABEL}   are missing. Refusing to run a partial test suite."
  exit 2
fi

if ! command -v deno >/dev/null 2>&1; then
  echo "${LABEL} FAILED — 'deno' not found on PATH. Install Deno to run edge-function tests."
  exit 1
fi

echo "${LABEL} RUNNING — service-role key detected, executing full test tier."

# --allow-net for HTTP to the deployed function + Supabase; --allow-env for
# credential lookup; --allow-read so the dotenv loader can find .env.
if deno test \
    --allow-net \
    --allow-env \
    --allow-read \
    --no-check \
    "${TEST_FILE}"; then
  echo "${LABEL} PASSED"
  exit 0
else
  status=$?
  echo "${LABEL} FAILED — deno test exit ${status}"
  exit 1
fi