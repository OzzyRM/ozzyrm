export function sectionId(kind: "overview" | "model" | "enum", name?: string): string {
    if (kind === "overview") {
        return "overview";
    }

    const slug = (name ?? "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");

    return `${kind}-${slug}`;
}
