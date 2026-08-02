import type { Parser } from "../utils/pre/parser";
import type {
    OrmDocgenAdapter,
    OzzyRMProjectConfig,
    OzzyRMSchemaSource,
} from "../utils/adapter";
import { isProjectConfig } from "../utils/adapter";
import { postProcess } from "../process/post-process";
import type { LoadedCatalog, SchemaCatalogGroup } from "./types";
import { basename, resolve } from "path";
import { mergeUnifiedSchema, type ParsedSourceEntry } from "./merge-unified";
import {
    UnifiedDiagnostic,
    UnifiedSchemaValidationError,
} from "./validation";
import { resolveScenarios } from "./resolve-scenarios";
import type { DocSchema, DocScenario } from "../utils/types/types";

export const DEFAULT_SCHEMA_VERSION = "1.0.0";

export function schemaFileLabel(source: OzzyRMSchemaSource): string {
    if (source.file) {
        return source.file;
    }

    const path = source.include[0] ?? source.id;
    return basename(path)
        .replace(/\.prisma$/i, "")
        .replace(/\.sql$/i, "")
        || basename(path);
}

export function normalizeVersion(version?: string): string {
    const value = version ?? DEFAULT_SCHEMA_VERSION;
    return value.startsWith("v") ? value : `v${value}`;
}

export function schemaGroupId(file: string): string {
    return file
        .replace(/[^a-zA-Z0-9.]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .toLowerCase() || "schema";
}

async function loadParser(orm: OrmDocgenAdapter["orm"]): Promise<Parser> {
    if (orm === "prisma") {
        const { PrismaParser } = await import("../parsers/prisma");
        return new PrismaParser();
    }

    if (orm === "drizzle") {
        const { DrizzleParser } = await import("../parsers/drizzle");
        return new DrizzleParser();
    }

    if (orm === "sql") {
        const { SqlParser } = await import("../parsers/sql");
        return new SqlParser();
    }

    throw new Error(`Unsupported schema source: ${String(orm)}`);
}

function compareVersions(left: string, right: string): number {
    const parse = (value: string) =>
        value.replace(/^v/i, "").split(".").map((part) => Number.parseInt(part, 10) || 0);

    const leftParts = parse(left);
    const rightParts = parse(right);
    const length = Math.max(leftParts.length, rightParts.length);

    for (let index = 0; index < length; index += 1) {
        const diff = (leftParts[index] ?? 0) - (rightParts[index] ?? 0);
        if (diff !== 0) {
            return diff;
        }
    }

    return 0;
}

export function normalizeProjectConfig(
    config: OzzyRMProjectConfig | OrmDocgenAdapter
): OzzyRMProjectConfig {
    if (isProjectConfig(config)) {
        return {
            output: config.output ?? "./.ozzyrm",
            schemas: config.schemas,
            unified: config.unified,
            scenarios: config.scenarios,
            watch: config.watch,
        };
    }

    return {
        output: config.output ?? "./.ozzyrm",
        schemas: [
            {
                id: config.orm,
                label: config.orm,
                ...config,
            },
        ],
    };
}

export async function loadConfigFile(
    cwd = process.cwd(),
    configPath = "ozzyrm.config.ts"
): Promise<OzzyRMProjectConfig> {
    const absolute = resolve(cwd, configPath);
    const mod = await import(absolute);
    return normalizeProjectConfig(mod.default ?? mod);
}

interface GeneratedEntry {
    id: string;
    file: string;
    groupId: string;
    version: string;
    orm: SchemaCatalogGroup["orm"];
    schema: SchemaCatalogGroup["versions"][number]["schema"];
}

async function parseSource(
    source: OzzyRMSchemaSource,
    cwd: string
): Promise<ParsedSourceEntry> {
    const file = schemaFileLabel(source);

    try {
        const parser = await loadParser(source.orm);
        const include = source.include.map((path) => resolve(cwd, path));
        const schema = await parser.parse({ ...source, include });
        const processed = postProcess(schema, source);

        return {
            id: source.id,
            orm: source.orm,
            label: source.label,
            file,
            schema: processed,
        };
    } catch (error) {
        return {
            id: source.id,
            orm: source.orm,
            label: source.label,
            file,
            schema: {
                generatedAt: new Date().toISOString(),
                orm: source.orm,
                version: "0.0.0",
                models: [],
                enums: [],
            },
            parseError: error instanceof Error ? error.message : String(error),
        };
    }
}

function toCatalog(
    entries: GeneratedEntry[],
    scenariosBySchemaId?: Map<string, DocScenario[]>
): LoadedCatalog {
    const groupsMap = new Map<string, GeneratedEntry[]>();

    for (const entry of entries) {
        const list = groupsMap.get(entry.groupId) ?? [];
        list.push(entry);
        groupsMap.set(entry.groupId, list);
    }

    const catalog: SchemaCatalogGroup[] = Array.from(groupsMap.values()).map((versions) => {
        const sorted = [...versions].sort((left, right) =>
            compareVersions(left.version, right.version)
        );
        const first = sorted[0]!;

        return {
            id: first.groupId,
            file: first.file,
            orm: first.orm,
            versions: sorted.map((entry) => ({
                id: entry.id,
                version: entry.version,
                schema: entry.schema,
                scenarios: scenariosBySchemaId?.get(entry.id),
            })),
        };
    });

    return {
        catalog,
        defaultSchemaId: entries[0]?.id ?? catalog[0]?.versions[0]?.id ?? "",
    };
}

function validateProjectIds(project: OzzyRMProjectConfig): UnifiedDiagnostic[] {
    const diagnostics: UnifiedDiagnostic[] = [];
    const sourceIds = new Set<string>();
    /** kebab-case ids: app-prisma, company-schema */
    const idRe = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

    if (!project.schemas.length) {
        diagnostics.push({
            code: "EMPTY_SCHEMAS",
            message: "project config requires at least one schema source in schemas[]",
            path: ["schemas"],
        });
        return diagnostics;
    }

    for (const [index, source] of project.schemas.entries()) {
        const id = typeof source.id === "string" ? source.id.trim() : "";
        if (!id || !idRe.test(id)) {
            diagnostics.push({
                code: "INVALID_SOURCE_ID",
                message: id
                    ? `schema source id "${id}" must be kebab-case (e.g. app-prisma)`
                    : `schemas[${index}].id is required and must be kebab-case (e.g. app-prisma)`,
                sourceId: id || undefined,
                path: ["schemas", String(index), "id"],
            });
        } else if (sourceIds.has(id)) {
            diagnostics.push({
                code: "DUP_SOURCE_ID",
                message: `duplicate schema source id "${id}"`,
                sourceId: id,
            });
        } else {
            sourceIds.add(id);
        }

        if (!Array.isArray(source.include) || source.include.length === 0) {
            diagnostics.push({
                code: "EMPTY_INCLUDE",
                message: `schema source "${id || `schemas[${index}]`}" requires a non-empty include[]`,
                sourceId: id || undefined,
                path: ["schemas", id || String(index), "include"],
            });
        }
    }

    const groupIds = new Set<string>();
    for (const [index, group] of (project.unified ?? []).entries()) {
        const id = typeof group.id === "string" ? group.id.trim() : "";
        if (!id || !idRe.test(id)) {
            diagnostics.push({
                code: "INVALID_SOURCE_ID",
                message: id
                    ? `unified group id "${id}" must be kebab-case (e.g. company-schema)`
                    : `unified[${index}].id is required and must be kebab-case (e.g. company-schema)`,
                sourceId: id || undefined,
                path: ["unified", String(index), "id"],
            });
        } else if (groupIds.has(id)) {
            diagnostics.push({
                code: "DUP_GROUP_ID",
                message: `duplicate unified group id "${id}"`,
                sourceId: id,
            });
        } else {
            groupIds.add(id);
        }
    }

    return diagnostics;
}

function buildUnifiedEntries(
    project: OzzyRMProjectConfig,
    parsed: ParsedSourceEntry[]
): { entries: GeneratedEntry[]; consumedSourceIds: Set<string> } {
    const diagnostics: UnifiedDiagnostic[] = [];
    const entries: GeneratedEntry[] = [];
    const consumedSourceIds = new Set<string>();
    const claimedBy = new Map<string, string>();

    for (const definition of project.unified ?? []) {
        for (const sourceId of definition.sources) {
            const previous = claimedBy.get(sourceId);
            if (previous && previous !== definition.id) {
                diagnostics.push({
                    code: "DUP_SOURCE_ID",
                    message: `source "${sourceId}" is claimed by unified groups "${previous}" and "${definition.id}"`,
                    sourceId: definition.id,
                    related: { sourceId: previous },
                });
            }
            claimedBy.set(sourceId, definition.id);
        }

        try {
            const schema = mergeUnifiedSchema({
                definition,
                members: parsed,
            });
            const file = definition.file ?? definition.id;

            entries.push({
                id: definition.id,
                file,
                groupId: schemaGroupId(file),
                version: normalizeVersion(definition.version),
                orm: "unified",
                schema,
            });

            for (const sourceId of definition.sources) {
                consumedSourceIds.add(sourceId);
            }
        } catch (error) {
            if (error instanceof UnifiedSchemaValidationError) {
                diagnostics.push(...error.diagnostics);
            } else {
                diagnostics.push({
                    code: "SOURCE_PARSE_FAILED",
                    message: error instanceof Error ? error.message : String(error),
                    sourceId: definition.id,
                });
            }
        }
    }

    if (diagnostics.length > 0) {
        throw new UnifiedSchemaValidationError(diagnostics);
    }

    return { entries, consumedSourceIds };
}

/** Parse adapters from project config into a UI catalog (no generated .ts files). */
export async function loadCatalog(
    config: OzzyRMProjectConfig | OrmDocgenAdapter,
    options?: { cwd?: string }
): Promise<LoadedCatalog> {
    const cwd = options?.cwd ?? process.cwd();
    const project = normalizeProjectConfig(config);

    const idDiagnostics = validateProjectIds(project);
    if (idDiagnostics.length > 0) {
        throw new UnifiedSchemaValidationError(idDiagnostics);
    }

    const settled = await Promise.allSettled(
        project.schemas.map((source) => parseSource(source, cwd))
    );

    const parsed: ParsedSourceEntry[] = settled.map((result, index) => {
        const source = project.schemas[index]!;
        if (result.status === "fulfilled") {
            return result.value;
        }

        return {
            id: source.id,
            orm: source.orm,
            label: source.label,
            file: schemaFileLabel(source),
            schema: {
                generatedAt: new Date().toISOString(),
                orm: source.orm,
                version: "0.0.0",
                models: [],
                enums: [],
            },
            parseError: result.reason instanceof Error
                ? result.reason.message
                : String(result.reason),
        };
    });

    const unifiedSourceIds = new Set(
        (project.unified ?? []).flatMap((group) => group.sources)
    );
    const standaloneParseErrors = parsed
        .filter((entry) => !unifiedSourceIds.has(entry.id) && entry.parseError)
        .map((entry) => ({
            code: "SOURCE_PARSE_FAILED" as const,
            message: entry.parseError!,
            sourceId: entry.id,
        }));

    if (standaloneParseErrors.length > 0) {
        throw new UnifiedSchemaValidationError(standaloneParseErrors);
    }

    const { entries: unifiedEntries, consumedSourceIds } = buildUnifiedEntries(
        project,
        parsed
    );

    const standaloneEntries: GeneratedEntry[] = parsed
        .filter((entry) => !consumedSourceIds.has(entry.id) && !entry.parseError)
        .map((entry) => ({
            id: entry.id,
            file: entry.file,
            groupId: schemaGroupId(entry.file),
            version: normalizeVersion(
                project.schemas.find((source) => source.id === entry.id)?.version
            ),
            orm: entry.orm,
            schema: entry.schema,
        }));

    const ordered = [...unifiedEntries, ...standaloneEntries];

    const schemasById = new Map<string, DocSchema>(
        ordered.map((entry) => [entry.id, entry.schema])
    );
    const scenariosBySchemaId = resolveScenarios(project.scenarios, schemasById);

    return toCatalog(ordered, scenariosBySchemaId);
}
