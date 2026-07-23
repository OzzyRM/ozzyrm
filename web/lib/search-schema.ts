import type { DocSchema } from "@reldoc/core";
import { enumValueSectionId, fieldSectionId, sectionId } from "./section-id";

export type SearchItemType = "model" | "enum" | "field" | "enumValue";

export interface SearchItem {
    id: string;
    label: string;
    depth: 0 | 1;
    type: SearchItemType;
}

export interface SearchGroup {
    title: string;
    items: SearchItem[];
}

function matches(value: string, query: string): boolean {
    return value.toLowerCase().includes(query);
}

export function searchSchema(schema: DocSchema, query: string): SearchGroup[] {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) {
        return [];
    }

    const groups: SearchGroup[] = [];

    const modelItems: SearchItem[] = [];
    for (const model of schema.models) {
        const modelMatch = matches(model.name, trimmed);
        const matchingFields = model.fields.filter((field) => matches(field.name, trimmed));

        if (!modelMatch && matchingFields.length === 0) {
            continue;
        }

        modelItems.push({
            id: sectionId("model", model.name),
            label: model.name,
            depth: 0,
            type: "model",
        });

        for (const field of matchingFields) {
            modelItems.push({
                id: fieldSectionId(model.name, field.name),
                label: field.name,
                depth: 1,
                type: "field",
            });
        }
    }

    if (modelItems.length > 0) {
        groups.push({ title: "Models", items: modelItems });
    }

    const enumItems: SearchItem[] = [];
    for (const enumDef of schema.enums) {
        const enumMatch = matches(enumDef.name, trimmed);
        const matchingValues = enumDef.values.filter((value) => matches(value.name, trimmed));

        if (!enumMatch && matchingValues.length === 0) {
            continue;
        }

        enumItems.push({
            id: sectionId("enum", enumDef.name),
            label: enumDef.name,
            depth: 0,
            type: "enum",
        });

        for (const value of matchingValues) {
            enumItems.push({
                id: enumValueSectionId(enumDef.name, value.name),
                label: value.name,
                depth: 1,
                type: "enumValue",
            });
        }
    }

    if (enumItems.length > 0) {
        groups.push({ title: "Enums", items: enumItems });
    }

    if (matches("overview", trimmed) || matches("schema", trimmed)) {
        groups.unshift({
            title: "Introduction",
            items: [{
                id: sectionId("overview"),
                label: "Overview",
                depth: 0,
                type: "model",
            }],
        });
    }

    return groups;
}
