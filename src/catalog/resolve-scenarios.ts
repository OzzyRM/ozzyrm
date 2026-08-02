import type { SchemaScenarioDefinition } from "../utils/adapter";
import type { DocSchema, DocScenario } from "../utils/types/types";
import {
    type UnifiedDiagnostic,
    UnifiedSchemaValidationError,
} from "./validation";

/** kebab-case id: issue-lifecycle, billing-flow */
const SCENARIO_ID_RE = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/** Undirected pair key for relation lookup */
function pairKey(a: string, b: string): string {
    return [a, b].sort().join("<->");
}

/** Collect undirected model pairs that have at least one relation field. */
export function collectRelatedModelPairs(schema: DocSchema): Set<string> {
    const pairs = new Set<string>();

    for (const model of schema.models) {
        for (const field of model.fields) {
            if (!field.relation) continue;
            pairs.add(pairKey(model.name, field.relation.model));
        }
    }

    return pairs;
}

function push(
    diagnostics: UnifiedDiagnostic[],
    partial: UnifiedDiagnostic
): void {
    diagnostics.push(partial);
}

/**
 * Resolve config scenarios against a catalog of schemas keyed by version id.
 * Fail-closed: any invalid id/ref/path throws UnifiedSchemaValidationError.
 */
export function resolveScenarios(
    definitions: SchemaScenarioDefinition[] | undefined,
    schemasById: Map<string, DocSchema>
): Map<string, DocScenario[]> {
    const bySchemaId = new Map<string, DocScenario[]>();
    if (!definitions?.length) {
        return bySchemaId;
    }

    const diagnostics: UnifiedDiagnostic[] = [];
    const seenIds = new Set<string>();

    for (const [index, def] of definitions.entries()) {
        const loc = `scenarios[${index}]`;
        const id = typeof def.id === "string" ? def.id.trim() : "";
        const label = typeof def.label === "string" ? def.label.trim() : "";
        const schemaId =
            typeof def.schemaId === "string" ? def.schemaId.trim() : "";

        if (!id || !SCENARIO_ID_RE.test(id)) {
            push(diagnostics, {
                code: "INVALID_SCENARIO_ID",
                message: id
                    ? `scenario id "${id}" must be kebab-case (e.g. issue-lifecycle)`
                    : "scenario id is required and must be kebab-case (e.g. issue-lifecycle)",
                sourceId: id || undefined,
                path: [loc, "id"],
            });
            continue;
        }

        if (seenIds.has(id)) {
            push(diagnostics, {
                code: "DUP_SCENARIO_ID",
                message: `duplicate scenario id "${id}"`,
                sourceId: id,
                path: [loc, "id"],
            });
            continue;
        }
        seenIds.add(id);

        if (!label) {
            push(diagnostics, {
                code: "INVALID_SCENARIO_LABEL",
                message: `scenario "${id}" requires a non-empty label`,
                sourceId: id,
                path: [loc, "label"],
            });
        }

        if (!schemaId) {
            push(diagnostics, {
                code: "UNKNOWN_SCHEMA_ID",
                message: `scenario "${id}" requires schemaId`,
                sourceId: id,
                path: [loc, "schemaId"],
            });
            continue;
        }

        const schema = schemasById.get(schemaId);
        if (!schema) {
            const known = [...schemasById.keys()].sort().join(", ") || "(none)";
            push(diagnostics, {
                code: "UNKNOWN_SCHEMA_ID",
                message: `scenario "${id}": schemaId "${schemaId}" not found. Known: ${known}`,
                sourceId: id,
                path: [loc, "schemaId"],
            });
            continue;
        }

        const modelNames = new Set(schema.models.map((m) => m.name));
        const enumNames = new Set(schema.enums.map((e) => e.name));
        const related = collectRelatedModelPairs(schema);

        if (!Array.isArray(def.models) || def.models.length === 0) {
            push(diagnostics, {
                code: "EMPTY_SCENARIO_MODELS",
                message: `scenario "${id}" must list at least one model`,
                sourceId: id,
                path: [loc, "models"],
            });
            continue;
        }

        const models: string[] = [];
        const modelSet = new Set<string>();
        for (const [mi, name] of def.models.entries()) {
            if (typeof name !== "string" || !name.trim()) {
                push(diagnostics, {
                    code: "UNKNOWN_MODEL",
                    message: `scenario "${id}": models[${mi}] is empty`,
                    sourceId: id,
                    path: [loc, "models", String(mi)],
                });
                continue;
            }
            if (!modelNames.has(name)) {
                push(diagnostics, {
                    code: "UNKNOWN_MODEL",
                    message: `scenario "${id}": model "${name}" not in schema "${schemaId}"`,
                    sourceId: id,
                    path: [loc, "models", name],
                });
                continue;
            }
            if (modelSet.has(name)) {
                continue;
            }
            models.push(name);
            modelSet.add(name);
        }

        if (models.length === 0) {
            push(diagnostics, {
                code: "EMPTY_SCENARIO_MODELS",
                message: `scenario "${id}": no valid models`,
                sourceId: id,
                path: [loc, "models"],
            });
            continue;
        }

        const enums: string[] = [];
        for (const [ei, name] of (def.enums ?? []).entries()) {
            if (typeof name !== "string" || !name.trim()) {
                push(diagnostics, {
                    code: "UNKNOWN_ENUM",
                    message: `scenario "${id}": enums[${ei}] is empty`,
                    sourceId: id,
                    path: [loc, "enums", String(ei)],
                });
                continue;
            }
            if (!enumNames.has(name)) {
                push(diagnostics, {
                    code: "UNKNOWN_ENUM",
                    message: `scenario "${id}": enum "${name}" not in schema "${schemaId}"`,
                    sourceId: id,
                    path: [loc, "enums", name],
                });
                continue;
            }
            enums.push(name);
        }

        const rawPath = def.path ?? [];
        const path: string[] = [];
        for (const [pi, name] of rawPath.entries()) {
            if (typeof name !== "string" || !name.trim()) {
                push(diagnostics, {
                    code: "UNKNOWN_MODEL",
                    message: `scenario "${id}": path[${pi}] is empty`,
                    sourceId: id,
                    path: [loc, "path", String(pi)],
                });
                continue;
            }
            if (!modelNames.has(name)) {
                push(diagnostics, {
                    code: "UNKNOWN_MODEL",
                    message: `scenario "${id}": path model "${name}" not in schema "${schemaId}"`,
                    sourceId: id,
                    path: [loc, "path", name],
                });
                continue;
            }
            if (!modelSet.has(name)) {
                push(diagnostics, {
                    code: "PATH_MODEL_NOT_IN_SCENARIO",
                    message: `scenario "${id}": path model "${name}" must also be listed in models`,
                    sourceId: id,
                    path: [loc, "path", name],
                });
                continue;
            }
            if (path[path.length - 1] !== name) {
                path.push(name);
            }
        }

        const pathEdges: DocScenario["pathEdges"] = [];
        for (let i = 0; i < path.length - 1; i++) {
            const source = path[i]!;
            const target = path[i + 1]!;
            if (!related.has(pairKey(source, target))) {
                push(diagnostics, {
                    code: "PATH_RELATION_MISSING",
                    message: `scenario "${id}": no relation between "${source}" and "${target}" in path`,
                    sourceId: id,
                    path: [loc, "path", source, target],
                });
                continue;
            }
            pathEdges.push({ source, target });
        }

        // skip attaching if this scenario already contributed diagnostics
        const scenarioHadError = diagnostics.some((d) => d.sourceId === id);
        if (scenarioHadError) {
            continue;
        }

        const resolved: DocScenario = {
            id,
            label: label || id,
            description: def.description,
            models,
            enums,
            path,
            pathEdges,
        };

        const list = bySchemaId.get(schemaId) ?? [];
        list.push(resolved);
        bySchemaId.set(schemaId, list);
    }

    if (diagnostics.length > 0) {
        throw new UnifiedSchemaValidationError(diagnostics);
    }

    return bySchemaId;
}
