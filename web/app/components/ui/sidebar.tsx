"use client";

import type { DocSchema } from "@reldoc/core";
import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchSchema } from "@/lib/search-schema";
import { sectionId } from "@/lib/section-id";
import { resolveSidebarActiveId } from "@/lib/scroll-spy";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { X } from "lucide-react";

export interface NavSection {
    id: string;
    label: string;
}

export interface NavGroup {
    title: string;
    items: NavSection[];
}

interface SidebarProps {
    schema: DocSchema;
    activeId: string;
    onNavigate: (id: string) => void;
}

function NavLink({
    label,
    active,
    onClick,
    nested,
    suffix,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    nested?: boolean;
    suffix?: string;
}) {
    const ref = useRef<HTMLButtonElement>(null);

    useEffect(() => {
        if (!active || !ref.current) {
            return;
        }

        ref.current.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
        });
    }, [active]);

    return (
        <button
            ref={ref}
            type="button"
            onClick={onClick}
            className={`relative w-full truncate py-1 text-left text-[13px] transition-colors ${
                nested ? "pl-5" : "pl-2"
            } ${
                active
                    ? "font-medium text-foreground before:absolute before:left-0 before:top-1/2 before:h-3.5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent"
                    : "text-muted hover:text-foreground"
            }`}
        >
            <span className="font-mono">{label}</span>
            {suffix && (
                <span className="ml-1.5 text-[10px] uppercase tracking-wide text-muted/70">
                    {suffix}
                </span>
            )}
        </button>
    );
}

export function buildNavGroups(schema: DocSchema): NavGroup[] {
    const groups: NavGroup[] = [
        {
            title: "Introduction",
            items: [{ id: sectionId("overview"), label: "Overview" }],
        },
    ];

    if (schema.models.length > 0) {
        groups.push({
            title: "Models",
            items: schema.models.map((model) => ({
                id: sectionId("model", model.name),
                label: model.name,
            })),
        });
    }

    if (schema.enums.length > 0) {
        groups.push({
            title: "Enums",
            items: schema.enums.map((enumDef) => ({
                id: sectionId("enum", enumDef.name),
                label: enumDef.name,
            })),
        });
    }

    return groups;
}

const TYPE_SUFFIX: Record<string, string | undefined> = {
    field: "field",
    enumValue: "value",
};

export function Sidebar({ schema, activeId, onNavigate }: SidebarProps) {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebouncedValue(query);
    const groups = buildNavGroups(schema);
    const sidebarActiveId = resolveSidebarActiveId(activeId, schema);

    const searchGroups = useMemo(
        () => searchSchema(schema, debouncedQuery),
        [schema, debouncedQuery]
    );

    const isSearching = debouncedQuery.trim().length > 0;

    return (
        <aside className="flex w-[240px] shrink-0 flex-col border-r border-border bg-background">
            <div className="px-3 py-3">
                <div className="relative">
                    <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted" />
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search models, fields..."
                        className="w-full rounded-md border border-border bg-background py-1.5 pl-8 pr-3 text-[13px] text-foreground outline-none transition-colors placeholder:text-muted focus:border-accent/40 [&::-webkit-search-cancel-button]:cursor-pointer"
                    />
                    {query && (
                        <button
                            type="button"
                            onClick={() => setQuery("")}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-muted transition-colors hover:text-foreground"
                            aria-label="Clear search"
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    )}
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3">
                {isSearching ? (
                    searchGroups.length > 0 ? (
                        searchGroups.map((group) => (
                            <div key={group.title} className="mb-4 last:mb-0">
                                <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                                    {group.title}
                                </p>
                                <div className="space-y-0.5">
                                    {group.items.map((item) => (
                                        <NavLink
                                            key={item.id}
                                            label={item.label}
                                            active={activeId === item.id}
                                            nested={item.depth === 1}
                                            suffix={TYPE_SUFFIX[item.type]}
                                            onClick={() => onNavigate(item.id)}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))
                    ) : (
                        <p className="px-2 py-6 text-center text-[12px] text-muted">
                            No results for &ldquo;{debouncedQuery}&rdquo;
                        </p>
                    )
                ) : (
                    groups.map((group) => (
                        <div key={group.title} className="mb-4 last:mb-0">
                            <p className="mb-1.5 px-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                                {group.title}
                            </p>
                            <div className="space-y-0.5">
                                {group.items.map((item) => (
                                    <NavLink
                                        key={item.id}
                                        label={item.label}
                                        active={sidebarActiveId === item.id}
                                        nested={group.title !== "Introduction"}
                                        onClick={() => onNavigate(item.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    ))
                )}
            </nav>
        </aside>
    );
}
