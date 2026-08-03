import { mkdir, writeFile } from "fs/promises";
import { basename } from "path";
import { join, resolve } from "path";
import type { DocSchema, OrmDocgenAdapter, Parser, OzzyRMProjectConfig, OzzyRMSchemaSource } from "ozzyrm";
import { isProjectConfig, postProcess } from "ozzyrm";

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

interface GeneratedSchemaEntry {
    id: string;
    file: string;
    groupId: string;
    version: string;
    orm: DocSchema["orm"];
    schema: DocSchema;
}

export async function loadParser(orm: OrmDocgenAdapter["orm"]): Promise<Parser> {
    switch (orm) {
        case "prisma": {
            const { PrismaParser } = await import("ozzyrm");
            return new PrismaParser();
        }
        case "drizzle": {
            const { DrizzleParser } = await import("ozzyrm");
            return new DrizzleParser();
        }
    }
}

async function loadRawConfig(): Promise<OzzyRMProjectConfig> {
    const configPath = resolve(process.cwd(), "ozzyrm.config.ts");
    const mod = await import(configPath);
    const config = mod.default ?? mod;

    if (isProjectConfig(config)) {
        return config;
    }

    return {
        output: config.output ?? "./.ozzyrm",
        schemas: [{
            id: config.orm,
            label: config.orm,
            ...config,
        }],
    };
}

async function generateOne(source: OzzyRMSchemaSource): Promise<GeneratedSchemaEntry> {
    const parser = await loadParser(source.orm);
    const include = source.include.map((path) => resolve(process.cwd(), path));
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

function groupSchemas(entries: GeneratedSchemaEntry[]): GeneratedSchemaEntry[][] {
    const groups = new Map<string, GeneratedSchemaEntry[]>();

    for (const entry of entries) {
        const list = groups.get(entry.groupId) ?? [];
        list.push(entry);
        groups.set(entry.groupId, list);
    }

    return Array.from(groups.values());
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

async function writeCatalog(outputDir: string, entries: GeneratedSchemaEntry[]): Promise<string> {
    await mkdir(outputDir, { recursive: true });

    for (const entry of entries) {
        const filePath = join(outputDir, `${entry.id}.json`);
        await writeFile(filePath, JSON.stringify(entry.schema, null, 2), "utf-8");
    }

    const grouped = groupSchemas(entries).map((versions) => {
        const sorted = [...versions].sort((left, right) => compareVersions(left.version, right.version));
        const first = sorted[0];

        return {
            id: first.groupId,
            file: first.file,
            orm: first.orm,
            versions: sorted.map((entry) => ({
                id: entry.id,
                version: entry.version,
                file: `${entry.id}.json`,
            })),
        };
    });

    const catalogPath = join(outputDir, "catalog.json");
    await writeFile(
        catalogPath,
        JSON.stringify({
            defaultId: entries[0]?.id ?? "prisma",
            groups: grouped,
        }, null, 2),
        "utf-8"
    );

    const webLibDir = resolve(process.cwd(), "web/lib/schema");
    await mkdir(webLibDir, { recursive: true });

    const imports = entries
        .map((entry) => `import ${toImportName(entry.id)} from "../../schemas/${entry.id}.json";`)
        .join("\n");

    const catalogGroups = grouped
        .map((group) => {
            const versions = group.versions
                .map((version) => `      {
        id: "${version.id}",
        version: "${version.version}",
        schema: ${toImportName(version.id)} as DocSchema,
      }`)
                .join(",\n");

            return `  {
    id: "${group.id}",
    file: "${group.file}",
    orm: "${group.orm}",
    versions: [
${versions}
    ],
  }`;
        })
        .join(",\n");

    const generatedPath = join(webLibDir, "catalog.generated.ts");
    await writeFile(
        generatedPath,
        `/* auto-generated by ozzyrm generate */
import type { DocSchema } from "ozzyrm";
${imports}

export interface SchemaCatalogVersion {
  id: string;
  version: string;
  schema: DocSchema;
}

export interface SchemaCatalogGroup {
  id: string;
  file: string;
  orm: DocSchema["orm"];
  versions: SchemaCatalogVersion[];
}

export const schemaCatalog: SchemaCatalogGroup[] = [
${catalogGroups}
];

export const defaultSchemaId = "${entries[0]?.id ?? "prisma"}";
`,
        "utf-8"
    );

    return catalogPath;
}

function toImportName(id: string): string {
    return id.replace(/[^a-zA-Z0-9]/g, "_");
}

export async function loadConfig(): Promise<OzzyRMProjectConfig> {
    return loadRawConfig();
}

export async function generateAllSchemas(): Promise<string[]> {
    const config = await loadRawConfig();
    const outputDir = resolve(process.cwd(), config.output ?? "./.ozzyrm");

    const results = await Promise.all(config.schemas.map(generateOne));
    await writeCatalog(outputDir, results);

    return results.map((entry) => join(outputDir, `${entry.id}.json`));
}

export async function getWatchedPaths(): Promise<string[]> {
    const config = await loadRawConfig();
    const paths: string[] = [resolve(process.cwd(), "ozzyrm.config.ts")];

    for (const source of config.schemas) {
        const resolved = source.include.map((path) => resolve(process.cwd(), path));

        if (source.orm === "prisma") {
            const { expandPrismaWatchPaths } = await import("ozzyrm");
            paths.push(...await expandPrismaWatchPaths(resolved));
            continue;
        }

        if (source.orm === "drizzle") {
            const { expandDrizzleWatchPaths } = await import("ozzyrm");
            paths.push(...await expandDrizzleWatchPaths(resolved));
            continue;
        }

        paths.push(...resolved);
    }

    return paths;
}

export async function generateSchema(): Promise<string> {
    const paths = await generateAllSchemas();
    return paths[0] ?? "";
}
