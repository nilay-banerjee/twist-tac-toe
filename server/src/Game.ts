import { PlayerInfo, Sign, WinReason } from "../../common/types";
import { chooseMove } from "./bot";
import {
  applyMove,
  createState,
  GameState,
  nextToVanish,
  other,
  winningLine,
} from "./engine";
import { Human, Player } from "./players";
import { GameServer, GameSocket } from "./types";
import { moveSchema } from "./validators";

const SIGNS: Sign[] = ["X", "O"];

type MoveListener = (data: unknown) => void;

export interface GameTimings {
  turnMs: number;
  botDelayMs: number;
}

export class Game {
  private state: GameState = createState("X");
  private players: Record<Sign, Player>;
  private turnEndsAt = 0;
  private turnTimer?: NodeJS.Timeout;
  private botTimer?: NodeJS.Timeout;
  private moveListeners = new Map<Human, MoveListener>();
  private over = false;

  constructor(
    private server: GameServer,
    readonly id: string,
    first: Player,
    second: Player,
    private timings: GameTimings,
    private onEnd: (game: Game) => void
  ) {
    const [x, o] = Math.random() < 0.5 ? [first, second] : [second, first];
    this.players = { X: x, O: o };
  }

  private get fadingHidden() {
    return this.playerList.some(
      (player) => player.kind === "bot" && player.difficulty === "hard"
    );
  }

  get playerList(): [Player, Player] {
    return [this.players.X, this.players.O];
  }

  private get humans(): Human[] {
    return this.playerList.flatMap((player) =>
      player.kind === "human" ? [player] : []
    );
  }

  private signOf(id: string) {
    return SIGNS.find((sign) => this.players[sign].id === id);
  }

  hasPlayer(id: string) {
    return this.signOf(id) !== undefined;
  }

  playerById(id: string) {
    const sign = this.signOf(id);
    return sign && this.players[sign];
  }

  opponentOf(id: string) {
    const sign = this.signOf(id);
    return sign && this.players[other(sign)];
  }

  start() {
    console.log(
      "Game",
      this.id,
      "created",
      this.players.X.username,
      "vs",
      this.players.O.username
    );
    for (const sign of SIGNS) {
      const player = this.players[sign];
      if (player.kind !== "human") continue;
      player.client.join(this.id);
      this.listenForMoves(player);
      this.server.to(player.id).emit("init", {
        gameId: this.id,
        you: this.info(sign),
        opponent: this.info(other(sign)),
        fadingHidden: this.fadingHidden,
      });
    }
    this.startTurn();
  }

  reattach(client: GameSocket) {
    const player = this.humans.find((human) => human.id === client.id);
    if (!player) return;
    const listener = this.moveListeners.get(player);
    if (listener) player.client.off("move", listener);
    player.client = client;
    this.listenForMoves(player);
  }

  rename(id: string, username: string) {
    const player = this.humans.find((human) => human.id === id);
    if (!player) return;
    player.username = username;
    this.server.to(this.id).emit("playerRenamed", { id, username });
  }

  playerLeft(id: string) {
    const sign = this.signOf(id);
    if (sign) this.finish(other(sign), "left", null);
  }

  dispose() {
    this.clearTimers();
    for (const [player, listener] of this.moveListeners) {
      player.client.off("move", listener);
    }
    this.moveListeners.clear();
    for (const player of this.humans) player.client.leave(this.id);
  }

  private info(sign: Sign): PlayerInfo {
    const player = this.players[sign];
    return {
      id: player.id,
      username: player.username,
      sign,
      isBot: player.kind === "bot",
    };
  }

  private listenForMoves(player: Human) {
    const listener: MoveListener = (data) => {
      const payload = moveSchema.safeParse(data);
      if (payload.success) this.handleMove(player, payload.data.cell);
    };
    player.client.on("move", listener);
    this.moveListeners.set(player, listener);
  }

  private handleMove(player: Human, cell: number) {
    if (this.over) return;
    if (this.players[this.state.turn] !== player) {
      return this.sendError(player, "It's not your turn.", 303);
    }
    if (this.state.board[cell] !== "") {
      return this.sendError(player, "That cell is taken.", 304);
    }
    this.play(cell);
  }

  private sendError(player: Human, message: string, errorCode: number) {
    this.server.to(player.id).emit("error", { message, errorCode });
  }

  private play(cell: number) {
    const mover = this.state.turn;
    this.state = applyMove(this.state, cell);
    const line = winningLine(this.state.board, mover);
    if (line) this.finish(mover, "line", line);
    else this.startTurn();
  }

  private startTurn() {
    this.clearTimers();
    this.turnEndsAt = Date.now() + this.timings.turnMs;
    this.turnTimer = setTimeout(
      () => this.finish(other(this.state.turn), "timeout", null),
      this.timings.turnMs
    );
    this.emitBoard();
    const player = this.players[this.state.turn];
    if (player.kind === "bot") {
      this.botTimer = setTimeout(
        () => this.play(chooseMove(this.state, player.difficulty)),
        this.timings.botDelayMs
      );
    }
  }

  private emitBoard() {
    this.server.to(this.id).emit("board", {
      board: [...this.state.board],
      turnId: this.over ? "" : this.players[this.state.turn].id,
      nextToVanish: this.fadingHidden
        ? { X: null, O: null }
        : nextToVanish(this.state),
      turnEndsInMs: this.over ? 0 : Math.max(0, this.turnEndsAt - Date.now()),
    });
  }

  private finish(winnerSign: Sign, reason: WinReason, line: number[] | null) {
    if (this.over) return;
    this.over = true;
    this.clearTimers();
    const winner = this.players[winnerSign];
    console.log("Game", this.id, "won by", winner.username, `(${reason})`);
    this.emitBoard();
    this.server.to(this.id).emit("win", { winnerId: winner.id, reason, line });
    this.onEnd(this);
  }

  private clearTimers() {
    clearTimeout(this.turnTimer);
    clearTimeout(this.botTimer);
  }
}
