#!/usr/bin/env bash
# Bootstrap a local SQLite copy of the WedgieTracker database from the
# committed seed. Use this if you don't have access to the production Turso
# database but want to run the app locally.
#
# Requires: sqlite3 (preinstalled on macOS; `apt install sqlite3` on Linux).

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SEED="$ROOT_DIR/database-backups/seed.sql"
LOCAL_DB="$ROOT_DIR/local.db"

if ! command -v sqlite3 >/dev/null 2>&1; then
  echo "sqlite3 is not installed. Install it (macOS: it's preinstalled; Linux: apt install sqlite3) and try again."
  exit 1
fi

if [ ! -f "$SEED" ]; then
  echo "Seed file not found at $SEED."
  echo "If you have access to production, run: pnpm db:dump"
  echo "Otherwise ask a maintainer to commit a fresh seed."
  exit 1
fi

if [ -f "$LOCAL_DB" ]; then
  read -r -p "$LOCAL_DB already exists. Overwrite? [y/N]: " REPLY
  if [[ ! "$REPLY" =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
  rm -f "$LOCAL_DB"
fi

sqlite3 "$LOCAL_DB" < "$SEED"

cat <<EOF
Local database created at $LOCAL_DB

Add these to your .env (TURSO_AUTH_TOKEN can be empty for file: URLs):
  TURSO_DATABASE_URL="file:./local.db"
  TURSO_AUTH_TOKEN=""
EOF
