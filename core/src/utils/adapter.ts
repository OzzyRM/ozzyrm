export interface OrmDocgenAdapter {
    orm: "prisma" | "drizzle";
    /** schema file paths, prisma schema directory, or drizzle entry file / directory */
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

export interface OzzyRMProjectConfig {
    output?: string;
    schemas: OzzyRMSchemaSource[];
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