import { resolve } from "path";
import { postProcess, writeSchema } from "@reldoc/core";
import type { OrmDocgenAdapter, Parser } from "@reldoc/core";

export async function loadConfig(): Promise<OrmDocgenAdapter> {
    const configPath = resolve(process.cwd(), "reldoc.config.ts");
    const mod = await import(configPath);
    return mod.default ?? mod;
}

export async function loadParser(orm: OrmDocgenAdapter["orm"]): Promise<Parser> {
    switch (orm) {
        case "prisma": {
            const { PrismaParser } = await import("@reldoc/parser-prisma");
            return new PrismaParser();
        }
        case "drizzle": {
            const { DrizzleParser } = await import("@reldoc/parser-drizzle");
            return new DrizzleParser();
        }
    }
}

export async function generateSchema(): Promise<string> {
    const config = await loadConfig();
    const parser = await loadParser(config.orm);
    const include = config.include.map((path) => resolve(process.cwd(), path));
    const schema = await parser.parse({ ...config, include });
    const processed = postProcess(schema, config);
    const output = resolve(process.cwd(), config.output ?? "./web");
    return writeSchema(processed, output);
}

export async function getWatchedPaths(): Promise<string[]> {
    const config = await loadConfig();
    return [
        resolve(process.cwd(), "reldoc.config.ts"),
        ...config.include.map((path) => resolve(process.cwd(), path)),
    ];
}
