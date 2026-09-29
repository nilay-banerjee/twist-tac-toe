import { AddressInfo } from "net";
import { io as connect, Socket } from "socket.io-client";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import {
  BoardEventType,
  ClientToServerEvents,
  InitEventType,
  ServerToClientEvents,
} from "../../common/types";
import { GAME_ID_ALPHABET, GAME_ID_LENGTH } from "../../common/constants";
import { createApp } from "../src/app";

type Client = Socket<ServerToClientEvents, ClientToServerEvents>;
type EventName = keyof ServerToClientEvents;
type Payload<E extends EventName> = Parameters<ServerToClientEvents[E]>[0];

const OPTIONS = {
  turnMs: 500,
  botDelayMs: 20,
  reconnectGraceMs: 300,
  rematchWindowMs: 2000,
};

let url = "";
const { httpServer, io } = createApp("*", OPTIONS);
const clients: Client[] = [];

beforeAll(async () => {
  await new Promise<void>((resolve) => httpServer.listen(0, resolve));
  url = `http://localhost:${(httpServer.address() as AddressInfo).port}`;
});

afterEach(() => {
  clients.splice(0).forEach((client) => client.disconnect());
});

afterAll(async () => {
  await io.close();
});

async function client(options: Parameters<typeof connect>[1] = {}) {
  const socket: Client = connect(url, {
    forceNew: true,
    reconnection: false,
    ...options,
  });
  clients.push(socket);
  await next(socket, "connect" as EventName);
  return socket;
}

function next<E extends EventName>(
  socket: Client,
  event: E,
  timeoutMs = 1500,
  matches: (data: Payload<E>) => boolean = () => true
): Promise<Payload<E>> {
  return new Promise((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = socket as any;
    const timer = setTimeout(() => {
      raw.off(event, listener);
      reject(new Error(`timed out waiting for "${event}"`));
    }, timeoutMs);
    const listener = (data: Payload<E>) => {
      if (!matches(data)) return;
      clearTimeout(timer);
      raw.off(event, listener);
      resolve(data);
    };
    raw.on(event, listener);
  });
}

function nothing(socket: Client, event: EventName, ms = 200) {
  return new Promise<void>((resolve, reject) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fail = () => reject(new Error(`unexpected "${event}"`));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (socket as any).once(event, fail);
    setTimeout(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (socket as any).off(event, fail);
      resolve();
    }, ms);
  });
}

async function startPrivateGame() {
  const a = await client();
  const b = await client();
  a.emit("createGame", { username: "alice" });
  const { gameId } = await next(a, "gameJoined");
  const initA = next(a, "init");
  const initB = next(b, "init");
  const boardA = next(a, "board");
  b.emit("joinGame", { username: "bob", gameId });
  const [ia, ib, board] = await Promise.all([initA, initB, boardA]);
  const x = ia.you.sign === "X" ? a : b;
  const o = x === a ? b : a;
  return { a, b, x, o, gameId, initA: ia, initB: ib, board };
}

// Broadcasts from the previous move can arrive late, so wait for the board
// where it's no longer this player's turn.
async function move(socket: Client, cell: number): Promise<BoardEventType> {
  const board = next(socket, "board", 1500, (b) => b.turnId !== socket.id);
  socket.emit("move", { cell });
  return board;
}

describe("matchmaking", () => {
  it("drops malformed payloads and keeps serving", async () => {
    const socket = await client();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const raw = socket as any;
    for (const event of ["createGame", "joinGame", "joinRandomGame", "playBot"]) {
      for (const payload of [undefined, null, "x", 42, {}, { username: 5 }]) {
        raw.emit(event, payload);
      }
    }
    await nothing(socket, "gameJoined");
    socket.emit("createGame", { username: "ok" });
    expect((await next(socket, "gameJoined")).username).toBe("ok");
  });

  it("hands out 6-character codes without look-alike characters", async () => {
    const codes = new Set<string>();
    for (let i = 0; i < 30; i++) {
      const socket = await client();
      socket.emit("createGame", { username: "u" });
      codes.add((await next(socket, "gameJoined")).gameId);
    }
    const valid = new RegExp(`^[${GAME_ID_ALPHABET}]{${GAME_ID_LENGTH}}$`);
    for (const code of codes) expect(code).toMatch(valid);
  });

  it("starts a private game with both players' names and opposite signs", async () => {
    const { initA, initB, board } = await startPrivateGame();
    expect(initA.opponent.username).toBe("bob");
    expect(initB.opponent.username).toBe("alice");
    expect(initA.you.sign).not.toBe(initB.you.sign);
    expect(initA.opponent.isBot).toBe(false);
    expect(board.board).toEqual(Array(9).fill(""));
    const xId = initA.you.sign === "X" ? initA.you.id : initB.you.id;
    expect(board.turnId).toBe(xId);
    expect(board.turnEndsInMs).toBeGreaterThan(0);
  });

  it("rejects unknown codes, your own code and games already running", async () => {
    const host = await client();
    host.emit("joinGame", { username: "h", gameId: "ZZZZZZ" });
    expect((await next(host, "error")).errorCode).toBe(404);
    host.emit("createGame", { username: "h" });
    const { gameId } = await next(host, "gameJoined");
    host.emit("joinGame", { username: "h", gameId });
    expect((await next(host, "error")).errorCode).toBe(400);

    const game = await startPrivateGame();
    const spectator = await client();
    spectator.emit("joinGame", { username: "eve", gameId: game.gameId });
    expect((await next(spectator, "error")).errorCode).toBe(404);
  });

  it("pairs quick-match players even after an unrelated disconnect", async () => {
    const first = await client();
    first.emit("joinRandomGame", { username: "first" });
    await next(first, "gameJoined");
    (await client()).disconnect();
    const second = await client();
    const init = next(second, "init");
    second.emit("joinRandomGame", { username: "second" });
    expect((await init).opponent.username).toBe("first");
  });

  it("takes a player out of quick-match when they cancel", async () => {
    const quitter = await client();
    quitter.emit("joinRandomGame", { username: "quitter" });
    await next(quitter, "gameJoined");
    quitter.emit("cancel");
    const b = await client();
    b.emit("joinRandomGame", { username: "b" });
    expect((await next(b, "gameJoined")).playersJoined).toBe(1);
    await nothing(quitter, "init");
  });

  it("broadcasts how many players are online", async () => {
    const watcher = await client();
    const update = next(watcher, "online");
    const other = await client();
    expect((await update).count).toBeGreaterThanOrEqual(2);
    const after = next(watcher, "online");
    other.disconnect();
    expect((await after).count).toBeGreaterThanOrEqual(1);
  });
});

describe("playing", () => {
  it("enforces turns and empty cells", async () => {
    const { x, o } = await startPrivateGame();
    o.emit("move", { cell: 0 });
    expect((await next(o, "error")).errorCode).toBe(303);
    await move(x, 4);
    o.emit("move", { cell: 4 });
    expect((await next(o, "error")).errorCode).toBe(304);
  });

  it("drops out-of-range and non-integer moves", async () => {
    const { x } = await startPrivateGame();
    for (const cell of [-1, 9, 1.5, "4"]) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (x as any).emit("move", { cell });
    }
    await nothing(x, "board");
  });

  it("removes the oldest mark and reports the next one to vanish", async () => {
    const { x, o } = await startPrivateGame();
    for (const [socket, cell] of [
      [x, 0],
      [o, 8],
      [x, 1],
      [o, 7],
    ] as const) {
      await move(socket, cell);
    }
    const third = await move(x, 5);
    expect(third.nextToVanish.X).toBe(0);
    await move(o, 3);
    const fourth = await move(x, 6);
    expect(fourth.board[0]).toBe("");
    expect(fourth.board[6]).toBe("X");
    expect(fourth.nextToVanish.X).toBe(1);
  });

  it("sends the final board and then the winning line", async () => {
    const { x, o } = await startPrivateGame();
    for (const [socket, cell] of [
      [x, 3],
      [o, 0],
      [x, 4],
      [o, 1],
    ] as const) {
      await move(socket, cell);
    }
    const events: string[] = [];
    o.on("board", (b) => {
      if (b.board[5] === "X") events.push("board");
    });
    o.on("win", () => events.push("win"));
    const win = next(o, "win");
    x.emit("move", { cell: 5 });
    const result = await win;
    expect(result.reason).toBe("line");
    expect(result.line).toEqual([3, 4, 5]);
    expect(result.winnerId).toBe(x.id);
    expect(events).toEqual(["board", "win"]);
  });

  it("awards the game to the waiting player on timeout", async () => {
    const { o } = await startPrivateGame();
    const win = await next(o, "win", 2000);
    expect(win.reason).toBe("timeout");
    expect(win.winnerId).toBe(o.id);
  });

  it("forfeits an active game when a player leaves", async () => {
    const { x, o } = await startPrivateGame();
    const win = next(o, "win");
    x.emit("leave");
    const result = await win;
    expect(result.reason).toBe("left");
    expect(result.winnerId).toBe(o.id);
  });

  it("does not forfeit an active game on cancel", async () => {
    const { x, o } = await startPrivateGame();
    x.emit("cancel");
    await nothing(o, "win", 150);
    expect((await move(x, 4)).board[4]).toBe("X");
  });
});

describe("bot games", () => {
  it("starts against the computer and it answers moves", async () => {
    const human = await client();
    const init = next(human, "init");
    const myTurn = next(human, "board", 1500, (b) => b.turnId === human.id);
    human.emit("playBot", { username: "solo", difficulty: "medium" });
    const { opponent, fadingHidden } = await init;
    expect(opponent.isBot).toBe(true);
    expect(opponent.username).toBe("Computer (Medium)");
    expect(fadingHidden).toBe(false);
    const cell = (await myTurn).board.findIndex((c) => c === "");
    const afterBot = next(
      human,
      "board",
      1500,
      (b) => b.turnId === human.id && b.board[cell] !== ""
    );
    human.emit("move", { cell });
    const board = await afterBot;
    expect(board.board.filter((c) => c === opponent.sign)).not.toHaveLength(0);
  });
});

describe("hard bot games", () => {
  it("never reveal which mark fades next", async () => {
    const human = await client();
    const boards: BoardEventType[] = [];
    human.on("board", (board) => {
      boards.push(board);
      if (board.turnId !== human.id) return;
      human.emit("move", { cell: board.board.findIndex((c) => c === "") });
    });
    const init = next(human, "init");
    const win = next(human, "win", 5000);
    human.emit("playBot", { username: "solo", difficulty: "hard" });
    expect((await init).fadingHidden).toBe(true);
    await win;
    expect(boards.length).toBeGreaterThan(5);
    for (const board of boards) {
      expect(board.nextToVanish).toEqual({ X: null, O: null });
    }
  });
});

describe("rematch", () => {
  it("restarts only when both players ask", async () => {
    const { x, o } = await startPrivateGame();
    x.emit("leave");
    await next(o, "win");
    const game = await startPrivateGame();
    const loserWin = next(game.o, "win", 2000);
    await next(game.x, "win", 2000);
    await loserWin;
    const offered = next(game.o, "rematchOffered");
    game.x.emit("rematch");
    expect((await offered).username).toMatch(/alice|bob/);
    const initX = next(game.x, "init");
    const initO = next(game.o, "init");
    game.o.emit("rematch");
    const [nx, no] = await Promise.all([initX, initO]);
    expect(nx.gameId).toBe(no.gameId);
    expect(nx.gameId).not.toBe(game.gameId);
  });

  it("tells the other player when their opponent leaves after the game", async () => {
    const { x, o } = await startPrivateGame();
    await next(o, "win", 2000);
    const notice = next(o, "rematchUnavailable");
    x.emit("leave");
    expect((await notice).message).toMatch(/left/);
  });

  it("restarts a bot game straight away", async () => {
    const human = await client();
    const first = next(human, "init");
    human.emit("playBot", { username: "solo", difficulty: "easy" });
    const { gameId } = await first;
    await next(human, "win", 3000);
    const again = next(human, "init");
    human.emit("rematch");
    expect((await again).gameId).not.toBe(gameId);
  });
});

describe("connection drops", () => {
  it("keeps the game when a player reconnects within the grace period", async () => {
    const a = await client({ reconnection: true, reconnectionDelay: 20 });
    const b = await client({ reconnection: true, reconnectionDelay: 20 });
    a.emit("createGame", { username: "alice" });
    const { gameId } = await next(a, "gameJoined");
    const initA = next(a, "init");
    b.emit("joinGame", { username: "bob", gameId });
    const { you } = await initA;
    const x = you.sign === "X" ? a : b;
    const o = x === a ? b : a;
    const oldId = o.id;
    const back = next(o, "connect" as EventName);
    o.io.engine.close();
    await move(x, 4);
    await back;
    expect(o.recovered).toBe(true);
    expect(o.id).toBe(oldId);
    expect((await move(o, 0)).board[0]).toBe("O");
  });

  it("forfeits the game if a player never comes back", async () => {
    const { x, o } = await startPrivateGame();
    const win = next(x, "win", 2000);
    o.io.engine.close();
    const result = await win;
    expect(result.reason).toBe("left");
  });
});

export type { InitEventType };
