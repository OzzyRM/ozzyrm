import { watch } from "fs";
import { resolve } from "path";
import type { OrmDocgenAdapter, OzzyRMProjectConfig } from "../utils/adapter";
import { generate } from "./generate";
import { loadConfigFile, normalizeProjectConfig } from "./load-catalog";

export interface WatchOptions {
    cwd?: string;
    configPath?: string;
    config?: OzzyRMProjectConfig | OrmDocgenAdapter;
    onGenerate?: (files: string[]) => void;
    onError?: (error: unknown) => void;
}

async function getWatchedPaths(
    project: OzzyRMProjectConfig,
    cwd: string
): Promise<string[]> {
    const paths: string[] = [resolve(cwd, "ozzyrm.config.ts")];

    for (const source of project.schemas) {
        const resolved = source.include.map((path) => resolve(cwd, path));

        if (source.orm === "prisma") {
            const { expandPrismaWatchPaths } = await import("../parsers/prisma");
            paths.push(...(await expandPrismaWatchPaths(resolved)));
            continue;
        }

        if (source.orm === "drizzle") {
            const { expandDrizzleWatchPaths } = await import("../parsers/drizzle");
            paths.push(...(await expandDrizzleWatchPaths(resolved)));
            continue;
        }

        if (source.orm === "sql") {
            const { expandSqlWatchPaths } = await import("../parsers/sql");
            paths.push(...(await expandSqlWatchPaths(resolved)));
            continue;
        }

        paths.push(...resolved);
    }

    return [...new Set(paths)];
}

/** Watch schema/config files and regenerate .ozzyrm JSON output. */
export async function watchCatalog(options: WatchOptions = {}): Promise<{ close: () => void }> {
    const cwd = options.cwd ?? process.cwd();
    const project = options.config
        ? normalizeProjectConfig(options.config)
        : await loadConfigFile(cwd, options.configPath ?? "ozzyrm.config.ts");

    const paths = await getWatchedPaths(project, cwd);
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async (label: string) => {
        try {
            const result = await generate(project, { cwd });
            console.log(`[ozzyrm] ${label} → ${result.files.length} file(s) in ${result.outputDir}`);
            options.onGenerate?.(result.files);
        } catch (error) {
            // keep previous valid JSON on disk; report full diagnostics for unified failures
            console.error(
                "[ozzyrm] generate failed:",
                error instanceof Error ? error.message : error
            );
            options.onError?.(error);
        }
    };

    const schedule = (label: string) => {
        clearTimeout(timer);
        timer = setTimeout(() => {
            void run(label);
        }, 200);
    };

    const watchers = paths.map((path) => {
        console.log(`[ozzyrm] watching ${path}`);
        return watch(path, () => schedule(path));
    });

    await run("initial");

    return {
        close() {
            clearTimeout(timer);
            for (const watcher of watchers) {
                watcher.close();
            }
        },
    };
}
