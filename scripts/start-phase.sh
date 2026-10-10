#!/usr/bin/env bash
# Usage: scripts/start-phase.sh <phase 0-10>
# Refuses to start phase N unless gate N-1 has passed.
set -euo pipefail
cd "$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
N="${1:-}"
[[ "$N" =~ ^([0-9]|10)$ ]] || { echo "usage: scripts/start-phase.sh <phase 0-10>" >&2; exit 64; }
if (( N == 0 )); then echo "Phase 0 may start any time."; exit 0; fi
P=$((N-1))
if [[ -f "signoff/phase-$P.passed" ]]; then
  echo "OK: gate $P passed →"; sed 's/^/   /' "signoff/phase-$P.passed"
  echo "You may start phase $N. See IMPLEMENTATION.md → 'Phase $N'."
else
  echo "REFUSED: gate $P has not passed. Finish phase $P and run: scripts/gate.sh $P" >&2
  exit 2
fi
