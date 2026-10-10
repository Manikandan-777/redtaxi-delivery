#!/usr/bin/env bash
# Automatable subset of SECURITY_CHECK.md. Usage: WEB=https://host [API=https://api-host] bash scripts/security-smoke.sh
# Exit code 0 only if every check passes. Safe, read-mostly requests; the OTP check sends several
# OTP requests for a throwaway number — point it at demo/staging, NOT at a real SMS provider with spend.
set -uo pipefail
WEB="${WEB:-}"; API="${API:-}"
[[ -n "$WEB" ]] || { echo "WEB is required, e.g. WEB=http://localhost:3000" >&2; exit 64; }
FAILS=0; PASS=0
ok()   { printf '  \033[32m✔\033[0m %s\n' "$1"; PASS=$((PASS+1)); }
bad()  { printf '  \033[31m✘\033[0m %s\n' "$1"; FAILS=$((FAILS+1)); }
chk()  { if eval "$2"; then ok "$1"; else bad "$1"; fi; }
H="$(curl -sI --max-time 15 "$WEB/" || true)"
code() { curl -s -o /dev/null --max-time 15 -w '%{http_code}' "$@"; }

echo "SC-D2 security headers on $WEB"
chk "Content-Security-Policy present"            'grep -qi "^content-security-policy:" <<<"$H"'
chk "no unsafe-eval in CSP"                      '! grep -i "^content-security-policy:" <<<"$H" | grep -qi "unsafe-eval"'
chk "X-Content-Type-Options: nosniff"            'grep -qi "^x-content-type-options:.*nosniff" <<<"$H"'
chk "Referrer-Policy present"                    'grep -qi "^referrer-policy:" <<<"$H"'
chk "clickjacking protection (frame-ancestors or X-Frame-Options)" 'grep -qiE "^x-frame-options:|frame-ancestors" <<<"$H"'
chk "no X-Powered-By header"                     '! grep -qi "^x-powered-by:" <<<"$H"'
if [[ "$WEB" == https://* ]]; then
  chk "SC-D1 HSTS present"                       'grep -qi "^strict-transport-security:" <<<"$H"'
fi

echo "SC-B1 role walls (anonymous)"
for p in /admin /driver /bookings; do
  loc="$(curl -sI --max-time 15 "$WEB$p" | tr -d '\r' | awk 'tolower($1)=="location:"{print $2}')"
  chk "anonymous GET $p redirects to a login page" '[[ "$loc" == *login* ]]'
done

echo "SC-D5 BFF proxy does not forward traversal / absolute URLs"
for u in "/api/proxy/../../admin/stats" "/api/proxy/%2e%2e/%2e%2e/etc/passwd" "/api/proxy/http://169.254.169.254/latest/meta-data/"; do
  c="$(code --path-as-is "$WEB$u")"
  chk "$u → blocked (got $c)" '[[ "$c" =~ ^(400|401|403|404)$ ]]'
done

echo "SC-D4 CORS allow-list"
T="${API:-$WEB}"
acao="$(curl -sI --max-time 15 -H 'Origin: https://evil.example' "$T/api/vehicles" "$T/vehicles" 2>/dev/null | tr -d '\r' | grep -i '^access-control-allow-origin:' || true)"
chk "no ACAO for https://evil.example" '[[ "$acao" != *evil.example* && "$acao" != *"*"* ]]'

echo "SC-A1 OTP send rate limit"
got429=0
for i in 1 2 3 4 5 6 7 8 9 10; do
  c="$(code -X POST "$WEB/api/auth/otp/send" -H 'content-type: application/json' -H "origin: $WEB" -d '{"phone":"9000000001"}')"
  [[ "$c" == "429" ]] && got429=1
done
chk "429 returned within 10 rapid OTP requests" '(( got429 == 1 ))'

if [[ -n "$API" ]]; then
  echo "SC-B1 role walls on API (anonymous)"
  for p in /admin/stats /admin/drivers /driver/stats /bookings; do
    c="$(code "$API$p")"
    chk "anonymous $p → 401/403 (got $c)" '[[ "$c" =~ ^(401|403)$ ]]'
  done
  echo "SC-H3 no stack traces on errors"
  body="$(curl -s --max-time 15 -X POST "$API/quotes" -H 'content-type: application/json' -d '{bad json')"
  chk "malformed JSON does not leak internals" '! grep -qiE "at .*\.(js|ts):[0-9]+|node_modules|stack|SQL" <<<"$body"'
fi

echo
echo "Result: $PASS passed, $FAILS failed"
echo "Manual/authenticated checks remain: see SECURITY_CHECK.md (cookies, IDOR, payments, sockets, uploads, mobile)."
(( FAILS == 0 ))
