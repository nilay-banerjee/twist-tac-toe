import { useEffect, useRef, useState } from "react"
import { useParams } from "react-router-dom"
import { socket } from "@/socket"
import { GameHeading } from "@/components/GameHeading"
import { InputCodePattern } from "@/components/InputCodePattern"
import { Loading } from "../ui/loading"
import { Button } from "../ui/button"
import { GAME_ID_LENGTH } from "../../../../common/constants"
import { ErrorEventType } from "../../../../common/types"

const RESPONSE_TIMEOUT_MS = 10_000

export function Join({ username }: { username: string }) {
    const [gameId, setGameId] = useState(
        useParams().joinId?.toUpperCase() || "",
    )
    const [isLoading, setIsLoading] = useState(false)
    const [errorMsg, setErrorMsg] = useState("")
    const responseTimeout = useRef<ReturnType<typeof setTimeout>>()

    useEffect(() => {
        if (gameId.length === GAME_ID_LENGTH) joinGame()
    }, [gameId])

    useEffect(() => {
        function errorHandler(data: ErrorEventType) {
            showError(data.message)
        }
        socket.on("error", errorHandler)
        return () => {
            socket.off("error", errorHandler)
        }
    }, [])

    function showError(message: string) {
        clearTimeout(responseTimeout.current)
        responseTimeout.current = undefined
        setIsLoading(false)
        setErrorMsg(message)
    }

    function joinGame() {
        if (responseTimeout.current) return
        if (gameId.length !== GAME_ID_LENGTH) {
            showError(`Enter all ${GAME_ID_LENGTH} characters of the code.`)
            return
        }
        setIsLoading(true)
        setErrorMsg("")
        socket.emit("joinGame", { username, gameId: gameId.toUpperCase() })
        responseTimeout.current = setTimeout(
            () => showError("The server didn't answer. Try again."),
            RESPONSE_TIMEOUT_MS,
        )
    }

    return (
        <main className="mx-auto flex max-w-md flex-col items-center gap-6 px-4 pb-12">
            <GameHeading compact />
            <section className="flex w-full flex-col items-center gap-4 rounded-xl border border-border p-5 text-center">
                <h1 className="text-xl font-bold">Join a room</h1>
                <p className="text-muted-foreground">
                    Enter the code your friend sent you. Codes never use 0, O,
                    1, I, L, 2, Z, 5 or S.
                </p>
                <div
                    onKeyDown={(e) => {
                        if (e.key === "Enter") joinGame()
                    }}
                >
                    <InputCodePattern
                        setCode={setGameId}
                        value={gameId.toUpperCase()}
                    />
                </div>
                <Button onClick={joinGame} disabled={isLoading}>
                    Join room
                </Button>
                {isLoading && <Loading />}
                {errorMsg && (
                    <p role="alert" className="text-red-600 dark:text-red-400">
                        {errorMsg}
                    </p>
                )}
            </section>
        </main>
    )
}
