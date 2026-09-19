#!/usr/bin/env bash
# Bootstraps a Node 18+ runtime (downloading one only if the system
# node is too old) and starts/stops/checks the Vite dev server for
# badminton-matchmaker. See ../SKILL.md for the full story.
set -euo pipefail

UNIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
NODE_CACHE="$HOME/.cache/claude-node"
NODE_VERSION="v24.20.0"
NODE_DIST="node-${NODE_VERSION}-darwin-x64"
PORT=5173
LOG_FILE="/tmp/badminton-matchmaker-dev.log"

resolve_node() {
  if command -v node >/dev/null 2>&1 && [ "$(node -e 'console.log(process.versions.node.split(".")[0])')" -ge 18 ]; then
    return 0
  fi
  local bin="$NODE_CACHE/$NODE_DIST/bin"
  if [ ! -x "$bin/node" ]; then
    echo "system node is missing or older than 18 — downloading $NODE_VERSION..." >&2
    mkdir -p "$NODE_CACHE"
    local url="https://nodejs.org/dist/${NODE_VERSION}/${NODE_DIST}.tar.gz"
    local tmp; tmp=$(mktemp -d)
    curl -sL -o "$tmp/node.tar.gz" "$url"
    local expected actual
    expected=$(curl -s "https://nodejs.org/dist/${NODE_VERSION}/SHASUMS256.txt" | grep "${NODE_DIST}.tar.gz\$" | awk '{print $1}')
    actual=$(shasum -a 256 "$tmp/node.tar.gz" | awk '{print $1}')
    if [ -z "$expected" ] || [ "$expected" != "$actual" ]; then
      echo "checksum mismatch for downloaded node tarball, aborting" >&2
      rm -rf "$tmp"
      exit 1
    fi
    tar xzf "$tmp/node.tar.gz" -C "$NODE_CACHE"
    rm -rf "$tmp"
  fi
  export PATH="$bin:$PATH"
}

resolve_node
cd "$UNIT_DIR"

case "${1:-start}" in
  start)
    [ -d node_modules ] || npm install
    if curl -sf "http://localhost:$PORT/" -o /dev/null 2>/dev/null; then
      echo "already running: http://localhost:$PORT/"
      exit 0
    fi
    nohup npm run dev > "$LOG_FILE" 2>&1 &
    disown
    echo "starting (log: $LOG_FILE)..."
    # No `timeout`/`gtimeout` on stock macOS — poll with a manual counter instead.
    for _ in $(seq 1 60); do
      curl -sf "http://localhost:$PORT/" -o /dev/null 2>/dev/null && break
      sleep 0.5
    done
    if ! curl -sf "http://localhost:$PORT/" -o /dev/null 2>/dev/null; then
      echo "server did not come up within 30s — check $LOG_FILE" >&2
      exit 1
    fi
    echo "ready: http://localhost:$PORT/"
    ;;
  stop)
    lsof -ti:$PORT -sTCP:LISTEN 2>/dev/null | xargs -r kill
    echo "stopped"
    ;;
  status)
    if curl -sf "http://localhost:$PORT/" -o /dev/null 2>/dev/null; then
      echo "up: http://localhost:$PORT/"
    else
      echo "down"
    fi
    ;;
  test)
    [ -d node_modules ] || npm install
    npm test
    ;;
  build)
    [ -d node_modules ] || npm install
    npm run build
    ;;
  *)
    echo "usage: $0 {start|stop|status|test|build}" >&2
    exit 1
    ;;
esac
