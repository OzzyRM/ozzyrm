"use client";

import { useMemo } from "react";
import {
    buildDocsPlaceholderItems,
    searchDocsPlaceholder,
    type DocsPlaceholderItem,
} from "../../lib/glossary/docs-placeholder";
import { Badge } from "./badge";
import { SearchDialog } from "./search-dialog";

interface DocsSearchDialogProps {
    open: boolean;
    onClose: () => void;
    initialQuery?: string;
    docsBaseUrl?: string;
}

export function DocsSearchDialog({
    open,
    onClose,
    initialQuery = "",
    docsBaseUrl,
}: DocsSearchDialogProps) {
    const items = useMemo(
        () => buildDocsPlaceholderItems(docsBaseUrl),
        [docsBaseUrl]
    );

    return (
        <SearchDialog
            open={open}
            onClose={onClose}
            title="Search documentation"
            placeholder="Search glossary…"
            initialQuery={initialQuery}
            items={items}
            filterItems={searchDocsPlaceholder}
            getItemId={(item) => item.id}
            onSelect={(item: DocsPlaceholderItem) => {
                onClose();
                if (typeof window === "undefined") {
                    return;
                }
                window.open(item.url, "_blank", "noopener,noreferrer");
            }}
            renderItem={(item) => (
                <>
                    <span className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium">{item.title}</span>
                        <Badge label={item.category} variant="default" />
                    </span>
                    <span className="truncate text-[12px] text-muted">
                        {item.description}
                    </span>
                </>
            )}
        />
    );
}
