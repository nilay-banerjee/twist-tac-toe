import { socket } from "@/socket"
import { useEffect, useRef } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { GameHeading } from "@/components/GameHeading"
import SparklesText from "@/components/magicui/sparkles-text"
import { confettiFireworksHandler } from "@/components/util/confetti-fireworks-handler"
import { ConfettiEmojiHandler } from "@/components/util/confetti-emoji-handler"
import { Timer } from "@/components/Timer"
import { TimeEventType, WinEventType } from "../../../../common/types"
const REDIRECT_DURATION = 7
export function Game({
    sign,
    board,
    turn,
    winEvent,
    timeEvent,
}: {
    sign: string
    board: string[]
    turn: boolean
    winEvent: WinEventType
    timeEvent: TimeEventType
}) {
    const interval = useRef<ReturnType<typeof setInterval>>()
    const navigate = useNavigate()
    useEffect(() => {
        function connectHandler() {
            if (socket.recovered) return
            toast.error("Connection lost, the game has ended")
            navigate("/")
        }
        socket.on("connect", connectHandler)
        return () => {
            socket.off("connect", connectHandler)
        }
    }, [])
    useEffect(() => {
        if (!winEvent.winner || winEvent.winner === "") return
        let redirect_Count = REDIRECT_DURATION
        toast.info(winEvent.message, {})
        const id = toast.info(`Redirecting in ${redirect_Count} Seconds`)
        interval.current = setInterval(() => {
            redirect_Count--
            toast.info(`Redirecting in ${redirect_Count} Seconds`, {
                id: id,
            })
            if (redirect_Count === 0) {
                clearInterval(interval.current)
                toast.dismiss()
                navigate("/")
            }
        }, 1000)
        const gameGrid = document.getElementsByClassName("cells")
        for (let i = 0; i < gameGrid.length; i++) {
            const cell = gameGrid.item(i) as HTMLLIElement
            if (cell) {
                cell.style.cursor = "not-allowed"
            }
        }

        if (winEvent.id === socket.id) confettiFireworksHandler()
        else ConfettiEmojiHandler(["💩", "🧻", "🚽", "🤮"])
    }, [winEvent])
    function moveListener(cell: number) {
        if (winEvent.winner || !turn || board[cell]) return
        socket.emit("move", { move: String(cell) })
    }
    return (
        <div>
            <GameHeading />
            {!winEvent.winner && (
                <div className="mt-10 flex flex-row items-center justify-between px-8 text-xl md:px-28 md:text-5xl">
                    <h1 className="text-fuchsia-400">Your Sign: {sign}</h1>
                    <h1>
                        {turn ? (
                            <div className="text-cyan-400">Your Turn</div>
                        ) : (
                            <div className="text-rose-500">Opponents Turn</div>
                        )}
                    </h1>
                </div>
            )}
            {winEvent.winner && (
                <div className="justify-cente mt-8 flex flex-col items-center gap-9">
                    <SparklesText
                        className="text-xl md:text-5xl"
                        text={
                            winEvent.id === socket.id
                                ? "You Won!"
                                : "Game Over! Better Luck Next Time"
                        }
                    />
                    <Link
                        className="text-xl hover:text-cyan-300 md:text-3xl"
                        to={"/"}
                        onClick={() => {
                            clearInterval(interval.current)
                            toast.dismiss()
                        }}
                    >
                        Return To Home Screen
                    </Link>
                </div>
            )}
            {!winEvent.winner && (
                <div className="flex items-center justify-center">
                    <Timer timeEvent={timeEvent} turn={turn} />
                </div>
            )}
            <div className="mt-[10%] flex justify-center">
                <div className="bg-primary-300 p-10">
                    <div className="items-centers grid grid-cols-3 justify-center gap-0">
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pb-3 pr-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                onClick={() => moveListener(0)}
                            >
                                {board[0]}
                            </div>
                            <div className="absolute right-0 h-full w-3 rounded-t-lg bg-ring/95"></div>
                            <div className="absolute bottom-0 h-3 w-full rounded-l-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pb-3 pr-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                onClick={() => moveListener(1)}
                            >
                                {board[1]}
                            </div>
                            <div className="absolute right-0 h-full w-3 rounded-t-lg bg-ring/95"></div>
                            <div className="absolute bottom-0 h-3 w-full bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pb-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                onClick={() => moveListener(2)}
                            >
                                {board[2]}
                            </div>

                            <div className="absolute bottom-0 h-3 w-full rounded-r-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pb-3 pr-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                onClick={() => moveListener(3)}
                            >
                                {board[3]}
                            </div>
                            <div className="absolute right-0 h-full w-3 bg-ring/95"></div>
                            <div className="absolute bottom-0 h-3 w-full rounded-l-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pb-3 pr-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                onClick={() => moveListener(4)}
                            >
                                {board[4]}
                            </div>
                            <div className="absolute right-0 h-full w-3 bg-ring/95"></div>
                            <div className="absolute bottom-0 h-3 w-full bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pb-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                onClick={() => moveListener(5)}
                            >
                                {board[5]}
                            </div>
                            <div className="absolute bottom-0 h-3 w-full rounded-r-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pr-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                onClick={() => moveListener(6)}
                            >
                                {board[6]}
                            </div>
                            <div className="absolute right-0 h-full w-3 rounded-b-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pr-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                onClick={() => moveListener(7)}
                            >
                                {board[7]}
                            </div>
                            <div className="absolute right-0 h-full w-3 rounded-b-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                onClick={() => moveListener(8)}
                            >
                                {board[8]}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
