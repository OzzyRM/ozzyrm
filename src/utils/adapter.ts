export interface OrmDocgenAdapter {
    orm: "prisma" | "drizzle" | "sql";
    /** schema file paths, directories (prisma/sql), or drizzle entry file */
    include: string[];
    extension?: string;
    output?: string;
    servePort?: number;
    serveRoute?: string;
    disabled?: {
        enums?: boolean;
        referencedBy?: boolean;
        descriptions?: boolean;
    };
    metadata?: {
        models?: Record<string, { description?: string }>;
        fields?: Record<string, Record<string, { description?: string }>>;
    };
}

export interface OzzyRMSchemaSource extends OrmDocgenAdapter {
    id: string;
    label?: string;
    /** display name in source sidebar; defaults to basename of first include path */
    file?: string;
    /** semver label shown as v1.0.0; defaults to 1.0.0 */
    version?: string;
}

/** Explicit group that merges selected schema sources into one validated graph */
export interface UnifiedSchemaDefinition {
    id: string;
    /** OzzyRMSchemaSource.id values to merge */
    sources: string[];
    label?: string;
    /** display name in source sidebar; defaults to id */
    file?: string;
    /** semver label shown as v1.0.0; defaults to 1.0.0 */
    version?: string;
}

/**
 * Developer-defined use-case slice of a schema: which models/enums matter
 * and an optional ordered path for ERD highlight simulation.
 */
export interface SchemaScenarioDefinition {
    id: string;
    label: string;
    description?: string;
    /** SchemaCatalogVersion.id this scenario belongs to */
    schemaId: string;
    models: string[];
    enums?: string[];
    /** Ordered model names for path highlight (e.g. User → Org → Project) */
    path?: string[];
}

export interface OzzyRMWatchConfig {
    /**
     * When `ozzyrm watch` runs: start file watchers (default true).
     * Set false to make `ozzyrm watch` a no-op / opt-out.
     */
    enabled?: boolean;
    /** Debounce before regenerate (ms). Default 200. */
    debounceMs?: number;
    /** Run one generate on watch start. Default true. */
    generateOnStart?: boolean;
    /**
     * Dev HMR bridge for Next (and similar): each generate writes `.ozzyrm/stamp.js`.
     * `OzzyRMDocsFromConfig` imports that stamp so the bundler reloads when schemas change
     * while `ozzyrm watch` is running. Default false.
     */
    hot?: boolean;
}

export interface OzzyRMProjectConfig {
    output?: string;
    schemas: OzzyRMSchemaSource[];
    /** optional unified graphs; member sources are removed from standalone sidebar entries */
    unified?: UnifiedSchemaDefinition[];
    /** optional use-case scenarios attached to catalog versions by schemaId */
    scenarios?: SchemaScenarioDefinition[];
    /**
     * Dev watch / HMR options for `ozzyrm watch` and optional Next stamp bridge.
     * Not required for production `loadCatalog`.
     */
    watch?: boolean | OzzyRMWatchConfig;
}

export function defineConfig(config: OrmDocgenAdapter): OrmDocgenAdapter {
    return {
        output: ".ozzyrm",
        servePort: 3000,
        serveRoute: "/schema",
        ...config,
    };
}

export function defineProject(config: OzzyRMProjectConfig): OzzyRMProjectConfig {
    return {
        output: "./.ozzyrm",
        ...config,
    };
}

export function isProjectConfig(
    config: OrmDocgenAdapter | OzzyRMProjectConfig
): config is OzzyRMProjectConfig {
    return "schemas" in config;
}
