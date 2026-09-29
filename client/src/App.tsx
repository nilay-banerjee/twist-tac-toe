import { useEffect, useState } from "react"
import { BrowserRouter, Route, Routes, useNavigate } from "react-router-dom"
import { MotionConfig } from "framer-motion"
import { ThemeProvider } from "@/components/util/themeProvider"
import { Appbar } from "@/components/Appbar"
import { Landing } from "@/components/pages/Landing"
import { Game } from "@/components/pages/Game"
import { Create } from "@/components/pages/Create"
import { Join } from "@/components/pages/Join"
import {
    cleanUsername,
    loadUsername,
    randomUsername,
    saveUsername,
} from "@/lib/username"
import { socket } from "./socket"
import {
    BoardEventType,
    GameJoinedEventType,
    InitEventType,
    PlayerInfo,
    PlayerRenamedEventType,
    WinEventType,
} from "../../common/types"

export type BoardState = BoardEventType & { turnEndsAt: number }

export interface RematchState {
    requested: boolean
    offeredBy: string | null
    unavailable: string | null
}

export interface Session {
    game: InitEventType | null
    board: BoardState | null
    win: WinEventType | null
    rematch: RematchState
}

const EMPTY_SESSION: Session = {
    game: null,
    board: null,
    win: null,
    rematch: { requested: false, offeredBy: null, unavailable: null },
}

function FollowGame({ gameId }: { gameId?: string }) {
    const navigate = useNavigate()
    useEffect(() => {
        if (gameId) navigate(`/game/${gameId}`)
    }, [gameId, navigate])
    return null
}

function App() {
    const [username, setUsername] = useState(loadUsername)
    const [waiting, setWaiting] = useState<GameJoinedEventType | null>(null)
    const [online, setOnline] = useState(0)
    const [session, setSession] = useState<Session>(EMPTY_SESSION)

    useEffect(() => {
        saveUsername(username)
    }, [username])

    useEffect(() => {
        const onGameJoined = (data: GameJoinedEventType) => setWaiting(data)
        const onInit = (data: InitEventType) => {
            setWaiting(null)
            setSession({ ...EMPTY_SESSION, game: data })
        }
        const onBoard = (data: BoardEventType) =>
            setSession((s) => ({
                ...s,
                board: { ...data, turnEndsAt: Date.now() + data.turnEndsInMs },
            }))
        const onWin = (data: WinEventType) =>
            setSession((s) => ({ ...s, win: data }))
        const onRematchOffered = ({ username }: { username: string }) =>
            setSession((s) => ({
                ...s,
                rematch: { ...s.rematch, offeredBy: username },
            }))
        const onRematchUnavailable = ({ message }: { message: string }) =>
            setSession((s) => ({
                ...s,
                rematch: {
                    requested: false,
                    offeredBy: null,
                    unavailable: message,
                },
            }))
        const onOnline = ({ count }: { count: number }) => setOnline(count)
        const onPlayerRenamed = ({ id, username }: PlayerRenamedEventType) =>
            setSession((s) => {
                if (!s.game) return s
                const withName = (player: PlayerInfo) =>
                    player.id === id ? { ...player, username } : player
                return {
                    ...s,
                    game: {
                        ...s.game,
                        you: withName(s.game.you),
                        opponent: withName(s.game.opponent),
                    },
                }
            })

        socket.on("gameJoined", onGameJoined)
        socket.on("init", onInit)
        socket.on("board", onBoard)
        socket.on("win", onWin)
        socket.on("rematchOffered", onRematchOffered)
        socket.on("rematchUnavailable", onRematchUnavailable)
        socket.on("online", onOnline)
        socket.on("playerRenamed", onPlayerRenamed)
        return () => {
            socket.off("gameJoined", onGameJoined)
            socket.off("init", onInit)
            socket.off("board", onBoard)
            socket.off("win", onWin)
            socket.off("rematchOffered", onRematchOffered)
            socket.off("rematchUnavailable", onRematchUnavailable)
            socket.off("online", onOnline)
            socket.off("playerRenamed", onPlayerRenamed)
        }
    }, [])

    function rename(name: string) {
        const username = cleanUsername(name) || randomUsername()
        setUsername(username)
        socket.emit("rename", { username })
    }

    function requestRematch() {
        socket.emit("rematch")
        setSession((s) => ({
            ...s,
            rematch: { ...s.rematch, requested: true },
        }))
    }

    function cancelWaiting() {
        socket.emit("cancel")
        setWaiting(null)
    }

    function leaveGame() {
        socket.emit("leave")
        setSession(EMPTY_SESSION)
    }

    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <MotionConfig reducedMotion="user">
                <BrowserRouter>
                    <FollowGame gameId={session.game?.gameId} />
                    <Appbar username={username} onRename={rename} />
                    <Routes>
                        <Route
                            path="/"
                            element={
                                <Landing username={username} online={online} />
                            }
                        />
                        <Route
                            path="/create"
                            element={
                                <Create
                                    username={username}
                                    waiting={waiting}
                                    online={online}
                                    randomGame={false}
                                    onCancel={cancelWaiting}
                                />
                            }
                        />
                        <Route
                            path="/create_random"
                            element={
                                <Create
                                    username={username}
                                    waiting={waiting}
                                    online={online}
                                    randomGame
                                    onCancel={cancelWaiting}
                                />
                            }
                        />
                        <Route
                            path="/join"
                            element={<Join username={username} />}
                        />
                        <Route
                            path="/join/:joinId"
                            element={<Join username={username} />}
                        />
                        <Route
                            path="/game/:gameId"
                            element={
                                <Game
                                    session={session}
                                    onRematch={requestRematch}
                                    onLeave={leaveGame}
                                />
                            }
                        />
                        <Route
                            path="*"
                            element={
                                <Landing username={username} online={online} />
                            }
                        />
                    </Routes>
                </BrowserRouter>
            </MotionConfig>
        </ThemeProvider>
    )
}

export default App
