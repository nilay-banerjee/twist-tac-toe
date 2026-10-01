import WordRotate from "@/components/magicui/word-rotate"
import { Link } from "react-router-dom"
import { cn, focusRing } from "@/lib/utils"

export function GameHeading({ compact = false }: { compact?: boolean }) {
    return (
        <Link
            to="/"
            aria-label="Twist Tac Toe, home"
            className={cn("rounded-md", focusRing)}
        >
            <div
                className={cn(
                    "grid grid-flow-col items-center justify-center gap-[0.25em] font-bold",
                    compact ? "text-3xl" : "text-5xl md:text-8xl",
                )}
            >
                <div className="min-w-[2.6em]">
                    <WordRotate
                        className="text-end text-black dark:text-white"
                        words={["Tic", "Twist"]}
                        duration={2000}
                    />
                </div>
                <span className="whitespace-nowrap">Tac Toe</span>
            </div>
        </Link>
    )
}
