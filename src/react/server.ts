import { access, readFile } from "fs/promises";
import { join, resolve } from "path";
import { pathToFileURL } from "url";
import { createElement } from "react";
import type { OzzyRMProjectConfig } from "../utils/adapter";
import { loadCatalog } from "../catalog/load-catalog";
import { resolveWatchConfig } from "../catalog/watch";
import { UnifiedSchemaValidationError } from "../catalog/validation";
import { isSafeOzzyrmStampModule } from "../security/stamp";
import { ConfigErrorOverlay } from "./config-error-overlay";
import { OzzyRMDocs, type OzzyRMDocsProps } from "./OzzyRMDocs";

export type OzzyRMDocsFromConfigProps = Omit<OzzyRMDocsProps, "catalog" | "defaultSchemaId"> & {
    config: OzzyRMProjectConfig;
    cwd?: string;
    defaultSchemaId?: string;
};

/**
 * Import `.ozzyrm/stamp.js` when watch.hot is on so Next/Turbopack
 * invalidate this module when `ozzyrm watch` regenerates after schema edits.
 * File contents are validated before import (allowlisted stamp module only).
 */
async function pullHotStamp(config: OzzyRMProjectConfig, cwd: string): Promise<void> {
    const watchConfig = resolveWatchConfig(config.watch);
    if (!watchConfig.hot) {
        return;
    }

    const stampPath = join(resolve(cwd, config.output ?? "./.ozzyrm"), "stamp.js");
    try {
        await access(stampPath);
        const source = await readFile(stampPath, "utf-8");
        if (!isSafeOzzyrmStampModule(source)) {
            console.warn(
                "[ozzyrm] refusing to import stamp.js — contents are not a safe ozzyrm stamp module"
            );
            return;
        }
        const mod = await import(/* webpackIgnore: true */ pathToFileURL(stampPath).href);
        void mod?.ozzyrmStamp;
    } catch {
        // stamp missing until first `ozzyrm watch` / generate with hot — ok
    }
}

/**
 * Server-side helper: resolve adapters → catalog, then render client docs.
 * Config / schema validation failures render a Next.js-style error overlay
 * (message is copyable) instead of crashing the route.
 *
 * With `watch: { hot: true }` in config, pair with `ozzyrm watch` so schema
 * file edits invalidate the Next module graph via `.ozzyrm/stamp.js`.
 *
 * @example
 * import config from "../ozzyrm.config";
 * import { OzzyRMDocsFromConfig } from "ozzyrm/react/server";
 * export default function Page() {
 *   return <OzzyRMDocsFromConfig config={config} />;
 * }
 */
export async function OzzyRMDocsFromConfig({
    config,
    cwd = process.cwd(),
    defaultSchemaId,
    ...rest
}: OzzyRMDocsFromConfigProps) {
    try {
        await pullHotStamp(config, cwd);
        const loaded = await loadCatalog(config, { cwd });

        return createElement(OzzyRMDocs, {
            ...rest,
            catalog: loaded.catalog,
            defaultSchemaId: defaultSchemaId ?? loaded.defaultSchemaId,
        });
    } catch (error) {
        if (error instanceof UnifiedSchemaValidationError) {
            return createElement(ConfigErrorOverlay, {
                message: error.message,
                diagnostics: error.diagnostics.map((item) => ({
                    code: item.code,
                    message: item.message,
                    sourceId: item.sourceId,
                    path: item.path,
                })),
            });
        }

        throw error;
    }
}

export { loadCatalog } from "../catalog/load-catalog";
export {
    resolveWatchConfig,
    collectWatchPaths,
    type ResolvedWatchConfig,
} from "../catalog/watch";
export { ConfigErrorOverlay, type ConfigErrorOverlayProps } from "./config-error-overlay";
export { UnifiedSchemaValidationError } from "../catalog/validation";
