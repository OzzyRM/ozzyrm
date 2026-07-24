import type { OzzyRMSchemaSource } from "../utils/adapter";

export type PrismaAdapterOptions = Omit<OzzyRMSchemaSource, "orm"> & {
    include: string[];
};

export type DrizzleAdapterOptions = Omit<OzzyRMSchemaSource, "orm"> & {
    include: string[];
};

/** Built-in Prisma schema adapter for OzzyRM config */
export function prisma(options: PrismaAdapterOptions): OzzyRMSchemaSource {
    return {
        ...options,
        orm: "prisma",
        file: options.file ?? "schema.prisma",
        version: options.version ?? "1.0.0",
    };
}

/** Built-in Drizzle schema adapter for OzzyRM config */
export function drizzle(options: DrizzleAdapterOptions): OzzyRMSchemaSource {
    return {
        ...options,
        orm: "drizzle",
        file: options.file ?? "schema.ts",
        version: options.version ?? "1.0.0",
    };
}
