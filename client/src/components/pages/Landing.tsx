import { Link } from "react-router-dom"
import { ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import ShineBorder from "@/components/magicui/shine-border"
import AnimatedGradientText from "@/components/magicui/animated-gradient-text"
import { GameHeading } from "@/components/GameHeading"
import { useEffect } from "react"
import { toast } from "sonner"

import o_x from "../../assets/o_x.mp4"
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "../ui/tooltip"
import WordRotate from "../magicui/word-rotate"

export function Landing() {
    useEffect(() => {
        toast.dismiss()
    }, [])
    return (
        <>
            <div className="flex w-full flex-col items-center justify-center gap-6">
                <GameHeading />
                <div className="hidden md:block">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger>
                                <div className="text-3xl">
                                    Classical Tic Tac Toe with a Twist! 🤫
                                </div>
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>
                                    Each Player's 1st Move Disappears on 4th
                                    Move😈
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                </div>
                <div className="min-h-[108px] md:hidden">
                    <WordRotate
                        className="text-xl text-black dark:text-white"
                        words={[
                            "Classical Tic Tac Toe with a Twist! 🤫",
                            " Each Player's 1st Move Disappears on 4th Move😈",
                        ]}
                        duration={1800}
                    />
                </div>
            </div>
            <div className="flex flex-col items-center justify-center md:mt-20 md:flex-row md:gap-12 md:px-10">
                <div className="order-2 md:order-none">
                    <ShineBorder
                        className="flex items-center justify-center rounded-lg border bg-background md:h-[350px] md:w-[350px] md:shadow-xl"
                        color={["#A07CFE", "#FE8FB5", "#FFBE7B"]}
                    >
                        <video
                            src={o_x}
                            aria-label="Twist-Tac-Toe gameplay demo"
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="h-[350px] w-[350px] p-6 invert dark:invert-0 md:p-4"
                        />
                    </ShineBorder>
                </div>
                <div className="order-1 flex h-[380px] flex-col items-center justify-center gap-6 md:order-none md:w-[500px]">
                    <div className="z-10 flex flex-col items-center justify-center gap-6">
                        <Link to="/create_random">
                            <AnimatedGradientText className="w-full text-xl">
                                🎮{" "}
                                <hr className="mx-2 h-8 w-[1px] shrink-0 bg-gray-300" />{" "}
                                <span
                                    className={cn(
                                        `inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-xl text-transparent`,
                                    )}
                                >
                                    Quick Start
                                </span>
                                <ChevronRight className="ml-1 size-6 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                            </AnimatedGradientText>
                        </Link>
                        <Link to="/create">
                            <AnimatedGradientText className="text-xl">
                                🎮{" "}
                                <hr className="mx-2 h-8 w-[1px] shrink-0 bg-gray-300" />{" "}
                                <span
                                    className={cn(
                                        `inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-xl text-transparent`,
                                    )}
                                >
                                    Create Game
                                </span>
                                <ChevronRight className="ml-1 size-6 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                            </AnimatedGradientText>
                        </Link>
                    </div>
                    <div className="z-10 flex items-center justify-center">
                        <Link to="/join">
                            <AnimatedGradientText className="text-xl">
                                🤝🏻{" "}
                                <hr className="mx-2 h-8 w-[1px] shrink-0 bg-gray-300" />{" "}
                                <span
                                    className={cn(
                                        `inline animate-gradient bg-gradient-to-r from-[#ffaa40] via-[#9c40ff] to-[#ffaa40] bg-[length:var(--bg-size)_100%] bg-clip-text text-xl text-transparent`,
                                    )}
                                >
                                    Join Game
                                </span>
                                <ChevronRight className="ml-1 size-6 transition-transform duration-300 ease-in-out group-hover:translate-x-0.5" />
                            </AnimatedGradientText>
                        </Link>
                    </div>
                </div>
            </div>
        </>
    )
}
