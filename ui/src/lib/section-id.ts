function slug(value: string): string {
    return value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
}

export function sectionId(kind: "overview" | "model" | "enum", name?: string): string {
    if (kind === "overview") {
        return "overview";
    }

    return `${kind}-${slug(name ?? "")}`;
}

export function fieldSectionId(modelName: string, fieldName: string): string {
    return `field-${slug(modelName)}-${slug(fieldName)}`;
}

export function enumValueSectionId(enumName: string, valueName: string): string {
    return `${sectionId("enum", enumName)}-value-${slug(valueName)}`;
}
