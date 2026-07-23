"use client";

import type { DocSchema } from "@reldoc/core";
import { sectionId } from "@/lib/section-id";

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
}: {
    label: string;
    active: boolean;
    onClick: () => void;
    nested?: boolean;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`relative w-full truncate py-1 text-left text-[13px] transition-colors ${
                nested ? "pl-3" : "pl-2"
            } ${
                active
                    ? "font-medium text-foreground before:absolute before:left-0 before:top-1/2 before:h-3.5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent"
                    : "text-muted hover:text-foreground"
            }`}
        >
            {label}
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

export function Sidebar({ schema, activeId, onNavigate }: SidebarProps) {
    const groups = buildNavGroups(schema);

    return (
        <aside className="flex w-[220px] shrink-0 flex-col border-r border-border bg-sidebar">
            <div className="border-b border-border px-4 py-3">
                <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold tracking-tight">Reldoc</span>
                    <span className="rounded border border-border px-1.5 py-px font-mono text-[10px] uppercase text-muted">
                        {schema.orm}
                    </span>
                </div>
                {schema.dataSource?.provider && (
                    <p className="mt-1 font-mono text-[11px] text-muted">
                        {schema.dataSource.provider}
                    </p>
                )}
            </div>

            <nav className="flex-1 overflow-y-auto px-3 py-3">
                {groups.map((group) => (
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
                                    nested={group.title !== "Introduction"}
                                    onClick={() => onNavigate(item.id)}
                                />
                            ))}
                        </div>
                    </div>
                ))}
            </nav>
        </aside>
    );
}
