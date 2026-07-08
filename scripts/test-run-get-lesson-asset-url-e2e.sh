#!/usr/bin/env bash
# Meta-test for scripts/run-get-lesson-asset-url-e2e.sh.
#
# Asserts the runner reports each documented state with the correct exit code
# and a human-readable label. This is a fast, hermetic bash test — it does NOT
# hit the network or invoke Deno; it exercises the runner's env-gating logic
# only.
#
# States covered:
#   1. SKIPPED   — no service-role key            → exit 0
#   2. MISCONFIGURED — service-role key set but URL/anon missing → exit 2
#   3. FAILED    — fully configured, no `deno` on PATH → exit 1
#
# Usage:
#   ./scripts/test-run-get-lesson-asset-url-e2e.sh

set -u -o pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUNNER="${SCRIPT_DIR}/run-get-lesson-asset-url-e2e.sh"
LABEL="[runner-meta-test]"

if [[ ! -x "${RUNNER}" ]]; then
  echo "${LABEL} FAIL — runner not found or not executable: ${RUNNER}"
  exit 1
fi

FAILURES=0
PASSES=0

# Run the runner with a scrubbed env so tests are independent of the ambient
# shell (which may already have SUPABASE_URL / anon exported via .env).
#
# `env -i` clears the environment; we re-inject only what each scenario needs.
# HOME/PATH are forwarded so bash + coreutils still resolve. The runner also
# `source`s .env if present in CWD, so we run from a scratch temp dir to
# guarantee no .env leaks in.
run_scenario() {
  local scratch
  scratch="$(mktemp -d)"
  ( cd "${scratch}" && env -i HOME="${HOME}" PATH="$1" "${@:2}" bash "${RUNNER}" )
  local rc=$?
  rm -rf "${scratch}"
  return ${rc}
}

assert_exit_and_label() {
  local name="$1"        # scenario name
  local expected_rc="$2" # expected exit code
  local expected_pat="$3" # regex that must appear in output
  local rc="$4"
  local out="$5"

  local ok=1
  if [[ "${rc}" != "${expected_rc}" ]]; then
    echo "${LABEL} FAIL ${name} — exit ${rc}, expected ${expected_rc}"
    ok=0
  fi
  if ! grep -Eq "${expected_pat}" <<<"${out}"; then
    echo "${LABEL} FAIL ${name} — output missing pattern: ${expected_pat}"
    echo "----- output -----"
    echo "${out}"
    echo "------------------"
    ok=0
  fi
  if [[ ${ok} -eq 1 ]]; then
    echo "${LABEL} PASS ${name} — exit ${rc}, matched \"${expected_pat}\""
    PASSES=$((PASSES + 1))
  else
    FAILURES=$((FAILURES + 1))
  fi
}

# --- Scenario 1: no service-role key → SKIPPED / exit 0 -----------------
SCRATCH1="$(mktemp -d)"
OUT1="$(cd "${SCRATCH1}" && env -i HOME="${HOME}" PATH="${PATH}" bash "${RUNNER}" 2>&1)"
RC1=$?
rm -rf "${SCRATCH1}"
assert_exit_and_label "no-service-key" 0 "SKIPPED" "${RC1}" "${OUT1}"

# --- Scenario 2: service key set but URL/anon missing → MISCONFIGURED / exit 2 ---
SCRATCH2="$(mktemp -d)"
OUT2="$(cd "${SCRATCH2}" && env -i HOME="${HOME}" PATH="${PATH}" \
  SUPABASE_SERVICE_ROLE_KEY="fake-service-role-for-meta-test" \
  bash "${RUNNER}" 2>&1)"
RC2=$?
rm -rf "${SCRATCH2}"
assert_exit_and_label "service-key-without-url-or-anon" 2 "MISCONFIGURED" "${RC2}" "${OUT2}"

# --- Scenario 3: fully configured but `deno` unavailable → FAILED / exit 1 ---
# Point PATH at an empty dir so `command -v deno` fails deterministically,
# even if the ambient environment has Deno installed. /usr/bin is included so
# bash's builtins for `env`, `mktemp`, `grep` still resolve inside the runner.
EMPTY_BIN="$(mktemp -d)"
SCRATCH3="$(mktemp -d)"
OUT3="$(cd "${SCRATCH3}" && env -i HOME="${HOME}" PATH="${EMPTY_BIN}:/usr/bin:/bin" \
  SUPABASE_SERVICE_ROLE_KEY="fake-service-role-for-meta-test" \
  SUPABASE_URL="https://example.supabase.co" \
  SUPABASE_ANON_KEY="fake-anon-for-meta-test" \
  bash "${RUNNER}" 2>&1)"
RC3=$?
rm -rf "${SCRATCH3}" "${EMPTY_BIN}"
assert_exit_and_label "fully-configured-no-deno" 1 "FAILED.*deno" "${RC3}" "${OUT3}"

echo
echo "${LABEL} summary: ${PASSES} passed, ${FAILURES} failed"
if [[ ${FAILURES} -gt 0 ]]; then
  exit 1
fi
exit 0