import type {
    DocEnum,
    DocModel,
    DocSchema,
    SchemaSourceRef,
} from "../utils/types/types";
import type { UnifiedSchemaDefinition } from "../utils/adapter";
import {
    physicalEnumKeys,
    physicalModelKeys,
    UnifiedDiagnostic,
    UnifiedSchemaValidationError,
    normalizeIdentityKey,
} from "./validation";

export interface ParsedSourceEntry {
    id: string;
    orm: Exclude<DocSchema["orm"], "unified">;
    label?: string;
    file: string;
    schema: DocSchema;
    parseError?: string;
}

export interface MergeUnifiedInput {
    definition: UnifiedSchemaDefinition;
    members: ParsedSourceEntry[];
}

interface ModelOwner {
    model: DocModel;
    source: SchemaSourceRef;
}

interface EnumOwner {
    item: DocEnum;
    source: SchemaSourceRef;
}

/**
 * Strict merge of multiple parsed sources into one DocSchema.
 * Duplicate identities always conflict. Relations resolve via name/dbName/tableName aliases
 * only when a single owner exists for that identity.
 */
export function mergeUnifiedSchema(input: MergeUnifiedInput): DocSchema {
    const diagnostics: UnifiedDiagnostic[] = [];
    const { definition, members } = input;

    if (definition.sources.length < 2) {
        diagnostics.push({
            code: "EMPTY_GROUP",
            message: `unified group "${definition.id}" needs at least 2 sources`,
            sourceId: definition.id,
        });
    }

    const seenMemberIds = new Set<string>();
    for (const sourceId of definition.sources) {
        if (seenMemberIds.has(sourceId)) {
            diagnostics.push({
                code: "DUP_SOURCE_ID",
                message: `source "${sourceId}" is listed more than once in unified group "${definition.id}"`,
                sourceId: definition.id,
                path: ["sources", sourceId],
            });
            continue;
        }
        seenMemberIds.add(sourceId);

        const member = members.find((item) => item.id === sourceId);
        if (!member) {
            diagnostics.push({
                code: "UNKNOWN_SOURCE",
                message: `unified group "${definition.id}" references unknown source "${sourceId}"`,
                sourceId: definition.id,
                path: ["sources", sourceId],
            });
            continue;
        }

        if (member.parseError) {
            diagnostics.push({
                code: "SOURCE_PARSE_FAILED",
                message: member.parseError,
                sourceId: member.id,
            });
        }
    }

    const available = members.filter(
        (member) => definition.sources.includes(member.id) && !member.parseError
    );

    const sources: SchemaSourceRef[] = available.map((member) => ({
        id: member.id,
        orm: member.orm,
        label: member.label ?? member.file,
    }));

    const modelOwners: ModelOwner[] = [];
    const enumOwners: EnumOwner[] = [];
    const logicalModelIndex = new Map<string, ModelOwner[]>();
    const physicalModelIndex = new Map<string, ModelOwner[]>();
    const logicalEnumIndex = new Map<string, EnumOwner[]>();
    const physicalEnumIndex = new Map<string, EnumOwner[]>();

    for (const member of available) {
        const source: SchemaSourceRef = {
            id: member.id,
            orm: member.orm,
            label: member.label ?? member.file,
        };

        const fieldNames = new Set<string>();
        for (const model of member.schema.models) {
            fieldNames.clear();
            for (const field of model.fields) {
                const key = normalizeIdentityKey(field.name);
                if (fieldNames.has(key)) {
                    diagnostics.push({
                        code: "DUP_FIELD",
                        message: `duplicate field "${field.name}" on model "${model.name}"`,
                        sourceId: member.id,
                        path: [model.name, "fields", field.name],
                    });
                }
                fieldNames.add(key);
            }

            const owner: ModelOwner = {
                model: {
                    ...model,
                    fields: model.fields.map((field) => ({ ...field })),
                    referencedBy: [],
                    source,
                },
                source,
            };
            modelOwners.push(owner);

            const logical = normalizeIdentityKey(model.name);
            pushIndex(logicalModelIndex, logical, owner);

            for (const physical of physicalModelKeys(model)) {
                if (physical === logical) {
                    continue;
                }
                pushIndex(physicalModelIndex, physical, owner);
            }
        }

        for (const item of member.schema.enums) {
            const owner: EnumOwner = {
                item: { ...item, values: item.values.map((value) => ({ ...value })), source },
                source,
            };
            enumOwners.push(owner);

            const logical = normalizeIdentityKey(item.name);
            pushIndex(logicalEnumIndex, logical, owner);

            for (const physical of physicalEnumKeys(item)) {
                if (physical === logical) {
                    continue;
                }
                pushIndex(physicalEnumIndex, physical, owner);
            }
        }
    }

    // duplicate logical model names across sources
    for (const [key, owners] of logicalModelIndex) {
        if (owners.length > 1) {
            diagnostics.push({
                code: "DUP_MODEL",
                message: `model identity "${key}" is defined by multiple sources`,
                path: [owners[0]!.model.name],
                sourceId: owners[0]!.source.id,
                related: {
                    sourceId: owners[1]!.source.id,
                    path: [owners[1]!.model.name],
                },
            });
        }
    }

    // duplicate physical table identities, including logical-name vs @@map/tableName collisions
    const physicalKeys = new Set([
        ...physicalModelIndex.keys(),
        ...logicalModelIndex.keys(),
    ]);
    for (const key of physicalKeys) {
        const owners = uniqueBy(
            [
                ...(physicalModelIndex.get(key) ?? []),
                ...(logicalModelIndex.get(key) ?? []),
            ],
            (owner) => `${owner.source.id}:${owner.model.name}`
        );
        if (owners.length < 2) {
            continue;
        }

        // same logical name is already reported as DUP_MODEL
        const sameLogicalName = owners.every(
            (owner) =>
                normalizeIdentityKey(owner.model.name)
                === normalizeIdentityKey(owners[0]!.model.name)
        );
        if (sameLogicalName && key === normalizeIdentityKey(owners[0]!.model.name)) {
            continue;
        }

        diagnostics.push({
            code: "DUP_TABLE_NAME",
            message: `physical table identity "${key}" is claimed by multiple models/sources`,
            path: [owners[0]!.model.name],
            sourceId: owners[0]!.source.id,
            related: {
                sourceId: owners[1]!.source.id,
                path: [owners[1]!.model.name],
            },
        });
    }

    for (const [key, owners] of logicalEnumIndex) {
        if (owners.length > 1) {
            diagnostics.push({
                code: "DUP_ENUM",
                message: `enum identity "${key}" is defined by multiple sources`,
                path: [owners[0]!.item.name],
                sourceId: owners[0]!.source.id,
                related: {
                    sourceId: owners[1]!.source.id,
                    path: [owners[1]!.item.name],
                },
            });
        }
    }

    const physicalEnumKeysSet = new Set([
        ...physicalEnumIndex.keys(),
        ...logicalEnumIndex.keys(),
    ]);
    for (const key of physicalEnumKeysSet) {
        const owners = uniqueBy(
            [
                ...(physicalEnumIndex.get(key) ?? []),
                ...(logicalEnumIndex.get(key) ?? []),
            ],
            (owner) => `${owner.source.id}:${owner.item.name}`
        );
        if (owners.length < 2) {
            continue;
        }

        const sameLogicalName = owners.every(
            (owner) =>
                normalizeIdentityKey(owner.item.name)
                === normalizeIdentityKey(owners[0]!.item.name)
        );
        if (sameLogicalName && key === normalizeIdentityKey(owners[0]!.item.name)) {
            continue;
        }

        diagnostics.push({
            code: "DUP_ENUM",
            message: `physical enum identity "${key}" is claimed by multiple sources`,
            path: [owners[0]!.item.name],
            sourceId: owners[0]!.source.id,
            related: {
                sourceId: owners[1]!.source.id,
                path: [owners[1]!.item.name],
            },
        });
    }

    const resolveModel = (raw: string): ModelOwner | "ambiguous" | undefined => {
        const key = normalizeIdentityKey(raw);
        const bare = normalizeIdentityKey(raw.split(".").pop() ?? raw);
        const logical = logicalModelIndex.get(key) ?? logicalModelIndex.get(bare) ?? [];
        const physical = physicalModelIndex.get(key) ?? physicalModelIndex.get(bare) ?? [];
        const combined = uniqueBy(
            [...logical, ...physical],
            (owner) => `${owner.source.id}:${owner.model.name}`
        );

        if (combined.length === 0) {
            return undefined;
        }
        if (combined.length > 1) {
            return "ambiguous";
        }
        return combined[0];
    };

    const resolveEnum = (raw: string): EnumOwner | "ambiguous" | undefined => {
        const key = normalizeIdentityKey(raw);
        const bare = normalizeIdentityKey(raw.split(".").pop() ?? raw);
        const logical = logicalEnumIndex.get(key) ?? logicalEnumIndex.get(bare) ?? [];
        const physical = physicalEnumIndex.get(key) ?? physicalEnumIndex.get(bare) ?? [];
        const combined = uniqueBy(
            [...logical, ...physical],
            (owner) => `${owner.source.id}:${owner.item.name}`
        );

        if (combined.length === 0) {
            return undefined;
        }
        if (combined.length > 1) {
            return "ambiguous";
        }
        return combined[0];
    };

    // validate relations / enums / indexes against the global registry
    for (const owner of modelOwners) {
        const model = owner.model;

        for (const field of model.fields) {
            if (field.relation) {
                const target = resolveModel(field.relation.model);
                if (!target) {
                    diagnostics.push({
                        code: "REL_TARGET_NOT_FOUND",
                        message: `relation "${model.name}.${field.name}" targets unknown model "${field.relation.model}"`,
                        sourceId: owner.source.id,
                        path: [model.name, "fields", field.name, "relation"],
                    });
                } else if (target === "ambiguous") {
                    diagnostics.push({
                        code: "AMBIGUOUS_NAME",
                        message: `relation "${model.name}.${field.name}" target "${field.relation.model}" is ambiguous across sources`,
                        sourceId: owner.source.id,
                        path: [model.name, "fields", field.name, "relation"],
                    });
                } else {
                    // rewrite to canonical logical name for navigation
                    field.relation = {
                        ...field.relation,
                        model: target.model.name,
                    };

                    const targetField = target.model.fields.find(
                        (item) =>
                            normalizeIdentityKey(item.name) === normalizeIdentityKey(field.relation!.field)
                            || (
                                item.dbName
                                && normalizeIdentityKey(item.dbName) === normalizeIdentityKey(field.relation!.field)
                            )
                    );

                    if (!targetField) {
                        diagnostics.push({
                            code: "REL_FIELD_NOT_FOUND",
                            message: `relation "${model.name}.${field.name}" targets missing field "${field.relation.field}" on "${target.model.name}"`,
                            sourceId: owner.source.id,
                            path: [model.name, "fields", field.name, "relation", "field"],
                            related: {
                                sourceId: target.source.id,
                                path: [target.model.name],
                            },
                        });
                    } else {
                        field.relation.field = targetField.name;
                        const exists = target.model.referencedBy.some(
                            (item) => item.model === model.name && item.field === field.name
                        );
                        if (!exists) {
                            target.model.referencedBy.push({
                                model: model.name,
                                field: field.name,
                            });
                        }
                    }
                }
            }

            if (field.enumName || field.kind === "enum") {
                const enumName = field.enumName ?? field.nativeType;
                if (enumName) {
                    const target = resolveEnum(enumName);
                    if (!target) {
                        diagnostics.push({
                            code: "ENUM_NOT_FOUND",
                            message: `field "${model.name}.${field.name}" references unknown enum "${enumName}"`,
                            sourceId: owner.source.id,
                            path: [model.name, "fields", field.name, "enum"],
                        });
                    } else if (target === "ambiguous") {
                        diagnostics.push({
                            code: "AMBIGUOUS_NAME",
                            message: `field "${model.name}.${field.name}" enum "${enumName}" is ambiguous across sources`,
                            sourceId: owner.source.id,
                            path: [model.name, "fields", field.name, "enum"],
                        });
                    } else {
                        field.enumName = target.item.name;
                    }
                }
            }
        }

        for (const index of model.indexes) {
            for (const fieldName of index.fields) {
                const exists = model.fields.some(
                    (field) =>
                        normalizeIdentityKey(field.name) === normalizeIdentityKey(fieldName)
                        || (
                            field.dbName
                            && normalizeIdentityKey(field.dbName) === normalizeIdentityKey(fieldName)
                        )
                );
                if (!exists) {
                    diagnostics.push({
                        code: "INDEX_FIELD_NOT_FOUND",
                        message: `index on "${model.name}" references missing field "${fieldName}"`,
                        sourceId: owner.source.id,
                        path: [model.name, "indexes", fieldName],
                    });
                }
            }
        }

        for (const group of [...model.compoundId, ...model.compoundUnique]) {
            for (const fieldName of group) {
                const exists = model.fields.some(
                    (field) => normalizeIdentityKey(field.name) === normalizeIdentityKey(fieldName)
                );
                if (!exists) {
                    diagnostics.push({
                        code: "INDEX_FIELD_NOT_FOUND",
                        message: `constraint on "${model.name}" references missing field "${fieldName}"`,
                        sourceId: owner.source.id,
                        path: [model.name, "constraints", fieldName],
                    });
                }
            }
        }
    }

    if (diagnostics.length > 0) {
        throw new UnifiedSchemaValidationError(diagnostics);
    }

    const providers = available
        .map((member) => member.schema.dataSource?.provider)
        .filter((value): value is NonNullable<typeof value> => Boolean(value));

    return {
        generatedAt: new Date().toISOString(),
        orm: "unified",
        version: definition.version ?? "1.0.0",
        dataSource: providers[0] ? { provider: providers[0] } : undefined,
        models: modelOwners.map((owner) => owner.model),
        enums: enumOwners.map((owner) => owner.item),
        sources,
    };
}

function pushIndex<T>(map: Map<string, T[]>, key: string, value: T): void {
    const list = map.get(key) ?? [];
    list.push(value);
    map.set(key, list);
}

function uniqueBy<T>(items: T[], keyFn: (item: T) => string): T[] {
    const seen = new Set<string>();
    const result: T[] = [];
    for (const item of items) {
        const key = keyFn(item);
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        result.push(item);
    }
    return result;
}
