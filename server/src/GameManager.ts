import { JoinGamePayload, UsernamePayload } from "../../common/types";
import { Game } from "./Game";
import { GameServer, GameSocket } from "./types";
import { User } from "./User";
import { joinGameSchema, usernameSchema } from "./validators";

export class GameManager {
  private server: GameServer;
  private randomPlayerWaiting: User;
  private pendingPlayers = new Map<string, User>();
  private games = new Map<string, Game>();
  private rooms = new Set<string>();
  constructor() {
    this.randomPlayerWaiting = {} as User;
    this.server = {} as GameServer;
  }
  generateGameId() {
    return Math.random().toString(36).substring(5, 11).toUpperCase();
  }
  generateUniqueGameID() {
    let gameId;
    do {
      gameId = this.generateGameId();
    } while (this.rooms.has(gameId));
    return gameId;
  }

  private findPendingPlayer(clientId: string) {
    return [...this.pendingPlayers.values()].find(
      (player) => player.id === clientId
    );
  }

  handleConnection(server: GameServer, client: GameSocket) {
    this.server = server;
    client.on("disconnect", () => {
      if (this.randomPlayerWaiting.id === client.id) {
        this.rooms.delete(this.randomPlayerWaiting.gameId);
        this.randomPlayerWaiting = {} as User;
      }
      const pendingPlayer = this.findPendingPlayer(client.id);
      if (pendingPlayer) this.closeGame({ gameId: pendingPlayer.gameId });
      [...this.games.values()]
        .filter((game) => game.isPlayer(client.id))
        .forEach((game) => game.playerLeft(client.id));
      console.log(client.id, "disconnected");
    });
    client.on("createGame", (data: unknown) => {
      const payload = usernameSchema.safeParse(data);
      if (!payload.success) return;
      this.createGameHandler(payload.data, client);
    });
    client.on("joinGame", (data: unknown) => {
      const payload = joinGameSchema.safeParse(data);
      if (!payload.success) return;
      this.joinGameHandler(payload.data, client);
    });
    client.on("joinRandomGame", (data: unknown) => {
      const payload = usernameSchema.safeParse(data);
      if (!payload.success) return;
      this.joinRandomGameHandler(payload.data, client);
    });
  }

  joinRandomGameHandler(data: UsernamePayload, client: GameSocket) {
    if (this.randomPlayerWaiting.id === client.id) {
      this.server.to(this.randomPlayerWaiting.gameId).emit("gameJoined", {
        username: this.randomPlayerWaiting.username,
        id: this.randomPlayerWaiting.id,
        gameId: this.randomPlayerWaiting.gameId,
        message: "Waiting For Another Player To Join!",
        playersJoined: 1,
      });
      return;
    }
    //TODO: logic to send gameJoined Msg to the 2nd player who joins the game and send multiple requests
    const game = [...this.games.values()].find((game) =>
      game.isPlayer(client.id)
    );
    if (game) {
      const player = game.getPlayer(client.id);
      if (!player) return;
      this.server.to(player.gameId).emit("gameJoined", {
        username: player.username,
        id: player.id,
        gameId: player.gameId,
        message: "Another Player Joined!",
        playersJoined: 2,
      });
      return;
    }
    const username = data.username || "NooBIE";
    if (!this.randomPlayerWaiting.id) {
      const gameId = this.generateUniqueGameID();
      this.randomPlayerWaiting = new User(client, username, gameId, client.id);
      this.randomPlayerWaiting.client.join(gameId);
      this.server.to(gameId).emit("gameJoined", {
        username: this.randomPlayerWaiting.username,
        id: this.randomPlayerWaiting.id,
        gameId: gameId,
        message: "Waiting For Another Player To Join!",
        playersJoined: 1,
      });
      this.rooms.add(gameId);
      return;
    }
    const gameId = this.randomPlayerWaiting.gameId;
    if (
      this.rooms.has(gameId) &&
      this.randomPlayerWaiting.id != client.id
    ) {
      const player = new User(client, username, gameId, client.id);
      player.client.join(gameId);
      this.server.to(gameId).emit("gameJoined", {
        username,
        id: player.id,
        gameId,
        message: "Another Player Joined!",
        playersJoined: 2,
      });
      const game = new Game(
        this.server,
        gameId,
        this.randomPlayerWaiting,
        player
      );
      this.games.set(gameId, game);
      this.randomPlayerWaiting = {} as User;
      game.gameHandler();
    } else {
      client.emit("error", {
        message: "Game ID not Found",
        errorCode: 404,
      });
    }
  }
  createGameHandler(data: UsernamePayload, client: GameSocket) {
    let pendingPlayer = this.findPendingPlayer(client.id);
    if (pendingPlayer) {
      this.server.to(pendingPlayer.gameId).emit("gameJoined", {
        username: pendingPlayer.username,
        id: pendingPlayer.id,
        gameId: pendingPlayer.gameId,
        message: "Waiting For Another Player To Join!",
        playersJoined: 1,
      });
      return;
    }
    const username = data.username || "NooBIE";
    const gameId = this.generateUniqueGameID();
    pendingPlayer = new User(client, username, gameId, client.id);
    pendingPlayer.client.join(gameId);
    this.server.to(gameId).emit("gameJoined", {
      username,
      id: pendingPlayer.id,
      gameId: gameId,
      message: "Waiting For Another Player To Join!",
      playersJoined: 1,
    });
    this.pendingPlayers.set(gameId, pendingPlayer);
    this.rooms.add(gameId);
  }

  joinGameHandler(data: JoinGamePayload, client: GameSocket) {
    const { gameId } = data;
    const username = data.username || "NooBIE";
    const pendingPlayer =
      this.randomPlayerWaiting.gameId === gameId
        ? this.randomPlayerWaiting
        : this.pendingPlayers.get(gameId);

    if (!pendingPlayer) {
      client.emit("error", {
        message: "Game ID not Found",
        errorCode: 404,
      });
      return;
    }
    if (pendingPlayer.id === client.id) {
      client.emit("error", {
        message: "Cannot Join Your Own Game",
        errorCode: 400,
      });
      return;
    }

    const player = new User(client, username, gameId, client.id);
    player.client.join(gameId);
    this.server.to(gameId).emit("gameJoined", {
      username,
      id: player.id,
      gameId,
      message: "Another Player Joined!",
      playersJoined: 2,
    });
    const game = new Game(this.server, gameId, pendingPlayer, player);
    this.games.set(gameId, game);
    game.gameHandler();
    this.pendingPlayers.delete(gameId);
    if (this.randomPlayerWaiting.gameId === gameId) {
      this.randomPlayerWaiting = {} as User;
    }
  }
  closeGame(data: { gameId: string }) {
    const { gameId } = data;
    this.rooms.delete(gameId);
    this.games.delete(gameId);
    this.pendingPlayers.delete(gameId);
    console.log("Game", gameId, "closed");
  }
}
