"use client";

import {
    createContext,
    useCallback,
    useContext,
    useMemo,
    useState,
    type ReactNode,
} from "react";
import type { GlossaryCategory } from "../lib/glossary/entries";
import { openGlossaryDocs } from "../lib/glossary/docs-site";
import { lookupGlossary } from "../lib/glossary/lookup";
import { DocsSearchDialog } from "./ui/docs-search-dialog";

interface GlossaryContextValue {
    openGlossary: (label: string, category: GlossaryCategory) => void;
    openDocsSearch: (initialQuery?: string) => void;
    docsBaseUrl: string;
}

const GlossaryContext = createContext<GlossaryContextValue | null>(null);

export function GlossaryProvider({
    children,
    docsBaseUrl,
}: {
    children: ReactNode;
    docsBaseUrl?: string;
}) {
    const [open, setOpen] = useState(false);
    const [initialQuery, setInitialQuery] = useState("");

    const openDocsSearch = useCallback((query = "") => {
        setInitialQuery(query);
        setOpen(true);
    }, []);

    const openGlossary = useCallback(
        (label: string, category: GlossaryCategory) => {
            const match = lookupGlossary(label, category);
            if (!match) {
                return;
            }
            openGlossaryDocs(match.category, match.key, docsBaseUrl);
        },
        [docsBaseUrl]
    );

    const close = useCallback(() => {
        setOpen(false);
    }, []);

    const value = useMemo(
        () => ({
            openGlossary,
            openDocsSearch,
            docsBaseUrl: docsBaseUrl ?? "https://ozzyrm.vercel.app",
        }),
        [openGlossary, openDocsSearch, docsBaseUrl]
    );

    return (
        <GlossaryContext.Provider value={value}>
            {children}

            <DocsSearchDialog
                open={open}
                onClose={close}
                initialQuery={initialQuery}
                docsBaseUrl={docsBaseUrl}
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
