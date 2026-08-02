/**
 * Allow safe logo URLs for <img src>. Reject javascript:/vbscript: and non-image data: URIs.
 */
export function sanitizeLogoSrc(
    src: string | undefined,
    fallback: string
): string {
    if (!src || typeof src !== "string") {
        return fallback;
    }

    const trimmed = src.trim();
    if (!trimmed) {
        return fallback;
    }

    const lower = trimmed.toLowerCase();

    if (
        lower.startsWith("javascript:") ||
        lower.startsWith("vbscript:") ||
        lower.startsWith("data:text/") ||
        lower.startsWith("data:application/")
    ) {
        return fallback;
    }

    if (lower.startsWith("data:image/")) {
        return trimmed;
    }

    if (lower.startsWith("https:") || lower.startsWith("http:")) {
        return trimmed;
    }

    // relative / root-relative / plain filename — no scheme
    if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) {
        return trimmed;
    }

    return fallback;
}
