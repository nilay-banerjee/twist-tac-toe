import { useEffect, useState } from "react"
import AnimatedCircularProgressBar from "./ui/animated-circular-progress-bar"
import { TimeEventType } from "../../../common/types"

export function Timer({
    timeEvent,
    turn,
    duration = 15,
}: {
    timeEvent: TimeEventType
    turn: boolean
    duration?: number
}) {
    const [timeLeft, setTimeLeft] = useState(
        duration - Math.round(timeEvent.lastMoveTimeInSeconds),
    )
    if (timeLeft < 0) setTimeLeft(0)
    if (timeLeft > duration) setTimeLeft(duration)
    useEffect(() => {
        setTimeLeft(duration - Math.round(timeEvent.lastMoveTimeInSeconds))
    }, [timeEvent])
    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((timeLeft) => timeLeft - 1)
        }, 950)
        return () => clearInterval(timer)
    }, [])
    return (
        <>
            <AnimatedCircularProgressBar
                className="mt-10 h-32 w-32 md:h-40 md:w-40"
                max={duration}
                min={0}
                value={timeLeft}
                gaugePrimaryColor={
                    timeLeft <= 10
                        ? timeLeft <= 5
                            ? turn
                                ? "#ef4444ff"
                                : "#ef44449f"
                            : turn
                              ? "#fbbf24ff"
                              : "#fbbf249f"
                        : turn
                          ? "#16a34aff"
                          : "#16a34a9f"
                }
                gaugeSecondaryColor="rgba(0, 0, 0, 0)"
            />
        </>
    )
}
