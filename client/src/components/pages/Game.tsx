import { useEffect, useRef, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { toast } from "sonner"
import { Board } from "@/components/Board"
import { GameHeading } from "@/components/GameHeading"
import { PlayerCard } from "@/components/PlayerCard"
import { ResultPanel } from "@/components/ResultPanel"
import { Button } from "@/components/ui/button"
import { confettiFireworksHandler } from "@/components/util/confetti-fireworks-handler"
import { ConfettiEmojiHandler } from "@/components/util/confetti-emoji-handler"
import { socket } from "@/socket"
import { Session } from "@/App"
import { describeWin } from "../../../../common/messages"
import { Cell, ErrorEventType } from "../../../../common/types"

const EMPTY_BOARD: Cell[] = Array(9).fill("")
const NOTHING_VANISHING = { X: null, O: null }
const CONFIRM_LEAVE_MS = 3000

export function Game({
    session,
    onRematch,
    onLeave,
}: {
    session: Session
    onRematch: () => void
    onLeave: () => void
}) {
    const { gameId } = useParams()
    const navigate = useNavigate()
    const [confirmLeave, setConfirmLeave] = useState(false)
    const { game, board, win, rematch } = session
    const inGame = useRef(false)
    inGame.current = game !== null && game.gameId === gameId

    useEffect(() => {
        function onError(data: ErrorEventType) {
            toast.error(data.message)
        }
        function onReconnect() {
            if (socket.recovered || !inGame.current) return
            toast.error("Connection lost, so the game has ended.")
            onLeave()
            navigate("/")
        }
        socket.on("error", onError)
        socket.on("connect", onReconnect)
        return () => {
            socket.off("error", onError)
            socket.off("connect", onReconnect)
        }
    }, [onLeave, navigate])

    const youId = game?.you.id
    useEffect(() => {
        if (!win || !youId) return
        if (win.winnerId === youId) confettiFireworksHandler()
        else ConfettiEmojiHandler(["💩", "🧻", "🚽", "🤮"])
    }, [win, youId])

    useEffect(() => {
        if (!confirmLeave) return
        const timer = setTimeout(() => setConfirmLeave(false), CONFIRM_LEAVE_MS)
        return () => clearTimeout(timer)
    }, [confirmLeave])

    function goHome() {
        onLeave()
        navigate("/")
    }

    function leave() {
        if (confirmLeave) goHome()
        else setConfirmLeave(true)
    }

    if (!game || game.gameId !== gameId) {
        return (
            <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 pb-12">
                <GameHeading compact />
                <section className="flex w-full flex-col items-center gap-3 rounded-xl border border-border p-5 text-center">
                    <h1 className="text-xl font-bold">
                        This game isn't available
                    </h1>
                    <p className="text-muted-foreground">
                        It has ended, or this page was reloaded. Reloading
                        starts a new connection, so the game can't continue.
                    </p>
                    <Button onClick={() => navigate("/")}>Home</Button>
                </section>
            </main>
        )
    }

    const myTurn = !win && board?.turnId === game.you.id
    const theirTurn = !win && board?.turnId === game.opponent.id
    const turnEndsAt = board?.turnEndsAt ?? 0
    const [winner, loser] =
        win?.winnerId === game.you.id
            ? [game.you, game.opponent]
            : [game.opponent, game.you]
    const status = win
        ? describeWin(win.reason, winner.username, loser.username)
        : myTurn
          ? "Your turn"
          : `${game.opponent.username}'s turn`

    return (
        <main className="mx-auto flex w-full max-w-xl flex-col items-center gap-4 px-4 pb-8">
            <GameHeading compact />
            <div className="grid w-full grid-cols-2 gap-3">
                <PlayerCard
                    player={game.you}
                    isYou
                    active={myTurn}
                    turnEndsAt={turnEndsAt}
                />
                <PlayerCard
                    player={game.opponent}
                    isYou={false}
                    active={theirTurn}
                    turnEndsAt={turnEndsAt}
                />
            </div>
            <p aria-live="polite" className="h-7 text-lg font-bold">
                {status}
            </p>
            <Board
                board={board?.board ?? EMPTY_BOARD}
                nextToVanish={board?.nextToVanish ?? NOTHING_VANISHING}
                line={win?.line ?? null}
                mySign={game.you.sign}
                canPlay={myTurn}
                onPlay={(cell) => socket.emit("move", { cell })}
            />
            {win ? (
                <ResultPanel
                    win={win}
                    youId={game.you.id}
                    opponent={game.opponent}
                    rematch={rematch}
                    onRematch={onRematch}
                    onHome={goHome}
                />
            ) : (
                <>
                    <p className="text-center text-sm text-muted-foreground">
                        {game.fadingHidden
                            ? "Hard mode: marks don't fade here, so keep track of which is oldest."
                            : "Faded marks disappear on that player's next move."}
                    </p>
                    <Button variant="ghost" size="sm" onClick={leave}>
                        {confirmLeave ? "Tap again to forfeit" : "Leave game"}
                    </Button>
                </>
            )}
        </main>
    )
}
