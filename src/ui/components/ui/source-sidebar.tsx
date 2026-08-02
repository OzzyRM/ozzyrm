"use client";

import { CircleHelp, File } from "lucide-react";
import { useCallback, useState } from "react";
import type { SchemaCatalogGroup } from "../../types";
import { DEFAULT_LOGO_SRC } from "../../brand/default-logo";
import { useGlossary } from "../glossary-provider";
import { SchemaSearchDialog } from "./schema-search-dialog";

interface SourceSidebarProps {
    catalog: SchemaCatalogGroup[];
    activeSchemaId: string;
    onSchemaChange: (id: string) => void;
    logoSrc?: string;
}

const RAIL_WIDTH = 52;

export function SourceSidebar({
    catalog,
    activeSchemaId,
    onSchemaChange,
    logoSrc = DEFAULT_LOGO_SRC,
}: SourceSidebarProps) {
    const { openDocsSearch } = useGlossary();
    const [schemaSearchOpen, setSchemaSearchOpen] = useState(false);
    const [schemaQuery, setSchemaQuery] = useState("");

    const openSchemaSearch = useCallback((seed = "") => {
        setSchemaQuery(seed);
        setSchemaSearchOpen(true);
    }, []);

    const activeGroupId = catalog.find((group) =>
        group.versions.some((version) => version.id === activeSchemaId)
    )?.id;

    return (
        <>
            <aside
                className="flex shrink-0 flex-col border-r border-border bg-sidebar"
                style={{ width: RAIL_WIDTH }}
            >
                <div className="flex items-center justify-center border-b border-border px-2 py-3">
                    <img
                        src={logoSrc}
                        alt="OzzyRM"
                        width={28}
                        height={28}
                        className="h-5 w-auto shrink-0"
                    />
                </div>

                <nav className="flex flex-1 flex-col items-center gap-1 overflow-y-auto px-1.5 py-3">
                    {catalog.map((group) => {
                        const active = group.id === activeGroupId;
                        return (
                            <button
                                key={group.id}
                                type="button"
                                title={group.file}
                                aria-label={`Open schemas · ${group.file}`}
                                aria-current={active ? "true" : undefined}
                                onClick={() => openSchemaSearch(group.file)}
                                className={[
                                    "flex h-9 w-9 items-center justify-center rounded-md transition-colors",
                                    active
                                        ? "bg-gray-100 text-black"
                                        : "text-muted hover:bg-gray-100/70 hover:text-foreground",
                                ].join(" ")}
                            >
                                <File className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                            </button>
                        );
                    })}
                </nav>

                <div className="flex items-center justify-center border-t border-border px-1.5 py-2">
                    <button
                        type="button"
                        title="Search docs"
                        aria-label="Search documentation"
                        onClick={() => openDocsSearch()}
                        className="flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-gray-100/70 hover:text-foreground"
                    >
                        <CircleHelp className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </button>
                </div>
            </aside>

            <SchemaSearchDialog
                open={schemaSearchOpen}
                onClose={() => setSchemaSearchOpen(false)}
                catalog={catalog}
                activeSchemaId={activeSchemaId}
                onSelect={onSchemaChange}
                initialQuery={schemaQuery}
            />
        </>
    );
}
