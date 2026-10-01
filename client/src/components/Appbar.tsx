import { FormEvent, useState } from "react"
import { cn, focusRing } from "@/lib/utils"
import { Pencil } from "lucide-react"
import { ModeToggle } from "@/components/util/mode-toggle"
import { USERNAME_MAX_LENGTH } from "../../../common/constants"

export function Appbar({
    username,
    onRename,
}: {
    username: string
    onRename: (name: string) => void
}) {
    const [draft, setDraft] = useState<string | null>(null)

    function save(event: FormEvent) {
        event.preventDefault()
        if (draft !== null) onRename(draft)
        setDraft(null)
    }

    return (
        <header className="flex items-center justify-end gap-1 px-3 py-2 text-sm">
            {draft === null ? (
                <button
                    onClick={() => setDraft(username)}
                    className={cn(
                        "flex items-center gap-2 rounded-md px-2 py-1 hover:bg-secondary",
                        focusRing,
                    )}
                    aria-label={`Playing as ${username}. Change name`}
                >
                    <span className="text-muted-foreground">Playing as</span>
                    <span className="font-bold">{username}</span>
                    <Pencil className="size-3.5 text-muted-foreground" />
                </button>
            ) : (
                <form onSubmit={save} className="flex items-center gap-2">
                    <label htmlFor="username" className="text-muted-foreground">
                        Your name
                    </label>
                    <input
                        id="username"
                        autoFocus
                        value={draft}
                        maxLength={USERNAME_MAX_LENGTH}
                        onChange={(e) => setDraft(e.target.value)}
                        onBlur={save}
                        onKeyDown={(e) => e.key === "Escape" && setDraft(null)}
                        className={cn(
                            "w-44 rounded-md border border-input bg-background px-2 py-1 font-bold",
                            focusRing,
                        )}
                    />
                </form>
            )}
            <ModeToggle />
        </header>
    )
}
