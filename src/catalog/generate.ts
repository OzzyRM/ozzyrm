import { mkdir, writeFile } from "fs/promises";
import { join, resolve } from "path";
import type { OrmDocgenAdapter, OzzyRMProjectConfig } from "../utils/adapter";
import {
    loadCatalog,
    loadConfigFile,
    normalizeProjectConfig,
} from "./load-catalog";
import type { LoadedCatalog } from "./types";

export interface GenerateResult extends LoadedCatalog {
    outputDir: string;
    files: string[];
}

/** Write catalog + schema JSON under config.output (default ./.ozzyrm). */
export async function generate(
    config?: OzzyRMProjectConfig | OrmDocgenAdapter,
    options?: { cwd?: string; configPath?: string }
): Promise<GenerateResult> {
    const cwd = options?.cwd ?? process.cwd();
    const project = config
        ? normalizeProjectConfig(config)
        : await loadConfigFile(cwd, options?.configPath ?? "ozzyrm.config.ts");

    const loaded = await loadCatalog(project, { cwd });
    const outputDir = resolve(cwd, project.output ?? "./.ozzyrm");
    await mkdir(outputDir, { recursive: true });

    const files: string[] = [];

    for (const group of loaded.catalog) {
        for (const version of group.versions) {
            const filePath = join(outputDir, `${version.id}.json`);
            await writeFile(filePath, JSON.stringify(version.schema, null, 2), "utf-8");
            files.push(filePath);
        }
    }

    const catalogPath = join(outputDir, "catalog.json");
    await writeFile(
        catalogPath,
        JSON.stringify(
            {
                defaultId: loaded.defaultSchemaId,
                groups: loaded.catalog.map((group) => ({
                    id: group.id,
                    file: group.file,
                    orm: group.orm,
                    versions: group.versions.map((version) => ({
                        id: version.id,
                        version: version.version,
                        file: `${version.id}.json`,
                    })),
                })),
            },
            null,
            2
        ),
        "utf-8"
    );
    files.push(catalogPath);

    return {
        ...loaded,
        outputDir,
        files,
    };
}
