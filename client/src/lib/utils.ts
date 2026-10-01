import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}
