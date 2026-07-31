"use client";

import { Search } from "lucide-react";
import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import {
    DOCS_PLACEHOLDER_ITEMS,
    searchDocsPlaceholder,
    type DocsPlaceholderItem,
} from "../../lib/glossary/docs-placeholder";
import { Badge } from "./badge";

interface DocsSearchDialogProps {
    open: boolean;
    onClose: () => void;
    initialQuery?: string;
}

export function DocsSearchDialog({
    open,
    onClose,
    initialQuery = "",
}: DocsSearchDialogProps) {
    const titleId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState(initialQuery);
    const [activeIndex, setActiveIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    const results = useMemo(
        () => searchDocsPlaceholder(query, DOCS_PLACEHOLDER_ITEMS),
        [query]
    );

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (!open) {
            return;
        }

        setQuery(initialQuery);
        setActiveIndex(0);

        const frame = requestAnimationFrame(() => {
            inputRef.current?.focus();
            inputRef.current?.select();
        });

        return () => cancelAnimationFrame(frame);
    }, [open, initialQuery]);

    useEffect(() => {
        setActiveIndex(0);
    }, [query]);

    useEffect(() => {
        if (!open) {
            return;
        }

        const onKeyDown = (event: globalThis.KeyboardEvent) => {
            if (event.key === "Escape") {
                event.preventDefault();
                onClose();
            }
        };

        document.body.style.overflow = "hidden";
        window.addEventListener("keydown", onKeyDown);

        return () => {
            document.body.style.overflow = "";
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [open, onClose]);

    if (!open || !mounted) {
        return null;
    }

    const selectItem = (item: DocsPlaceholderItem) => {
        // placeholder: landing docs not live yet
        onClose();
        window.location.hash = item.href.replace(/^#/, "");
    };

    const onInputKeyDown = (event: ReactKeyboardEvent<HTMLInputElement>) => {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            setActiveIndex((index) =>
                results.length === 0 ? 0 : Math.min(index + 1, results.length - 1)
            );
            return;
        }

        if (event.key === "ArrowUp") {
            event.preventDefault();
            setActiveIndex((index) => Math.max(index - 1, 0));
            return;
        }

        if (event.key === "Enter") {
            event.preventDefault();
            const item = results[activeIndex];
            if (item) {
                selectItem(item);
            }
        }
    };

    return createPortal(
        <div className="docs-search-overlay">
            <button
                type="button"
                aria-label="Close search"
                onClick={onClose}
                className="docs-search-backdrop"
            />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby={titleId}
                className="docs-search-panel"
            >
                <h2 id={titleId} className="absolute -left-[9999px] h-px w-px overflow-hidden">
                    Search documentation
                </h2>

                <div className="flex items-center gap-2 border-b border-border px-3">
                    <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                    <input
                        ref={inputRef}
                        type="search"
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={onInputKeyDown}
                        placeholder="Search docs…"
                        className="h-11 w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:cursor-pointer"
                        aria-autocomplete="list"
                        aria-controls="docs-search-results"
                        aria-activedescendant={
                            results[activeIndex]
                                ? `docs-search-option-${results[activeIndex].id}`
                                : undefined
                        }
                    />
                </div>

                <ul
                    id="docs-search-results"
                    role="listbox"
                    className="max-h-80 overflow-y-auto p-1.5"
                >
                    {results.length === 0 ? (
                        <li className="px-3 py-6 text-center text-[13px] text-muted">
                            No results for “{query.trim()}”
                        </li>
                    ) : (
                        results.map((item, index) => {
                            const active = index === activeIndex;
                            return (
                                <li key={item.id} role="presentation">
                                    <button
                                        type="button"
                                        id={`docs-search-option-${item.id}`}
                                        role="option"
                                        aria-selected={active}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => selectItem(item)}
                                        className={[
                                            "flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left transition-colors",
                                            active
                                                ? "bg-black/10 text-foreground"
                                                : "text-foreground hover:bg-code-bg",
                                        ].join(" ")}
                                    >
                                        <span className="flex items-center justify-between gap-2">
                                            <span className="text-[13px] font-medium">
                                                {item.title}
                                            </span>
                                            <Badge label={item.category} variant="default" />
                                        </span>
                                        <span className="truncate text-[12px] text-muted">
                                            {item.description}
                                        </span>
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>

                <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted">
                    <span>Docs landing coming soon</span>
                    <span className="hidden sm:inline">↑↓ navigate · ↵ open · esc close</span>
                </div>
            </div>
        </div>,
        document.body
    );
}
