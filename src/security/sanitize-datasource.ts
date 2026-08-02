import type { DocSchema, ProviderEnums } from "../utils/types/types";

const PROVIDERS = new Set<string>([
    "postgresql",
    "mysql",
    "sqlite",
    "sqlserver",
    "mongodb",
    "cockroachdb",
]);

/**
 * Persist only the safe provider label — never connection URLs / credentials.
 */
export function sanitizeDataSource(
    dataSource: DocSchema["dataSource"] | undefined
): DocSchema["dataSource"] | undefined {
    if (!dataSource?.provider) {
        return undefined;
    }

    const provider = String(dataSource.provider);
    if (!PROVIDERS.has(provider)) {
        return undefined;
    }

    return { provider: provider as ProviderEnums };
}

/** Strip secrets from a full DocSchema (defense in depth before write/UI). */
export function sanitizeDocSchema(schema: DocSchema): DocSchema {
    return {
        ...schema,
        dataSource: sanitizeDataSource(schema.dataSource),
    };
}
