import { cn } from "@/lib/utils"
import { SIGN_STYLES } from "@/lib/signs"
import { Sign } from "../../../common/types"

export interface MiniMark {
    sign: Sign
    state?: "fading" | "new" | "gone"
}

export function MiniBoard({ cells }: { cells: (MiniMark | null)[] }) {
    return (
        <div
            aria-hidden
            className="grid aspect-square w-24 shrink-0 grid-cols-3 grid-rows-3 gap-1 overflow-hidden rounded-lg bg-slate-700 dark:bg-slate-300 sm:w-32"
        >
            {cells.map((mark, index) => (
                <div
                    key={index}
                    className="relative flex items-center justify-center bg-background text-2xl font-bold"
                >
                    {mark && mark.state !== "gone" && (
                        <span
                            className={cn(
                                SIGN_STYLES[mark.sign].text,
                                mark.state === "fading" && "opacity-35",
                            )}
                        >
                            {mark.sign}
                        </span>
                    )}
                    {(mark?.state === "fading" || mark?.state === "gone") && (
                        <span
                            className={cn(
                                "absolute inset-1 rounded border border-dashed border-current opacity-50",
                                SIGN_STYLES[mark.sign].text,
                            )}
                        />
                    )}
                    {mark?.state === "new" && (
                        <span
                            className={cn(
                                "absolute inset-1 rounded ring-2",
                                SIGN_STYLES[mark.sign].ring,
                            )}
                        />
                    )}
                </div>
            ))}
        </div>
    )
}
