import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Share2 } from "lucide-react"
import { socket } from "@/socket"
import { Loading } from "@/components/ui/loading"
import { Button } from "@/components/ui/button"
import { GameHeading } from "@/components/GameHeading"
import { CopyButton } from "@/components/CopyButton"
import { DifficultyPicker } from "@/components/DifficultyPicker"
import { Difficulty, GameJoinedEventType } from "../../../../common/types"

const BOT_OFFER_DELAY_MS = 5_000

export function Create({
    username,
    waiting,
    online,
    randomGame,
    onCancel,
}: {
    username: string
    waiting: GameJoinedEventType | null
    online: number
    randomGame: boolean
    onCancel: () => void
}) {
    const navigate = useNavigate()
    const [offerBot, setOfferBot] = useState(false)
    const usernameRef = useRef(username)
    const onCancelRef = useRef(onCancel)

    useEffect(() => {
        function request() {
            const payload = { username: usernameRef.current }
            if (randomGame) socket.emit("joinRandomGame", payload)
            else socket.emit("createGame", payload)
        }
        const cancel = onCancelRef.current
        function onConnect() {
            if (!socket.recovered) request()
        }
        request()
        socket.on("connect", onConnect)
        const botOffer = randomGame
            ? setTimeout(() => setOfferBot(true), BOT_OFFER_DELAY_MS)
            : undefined
        return () => {
            clearTimeout(botOffer)
            setOfferBot(false)
            socket.off("connect", onConnect)
            cancel()
        }
    }, [randomGame])

    function playBot(difficulty: Difficulty) {
        socket.emit("playBot", { username, difficulty })
    }

    const gameId = waiting && waiting.id === socket.id ? waiting.gameId : null
    const link = gameId ? `${window.location.origin}/join/${gameId}` : ""
    const canShare = typeof navigator.share === "function"

    return (
        <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 pb-12">
            <GameHeading compact />
            <section className="flex w-full flex-col items-center gap-4 rounded-xl border border-border p-5 text-center">
                {randomGame ? (
                    <>
                        <h1 className="text-xl font-bold">
                            Looking for an opponent
                        </h1>
                        <Loading />
                        <p className="text-sm text-muted-foreground">
                            {online} players online
                        </p>
                    </>
                ) : (
                    <>
                        <h1 className="text-xl font-bold">Invite a friend</h1>
                        {gameId ? (
                            <>
                                <p className="text-muted-foreground">
                                    Send them this link, or read out the code.
                                </p>
                                <div className="select-all text-4xl font-bold tracking-[0.3em]">
                                    {gameId}
                                </div>
                                <div className="flex flex-wrap justify-center gap-2">
                                    <CopyButton text={link} label="Copy link" />
                                    {canShare && (
                                        <Button
                                            variant="outline"
                                            onClick={() =>
                                                navigator
                                                    .share({
                                                        title: "Twist Tac Toe",
                                                        text: "Play Twist Tac Toe with me",
                                                        url: link,
                                                    })
                                                    .catch(() => {})
                                            }
                                        >
                                            <Share2 className="mr-2 size-4" />
                                            Share
                                        </Button>
                                    )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    The game starts as soon as they join.
                                </p>
                            </>
                        ) : (
                            <Loading />
                        )}
                    </>
                )}
            </section>
            {randomGame && offerBot && (
                <section className="flex w-full flex-col gap-3 rounded-xl border border-border p-4">
                    <h2 className="font-bold">
                        Nobody free? Play the computer instead
                    </h2>
                    <DifficultyPicker onPick={playBot} />
                </section>
            )}
            <Button variant="ghost" onClick={() => navigate("/")}>
                Cancel
            </Button>
        </main>
    )
}
