# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Twist-Tac-Toe: real-time two-player tic-tac-toe over Socket.IO. The twist: each player may have at most **3 marks on the board**. Placing a 4th mark removes that player's oldest mark (FIFO). Win detection runs on the current board, so the disappearing-mark mechanic is central to gameplay.

## Layout

Three top-level directories, **not** an npm workspace (no root `package.json`) — install and run `client/` and `server/` independently:

- `client/` — React 18 + Vite + TypeScript, Tailwind + shadcn/ui + magicui, `socket.io-client`.
- `server/` — Node + Express + Socket.IO, TypeScript compiled to `dist/`.
- `common/types.ts` — types shared across both, including the Socket.IO event maps (`ClientToServerEvents`/`ServerToClientEvents`) that type the socket on each side. `common/constants.ts` — shared values (`TURN_SECONDS`, `USERNAME_MAX_LENGTH`, `GAME_ID_LENGTH`). Both are imported by **relative path** (`../../common/...`), not a package. The server's `rootDir` is the repo root so it can compile them.

## Commands

Client (`cd client`):
- `npm run dev` — Vite dev server.
- `npm run build` — `tsc -b && vite build` (this is also the only full typecheck).
- `npm run lint` — ESLint.

Server (`cd server`):
- `npm run dev` — `tsx watch src/index.ts`, runs TS directly with reload (no separate compile step).
- `npm run build` — `tsc`, compiles `src/` → `dist/server/src/` (and `common/` → `dist/common/`).
- `npm start` — `node dist/server/src/index.js`, runs the compiled build (production).
- `npm test` — vitest. `test/engine.test.ts` and `test/bot.test.ts` cover the rules and the bot; `test/socket.test.ts` starts a real server on a random port (short timings via `createApp` options) and drives it with `socket.io-client`. When a test waits for a `board` event, filter for the one it expects: broadcasts from the previous move can arrive late.

The client has no tests.

Env vars (copy from each `.env_example`): client `VITE_BACKEND_URL`; server `PORT`, `BACKEND_URL`, `CLIENT_URL` (allowed CORS origin; unset means any origin).

`npm audit` on the client reports 4 remaining advisories. They are **intentionally not fixed**, and each needs a breaking major upgrade:
- `vite` and `esbuild` (fix: Vite 5→8): they only affect the local dev server, not production builds.
- `react-router` and `react-router-dom` (fix: React Router 6→7): an open redirect through a backslash in a `<Link>`/`navigate()` target, and SSR hydration. The app only navigates to paths it builds from validated game codes and has no SSR.

Do not "fix" these without an explicit decision to do the major upgrade.

## Server architecture

One `GameManager` owns matchmaking; each match is a `Game`.

- **`app.ts`** — `createApp(clientUrl, options)` builds Express + Socket.IO + the `GameManager` and returns `{ httpServer, io }`. `DEFAULT_OPTIONS` holds the timings (turn length, bot delay, reconnect grace, rematch window); tests pass shorter ones. **`index.ts`** only loads env and calls `listen`.
- **`engine.ts`** — the rules as pure functions over `GameState` (`board`, each sign's marks oldest-first, `turn`): `applyMove` drops the mover's oldest mark when they already have `MAX_MARKS` (3), then places; `winningLine`; `legalMoves`; `nextToVanish`. A player's own oldest mark is still occupied, so they can't play on it.
- **`bot.ts`** — `chooseMove(state, difficulty)`. All levels take an immediate win. `easy` otherwise avoids moves that allow an immediate loss; `medium` and `hard` use the same depth-8 negamax with alpha-beta (about 11 ms on an empty board) and random tie-breaks. What makes `hard` harder is in `Game.ts`: games against a hard bot send `fadingHidden: true` in `init` and always null `nextToVanish`, so the board never shows which mark fades next.
- **`players.ts`** — `Human` (wraps a socket; `id` is the socket id) and `Bot` (no socket), as the `Player` union discriminated by `kind`.
- **`Game.ts`** — one match. Assigns X/O at random, emits `init` to each human, then runs turns: every change broadcasts the full `board` (with whose turn it is, `nextToVanish` and `turnEndsInMs`). One `setTimeout` per turn ends the game on timeout; bot turns are scheduled after `botDelayMs`. `finish` emits the final board, then `win` (with `reason` and the winning `line`), then calls `onEnd`. `dispose()` removes move listeners and leaves the room.
- **`GameManager.ts`** — `quickMatch` (one waiting player), `privateGames` (code → host), `games` (active) and `finished` (kept for `rematchWindowMs` so both players can ask for a rematch; against a bot it restarts at once). Game codes are 6 characters from `GAME_ID_ALPHABET` in `common/constants.ts`, which leaves out look-alikes (`0/O`, `1/I/L`, `2/Z`, `5/S`), drawn with `crypto.randomInt`. The Join input only accepts that alphabet; server validation stays at `[A-Z0-9]{6}` so a bad code still gets a "not found" reply instead of being dropped silently. `cancel` removes a player from waiting lists only; `leave` also forfeits an active game and closes the rematch window. On a dropped connection it waits `reconnectGraceMs` before calling `leave`; Socket.IO connection state recovery (same socket id, missed room broadcasts replayed) lets a player who returns in time keep their game, and `reattach` moves their `Human` and move listener onto the new socket object. An explicit client disconnect leaves immediately. It broadcasts the `online` count on every connect and disconnect.
- **`validators.ts`** — zod schemas every incoming payload is parsed with; malformed payloads are dropped before any handler runs. **`types.ts`** — `GameServer`/`GameSocket`, Socket.IO types bound to the shared event maps.

### Socket.IO event contract (the real API)

This event contract, not any HTTP endpoint, is the client/server interface:
- Client → Server: `createGame`, `joinGame`, `joinRandomGame`, `playBot`, `move` (`{ cell: 0-8 }`, no ack; the next `board` broadcast is the confirmation), `cancel`, `leave`, `rematch`, `rename` (updates the player's name wherever they are: waiting, in a game or on the result screen).
- Server → Client: `gameJoined` (waiting for an opponent), `init`, `board`, `win` (winner id, reason and line only; the client words the result with `describeWin` from `common/messages.ts` using current names), `playerRenamed`, `rematchOffered`, `rematchUnavailable`, `online`, `error`.

Payload shapes and both event maps live in `common/types.ts`.

## Client architecture

- **`App.tsx` is the hub.** It owns the username, the waiting state, the online count and the game `Session` (`init`, latest `board` with a local `turnEndsAt`, `win`, rematch state), registers every socket listener once, and passes state down as props. `FollowGame` navigates to `/game/:id` whenever an `init` arrives, which covers private games, quick match, bot games and rematches.
- **`socket.tsx`** — one shared `socket.io-client` instance pointed at `VITE_BACKEND_URL`. It connects on import; never call `socket.connect()` yourself, because a second connect mid-handshake makes the server force-close the connection.
- **Pages** (`src/components/pages/`): `Landing` (quick match, bot difficulty picker, create/join, rules) → `Create` (private invite link or quick-match wait with a bot offer after 5s; sends `cancel` on unmount and re-sends its request if the socket reconnects without recovery) / `Join` (6-character code, shows server errors) / `Game`.
- **`Game.tsx`** renders player cards (`PlayerCard`, countdown from the board's deadline), the `Board` and a `ResultPanel` (rematch, home). A URL that doesn't match the current session shows "This game isn't available"; a reconnect that fails to recover sends the player home.
- **`Board.tsx`** — 3×3 buttons drawn from the server's board. The mark in `nextToVanish` is faded with a dashed ring (the game's twist), the winning line is tinted, and marks animate in and out with framer-motion (`MotionConfig reducedMotion="user"` in `App`). X is amber and O violet (`lib/signs.ts`).
- **`lib/username.ts`** — random two-word names (`SneakyOtter`), saved in `localStorage`; the name is editable in the `Appbar`.
- UI building blocks: shadcn/ui primitives in `components/ui/`, animated components in `components/magicui/`. Path alias `@/` → `client/src/` (configured in both `vite.config.ts` and `tsconfig`).
