import { createElement } from "react";
import type { OzzyRMProjectConfig } from "../utils/adapter";
import { loadCatalog } from "../catalog/load-catalog";
import { OzzyRMDocs, type OzzyRMDocsProps } from "./OzzyRMDocs";

export type OzzyRMDocsFromConfigProps = Omit<OzzyRMDocsProps, "catalog" | "defaultSchemaId"> & {
    config: OzzyRMProjectConfig;
    cwd?: string;
    defaultSchemaId?: string;
};

/**
 * Server-side helper: resolve adapters → catalog, then render client docs.
 * Use from Next.js Server Components / Route Handlers.
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
    cwd,
    defaultSchemaId,
    ...rest
}: OzzyRMDocsFromConfigProps) {
    const loaded = await loadCatalog(config, { cwd });

    return createElement(OzzyRMDocs, {
        ...rest,
        catalog: loaded.catalog,
        defaultSchemaId: defaultSchemaId ?? loaded.defaultSchemaId,
    });
}

export { loadCatalog } from "../catalog/load-catalog";
