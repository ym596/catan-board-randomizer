#!/bin/sh
set -eu
PROJECT_ROOT=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
TASK_NODE=$(command -v node || true)
supports_node() {
  [ -n "$1" ] && "$1" -e 'const [a,b]=process.versions.node.split(".").map(Number);process.exit(a>22||(a===22&&b>=12)?0:1)' >/dev/null 2>&1
}
if ! supports_node "$TASK_NODE"; then
  TASK_NODE="$HOME/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node"
fi
if ! supports_node "$TASK_NODE"; then
  echo 'This project needs Node 22.12 or newer. No system changes were made.' >&2
  exit 1
fi
if [ ! -f "$PROJECT_ROOT/node_modules/vite/bin/vite.js" ]; then
  echo 'Dependencies are missing. With a supported Node version and pnpm, run: pnpm install' >&2
  exit 1
fi
cd "$PROJECT_ROOT"
exec "$TASK_NODE" node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5173 "$@"
