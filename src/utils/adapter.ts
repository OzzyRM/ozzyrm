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

export interface OzzyRMProjectConfig {
    output?: string;
    schemas: OzzyRMSchemaSource[];
    /** optional unified graphs; member sources are removed from standalone sidebar entries */
    unified?: UnifiedSchemaDefinition[];
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
