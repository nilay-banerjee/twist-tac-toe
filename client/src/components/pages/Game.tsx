//  TODO: Compare Moves with Board State, and add a api endpoint to check Board State & update if required.
import { socket } from "@/socket"
import React, { useEffect } from "react"
import { Link, useNavigate } from "react-router-dom"
import { toast } from "sonner"
import { GameHeading } from "@/components/GameHeading"
import SparklesText from "@/components/magicui/sparkles-text"
import { confettiFireworksHandler } from "@/components/util/confetti-fireworks-handler"
import { ConfettiEmojiHandler } from "@/components/util/confetti-emoji-handler"
import { Timer } from "@/components/Timer"
import {
    MoveEventType,
    RemoveEventType,
    TimeEventType,
    WinEventType,
} from "../../../../common/types"
let REDIRECT_DURATION = 7
export function Game({
    sign,
    moveEvent,
    removeEvent,
    turnState,
    winEvent,
    timeEvent,
}: {
    sign: string
    moveEvent: MoveEventType
    removeEvent: RemoveEventType
    turnState: [boolean, React.Dispatch<React.SetStateAction<boolean>>]
    winEvent: WinEventType
    timeEvent: TimeEventType
}) {
    let interval: NodeJS.Timeout
    const navigate = useNavigate()
    const [turn, setTurn] = turnState
    useEffect(() => {
        if (sign === "") {
            sign = turn ? "X" : "O"
        }
    }, [])
    useEffect(() => {
        const cell = document.getElementById(moveEvent.move) || {
            innerText: "",
        }
        cell.innerText = sign === "X" ? "O" : "X"
    }, [moveEvent])
    useEffect(() => {
        const cell = document.getElementById(removeEvent.move) || {
            innerText: "",
        }
        cell.innerText = ""
    }, [removeEvent])
    useEffect(() => {
        if (!winEvent.winner || winEvent.winner === "") return
        let redirect_Count = REDIRECT_DURATION
        toast.info(winEvent.message, {})
        const id = toast.info(`Redirecting in ${redirect_Count} Seconds`)
        interval = setInterval(() => {
            redirect_Count--
            toast.info(`Redirecting in ${redirect_Count} Seconds`, {
                id: id,
            })
            if (redirect_Count === 0) {
                clearInterval(interval)
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
    async function moveListener(event: any) {
        if (winEvent.winner) return
        if (turn) {
            const cell = event.target
            try {
                const res = await socket
                    .timeout(1000)
                    .emitWithAck("move", { move: cell.id })
                if (res.status === 200) {
                    cell.innerText = sign
                    setTurn((turn) => !turn)
                } else {
                    console.log("Invalid Move", res)
                }
            } catch (e: Error | any) {
                if (e.message === "timeout") {
                    console.log("Timeout")
                }
            }
        }
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
                            clearInterval(interval)
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
                                key="0"
                                id="0"
                                onClick={moveListener}
                            ></div>
                            <div className="absolute right-0 h-full w-3 rounded-t-lg bg-ring/95"></div>
                            <div className="absolute bottom-0 h-3 w-full rounded-l-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pb-3 pr-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                key="1"
                                id="1"
                                onClick={moveListener}
                            ></div>
                            <div className="absolute right-0 h-full w-3 rounded-t-lg bg-ring/95"></div>
                            <div className="absolute bottom-0 h-3 w-full bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pb-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                key="2"
                                id="2"
                                onClick={moveListener}
                            ></div>

                            <div className="absolute bottom-0 h-3 w-full rounded-r-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pb-3 pr-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                key="3"
                                id="3"
                                onClick={moveListener}
                            ></div>
                            <div className="absolute right-0 h-full w-3 bg-ring/95"></div>
                            <div className="absolute bottom-0 h-3 w-full rounded-l-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pb-3 pr-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                key="4"
                                id="4"
                                onClick={moveListener}
                            ></div>
                            <div className="absolute right-0 h-full w-3 bg-ring/95"></div>
                            <div className="absolute bottom-0 h-3 w-full bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pb-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                key="5"
                                id="5"
                                onClick={moveListener}
                            ></div>
                            <div className="absolute bottom-0 h-3 w-full rounded-r-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pr-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                key="6"
                                id="6"
                                onClick={moveListener}
                            ></div>
                            <div className="absolute right-0 h-full w-3 rounded-b-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center pr-3 text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                key="7"
                                id="7"
                                onClick={moveListener}
                            ></div>
                            <div className="absolute right-0 h-full w-3 rounded-b-lg bg-ring/95"></div>
                        </div>
                        <div className="relative flex">
                            <div
                                className="cells flex h-[68px] w-[68px] cursor-pointer items-center justify-center text-center text-2xl md:h-[108px] md:w-[108px] md:text-5xl"
                                key="8"
                                id="8"
                                onClick={moveListener}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
