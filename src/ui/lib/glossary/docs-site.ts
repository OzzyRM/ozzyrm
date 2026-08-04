/** Public docs site that hosts glossary pages for the mounted UI. */
export const DOCS_SITE_ORIGIN = "https://ozzyrm.vercel.app";

export type GlossaryDocsCategory = "type" | "attribute";

/** Path only, e.g. `/docs/glossary/type/string` */
export function glossaryDocsPath(
    category: GlossaryDocsCategory,
    key: string
): string {
    return `/docs/glossary/${category}/${key}`;
}

/** Absolute glossary URL on ozzyrm.vercel.app */
export function glossaryDocsUrl(
    category: GlossaryDocsCategory,
    key: string
): string {
    return `${DOCS_SITE_ORIGIN}${glossaryDocsPath(category, key)}`;
}

export function openGlossaryDocs(
    category: GlossaryDocsCategory,
    key: string
): void {
    if (typeof window === "undefined") {
        return;
    }

    window.open(glossaryDocsUrl(category, key), "_blank", "noopener,noreferrer");
}
