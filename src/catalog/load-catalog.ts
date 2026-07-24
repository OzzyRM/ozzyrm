import type { Parser } from "../utils/pre/parser";
import type { OrmDocgenAdapter, OzzyRMProjectConfig, OzzyRMSchemaSource } from "../utils/adapter";
import { isProjectConfig } from "../utils/adapter";
import { postProcess } from "../process/post-process";
import type { LoadedCatalog, SchemaCatalogGroup } from "./types";
import { basename, resolve } from "path";
export const DEFAULT_SCHEMA_VERSION = "1.0.0";

export function schemaFileLabel(source: OzzyRMSchemaSource): string {
    if (source.file) {
        return source.file;
    }

    const path = source.include[0] ?? source.id;
    return basename(path).replace(/\.prisma$/i, "") || basename(path);
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

    const { DrizzleParser } = await import("../parsers/drizzle");
    return new DrizzleParser();
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

async function generateOne(
    source: OzzyRMSchemaSource,
    cwd: string
): Promise<GeneratedEntry> {
    const parser = await loadParser(source.orm);
    const include = source.include.map((path) => resolve(cwd, path));
    const schema = await parser.parse({ ...source, include });
    const processed = postProcess(schema, source);
    const file = schemaFileLabel(source);

    return {
        id: source.id,
        file,
        groupId: schemaGroupId(file),
        version: normalizeVersion(source.version),
        orm: processed.orm,
        schema: processed,
    };
}

function toCatalog(entries: GeneratedEntry[]): LoadedCatalog {
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
            })),
        };
    });

    return {
        catalog,
        defaultSchemaId: entries[0]?.id ?? catalog[0]?.versions[0]?.id ?? "",
    };
}

/** Parse adapters from project config into a UI catalog (no generated .ts files). */
export async function loadCatalog(
    config: OzzyRMProjectConfig | OrmDocgenAdapter,
    options?: { cwd?: string }
): Promise<LoadedCatalog> {
    const cwd = options?.cwd ?? process.cwd();
    const project = normalizeProjectConfig(config);
    const entries = await Promise.all(
        project.schemas.map((source) => generateOne(source, cwd))
    );
    return toCatalog(entries);
}
