import { useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { SIGN_STYLES } from "@/lib/signs"
import { TURN_SECONDS } from "../../../common/constants"
import { PlayerInfo } from "../../../common/types"

function useSecondsLeft(endsAt: number, running: boolean) {
    const [now, setNow] = useState(Date.now)
    useEffect(() => {
        if (!running) return
        const timer = setInterval(() => setNow(Date.now()), 200)
        return () => clearInterval(timer)
    }, [running, endsAt])
    return Math.max(0, (endsAt - now) / 1000)
}

export function PlayerCard({
    player,
    isYou,
    active,
    turnEndsAt,
}: {
    player: PlayerInfo
    isYou: boolean
    active: boolean
    turnEndsAt: number
}) {
    const style = SIGN_STYLES[player.sign]
    const secondsLeft = useSecondsLeft(turnEndsAt, active)
    const fraction = active ? Math.min(1, secondsLeft / TURN_SECONDS) : 0
    return (
        <div
            className={cn(
                "flex min-w-0 flex-col gap-2 rounded-xl border border-border p-3 transition-shadow",
                active && ["ring-2", style.ring],
            )}
        >
            <div className="flex items-center gap-3">
                <span className={cn("text-3xl font-bold", style.text)}>
                    {player.sign}
                </span>
                <div className="min-w-0">
                    <div className="truncate font-bold">{player.username}</div>
                    <div className="text-xs text-muted-foreground">
                        {isYou ? "You" : player.isBot ? "Computer" : "Opponent"}
                    </div>
                </div>
                {active && (
                    <span className="ml-auto text-sm tabular-nums text-muted-foreground">
                        {Math.ceil(secondsLeft)}s
                    </span>
                )}
            </div>
            <div className="h-1 overflow-hidden rounded-full bg-secondary">
                <div
                    className={cn(
                        "h-full rounded-full transition-[width] duration-200 ease-linear",
                        secondsLeft <= 5 ? "bg-red-500" : style.bar,
                    )}
                    style={{ width: `${fraction * 100}%` }}
                />
            </div>
        </div>
    )
}
