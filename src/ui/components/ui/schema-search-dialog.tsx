"use client";

import { useMemo } from "react";
import type { SchemaCatalogGroup } from "../../types";
import { Badge } from "./badge";
import { OrmIcon } from "./orm-icon";
import { SearchDialog } from "./search-dialog";

export interface SchemaSearchItem {
    id: string;
    file: string;
    version: string;
    orm: SchemaCatalogGroup["orm"];
    groupId: string;
    modelCount: number;
    enumCount: number;
}

interface SchemaSearchDialogProps {
    open: boolean;
    onClose: () => void;
    catalog: SchemaCatalogGroup[];
    activeSchemaId: string;
    onSelect: (schemaId: string) => void;
    /** seed query e.g. file name when opened from a file icon */
    initialQuery?: string;
}

function buildSchemaItems(catalog: SchemaCatalogGroup[]): SchemaSearchItem[] {
    return catalog.flatMap((group) =>
        group.versions.map((version) => ({
            id: version.id,
            file: group.file,
            version: version.version,
            orm: group.orm,
            groupId: group.id,
            modelCount: version.schema.models.length,
            enumCount: version.schema.enums.length,
        }))
    );
}

function filterSchemaItems(
    query: string,
    items: SchemaSearchItem[]
): SchemaSearchItem[] {
    const q = query.trim().toLowerCase();
    if (!q) {
        return items;
    }

    return items.filter((item) => {
        const haystack = [
            item.file,
            item.version,
            item.orm,
            item.id,
            item.groupId,
        ]
            .join(" ")
            .toLowerCase();
        return haystack.includes(q);
    });
}

export function SchemaSearchDialog({
    open,
    onClose,
    catalog,
    activeSchemaId,
    onSelect,
    initialQuery = "",
}: SchemaSearchDialogProps) {
    const items = useMemo(() => buildSchemaItems(catalog), [catalog]);

    return (
        <SearchDialog
            open={open}
            onClose={onClose}
            title="Search schemas"
            placeholder="Search schemas…"
            footerLeft={`${items.length} schema${items.length === 1 ? "" : "s"} detected`}
            initialQuery={initialQuery}
            items={items}
            filterItems={filterSchemaItems}
            getItemId={(item) => item.id}
            onSelect={(item) => {
                onSelect(item.id);
                onClose();
            }}
            renderItem={(item) => (
                <>
                    <span className="flex items-center justify-between gap-2">
                        <span className="flex min-w-0 items-center gap-2">
                            <OrmIcon orm={item.orm} className="h-3.5 w-3.5 shrink-0" />
                            <span className="truncate text-[13px] font-medium">
                                {item.file}
                            </span>
                            {item.id === activeSchemaId ? (
                                <span className="shrink-0 text-xs font-medium text-muted">
                                    active
                                </span>
                            ) : null}
                        </span>
                        <Badge label={item.version} variant="default" />
                    </span>
                    <div className="flex gap-1 items-center">
                        <span className="text-xs text-muted">
                            {item.orm}
                        </span>
                        <Badge label={item.modelCount.toString()} variant="default" />
                        <Badge label={item.enumCount.toString()} variant="default" />
                    </div>
                </>
            )}
        />
    );
}
