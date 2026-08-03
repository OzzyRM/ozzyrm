/** Public docs site that hosts glossary pages for the mounted UI. */
export const DEFAULT_DOCS_SITE_ORIGIN = "https://ozzyrm.vercel.app";

export type GlossaryDocsCategory = "type" | "attribute";

export function normalizeDocsSiteOrigin(origin?: string): string {
    const raw = (origin ?? DEFAULT_DOCS_SITE_ORIGIN).trim().replace(/\/+$/, "");
    return raw.length > 0 ? raw : DEFAULT_DOCS_SITE_ORIGIN;
}

/** Path only, e.g. `/docs/glossary/type/string` */
export function glossaryDocsPath(
    category: GlossaryDocsCategory,
    key: string
): string {
    return `/docs/glossary/${category}/${key}`;
}

/** Absolute glossary URL on the docs site. */
export function glossaryDocsUrl(
    category: GlossaryDocsCategory,
    key: string,
    origin?: string
): string {
    return `${normalizeDocsSiteOrigin(origin)}${glossaryDocsPath(category, key)}`;
}

export function openGlossaryDocs(
    category: GlossaryDocsCategory,
    key: string,
    origin?: string
): void {
    if (typeof window === "undefined") {
        return;
    }

    window.open(
        glossaryDocsUrl(category, key, origin),
        "_blank",
        "noopener,noreferrer"
    );
}
