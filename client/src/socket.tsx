import { io, Socket } from "socket.io-client"
import { ClientToServerEvents, ServerToClientEvents } from "../../common/types"
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
const URL = `${BACKEND_URL || "http://localhost:8080"}`

export const socket: Socket<ServerToClientEvents, ClientToServerEvents> =
    io(URL)
