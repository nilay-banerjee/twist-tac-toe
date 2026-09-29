import cors from "cors";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { TURN_SECONDS } from "../../common/constants";
import { ClientToServerEvents, ServerToClientEvents } from "../../common/types";
import { GameManager, ServerOptions } from "./GameManager";

export const DEFAULT_OPTIONS: ServerOptions = {
  turnMs: TURN_SECONDS * 1000,
  botDelayMs: 700,
  reconnectGraceMs: 10_000,
  rematchWindowMs: 60_000,
};

export function createApp(clientUrl: string, options = DEFAULT_OPTIONS) {
  const app = express();
  app.use(cors({ origin: clientUrl }));
  app.get("/", (req, res) => {
    res.json({ msg: "Hello From Server" });
  });

  const httpServer = http.createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(
    httpServer,
    {
      maxHttpBufferSize: 10_000,
      connectionStateRecovery: {
        maxDisconnectionDuration: options.reconnectGraceMs,
      },
      cors: {
        origin: clientUrl,
        methods: ["GET", "POST"],
      },
    }
  );

  const gameManager = new GameManager(io, options);
  io.on("connection", (socket) => gameManager.handleConnection(socket));
  io.engine.on("connection_error", (err) => {
    console.error("Connection error", err.code, err.message);
  });

  return { httpServer, io };
}
