#!/usr/bin/env bash
# Raven setup verification script
set -euo pipefail

RED=$(printf '\033[31m'); GREEN=$(printf '\033[32m'); YELLOW=$(printf '\033[33m'); NC=$(printf '\033[0m')
ok(){ echo "${GREEN}✔${NC} $1"; }
warn(){ echo "${YELLOW}⚠${NC} $1"; }
fail(){ echo "${RED}✘${NC} $1"; exit 1; }

root_dir="$(pwd)"

echo "— Raven setup verification —"
echo "Repo: $root_dir"
echo

command -v node >/dev/null 2>&1 || fail "Node.js not found. Install Node ≥ 18.17."
command -v npm  >/dev/null 2>&1 || fail "npm not found. Install npm ≥ 9."
ok "Node.js: $(node -v)"
ok "npm: $(npm -v)"

if command -v tree >/dev/null 2>&1; then
  ok "tree: $(tree --version | head -n1)"
else
  warn "tree not installed (used by sitemap script). Install with: macOS 'brew install tree' or 'sudo apt install tree'."
fi

[ -d "services/api/src" ] || fail "Missing services/api/src"
[ -d "apps/web/src" ]     || fail "Missing apps/web/src"
ok "Project structure present"

api_env="services/api/.env.nonprod"
web_env="apps/web/.env.local"

[ -f "$api_env" ] && ok "Found $api_env" || warn "Missing $api_env (create it per README)."
[ -f "$web_env" ] && ok "Found $web_env" || warn "Missing $web_env (create it per README)."

if [ -f "$api_env" ]; then
  required_vars=(SUPABASE_URL SUPABASE_ANON_KEY SUPABASE_SERVICE_ROLE_KEY DATABASE_URL SESSION_SECRET TOKEN_SIGNING_KEY PORT COOKIE_DOMAIN CORS_ORIGINS)
  missing=()
  while IFS= read -r line; do
    case "$line" in
      \#*|"") continue;;
      *) export "$line" >/dev/null 2>&1 || true;;
    esac
  done < "$api_env"
  for v in "${required_vars[@]}"; do
    [ -n "${!v-}" ] || missing+=("$v")
  done
  if [ ${#missing[@]} -gt 0 ]; then
    warn "Missing API env vars: ${missing[*]}"
  else
    ok "All required API env vars present"
  fi
fi

if [ -f "$web_env" ]; then
  while IFS= read -r line; do
    case "$line" in
      \#*|"") continue;;
      *) export "$line" >/dev/null 2>&1 || true;;
    esac
  done < "$web_env"
  [ -n "${NEXT_PUBLIC_API_URL-}" ] && ok "NEXT_PUBLIC_API_URL set to ${NEXT_PUBLIC_API_URL}" || warn "NEXT_PUBLIC_API_URL missing in $web_env"
fi

check_port(){
  local port="$1"
  if lsof -iTCP -sTCP:LISTEN -nP 2>/dev/null | grep -q ":$port"; then
    warn "Port $port appears in use"
  else
    ok "Port $port available"
  fi
}
check_port 3000
check_port 4000

echo
echo "${GREEN}All checks complete.${NC} Next:"
echo " - Install deps: npm install"
echo " - Start both:   npm run dev"
