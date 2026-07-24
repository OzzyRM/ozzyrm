import { version as prismaVersion } from "@prisma/internals";
import type { Parser, OrmDocgenAdapter, DocSchema, ProviderEnums } from "../../utils";
import { mapEnum } from "./map-enum";
import { mapModel } from "./map-model";
import { loadPrismaSchema, parsePrismaDatamodel } from "./load-schema";

const PROVIDERS = new Set<ProviderEnums>([
    "postgresql",
    "mysql",
    "sqlite",
    "sqlserver",
    "mongodb",
    "cockroachdb",
]);

export { expandPrismaWatchPaths, loadPrismaSchema } from "./load-schema";

export class PrismaParser implements Parser {
    async parse(adapter: OrmDocgenAdapter): Promise<DocSchema> {
        const { datamodel } = await loadPrismaSchema(adapter.include);
        const { dmmf, config } = await parsePrismaDatamodel(datamodel);

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
            version: prismaVersion,
            dataSource: provider && PROVIDERS.has(provider as ProviderEnums)
                ? { provider: provider as ProviderEnums }
                : undefined,
            models,
            enums,
        };
    }
}
