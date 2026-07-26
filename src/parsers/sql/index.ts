import type { DocModel, DocSchema, OrmDocgenAdapter, Parser } from "../../utils";
import { SQL_PARSER_VERSION } from "./constants";
import { expandSqlWatchPaths, loadSqlSources, resolveSqlSchemaFiles } from "./load-schema";
import { mapSqlEnum } from "./map/map-enum";
import { mapSqlTable } from "./map/map-table";
import { parseSqlSource } from "./parse-source";

export { expandSqlWatchPaths, resolveSqlSchemaFiles } from "./load-schema";
export { parseSqlSource } from "./parse-source";

export class SqlParser implements Parser {
    async parse(adapter: OrmDocgenAdapter): Promise<DocSchema> {
        const sources = await loadSqlSources(adapter.include);
        const parsed = sources.map((source) => parseSqlSource(source.content));

        const extractedEnums = parsed.flatMap((item) => item.enums);
        const extractedTables = parsed.flatMap((item) => item.tables);
        const provider = parsed.find((item) => item.provider)?.provider;

        const enums = adapter.disabled?.enums
            ? []
            : extractedEnums.map(mapSqlEnum);

        const enumNames = new Set([
            ...enums.map((item) => item.name),
            ...extractedEnums.map((item) => item.name),
            ...extractedEnums
                .filter((item) => item.schema)
                .map((item) => `${item.schema}.${item.name}`),
        ]);

        const models = attachReferencedBy(
            extractedTables.map((table) => mapSqlTable(table, enumNames))
        );

        return {
            generatedAt: new Date().toISOString(),
            orm: "sql",
            version: SQL_PARSER_VERSION,
            dataSource: provider ? { provider } : undefined,
            models,
            enums,
        };
    }
}

function attachReferencedBy(models: DocModel[]): DocModel[] {
    const byName = new Map(models.map((model) => [model.name, model]));

    for (const model of models) {
        for (const field of model.fields) {
            if (!field.relation) {
                continue;
            }

            const target = byName.get(field.relation.model);
            if (!target) {
                continue;
            }

            const exists = target.referencedBy.some(
                (item) => item.model === model.name && item.field === field.name
            );
            if (!exists) {
                target.referencedBy.push({
                    model: model.name,
                    field: field.name,
                });
            }
        }
    }

    return models;
}
