import { useEffect, useRef, useState } from "react"
import { Page } from "@/components/Page"
import { Panel, PanelTitle } from "@/components/Panel"
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
        <Page>
            <GameHeading compact />
            <Panel>
                <PanelTitle>Join a room</PanelTitle>
                <p className="text-muted-foreground">
                    Enter the code your friend sent you.
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
            </Panel>
        </Page>
    )
}
