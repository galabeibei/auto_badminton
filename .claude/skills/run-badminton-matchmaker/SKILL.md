---
name: run-badminton-matchmaker
description: Build, run, test, and drive badminton-matchmaker (羽中遨翔), a pure front-end Vite + React badminton-matchmaking SPA (no backend). Use when asked to start the dev server, run its tests, build it, or screenshot / interact with its UI.
---

Pure front-end SPA (Vite + React + localStorage, no backend). Bootstrap
and lifecycle are handled by `.claude/skills/run-badminton-matchmaker/dev-server.sh`
(handles the Node 18+ requirement automatically — see Gotchas); the
running app is then driven with this environment's Browser tools
(`mcp__Claude_Browser__*`).

All paths below are relative to the repo root.

## Prerequisites

macOS. No OS packages needed. The project needs **Node 18+** — if
`node` on `PATH` is older (or missing), `dev-server.sh` downloads a
portable Node from nodejs.org into `~/.cache/claude-node/` (checksum
verified) and uses that instead, with no `sudo` and no Homebrew. See
Gotchas for why Homebrew's `node@20` doesn't work on this machine.

## Setup / Build / Run (agent path)

Everything goes through one script — it resolves Node, then forwards
to the matching `npm` script:

```bash
.claude/skills/run-badminton-matchmaker/dev-server.sh start   # npm install (if needed) + vite dev, backgrounded, waits for :5173
.claude/skills/run-badminton-matchmaker/dev-server.sh status  # prints "up: http://localhost:5173/" or "down"
.claude/skills/run-badminton-matchmaker/dev-server.sh test    # npm test (vitest run)
.claude/skills/run-badminton-matchmaker/dev-server.sh build   # npm run build (tsc && vite build) -> dist/
.claude/skills/run-badminton-matchmaker/dev-server.sh stop    # kills whatever is listening on :5173
```

`start` logs to `/tmp/badminton-matchmaker-dev.log` and returns once
`http://localhost:5173/` answers — verified output:

```
starting (log: /tmp/badminton-matchmaker-dev.log)...
ready: http://localhost:5173/
```

Once it's up, drive it with this environment's Browser tools (there is
no `chromium-cli` here — this is the native equivalent):

```
mcp__Claude_Browser__preview_start  url="http://localhost:5173/"   # opens the pane
mcp__Claude_Browser__computer       action="screenshot"             # verify homepage
mcp__Claude_Browser__computer       action="left_click" coordinate=[399,304]   # "打球啦" button
mcp__Claude_Browser__computer       action="screenshot"             # verify Step 1 wizard rendered
mcp__Claude_Browser__read_console_messages  onlyErrors=true          # should be empty (see Gotchas)
```

Verified result: homepage shows "羽中遨翔" + a "打球啦" button; clicking
it advances to "Step 1: 設定場地數量" with a working court-count picker.
No console errors on a fresh tab.

## Run (human path)

`npm run dev` (after getting Node 18+ on `PATH`) opens the same server
at `http://localhost:5173/` for a human to open in a real browser.
`Ctrl-C` to stop — or, since npm doesn't forward that signal to the
Vite child it spawned, `lsof -ti:5173 -sTCP:LISTEN | xargs kill`.

## Test

```bash
.claude/skills/run-badminton-matchmaker/dev-server.sh test
```

23 test files, 152 tests, all pass (~26s). Some `act(...)` warnings
print to stderr from `PlayerListScreen`/`AppStateProvider` tests —
benign, not failures.

---

## Gotchas

- **System Node is too old.** This machine's `node` is v14.17.3; Vite 5
  requires 18+. `npm run dev`/`vite` fails outright on 14.
  `dev-server.sh` detects this (`process.versions.node` major < 18)
  and falls back to a downloaded Node — see Prerequisites.
- **`brew install node@20` fails on this machine specifically** with
  `Error: Your Command Line Tools are too outdated` while compiling
  `readline` from source (no bottle for this macOS version) — fixing
  it needs `sudo`/Xcode CLT update, which an agent can't do. Don't
  spend time on Homebrew here; the direct-download path in
  `dev-server.sh` is what actually works and needs no privileges.
- **`npm`'s own bin script re-resolves `node` via `PATH`** (it's a
  shebang/symlink, not a fixed binary). Downloading a new Node isn't
  enough — you must put its `bin/` **ahead** of the old one on `PATH`
  before invoking `npm`, or `npm -v` throws
  `Cannot find module 'node:path'` (it silently runs under the old
  Node). `dev-server.sh`'s `resolve_node()` does this.
- **No `timeout`/`gtimeout` on stock macOS** (it's a GNU coreutils
  command, not in the BSD userland here, and this machine has no
  Homebrew coreutils installed). `dev-server.sh` polls with a plain
  `for`+`sleep` loop instead — don't reach for `timeout` in any
  variant of this script.
- **`.claude/` is entirely gitignored in this repo** (comment says
  it's to keep out machine-specific dev-server launch config). That
  silently swallows this skill too unless `.gitignore` carves out
  `!.claude/skills/` — already added; if it's ever missing, `git
  status .claude/` will show nothing instead of the skill files.
- **The app resumes from `localStorage` on load.** If a previous run
  left an in-progress match, navigating to `/` shows a blocking "回復
  上次的比賽紀錄?" modal instead of the home screen. Click "不用，重新開始"
  for a clean run (or clear `localStorage` first) before driving the
  rest of the flow.
- **`read_console_messages` accumulates for the tab's whole lifetime.**
  If you restarted the dev server while a tab stayed open, that tab
  keeps a stale `ERR_CONNECTION_REFUSED` from the moment the port was
  down, even though the app is fine now. Open a fresh tab
  (`mcp__Claude_Browser__tabs_create`) before trusting an
  errors-are-empty check.

## Troubleshooting

- **`Error: Cannot find module 'node:path'` from `npm -v`/`npm
  install`**: the old system Node (14) is still first on `PATH`. Fix
  by prepending the downloaded Node's `bin/` to `PATH` (or just use
  `dev-server.sh`, which does this itself).
- **`Error: Your Command Line Tools are too outdated`** during `brew
  install node@20`: expected on this machine — see Gotchas. Skip
  Homebrew, use `dev-server.sh`.
- **`line N: timeout: command not found`** in a hand-rolled wait loop:
  macOS has no `timeout`. Use a `for`+`sleep`+`curl` poll instead.
