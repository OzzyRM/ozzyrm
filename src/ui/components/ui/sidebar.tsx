"use client";

import type { DocSchema, DocScenario } from "../../..";
import { Search, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { searchSchema, type SearchItem } from "../../lib/search-schema";
import { sectionId } from "../../lib/section-id";
import { resolveSidebarActiveId } from "../../lib/scroll-spy";
import { useDebouncedValue } from "../../lib/use-debounced-value";

export interface NavSection {
    id: string;
    label: string;
    suffix?: string;
}

export interface NavGroup {
    title: string;
    items: NavSection[];
    /** nested groups get Scalar-style indent branch lines */
    branched?: boolean;
}

interface SidebarProps {
    schema: DocSchema;
    scenarios?: DocScenario[];
    activeId: string;
    onNavigate: (id: string) => void;
}

function NavLink({
    label,
    active,
    onClick,
    indent = 0,
    isFirst,
    isLast,
    suffix,
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    /** 0 = no branch; 1+ = branch columns */
    indent?: number;
    isFirst?: boolean;
    isLast?: boolean;
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

    const branched = indent > 0;

    return (
        <div
            className={[
                branched ? "nav-branch__item" : undefined,
                branched && isFirst ? "nav-branch__item--first" : undefined,
                branched && isLast ? "nav-branch__item--last" : undefined,
            ]
                .filter(Boolean)
                .join(" ")}
        >
            {Array.from({ length: indent }, (_, level) => (
                <span key={level} className="nav-branch__indent" aria-hidden>
                    <span className="nav-branch__line" />
                </span>
            ))}
            <button
                ref={ref}
                type="button"
                onClick={onClick}
                className={[
                    "nav-branch__btn w-full truncate py-1.5 pl-2 pr-2 text-left text-sm rounded-md transition-colors",
                    active
                        ? "bg-gray-100 font-medium text-black"
                        : "text-muted hover:bg-gray-100/70 hover:text-foreground",
                ].join(" ")}
            >
                <span className="">{label}</span>
                {suffix ? (
                    <span className="ml-1.5 text-[10px] capitalize text-muted/70">
                        {suffix}
                    </span>
                ) : null}
            </button>
        </div>
    );
}

export function buildNavGroups(
    schema: DocSchema,
    scenarios?: DocScenario[]
): NavGroup[] {
    const groups: NavGroup[] = [
        {
            title: "Introduction",
            items: [{ id: sectionId("overview"), label: "Overview" }],
        },
    ];

    if (scenarios && scenarios.length > 0) {
        groups.push({
            title: "Scenario",
            branched: true,
            items: scenarios.map((s) => ({
                id: sectionId("scenario", s.id),
                label: s.label,
                suffix: String(s.models.length),
            })),
        });
    }

    if (schema.models.length > 0) {
        groups.push({
            title: "Models",
            branched: true,
            items: schema.models.map((model) => ({
                id: sectionId("model", model.name),
                label: model.name,
            })),
        });
    }

    if (schema.enums.length > 0) {
        groups.push({
            title: "Enums",
            branched: true,
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

function groupUsesBranch(title: string, branched?: boolean): boolean {
    if (branched) return true;
    return title === "Models" || title === "Enums" || title === "Scenario";
}

export function Sidebar({ schema, scenarios, activeId, onNavigate }: SidebarProps) {
    const [query, setQuery] = useState("");
    const debouncedQuery = useDebouncedValue(query);
    const groups = buildNavGroups(schema, scenarios);
    const sidebarActiveId = resolveSidebarActiveId(activeId, schema);

    const searchGroups = useMemo(
        () => searchSchema(schema, debouncedQuery),
        [schema, debouncedQuery]
    );

    const isSearching = debouncedQuery.trim().length > 0;
    const displayGroups = isSearching ? searchGroups : groups;

    const hasResult = displayGroups.some((group) => group.items.length > 0);

    return (
        <aside className="flex w-60 shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar">
            <div className="relative border-b border-border px-3 py-2.5">
                <Search
                    aria-hidden
                    className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted"
                />
                <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search…"
                    className="h-8 w-full rounded-md border border-border bg-background pl-8 pr-8 text-[13px] text-foreground outline-none placeholder:text-muted focus:border-black/20"
                />
                {query ? (
                    <button
                        type="button"
                        aria-label="Clear search"
                        onClick={() => setQuery("")}
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                    >
                        <X className="h-3.5 w-3.5" />
                    </button>
                ) : null}
            </div>

            <nav className="flex-1 overflow-y-auto px-2 py-3">
                {isSearching && !hasResult ? (
                    <div className="py-10 text-center text-xs text-muted">
                        <p>
                            "<span className="font-medium">{debouncedQuery}</span>" not found
                        </p>
                    </div>
                ): (
                    displayGroups.map((group) => {
                        const branched = groupUsesBranch(
                            group.title,
                            (group as NavGroup).branched
                        );
            
                        return (
                            <div key={group.title} className="mb-4 last:mb-0">
                                <p className="mb-1 px-2 text-[10px] font-medium uppercase tracking-wider text-muted">
                                    {group.title}
                                </p>
            
                                <div className={branched ? "nav-branch" : "space-y-0.5"}>
                                    {group.items.map((item, index) => {
                                        const searchItem = item as SearchItem | NavSection;
                                        const depth =
                                            "depth" in searchItem ? searchItem.depth : 0;
                                        const searchType =
                                            "type" in searchItem
                                                ? searchItem.type
                                                : undefined;
                                        const indent = branched ? 1 + depth : 0;
            
                                        return (
                                            <NavLink
                                                key={item.id}
                                                label={item.label}
                                                active={sidebarActiveId === item.id}
                                                onClick={() => onNavigate(item.id)}
                                                indent={indent}
                                                isFirst={index === 0}
                                                isLast={index === group.items.length - 1}
                                                suffix={
                                                    isSearching
                                                        ? TYPE_SUFFIX[searchType ?? ""]
                                                        : (item as NavSection).suffix
                                                }
                                            />
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })
                )}
            </nav>
        </aside>
    );
}
