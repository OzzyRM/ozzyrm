import { watch } from "fs";
import { resolve } from "path";
import type {
    OrmDocgenAdapter,
    OzzyRMProjectConfig,
    OzzyRMWatchConfig,
} from "../utils/adapter";
import { generate } from "./generate";
import { loadConfigFile, normalizeProjectConfig } from "./load-catalog";

export interface WatchOptions {
    cwd?: string;
    configPath?: string;
    config?: OzzyRMProjectConfig | OrmDocgenAdapter;
    onGenerate?: (files: string[]) => void;
    onError?: (error: unknown) => void;
    /** override config.watch.debounceMs */
    debounceMs?: number;
}

export interface ResolvedWatchConfig {
    enabled: boolean;
    debounceMs: number;
    generateOnStart: boolean;
    hot: boolean;
}

const DEFAULT_DEBOUNCE_MS = 200;

/** Normalize `watch: true | false | { ... }` from project config. */
export function resolveWatchConfig(
    watch?: boolean | OzzyRMWatchConfig
): ResolvedWatchConfig {
    if (watch === false) {
        return {
            enabled: false,
            debounceMs: DEFAULT_DEBOUNCE_MS,
            generateOnStart: true,
            hot: false,
        };
    }

    if (watch === true || watch == null) {
        return {
            enabled: true,
            debounceMs: DEFAULT_DEBOUNCE_MS,
            generateOnStart: true,
            hot: false,
        };
    }

    return {
        enabled: watch.enabled !== false,
        debounceMs:
            typeof watch.debounceMs === "number" && watch.debounceMs >= 0
                ? watch.debounceMs
                : DEFAULT_DEBOUNCE_MS,
        generateOnStart: watch.generateOnStart !== false,
        hot: watch.hot === true,
    };
}

export async function collectWatchPaths(
    project: OzzyRMProjectConfig,
    cwd: string,
    configPath = "ozzyrm.config.ts"
): Promise<string[]> {
    const paths: string[] = [resolve(cwd, configPath)];

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
export async function watchCatalog(
    options: WatchOptions = {}
): Promise<{ close: () => void }> {
    const cwd = options.cwd ?? process.cwd();
    const configPath = options.configPath ?? "ozzyrm.config.ts";
    const project = options.config
        ? normalizeProjectConfig(options.config)
        : await loadConfigFile(cwd, configPath);

    const watchConfig = resolveWatchConfig(project.watch);
    const debounceMs = options.debounceMs ?? watchConfig.debounceMs;

    if (!watchConfig.enabled) {
        console.log(
            "[ozzyrm] watch.enabled=false in config — nothing to watch. Set watch: true or watch: { enabled: true }."
        );
        return { close() {} };
    }

    const paths = await collectWatchPaths(project, cwd, configPath);
    let timer: ReturnType<typeof setTimeout> | undefined;

    const run = async (label: string) => {
        try {
            // reload config each run so ozzyrm.config.ts edits apply
            const latest = options.config
                ? normalizeProjectConfig(options.config)
                : await loadConfigFile(cwd, configPath);
            const result = await generate(latest, { cwd });
            console.log(
                `[ozzyrm] ${label} → ${result.files.length} file(s) in ${result.outputDir}`
            );
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
        }, debounceMs);
    };

    const watchers = paths.map((path) => {
        console.log(`[ozzyrm] watching ${path}`);
        return watch(path, () => schedule(path));
    });

    if (watchConfig.hot) {
        console.log(
            "[ozzyrm] watch.hot=true — writing stamp.js on generate for Next/bundler HMR"
        );
    }

    if (watchConfig.generateOnStart) {
        await run("initial");
    }

    return {
        close() {
            clearTimeout(timer);
            for (const watcher of watchers) {
                watcher.close();
            }
        },
    };
}
