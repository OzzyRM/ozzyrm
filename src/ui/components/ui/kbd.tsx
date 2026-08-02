import type { ReactNode } from "react";

interface KbdProps {
    children: ReactNode;
}

export function Kbd({ children }: KbdProps) {
    return (
        <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded border border-border bg-code-bg px-1 font-mono text-[10px] font-medium text-muted">
            {children}
        </kbd>
    );
}
