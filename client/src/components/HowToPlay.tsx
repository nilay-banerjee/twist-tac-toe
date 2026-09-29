import { MiniBoard, MiniMark } from "@/components/MiniBoard"

const X: MiniMark = { sign: "X" }
const O: MiniMark = { sign: "O" }

const STEPS: { title: string; text: string; cells: (MiniMark | null)[] }[] = [
    {
        title: "Take turns",
        text: "Same as tic tac toe: get three in a row to win.",
        cells: [X, null, X, null, O, null, null, null, null],
    },
    {
        title: "Three marks max",
        text: "Once you have three on the board, your oldest one fades.",
        cells: [
            { sign: "X", state: "fading" },
            null,
            X,
            null,
            O,
            null,
            O,
            X,
            null,
        ],
    },
    {
        title: "Your fourth bumps the oldest",
        text: "Placing another mark removes the faded one. Watch for your opponent's too.",
        cells: [
            { sign: "X", state: "gone" },
            null,
            { sign: "X", state: "fading" },
            { sign: "X", state: "new" },
            O,
            null,
            O,
            X,
            null,
        ],
    },
]

export function HowToPlay() {
    return (
        <section aria-labelledby="how-to-play" className="w-full">
            <h2
                id="how-to-play"
                className="mb-5 text-center text-2xl font-bold md:text-3xl"
            >
                How to play
            </h2>
            <ol className="grid gap-6 sm:grid-cols-3">
                {STEPS.map((step, index) => (
                    <li
                        key={step.title}
                        className="flex items-center gap-4 sm:flex-col sm:gap-3 sm:text-center"
                    >
                        <MiniBoard cells={step.cells} />
                        <div className="sm:max-w-60">
                            <h3 className="font-bold">
                                <span className="text-muted-foreground">
                                    {index + 1}.
                                </span>{" "}
                                {step.title}
                            </h3>
                            <p className="text-sm text-muted-foreground">
                                {step.text}
                            </p>
                        </div>
                    </li>
                ))}
            </ol>
        </section>
    )
}
