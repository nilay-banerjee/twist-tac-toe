import { useEffect } from "react"
import { Link } from "react-router-dom"
import { Bot, ChevronRight } from "lucide-react"
import { toast } from "sonner"
import ShineBorder from "@/components/magicui/shine-border"
import AnimatedGradientText from "@/components/magicui/animated-gradient-text"
import { GameHeading } from "@/components/GameHeading"
import { DifficultyPicker } from "@/components/DifficultyPicker"
import { HowToPlay } from "@/components/HowToPlay"
import { Button } from "@/components/ui/button"
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
    useEffect(() => {
        toast.dismiss()
    }, [])

    function playBot(difficulty: Difficulty) {
        socket.emit("playBot", { username, difficulty })
    }

    return (
        <main className="mx-auto flex max-w-5xl flex-col items-center gap-8 px-4 pb-12 md:gap-12">
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
                            className="w-full rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
                    <div className="flex flex-col gap-3 rounded-xl border border-border p-4">
                        <h2 className="flex items-center gap-2 font-bold">
                            <Bot className="size-5" />
                            Play the computer
                        </h2>
                        <DifficultyPicker onPick={playBot} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <Button asChild variant="outline" size="lg">
                            <Link to="/create">Create game</Link>
                        </Button>
                        <Button asChild variant="outline" size="lg">
                            <Link to="/join">Join game</Link>
                        </Button>
                    </div>
                </section>
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
            </div>
            <HowToPlay />
        </main>
    )
}
