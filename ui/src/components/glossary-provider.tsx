"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { GlossaryCategory, GlossaryEntry } from "../lib/glossary/entries";
import { lookupGlossary } from "../lib/glossary/lookup";
import { Sheet } from "./ui/sheet";

interface GlossaryContextValue {
    openGlossary: (label: string, category: GlossaryCategory) => void;
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null);

export function GlossaryProvider({ children }: { children: ReactNode }) {
    const [entry, setEntry] = useState<GlossaryEntry | null>(null);

    const openGlossary = useCallback((label: string, category: GlossaryCategory) => {
        const match = lookupGlossary(label, category);
        if (match) {
            setEntry(match);
        }
    }, []);

    const close = useCallback(() => {
        setEntry(null);
    }, []);

    const value = useMemo(() => ({ openGlossary }), [openGlossary]);

    return (
        <GlossaryContext.Provider value={value}>
            {children}

            <Sheet open={Boolean(entry)} onClose={close} title={entry?.label ?? ""}>
                {entry && (
                    <div className="space-y-4">
                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                                {entry.category === "type" ? "Type" : "Attribute"}
                            </p>
                            <p className="mt-2 text-[14px] leading-relaxed text-foreground">
                                {entry.summary}
                            </p>
                        </div>

                        <div>
                            <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                                Explanation
                            </p>
                            <p className="mt-2 text-[13px] leading-relaxed text-muted">
                                {entry.description}
                            </p>
                        </div>

                        {entry.example && (
                            <div>
                                <p className="text-[11px] font-medium uppercase tracking-wider text-muted">
                                    Example
                                </p>
                                <pre className="mt-2 overflow-x-auto rounded-md border border-border bg-code-bg/60 px-3 py-2 font-mono text-[12px] leading-relaxed text-foreground">
                                    {entry.example}
                                </pre>
                            </div>
                        )}
                    </div>
                )}
            </Sheet>
        </GlossaryContext.Provider>
    );
}

export function useGlossary(): GlossaryContextValue {
    const context = useContext(GlossaryContext);

    if (!context) {
        throw new Error("useGlossary must be used within GlossaryProvider");
    }

    return context;
}
