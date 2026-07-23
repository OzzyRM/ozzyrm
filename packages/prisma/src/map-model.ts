import type { Model, Index, IndexType } from "@prisma/dmmf";
import type { DocModel, IndexesArray } from "@reldoc/core";
import { mapField } from "./map-field";

const INDEX_TYPE_MAP: Partial<Record<IndexType, IndexesArray>> = {
    normal: "BTree",
};

export function mapModel(
    model: Model,
    indexes: readonly Index[],
    enumNames: Set<string>
): DocModel {
    const modelIndexes = indexes
        .filter((index) => index.model === model.name && index.type === "normal")
        .map((index) => ({
            name: index.name ?? index.dbName ?? undefined,
            fields: index.fields.map((field) => field.name),
            type: mapIndexType(index.algorithm),
        }));

    return {
        name: model.name,
        dbName: model.dbName ?? undefined,
        description: model.documentation ?? undefined,
        referencedBy: [],
        compoundUnique: (model.uniqueFields ?? []).map((fields) => fields.map(String)),
        compoundId: model.primaryKey?.fields?.length
            ? [model.primaryKey.fields.map(String)]
            : [],
        indexes: modelIndexes,
        fields: model.fields.map((field) => mapField(field, enumNames)),
    };
}

function mapIndexType(algorithm?: string): IndexesArray | undefined {
    if (!algorithm) {
        return INDEX_TYPE_MAP.normal;
    }

    const normalized = algorithm.toLowerCase();
    if (normalized.includes("hash")) return "Hash";
    if (normalized.includes("gist")) return "Gist";
    if (normalized.includes("gin")) return "Gin";
    if (normalized.includes("spgist")) return "SpGist";
    if (normalized.includes("brin")) return "Brin";

    return "BTree";
}
