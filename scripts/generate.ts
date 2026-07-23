import { resolve } from "path";
import { postProcess, writeSchema } from "@reldoc/core";
import type { OrmDocgenAdapter, Parser } from "@reldoc/core";

async function loadConfig(): Promise<OrmDocgenAdapter> {
    const configPath = resolve(process.cwd(), "reldoc.config.ts");
    const mod = await import(configPath);
    return mod.default ?? mod;
}

async function loadParser(orm: OrmDocgenAdapter["orm"]): Promise<Parser> {
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

async function generate() {
    const config = await loadConfig();
    const parser = await loadParser(config.orm);
    const include = config.include.map((path) => resolve(process.cwd(), path));
    const schema = await parser.parse({ ...config, include });
    const processed = postProcess(schema, config);
    const output = resolve(process.cwd(), config.output ?? "./web");
    const destination = await writeSchema(processed, output);

    console.log(`Generated ${processed.models.length} models, ${processed.enums.length} enums`);
    console.log(`Output: ${destination}`);
}

generate().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
