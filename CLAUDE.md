# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Twist-Tac-Toe: real-time two-player tic-tac-toe over Socket.IO. The twist: each player may have at most **3 marks on the board**. Placing a 4th mark removes that player's oldest mark (FIFO). Win detection runs on the current board, so the disappearing-mark mechanic is central to gameplay.

## Layout

Three top-level directories, **not** an npm workspace (no root `package.json`) — install and run `client/` and `server/` independently:

- `client/` — React 18 + Vite + TypeScript, Tailwind + shadcn/ui + magicui, `socket.io-client`.
- `server/` — Node + Express + Socket.IO, TypeScript compiled to `dist/`.
- `common/types.ts` — types shared across both, including the Socket.IO event maps (`ClientToServerEvents`/`ServerToClientEvents`) that type the socket on each side. Imported by **relative path** (`../../common/types`), not a package. The server's `rootDir` is the repo root so it can compile this file.

## Commands

Client (`cd client`):
- `npm run dev` — Vite dev server.
- `npm run build` — `tsc -b && vite build` (this is also the only full typecheck).
- `npm run lint` — ESLint.

Server (`cd server`):
- `npm run dev` — `tsx watch src/index.ts`, runs TS directly with reload (no separate compile step).
- `npm run build` — `tsc`, compiles `src/` → `dist/server/src/` (and `common/` → `dist/common/`).
- `npm start` — `node dist/server/src/index.js`, runs the compiled build (production).

No test suite exists.

Env vars (copy from each `.env_example`): client `VITE_BACKEND_URL`; server `PORT`, `BACKEND_URL`.

`npm audit` on the client reports 2 remaining advisories (esbuild → vite). They are **intentionally not fixed**: the fix is a breaking Vite 5→8 major bump, and the advisory (GHSA-67mh-4wv8-2f99) only affects the local dev server, not production builds. Do not "fix" these without an explicit decision to upgrade Vite.

## Server architecture

Single `GameManager` owns all matchmaking; each match is a `Game` instance.

- **`index.ts`** — boots Express + Socket.IO, creates the one `GameManager`, and exports `removeGame()` (called by `Game.destroyGame()` to remove itself — note the circular import between `index.ts` and `Game.ts`).
- **`GameManager.ts`** — routes socket events and matchmaking state: `rooms` (all active game IDs), `pendingPlayers` (created games awaiting a second player), `games` (running matches), and a single `randomPlayerWaiting` slot for quick-match. Handles `createGame`, `joinGame`, `joinRandomGame`, `disconnect`. Game IDs are 6-char uppercase (`generateUniqueGameID`). Once two players are present it constructs a `Game` and calls `game.gameHandler()`.
- **`Game.ts`** — one per match. Holds `board: string[]` (length-9, index = cell id 0–8) and two FIFO queues `queueX`/`queueO` that implement the twist: on a 3rd-already-present placement it `shift()`s the oldest index, clears that board cell, and emits `remove`. `initGame` randomly assigns X/O + first turn and emits `init`. Turn/move gating via `isTurn` + `isValid`; `checkWin` scans 8 win patterns. A 15s inactivity timer (`TIMEOUT_DURATION`) emits `time` every 5s and, on timeout, awards the win to the waiting player and destroys the game.
- **`User.ts`** — wraps a socket with `username`, `id` (= socket.id), `gameId`, `sign`.
- `Moves.ts` (`Move` class) and `lib/util.ts` (`createRoomId`) are vestigial — not used by the current game flow.

### Socket.IO event contract (the real API)

This event contract, not any HTTP endpoint, is the client/server interface:
- Client → Server: `createGame`, `joinGame`, `joinRandomGame`, `move` (uses ack callback + `emitWithAck`).
- Server → Client: `gameJoined`, `init`, `move`, `remove`, `time`, `win`, `error`.

## Client architecture

- **`App.tsx` is the hub.** It owns *all* game state (username, sign, turn, and the `gameJoined`/`move`/`remove`/`win`/`time` event objects) and registers every socket listener, passing state down to routed pages as props. Pages emit socket events but read game state from `App`.
- **`socket.tsx`** — one shared `socket.io-client` instance pointed at `VITE_BACKEND_URL`.
- **Pages** (`src/components/pages/`): `Landing` → `Create` (emits `createGame`/`joinRandomGame`, shows the shareable code, navigates to `/game/:id` once 2 players join) / `Join` (6-char code entry) / `Game`.
- **`Game.tsx`** renders the 3×3 grid as plain `<div>`s with `id="0"`…`"8"`. Opponent moves and removals are applied by **direct DOM mutation** (`document.getElementById(...).innerText`), not React state — the cell id doubles as the board index sent to the server.
- UI building blocks: shadcn/ui primitives in `components/ui/`, animated components in `components/magicui/`. Path alias `@/` → `client/src/` (configured in both `vite.config.ts` and `tsconfig`).
