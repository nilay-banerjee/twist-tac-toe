import { Sign } from "../../../common/types"

export const SIGN_STYLES: Record<
    Sign,
    { text: string; bar: string; ring: string; tint: string }
> = {
    X: {
        text: "text-amber-600 dark:text-amber-400",
        bar: "bg-amber-500 dark:bg-amber-400",
        ring: "ring-amber-500/70 dark:ring-amber-400/70",
        tint: "bg-amber-400/15",
    },
    O: {
        text: "text-violet-600 dark:text-violet-300",
        bar: "bg-violet-500 dark:bg-violet-300",
        ring: "ring-violet-500/70 dark:ring-violet-300/70",
        tint: "bg-violet-400/15",
    },
}
