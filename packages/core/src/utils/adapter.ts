export interface OrmDocgenAdapter {
    orm: "prisma" | "drizzle";
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
};

/**
 * 
 * @param config 
 * @returns config
 * Returns a defined config within the defined interface (OrmDocgenAdapter)
 */
export function defineConfig(config: OrmDocgenAdapter): OrmDocgenAdapter {
    return {
        output: ".reldoc", // Default output path
        servePort: 3000, // Default serve port
        serveRoute: "/schema", // Default serve route
        ...config,
    };
};