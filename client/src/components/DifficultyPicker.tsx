import { Difficulty } from "../../../common/types"

const LEVELS: { difficulty: Difficulty; label: string; hint: string }[] = [
    { difficulty: "easy", label: "Easy", hint: "Blocks your wins" },
    { difficulty: "medium", label: "Medium", hint: "Thinks ahead" },
    { difficulty: "hard", label: "Hard", hint: "No fading hints" },
]

export function DifficultyPicker({
    onPick,
}: {
    onPick: (difficulty: Difficulty) => void
}) {
    return (
        <div className="grid w-full grid-cols-3 gap-2">
            {LEVELS.map(({ difficulty, label, hint }) => (
                <button
                    key={difficulty}
                    onClick={() => onPick(difficulty)}
                    className="flex flex-col items-center rounded-lg border border-border px-2 py-2.5 transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                    <span className="text-base font-bold">{label}</span>
                    <span className="text-xs text-muted-foreground">
                        {hint}
                    </span>
                </button>
            ))}
        </div>
    )
}
