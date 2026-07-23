import { readFile } from "fs/promises";
import { getConfig, getDMMF } from "@prisma/internals";
import type { Parser, OrmDocgenAdapter, DocSchema, ProviderEnums } from "@reldoc/core";
import { mapEnum } from "./map-enum";
import { mapModel } from "./map-model";

const PROVIDERS = new Set<ProviderEnums>([
    "postgresql",
    "mysql",
    "sqlite",
    "sqlserver",
    "mongodb",
    "cockroachdb",
]);

export class PrismaParser implements Parser {
    async parse(adapter: OrmDocgenAdapter): Promise<DocSchema> {
        const schemaPath = adapter.include[0];
        if (!schemaPath) {
            throw new Error("Prisma parser requires at least one schema path in adapter.include");
        }

        const schemaContent = await readFile(schemaPath, "utf-8");
        const [dmmf, config] = await Promise.all([
            getDMMF({ datamodel: schemaContent }),
            getConfig({ datamodel: schemaContent }),
        ]);

        const enums = adapter.disabled?.enums
            ? []
            : dmmf.datamodel.enums.map(mapEnum);

        const enumNames = new Set(enums.map((item) => item.name));
        const models = dmmf.datamodel.models.map((model) =>
            mapModel(model, dmmf.datamodel.indexes, enumNames)
        );

        const datasource = config.datasources[0];
        const provider = datasource?.activeProvider;

        return {
            generatedAt: new Date().toISOString(),
            orm: "prisma",
            version: await readPrismaVersion(),
            dataSource: provider && PROVIDERS.has(provider as ProviderEnums)
                ? { provider: provider as ProviderEnums }
                : undefined,
            models,
            enums,
        };
    }
}

async function readPrismaVersion(): Promise<string> {
    try {
        const { createRequire } = await import("module");
        const require = createRequire(__filename);
        const pkgPath = require.resolve("@prisma/internals/package.json");
        const content = await readFile(pkgPath, "utf-8");
        return JSON.parse(content).version as string;
    } catch {
        return "unknown";
    }
}
