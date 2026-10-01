import { useEffect } from "react"
import { Page } from "@/components/Page"
import { Panel, PanelTitle } from "@/components/Panel"
import { cn, focusRing } from "@/lib/utils"
import { Link } from "react-router-dom"
import { Bot, ChevronRight, DoorOpen, LogIn } from "lucide-react"
import { toast } from "sonner"
import ShineBorder from "@/components/magicui/shine-border"
import AnimatedGradientText from "@/components/magicui/animated-gradient-text"
import { GameHeading } from "@/components/GameHeading"
import { DifficultyPicker } from "@/components/DifficultyPicker"
import { HowToPlay } from "@/components/HowToPlay"
import { Button } from "@/components/ui/button"
import { useMediaQuery } from "@/lib/useMediaQuery"
import { socket } from "@/socket"
import o_x from "../../assets/o_x.mp4"
import { Difficulty } from "../../../../common/types"

export function Landing({
    username,
    online,
}: {
    username: string
    online: number
}) {
    const showDemo = useMediaQuery("(min-width: 768px)")

    useEffect(() => {
        toast.dismiss()
    }, [])

    function playBot(difficulty: Difficulty) {
        socket.emit("playBot", { username, difficulty })
    }

    return (
        <Page width="wide">
            <div className="flex flex-col items-center gap-3 text-center">
                <GameHeading />
                <p className="text-lg text-muted-foreground md:text-2xl">
                    Tic tac toe where your oldest mark disappears.
                </p>
            </div>
            <div className="grid w-full items-start gap-10 md:grid-cols-2">
                <section
                    aria-label="Play"
                    className="flex flex-col gap-5 md:order-2"
                >
                    <div className="flex flex-col items-center gap-2">
                        <Link
                            to="/create_random"
                            className={cn("w-full rounded-2xl", focusRing)}
                        >
                            <AnimatedGradientText className="w-full max-w-none justify-center py-3">
                                <span className="text-2xl">🎮</span>
                                <hr className="mx-3 h-8 w-[1px] shrink-0 bg-gray-300" />
                                <span className="inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-2xl font-bold text-transparent">
                                    Quick match
                                </span>
                                <ChevronRight className="ml-1 size-6 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                            </AnimatedGradientText>
                        </Link>
                        {online > 0 && (
                            <p className="text-sm text-muted-foreground">
                                {online} {online === 1 ? "player" : "players"}{" "}
                                online
                            </p>
                        )}
                    </div>
                    <Panel layout="stacked">
                        <PanelTitle size="small">
                            <Bot className="size-5" />
                            Play the computer
                        </PanelTitle>
                        <DifficultyPicker onPick={playBot} />
                    </Panel>
                    <div className="grid grid-cols-2 gap-3">
                        <Button asChild variant="cta" size="lg">
                            <Link to="/create">
                                <DoorOpen className="mr-2 size-4" />
                                Create room
                            </Link>
                        </Button>
                        <Button asChild variant="cta" size="lg">
                            <Link to="/join">
                                <LogIn className="mr-2 size-4" />
                                Join room
                            </Link>
                        </Button>
                    </div>
                </section>
                {showDemo && (
                    <section
                        aria-label="Gameplay demo"
                        className="flex flex-col items-center gap-5 md:order-1"
                    >
                        <ShineBorder
                            className="flex items-center justify-center rounded-lg border bg-background p-0 md:shadow-xl"
                            color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
                        >
                            <video
                                src={o_x}
                                aria-label="A game of Twist Tac Toe where old marks disappear"
                                autoPlay
                                loop
                                muted
                                playsInline
                                className="aspect-square w-[min(78vw,320px)] p-4 invert dark:invert-0"
                            />
                        </ShineBorder>
                    </section>
                )}
            </div>
            <HowToPlay />
        </Page>
    )
}
