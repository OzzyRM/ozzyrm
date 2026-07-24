import type { GlossaryCategory, GlossaryEntry } from "./entries";
import { GLOSSARY_ALIASES, GLOSSARY_ENTRIES } from "./entries";

const entriesByKey = new Map(GLOSSARY_ENTRIES.map((entry) => [entry.key, entry]));

function normalizeKey(label: string): string {
    return label.trim().toLowerCase().replace(/[^a-z0-9-]+/g, "");
}

export function lookupGlossary(
    label: string,
    category: GlossaryCategory
): GlossaryEntry | null {
    const normalized = normalizeKey(label);
    const key = GLOSSARY_ALIASES[normalized] ?? normalized;
    const entry = entriesByKey.get(key);

    if (!entry || entry.category !== category) {
        return null;
    }

    return entry;
}

export function hasGlossaryEntry(label: string, category: GlossaryCategory): boolean {
    return lookupGlossary(label, category) !== null;
}
