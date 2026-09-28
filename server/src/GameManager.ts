import { Server, Socket } from "socket.io";
import { Game } from "./Game";
import { User } from "./User";
import {
  JoinGamePayload,
  joinGameSchema,
  UsernamePayload,
  usernameSchema,
} from "./validators";

export class GameManager {
  private server: Server;
  private randomPlayerWaiting: User;
  private pendingPlayers: User[];
  private games: Game[];
  private rooms: string[];
  constructor() {
    this.randomPlayerWaiting = {} as User;
    this.server = {} as Server;
    this.pendingPlayers = [];
    this.games = [];
    this.rooms = [];
  }
  private logData() {
    console.log("Games: ", this.games.length, this.games);
    console.log("Rooms: ", this.rooms.length, this.rooms);
    console.log(
      "Pending Player: ",
      this.pendingPlayers.length,
      this.pendingPlayers.map((player) => player.username)
    );
    console.log("Random Player: ", this.randomPlayerWaiting);
  }
  generateGameId() {
    return Math.random().toString(36).substring(5, 11).toUpperCase();
  }
  generateUniqueGameID() {
    let gameId;
    do {
      gameId = this.generateGameId();
    } while (this.rooms.includes(gameId));
    return gameId;
  }

  handleConnection(server: Server, client: Socket) {
    this.server = server;
    client.on("disconnect", () => {
      this.rooms = this.rooms.filter(
        (room) => room !== this.randomPlayerWaiting.gameId
      );
      if (this.randomPlayerWaiting.id === client.id) {
        this.randomPlayerWaiting = {} as User;
      }
      console.log(`${client.id} Disconnected\n`);
    });
    client.on("createGame", (data) => {
      const payload = usernameSchema.safeParse(data);
      if (!payload.success) return;
      this.createGameHandler(payload.data, client);
    });
    client.on("joinGame", (data) => {
      const payload = joinGameSchema.safeParse(data);
      if (!payload.success) return;
      this.joinGameHandler(payload.data, client);
    });
    client.on("joinRandomGame", (data) => {
      const payload = usernameSchema.safeParse(data);
      if (!payload.success) return;
      this.joinRandomGameHandler(payload.data, client);
    });
  }

  joinRandomGameHandler(data: UsernamePayload, client: Socket) {
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
    const game = this.games.find((game) => game.isPlayer(client.id));
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
      this.rooms.push(gameId);
      return;
    }
    const gameId = this.randomPlayerWaiting.gameId;
    if (
      this.rooms.includes(gameId) &&
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
      this.games.push(game);
      this.randomPlayerWaiting = {} as User;
      game.gameHandler();
    } else {
      client.emit("error", {
        message: "Game ID not Found",
        errorCode: "404",
      });
    }
  }
  createGameHandler(data: UsernamePayload, client: Socket) {
    let pendingPlayer = this.pendingPlayers.find(
      (player) => player.id === client.id
    );
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
    this.pendingPlayers.push(pendingPlayer);
    this.rooms.push(gameId);
  }

  joinGameHandler(data: JoinGamePayload, client: Socket) {
    const { gameId } = data;
    const username = data.username || "NooBIE";
    const pendingPlayer =
      this.randomPlayerWaiting.gameId === gameId
        ? this.randomPlayerWaiting
        : this.pendingPlayers.find((player) => player.gameId === gameId);

    if (!pendingPlayer) {
      client.emit("error", {
        message: "Game ID not Found",
        errorCode: "404",
      });
      return;
    }
    if (pendingPlayer.id === client.id) {
      client.emit("error", {
        message: "Cannot Join Your Own Game",
        errorCode: "400",
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
    this.games.push(game);
    game.gameHandler();
    this.pendingPlayers = this.pendingPlayers.filter(
      (player) => player.gameId !== gameId
    );
    if (this.randomPlayerWaiting.gameId === gameId) {
      this.randomPlayerWaiting = {} as User;
    }
  }
  closeGame(data: { gameId: string }) {
    const { gameId } = data;
    if (this.rooms.includes(gameId)) {
      this.rooms = this.rooms.filter((room) => room !== gameId);
    }
    this.games = this.games.filter((game) => game.id !== gameId);
    this.pendingPlayers = this.pendingPlayers.filter(
      (player) => player.gameId !== gameId
    );
    console.log("Game Closed", gameId);
    this.logData();
  }
}
