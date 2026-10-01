import { cn, focusRing } from "@/lib/utils"
import { Difficulty } from "../../../common/types"

const LEVELS: {
    difficulty: Difficulty
    label: string
    hint: string
    color: string
}[] = [
    {
        difficulty: "easy",
        label: "Easy",
        hint: "Blocks your wins",
        color: "bg-green-500",
    },
    {
        difficulty: "medium",
        label: "Medium",
        hint: "Thinks ahead",
        color: "bg-yellow-400",
    },
    {
        difficulty: "hard",
        label: "Hard",
        hint: "No fading hints",
        color: "bg-red-500",
    },
]

const PIPS = [0, 1, 2]

export function DifficultyPicker({
    onPick,
}: {
    onPick: (difficulty: Difficulty) => void
}) {
    return (
        <div className="grid w-full grid-cols-3 gap-2">
            {LEVELS.map(({ difficulty, label, hint, color }, index) => (
                <button
                    key={difficulty}
                    onClick={() => onPick(difficulty)}
                    className={cn(
                        "flex flex-col items-center gap-1 rounded-lg border border-border px-2 py-2.5 transition hover:bg-accent/60 motion-safe:active:scale-[0.97]",
                        focusRing,
                    )}
                >
                    <span aria-hidden className="flex gap-1">
                        {PIPS.map((pip) => (
                            <span
                                key={pip}
                                className={cn(
                                    "h-1.5 w-4 rounded-full",
                                    pip <= index ? color : "bg-muted",
                                )}
                            />
                        ))}
                    </span>
                    <span className="text-base font-bold">{label}</span>
                    <span className="text-xs text-muted-foreground">
                        {hint}
                    </span>
                </button>
            ))}
        </div>
    )
}
