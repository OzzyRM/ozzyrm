"use client";

import { X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

interface SheetProps {
    open: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

const SHEET_DURATION_MS = 400;

export function Sheet({ open, onClose, title, children }: SheetProps) {
    const [present, setPresent] = useState(false);
    const [active, setActive] = useState(false);

    useEffect(() => {
        if (open) {
            setPresent(true);
            setActive(false);

            let frame1 = 0;
            let frame2 = 0;

            frame1 = requestAnimationFrame(() => {
                frame2 = requestAnimationFrame(() => {
                    setActive(true);
                });
            });

            return () => {
                cancelAnimationFrame(frame1);
                cancelAnimationFrame(frame2);
            };
        }

        setActive(false);

        const timeout = window.setTimeout(() => {
            setPresent(false);
        }, SHEET_DURATION_MS);

        return () => window.clearTimeout(timeout);
    }, [open]);

    useEffect(() => {
        if (!present) {
            return;
        }

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                onClose();
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [present, onClose]);

    if (!present) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50">
            <button
                type="button"
                aria-label="Close panel"
                onClick={onClose}
                data-open={active}
                className="sheet-backdrop absolute inset-0 bg-black/25 backdrop-blur-[2px]"
            />

            <aside
                role="dialog"
                aria-modal="true"
                aria-label={title}
                data-open={active}
                className="sheet-panel absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-l border-border bg-background shadow-2xl"
            >
                <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
                    <div>
                        <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                            Reference
                        </p>
                        <h2 className="mt-1 font-mono text-lg font-semibold tracking-tight">{title}</h2>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-md p-1.5 text-muted transition-colors hover:bg-code-bg hover:text-foreground"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4">
                    {children}
                </div>
            </aside>
        </div>
    );
}
