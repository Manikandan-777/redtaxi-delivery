#!/usr/bin/env bash
# Usage: scripts/gate.sh <phase 0-10> [--no-regress] [--list]
# Runs the phase's automated checks (+ regression of earlier phases), verifies the manual
# sign-off file is fully ticked, and only then writes signoff/phase-N.passed.
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
CONF="scripts/gates.conf"

N="${1:-}"; shift || true
REGRESS=1; LIST=0
for a in "$@"; do
  case "$a" in
    --no-regress) REGRESS=0 ;;
    --list) LIST=1 ;;
    *) echo "unknown option: $a" >&2; exit 64 ;;
  esac
done

if ! [[ "$N" =~ ^([0-9]|10)$ ]]; then
  echo "usage: scripts/gate.sh <phase 0-10> [--no-regress] [--list]" >&2; exit 64
fi
[[ -f "$CONF" ]] || { echo "missing $CONF" >&2; exit 66; }

red()   { printf '\033[31m%s\033[0m\n' "$*"; }
green() { printf '\033[32m%s\033[0m\n' "$*"; }

# 1. previous gate must have passed
if (( N > 0 )) && [[ ! -f "signoff/phase-$((N-1)).passed" ]]; then
  red "BLOCKED: Gate $((N-1)) has not passed (signoff/phase-$((N-1)).passed missing). Finish phase $((N-1)) first."
  exit 2
fi

# 2. collect commands
declare -a CMDS=()
first=$N; (( REGRESS )) && first=0
for (( p=first; p<=N; p++ )); do
  while IFS= read -r line; do
    [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
    if [[ "${line%%|*}" == "$p" ]]; then CMDS+=("$p|${line#*|}"); fi
  done < "$CONF"
done

if (( LIST )); then printf '%s\n' "${CMDS[@]}"; exit 0; fi
(( ${#CMDS[@]} > 0 )) || { red "No commands configured for phase $N in $CONF"; exit 66; }

# 3. run them all, remember failures
FAILS=()
for entry in "${CMDS[@]}"; do
  p="${entry%%|*}"; cmd="${entry#*|}"
  printf '\n▶ [phase %s] %s\n' "$p" "$cmd"
  if bash -c "$cmd"; then green "  ✔ pass"; else red "  ✘ FAIL"; FAILS+=("[phase $p] $cmd"); fi
done

# 4. manual sign-off file
SIGN="signoff/phase-$N.md"
if [[ ! -f "$SIGN" ]]; then
  FAILS+=("manual sign-off missing: $SIGN (copy signoff/TEMPLATE.md)")
else
  unchecked=$(grep -cE '^[[:space:]]*- \[ \]' "$SIGN" || true)
  if (( unchecked > 0 )); then FAILS+=("$unchecked unchecked box(es) in $SIGN"); fi
  grep -qiE '^approver:[[:space:]]*[^[:space:]]+' "$SIGN" || FAILS+=("no named approver in $SIGN")
fi

# 5. verdict
echo
if (( ${#FAILS[@]} > 0 )); then
  red "GATE $N: FAILED — do NOT start phase $((N+1))."
  printf '  - %s\n' "${FAILS[@]}"
  rm -f "signoff/phase-$N.passed"
  exit 1
fi

sha="$(git rev-parse --verify -q HEAD 2>/dev/null || echo no-git)"
printf 'phase=%s\ncommit=%s\ndate=%s\nby=%s\n' "$N" "$sha" "$(date -u +%FT%TZ)" "${USER:-unknown}" > "signoff/phase-$N.passed"
green "GATE $N: PASSED — stamp written to signoff/phase-$N.passed. You may start phase $((N+1))."
