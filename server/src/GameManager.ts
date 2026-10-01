import { randomInt } from "crypto";
import { GAME_ID_ALPHABET, GAME_ID_LENGTH } from "../../common/constants";
import {
  JoinGamePayload,
  PlayBotPayload,
  UsernamePayload,
} from "../../common/types";
import { Game, GameTimings } from "./Game";
import { Bot, Human, Player } from "./players";
import { GameServer, GameSocket } from "./types";
import { joinGameSchema, playBotSchema, usernameSchema } from "./validators";

const DEFAULT_USERNAME = "Player";
// The shown online count is padded so a quiet lobby doesn't look empty.
const ONLINE_PADDING_MIN = 10;
const ONLINE_PADDING_MAX = 13;

export interface ServerOptions extends GameTimings {
  reconnectGraceMs: number;
  rematchWindowMs: number;
}

interface Waiting {
  gameId: string;
  player: Human;
}

interface Finished {
  game: Game;
  wants: Set<string>;
  expiry: NodeJS.Timeout;
}

export class GameManager {
  private quickMatch: Waiting | null = null;
  private privateGames = new Map<string, Human>();
  private games = new Map<string, Game>();
  private finished = new Map<string, Finished>();
  private leaveTimers = new Map<string, NodeJS.Timeout>();
  private onlinePadding = randomInt(ONLINE_PADDING_MIN, ONLINE_PADDING_MAX + 1);

  constructor(
    private server: GameServer,
    private options: ServerOptions
  ) {}

  handleConnection(client: GameSocket) {
    if (client.recovered) {
      console.log(client.id, "reconnected");
      this.reattach(client);
    } else {
      console.log(client.id, "connected");
    }
    this.broadcastOnline();
    client.on("disconnect", (reason) => {
      console.log(client.id, "disconnected:", reason);
      this.broadcastOnline();
      if (reason === "client namespace disconnect") {
        this.leave(client.id);
        return;
      }
      this.leaveTimers.set(
        client.id,
        setTimeout(() => {
          this.leaveTimers.delete(client.id);
          this.leave(client.id);
        }, this.options.reconnectGraceMs)
      );
    });
    client.on("createGame", (data: unknown) => {
      const payload = usernameSchema.safeParse(data);
      if (payload.success) this.createGame(payload.data, client);
    });
    client.on("joinGame", (data: unknown) => {
      const payload = joinGameSchema.safeParse(data);
      if (payload.success) this.joinGame(payload.data, client);
    });
    client.on("joinRandomGame", (data: unknown) => {
      const payload = usernameSchema.safeParse(data);
      if (payload.success) this.joinRandomGame(payload.data, client);
    });
    client.on("playBot", (data: unknown) => {
      const payload = playBotSchema.safeParse(data);
      if (payload.success) this.playBot(payload.data, client);
    });
    client.on("cancel", () => this.cancel(client.id));
    client.on("leave", () => this.leave(client.id));
    client.on("rematch", () => this.rematch(client));
    client.on("rename", (data: unknown) => {
      const payload = usernameSchema.safeParse(data);
      if (payload.success && payload.data.username) {
        this.rename(client.id, payload.data.username);
      }
    });
  }

  private createGame(data: UsernamePayload, client: GameSocket) {
    const existing = this.findPrivateGame(client.id);
    if (existing) {
      this.sendWaiting(client, existing.gameId, existing.player.username);
      return;
    }
    this.cancel(client.id);
    const gameId = this.newGameId();
    const player = new Human(client, data.username || DEFAULT_USERNAME);
    this.privateGames.set(gameId, player);
    this.sendWaiting(client, gameId, player.username);
  }

  private joinGame(data: JoinGamePayload, client: GameSocket) {
    const { gameId } = data;
    const host =
      this.quickMatch?.gameId === gameId
        ? this.quickMatch.player
        : this.privateGames.get(gameId);
    if (!host) {
      this.sendError(
        client,
        "No room with that code is waiting for a player.",
        404
      );
      return;
    }
    if (host.id === client.id) {
      this.sendError(
        client,
        "That's your own room. Send the code to a friend instead.",
        400
      );
      return;
    }
    this.cancel(client.id);
    this.privateGames.delete(gameId);
    if (this.quickMatch?.gameId === gameId) this.quickMatch = null;
    const guest = new Human(client, data.username || DEFAULT_USERNAME);
    this.startGame(gameId, host, guest);
  }

  private joinRandomGame(data: UsernamePayload, client: GameSocket) {
    const username = data.username || DEFAULT_USERNAME;
    if (this.quickMatch?.player.id === client.id) {
      this.sendWaiting(client, this.quickMatch.gameId, username);
      return;
    }
    this.cancel(client.id);
    if (!this.quickMatch) {
      this.quickMatch = {
        gameId: this.newGameId(),
        player: new Human(client, username),
      };
      this.sendWaiting(client, this.quickMatch.gameId, username);
      return;
    }
    const { gameId, player: host } = this.quickMatch;
    this.quickMatch = null;
    this.startGame(gameId, host, new Human(client, username));
  }

  private playBot(data: PlayBotPayload, client: GameSocket) {
    this.cancel(client.id);
    const human = new Human(client, data.username || DEFAULT_USERNAME);
    this.startGame(this.newGameId(), human, new Bot(data.difficulty));
  }

  private startGame(gameId: string, first: Player, second: Player) {
    const game = new Game(
      this.server,
      gameId,
      first,
      second,
      this.options,
      (ended) => this.onGameEnd(ended)
    );
    this.games.set(gameId, game);
    game.start();
  }

  private onGameEnd(game: Game) {
    this.games.delete(game.id);
    this.finished.set(game.id, {
      game,
      wants: new Set(),
      expiry: setTimeout(
        () => this.closeFinished(game.id),
        this.options.rematchWindowMs
      ),
    });
  }

  private closeFinished(gameId: string) {
    const entry = this.finished.get(gameId);
    if (!entry) return;
    clearTimeout(entry.expiry);
    entry.game.dispose();
    this.finished.delete(gameId);
    console.log("Game", gameId, "closed");
  }

  private rematch(client: GameSocket) {
    const entry = this.findFinished(client.id);
    if (!entry) {
      client.emit("rematchUnavailable", {
        message: "This game can't be restarted anymore",
      });
      return;
    }
    entry.wants.add(client.id);
    const opponent = entry.game.opponentOf(client.id);
    if (!opponent) return;
    if (opponent.kind === "bot" || entry.wants.has(opponent.id)) {
      const [first, second] = entry.game.playerList;
      this.closeFinished(entry.game.id);
      this.startGame(this.newGameId(), first, second);
      return;
    }
    this.server.to(opponent.id).emit("rematchOffered", {
      username: entry.game.playerById(client.id)?.username ?? DEFAULT_USERNAME,
    });
  }

  private rename(clientId: string, username: string) {
    const apply = (player: Human) => {
      if (player.id === clientId) player.username = username;
    };
    if (this.quickMatch) apply(this.quickMatch.player);
    this.privateGames.forEach(apply);
    for (const game of this.games.values()) game.rename(clientId, username);
    for (const { game } of this.finished.values()) {
      game.rename(clientId, username);
    }
  }

  private cancel(clientId: string) {
    if (this.quickMatch?.player.id === clientId) this.quickMatch = null;
    for (const [gameId, host] of this.privateGames) {
      if (host.id === clientId) this.privateGames.delete(gameId);
    }
  }

  private leave(clientId: string) {
    this.cancel(clientId);
    for (const game of this.games.values()) {
      if (game.hasPlayer(clientId)) game.playerLeft(clientId);
    }
    const entry = this.findFinished(clientId);
    if (!entry) return;
    const opponent = entry.game.opponentOf(clientId);
    const leaver = entry.game.playerById(clientId);
    if (opponent?.kind === "human" && leaver) {
      this.server.to(opponent.id).emit("rematchUnavailable", {
        message: `${leaver.username} left`,
      });
    }
    this.closeFinished(entry.game.id);
  }

  private reattach(client: GameSocket) {
    clearTimeout(this.leaveTimers.get(client.id));
    this.leaveTimers.delete(client.id);
    const swap = (player: Human) => {
      if (player.id === client.id) player.client = client;
    };
    if (this.quickMatch) swap(this.quickMatch.player);
    this.privateGames.forEach(swap);
    for (const game of this.games.values()) game.reattach(client);
    for (const { game } of this.finished.values()) game.reattach(client);
  }

  private broadcastOnline() {
    this.onlinePadding = Math.min(
      ONLINE_PADDING_MAX,
      Math.max(ONLINE_PADDING_MIN, this.onlinePadding + randomInt(-1, 2))
    );
    this.server.emit("online", {
      count: this.server.of("/").sockets.size + this.onlinePadding,
    });
  }

  private sendWaiting(client: GameSocket, gameId: string, username: string) {
    client.emit("gameJoined", {
      username,
      id: client.id,
      gameId,
      message: "Waiting for another player to join",
      playersJoined: 1,
    });
  }

  private sendError(client: GameSocket, message: string, errorCode: number) {
    client.emit("error", { message, errorCode });
  }

  private findPrivateGame(clientId: string) {
    for (const [gameId, player] of this.privateGames) {
      if (player.id === clientId) return { gameId, player };
    }
  }

  private findFinished(clientId: string) {
    return [...this.finished.values()].find((entry) =>
      entry.game.hasPlayer(clientId)
    );
  }

  private newGameId() {
    let gameId: string;
    do {
      gameId = Array.from(
        { length: GAME_ID_LENGTH },
        () => GAME_ID_ALPHABET[randomInt(GAME_ID_ALPHABET.length)]
      ).join("");
    } while (this.isTaken(gameId));
    return gameId;
  }

  private isTaken(gameId: string) {
    return (
      this.quickMatch?.gameId === gameId ||
      this.privateGames.has(gameId) ||
      this.games.has(gameId) ||
      this.finished.has(gameId)
    );
  }
}
