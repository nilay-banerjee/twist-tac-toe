import { AnimatePresence, motion } from "framer-motion"
import { cn } from "@/lib/utils"
import { SIGN_STYLES } from "@/lib/signs"
import { Cell, Sign } from "../../../common/types"

function describeCell(index: number, mark: Cell, vanishing: boolean) {
    const where = `Row ${Math.floor(index / 3) + 1}, column ${(index % 3) + 1}`
    if (!mark) return `${where}, empty`
    return `${where}, ${mark}${vanishing ? ", disappears next" : ""}`
}

export function Board({
    board,
    nextToVanish,
    line,
    mySign,
    canPlay,
    onPlay,
}: {
    board: Cell[]
    nextToVanish: Record<Sign, number | null>
    line: number[] | null
    mySign: Sign
    canPlay: boolean
    onPlay: (cell: number) => void
}) {
    return (
        <div className="grid aspect-square w-[min(88vw,46vh,420px)] grid-cols-3 grid-rows-3 gap-2.5 overflow-hidden rounded-xl bg-slate-700 dark:bg-slate-300">
            {board.map((mark, index) => {
                const vanishing =
                    mark !== "" && nextToVanish[mark] === index && !line
                const winning = line?.includes(index) ?? false
                const playable = canPlay && mark === ""
                return (
                    <button
                        key={index}
                        onClick={() => onPlay(index)}
                        disabled={!playable}
                        aria-label={describeCell(index, mark, vanishing)}
                        className={cn(
                            "group relative flex items-center justify-center bg-background text-5xl font-bold focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-inset focus-visible:ring-ring md:text-6xl",
                            playable ? "cursor-pointer" : "cursor-default",
                        )}
                    >
                        {winning && mark && (
                            <span
                                aria-hidden
                                className={cn(
                                    "absolute inset-0",
                                    SIGN_STYLES[mark].tint,
                                )}
                            />
                        )}
                        <AnimatePresence>
                            {mark && (
                                <motion.span
                                    key={mark}
                                    initial={{ scale: 0.4, opacity: 0 }}
                                    animate={{
                                        scale: winning ? 1.15 : 1,
                                        opacity: vanishing ? 0.35 : 1,
                                    }}
                                    exit={{
                                        scale: 0.6,
                                        opacity: 0,
                                        filter: "blur(6px)",
                                    }}
                                    transition={{ duration: 0.25 }}
                                    className={cn(
                                        "absolute",
                                        SIGN_STYLES[mark].text,
                                        vanishing &&
                                            "motion-safe:animate-pulse",
                                    )}
                                >
                                    {mark}
                                </motion.span>
                            )}
                        </AnimatePresence>
                        {vanishing && (
                            <span
                                aria-hidden
                                className={cn(
                                    "absolute inset-2 rounded-lg border-2 border-dashed border-current opacity-40",
                                    SIGN_STYLES[mark].text,
                                )}
                            />
                        )}
                        {playable && (
                            <span
                                aria-hidden
                                className={cn(
                                    "opacity-0 transition-opacity group-hover:opacity-25",
                                    SIGN_STYLES[mySign].text,
                                )}
                            >
                                {mySign}
                            </span>
                        )}
                    </button>
                )
            })}
        </div>
    )
}
