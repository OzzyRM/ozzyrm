import { GLOSSARY_ENTRIES, type GlossaryCategory } from "./entries";
import { glossaryDocsPath, glossaryDocsUrl, normalizeDocsSiteOrigin } from "./docs-site";

export interface DocsPlaceholderItem {
    id: string;
    title: string;
    description: string;
    category: GlossaryCategory;
    /** path on the OzzyRM docs site */
    href: string;
    /** absolute URL used when opening the docs page */
    url: string;
}

export function buildDocsPlaceholderItems(
    docsBaseUrl?: string
): DocsPlaceholderItem[] {
    const origin = normalizeDocsSiteOrigin(docsBaseUrl);

    return GLOSSARY_ENTRIES.map((entry) => ({
        id: entry.key,
        title: entry.label,
        description: entry.summary,
        category: entry.category,
        href: glossaryDocsPath(entry.category, entry.key),
        url: glossaryDocsUrl(entry.category, entry.key, origin),
    }));
}

/** Default list pointed at https://ozzyrm.vercel.app */
export const DOCS_PLACEHOLDER_ITEMS: DocsPlaceholderItem[] =
    buildDocsPlaceholderItems();

export function searchDocsPlaceholder(
    query: string,
    items: DocsPlaceholderItem[] = DOCS_PLACEHOLDER_ITEMS
): DocsPlaceholderItem[] {
    const q = query.trim().toLowerCase();
    if (!q) {
        return items;
    }

    return items.filter((item) => {
        const haystack = [item.title, item.description, item.category, item.id]
            .join(" ")
            .toLowerCase();
        return haystack.includes(q);
    });
}
