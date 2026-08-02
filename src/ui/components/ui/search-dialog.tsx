"use client";

import { Search } from "lucide-react";
import {
    useEffect,
    useId,
    useMemo,
    useRef,
    useState,
    type KeyboardEvent as ReactKeyboardEvent,
    type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import { Kbd } from "./kbd";

export interface SearchDialogProps<T> {
    open: boolean;
    onClose: () => void;
    title: string;
    placeholder?: string;
    footerLeft?: ReactNode;
    initialQuery?: string;
    items: T[];
    filterItems: (query: string, items: T[]) => T[];
    getItemId: (item: T) => string;
    onSelect: (item: T) => void;
    renderItem: (item: T, active: boolean) => ReactNode;
}

/**
 * Shared command-palette shell: overlay, search input, keyboard nav, footer.
 */
export function SearchDialog<T>({
    open,
    onClose,
    title,
    placeholder = "Search…",
    footerLeft,
    initialQuery = "",
    items,
    filterItems,
    getItemId,
    onSelect,
    renderItem,
}: SearchDialogProps<T>) {
    const titleId = useId();
    const listId = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState(initialQuery);
    const [activeIndex, setActiveIndex] = useState(0);
    const [mounted, setMounted] = useState(false);

    const results = useMemo(
        () => filterItems(query, items),
        [filterItems, items, query]
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

    const selectAt = (index: number) => {
        const item = results[index];
        if (!item) {
            return;
        }
        onSelect(item);
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
            selectAt(activeIndex);
        }
    };

    const activeId =
        results[activeIndex] != null
            ? `${listId}-option-${getItemId(results[activeIndex]!)}`
            : undefined;

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
                <h2
                    id={titleId}
                    className="absolute -left-[9999px] h-px w-px overflow-hidden"
                >
                    {title}
                </h2>

                <div className="flex items-center gap-2 border-b border-border px-3">
                    <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden />
                    <input
                        ref={inputRef}
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        onKeyDown={onInputKeyDown}
                        placeholder={placeholder}
                        className="h-11 w-full bg-transparent text-[14px] text-foreground outline-none placeholder:text-muted [&::-webkit-search-cancel-button]:cursor-pointer"
                        aria-autocomplete="list"
                        aria-controls={listId}
                        aria-activedescendant={activeId}
                    />
                </div>

                <ul
                    id={listId}
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
                            const id = getItemId(item);
                            return (
                                <li key={id} role="presentation">
                                    <button
                                        type="button"
                                        id={`${listId}-option-${id}`}
                                        role="option"
                                        aria-selected={active}
                                        onMouseEnter={() => setActiveIndex(index)}
                                        onClick={() => onSelect(item)}
                                        className={[
                                            "flex w-full flex-col gap-0.5 rounded-sm px-3 py-2 text-left transition-colors",
                                            active
                                                ? "bg-black/10 text-foreground"
                                                : "text-foreground hover:bg-code-bg",
                                        ].join(" ")}
                                    >
                                        {renderItem(item, active)}
                                    </button>
                                </li>
                            );
                        })
                    )}
                </ul>

                <div className="flex items-center justify-between border-t border-border px-3 py-2 text-[11px] text-muted">
                    <span>{footerLeft ?? null}</span>
                    <span className="hidden items-center gap-3 sm:flex">
                        <span className="inline-flex items-center gap-1">
                            <Kbd>↑↓</Kbd>
                            <span>Navigate</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Kbd>↵</Kbd>
                            <span>Open</span>
                        </span>
                        <span className="inline-flex items-center gap-1">
                            <Kbd>esc</Kbd>
                            <span>Close</span>
                        </span>
                    </span>
                </div>
            </div>
        </div>,
        document.body
    );
}
