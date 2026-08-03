import { GLOSSARY_ENTRIES, type GlossaryCategory } from "./entries";

export interface DocsPlaceholderItem {
    id: string;
    title: string;
    description: string;
    category: GlossaryCategory;
      /** path on the OzzyRM docs site — landing hosts these glossary pages */
      href: string;
}

export const DOCS_PLACEHOLDER_ITEMS: DocsPlaceholderItem[] = GLOSSARY_ENTRIES.map(
    (entry) => ({
        id: entry.key,
        title: entry.label,
        description: entry.summary,
        category: entry.category,
        href: `/docs/glossary/${entry.category}/${entry.key}`,
    })
);

export function searchDocsPlaceholder(
    query: string,
    items: DocsPlaceholderItem[] = DOCS_PLACEHOLDER_ITEMS
): DocsPlaceholderItem[] {
    const q = query.trim().toLowerCase();
    if (!q) {
        return items;
    }

    return items.filter((item) => {
        const haystack = [
            item.title,
            item.description,
            item.category,
            item.id,
        ]
            .join(" ")
            .toLowerCase();
        return haystack.includes(q);
    });
}
