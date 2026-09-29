import { useEffect, useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"

export function CopyButton({ text, label }: { text: string; label: string }) {
    const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle")

    useEffect(() => {
        if (status !== "copied") return
        const timer = setTimeout(() => setStatus("idle"), 2500)
        return () => clearTimeout(timer)
    }, [status])

    async function copy() {
        try {
            await navigator.clipboard.writeText(text)
            setStatus("copied")
        } catch {
            setStatus("failed")
        }
    }

    return (
        <Button variant="outline" onClick={copy} aria-live="polite">
            {status === "copied" ? (
                <Check className="mr-2 size-4" />
            ) : (
                <Copy className="mr-2 size-4" />
            )}
            {status === "copied"
                ? "Copied"
                : status === "failed"
                  ? "Copy failed, select the text instead"
                  : label}
        </Button>
    )
}
