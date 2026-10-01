import { ReactNode } from "react"
import { cva, type VariantProps } from "class-variance-authority"

const pageVariants = cva("mx-auto flex w-full flex-col items-center px-4", {
    variants: {
        width: {
            narrow: "max-w-md gap-6 pb-12",
            game: "max-w-xl gap-4 pb-8",
            wide: "max-w-5xl gap-8 pb-12 md:gap-12",
        },
    },
    defaultVariants: { width: "narrow" },
})

export function Page({
    width,
    children,
}: VariantProps<typeof pageVariants> & { children: ReactNode }) {
    return <main className={pageVariants({ width })}>{children}</main>
}
