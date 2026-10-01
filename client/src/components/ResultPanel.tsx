import { House, RotateCcw } from "lucide-react"
import { Panel } from "@/components/Panel"
import SparklesText from "@/components/magicui/sparkles-text"
import { Button } from "@/components/ui/button"
import { RematchState } from "@/App"
import { PlayerInfo, WinEventType } from "../../../common/types"

function rematchLabel(rematch: RematchState, opponent: PlayerInfo) {
    if (rematch.offeredBy) return "Accept rematch"
    if (rematch.requested) return `Waiting for ${opponent.username}…`
    return "Rematch"
}

export function ResultPanel({
    win,
    youId,
    opponent,
    rematch,
    onRematch,
    onHome,
}: {
    win: WinEventType
    youId: string
    opponent: PlayerInfo
    rematch: RematchState
    onRematch: () => void
    onHome: () => void
}) {
    const youWon = win.winnerId === youId
    return (
        <Panel>
            {youWon ? (
                <SparklesText className="text-3xl md:text-4xl" text="You won" />
            ) : (
                <div className="text-3xl font-bold md:text-4xl">You lost</div>
            )}
            {rematch.offeredBy && !rematch.requested && (
                <p className="text-sm">{rematch.offeredBy} wants a rematch.</p>
            )}
            {rematch.unavailable && (
                <p className="text-sm text-muted-foreground">
                    {rematch.unavailable}. Rematch isn't available.
                </p>
            )}
            <div className="flex gap-3">
                {!rematch.unavailable && (
                    <Button onClick={onRematch} disabled={rematch.requested}>
                        <RotateCcw className="mr-2 size-4" />
                        {rematchLabel(rematch, opponent)}
                    </Button>
                )}
                <Button variant="outline" onClick={onHome}>
                    <House className="mr-2 size-4" />
                    Home
                </Button>
            </div>
        </Panel>
    )
}
