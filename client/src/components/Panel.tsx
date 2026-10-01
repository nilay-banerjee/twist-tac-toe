import { ComponentPropsWithoutRef, ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"

const panelVariants = cva(
    "flex w-full flex-col rounded-xl border border-border",
    {
        variants: {
            layout: {
                centered: "items-center gap-4 p-5 text-center",
                stacked: "gap-3 p-4",
            },
        },
        defaultVariants: { layout: "centered" },
    },
)

export function Panel({
    layout,
    ...props
}: VariantProps<typeof panelVariants> &
    Omit<ComponentPropsWithoutRef<"section">, "className">) {
    return <section className={panelVariants({ layout })} {...props} />
}

export function PanelTitle({
    size = "large",
    children,
}: {
    size?: "large" | "small"
    children: ReactNode
}) {
    if (size === "small") {
        return <h2 className="flex items-center gap-2 font-bold">{children}</h2>
    }
    return <h1 className="text-xl font-bold">{children}</h1>
}
