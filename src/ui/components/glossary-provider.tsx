"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { GlossaryCategory } from "../lib/glossary/entries";
import { lookupGlossary } from "../lib/glossary/lookup";
import { DocsSearchDialog } from "./ui/docs-search-dialog";

interface GlossaryContextValue {
    openGlossary: (label: string, category: GlossaryCategory) => void;
    openDocsSearch: (initialQuery?: string) => void;
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null);

export function GlossaryProvider({ children }: { children: ReactNode }) {
    const [open, setOpen] = useState(false);
    const [initialQuery, setInitialQuery] = useState("");

    const openDocsSearch = useCallback((query = "") => {
        setInitialQuery(query);
        setOpen(true);
    }, []);

    const openGlossary = useCallback((label: string, category: GlossaryCategory) => {
        const match = lookupGlossary(label, category);
        if (match) {
            openDocsSearch(match.label);
        }
    }, [openDocsSearch]);

    const close = useCallback(() => {
        setOpen(false);
    }, []);

    const value = useMemo(
        () => ({ openGlossary, openDocsSearch }),
        [openGlossary, openDocsSearch]
    );

    return (
        <GlossaryContext.Provider value={value}>
            {children}

            <DocsSearchDialog
                open={open}
                onClose={close}
                initialQuery={initialQuery}
            />
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
