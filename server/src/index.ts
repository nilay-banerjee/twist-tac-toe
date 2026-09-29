require("dotenv").config();
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { ClientToServerEvents, ServerToClientEvents } from "../../common/types";
import { GameManager } from "./GameManager";
import cors from "cors";

const PORT = Number(process.env.PORT) || 8080;
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost";

const gameManager = new GameManager();

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = new Server<ClientToServerEvents, ServerToClientEvents>(server, {
  maxHttpBufferSize: 10_000,
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

export function removeGame(gameId: string) {
  gameManager.closeGame({ gameId });
}
app.get("/", (req, res) => {
  res.json({ msg: "Hello From Server" });
});
io.on("connection", (socket) => {
  console.log(socket.id, "connected");
  gameManager.handleConnection(io, socket);
});
io.engine.on("connection_error", (err) => {
  console.error("Connection error", err.code, err.message);
});

server.listen(PORT, () => {
  console.log(`Server Running on  ${BACKEND_URL}:${PORT}`);
});
