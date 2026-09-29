import { MoveAckType, MovePayload } from "../../common/types";
import { User } from "./User";
import { removeGame } from ".";
import { GameServer } from "./types";
import { moveSchema } from "./validators";
const TIMEOUT_DURATION = 15;
const TIME_BROADCAST_INTERVAL_MS = 5000;
type MoveListener = (
  data: unknown,
  callback: (response: MoveAckType) => void
) => void;
export class Game {
  server: GameServer;
  id: string;
  private turn: User;
  private player1: User;
  private player2: User;
  private board: string[];
  private queueX: number[];
  private queueO: number[];
  private lastMoveTime = Date.now();
  private intervalID?: NodeJS.Timeout;
  private moveListeners = new Map<User, MoveListener>();
  constructor(server: GameServer, id: string, player1: User, player2: User) {
    this.server = server;
    this.turn = player1;
    this.id = id;
    this.board = [];
    this.queueO = [];
    this.queueX = [];
    this.player1 = player1;
    this.player2 = player2;
    if (player1 === undefined || player2 === undefined) {
      console.error("Cannot create game", this.id, "missing player");
      return;
    }
    console.log(
      "Game created",
      this.id,
      "Player1:",
      this.player1.username,
      "Player2:",
      this.player2.username
    );
    this.startTurnTimer();
    this.initGame();
  }

  private startTurnTimer() {
    this.lastMoveTime = Date.now();
    clearInterval(this.intervalID);
    this.intervalID = setInterval(
      () => this.checkInactivity(),
      TIME_BROADCAST_INTERVAL_MS
    );
  }
  private checkInactivity() {
    try {
      const lastMoveTimeInSeconds = (Date.now() - this.lastMoveTime) / 1000;
      this.server.to(this.id).emit("time", { lastMoveTimeInSeconds });
      if (lastMoveTimeInSeconds < TIMEOUT_DURATION) return;
      const winner = this.turn === this.player1 ? this.player2 : this.player1;
      console.log("Game", this.id, "timed out");
      this.server.to(this.id).emit("win", {
        winner: winner.username,
        id: winner.client.id,
        message: `Winner is ${winner.username} ${winner.sign} due to inactivity`,
        timeout: true,
      });
      this.destroyGame();
    } catch (e) {
      console.error(e);
    }
  }

  destroyGame() {
    clearInterval(this.intervalID);
    for (const [player, listener] of this.moveListeners) {
      player.client.off("move", listener);
    }
    this.moveListeners.clear();
    removeGame(this.id);
    this.player1.client.leave(this.id);
    this.player2.client.leave(this.id);
    this.turn = {} as User;
    this.id = "";
    this.board = [];
    this.queueO = [];
    this.queueX = [];
  }
  initGame() {
    const random = Math.random();
    if (random > 0.5) {
      this.turn = this.player1;
      this.player1.sign = "X";
      this.player2.sign = "O";
    } else {
      this.turn = this.player2;
      this.player2.sign = "X";
      this.player1.sign = "O";
    }
    try {
      this.player1.client.emit("init", {
        username: this.player1.username,
        sign: this.player1.sign,
        id: this.player1.client.id,
      });
      this.player2.client.emit("init", {
        username: this.player2.username,
        sign: this.player2.sign,
        id: this.player2.client.id,
      });
    } catch (e) {
      console.error(e);
    }
  }
  gameHandler() {
    for (const player of [this.player1, this.player2]) {
      const listener: MoveListener = (data, callback) => {
        const payload = moveSchema.safeParse(data);
        if (!payload.success) return;
        if (this.moveHandler(payload.data, player)) {
          try {
            callback({ message: "Move Successful", status: 200 });
          } catch (e) {
            console.error(e);
          }
        }
      };
      player.client.on("move", listener);
      this.moveListeners.set(player, listener);
    }
  }
  playerLeft(id: string) {
    const winner = id === this.player1.id ? this.player2 : this.player1;
    console.log("Game", this.id, "won by", winner.username, "(opponent left)");
    this.server.to(this.id).emit("win", {
      winner: winner.username,
      id: winner.client.id,
      message: `Winner is ${winner.username} ${winner.sign}, opponent left`,
      timeout: false,
    });
    this.destroyGame();
  }
  checkWin() {
    const winPatterns = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6],
    ];
    for (const pattern of winPatterns) {
      const [a, b, c] = pattern;
      if (
        this.board[a] !== undefined &&
        this.board[a] !== "" &&
        this.board[a] === this.board[b] &&
        this.board[a] === this.board[c]
      ) {
        console.log("Game", this.id, "won by", this.turn.username);
        try {
          this.server.to(this.id).emit("win", {
            winner: this.turn.username,
            id: this.turn.client.id,
            message: `Winner is ${this.turn.username} ${this.turn.sign}`,
            timeout: false,
          });

          this.destroyGame();
          return;
        } catch (e) {
          console.error(e);
        }
        break;
      }
    }
  }

  isValid(player: User, move: string) {
    if (this.board[Number(move)]) {
      try {
        this.server
          .to(player.client.id)
          .emit("error", { message: "Move Not Valid", errorCode: 304 });
        return false;
      } catch (e) {
        console.error(e);
      }
    }
    return true;
  }
  isTurn(player: User) {
    if (player === this.turn) return true;
    try {
      this.server
        .to(player.client.id)
        .emit("error", { message: "Not Your Turn", errorCode: 303 });
      return false;
    } catch (e) {
      console.error(e);
    }
  }

  initMove(data: MovePayload, player: User) {
    if (player.sign !== "X" && player.sign !== "O") return;
    const queue = player.sign === "X" ? this.queueX : this.queueO;
    const move = Number(data.move);
    const removed = queue.length === 3 ? queue.shift() : undefined;
    if (removed !== undefined) {
      this.board[removed] = "";
      try {
        this.server.to(this.id).emit("remove", { move: removed.toString() });
      } catch (e) {
        console.error(e);
      }
    }
    this.board[move] = player.sign;
    queue.push(move);
    this.checkWin();
  }
  moveHandler(data: MovePayload, player: User) {
    if (!player) return;
    if (this.isTurn(player)) {
      if (this.isValid(player, data.move)) {
        this.startTurnTimer();
        try {
          player.client.to(this.id).emit("move", {
            move: data.move,
            id: player.client.id,
            username: player.username,
          });
          this.server.to(this.id).emit("time", { lastMoveTimeInSeconds: 0 });
        } catch (e) {
          console.error(e);
        }
        this.initMove(data, player);
        this.turn = player === this.player1 ? this.player2 : this.player1;
        return true;
      }
    }
    return false;
  }
  isPlayer(id: string) {
    return id === this.player1.id || id === this.player2.id;
  }
  getPlayer(id: string) {
    return id === this.player1.id
      ? this.player1
      : id === this.player2.id
      ? this.player2
      : undefined;
  }
}
