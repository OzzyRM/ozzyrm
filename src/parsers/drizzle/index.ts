import { readFile } from "fs/promises";
import type { DocModel, DocSchema, OrmDocgenAdapter, Parser } from "../../utils";
import { parseSchemaFile } from "./ast/parse-source";
import { DRIZZLE_PARSER_VERSION } from "./constants";
import { expandDrizzleWatchPaths, resolveDrizzleSchemaFiles } from "./load-schema";
import { mapEnum } from "./map/map-enum";
import { mapTable } from "./map/map-table";

export { expandDrizzleWatchPaths, resolveDrizzleSchemaFiles } from "./load-schema";

export class DrizzleParser implements Parser {
    async parse(adapter: OrmDocgenAdapter): Promise<DocSchema> {
        const schemaFiles = await resolveDrizzleSchemaFiles(adapter.include);

        const parsedFiles = await Promise.all(
            schemaFiles.map(async (filePath) => {
                const content = await readFile(filePath, "utf-8");
                return parseSchemaFile(content, filePath);
            })
        );

        const extractedEnums = parsedFiles.flatMap((file) => file.enums);
        const extractedTables = parsedFiles.flatMap((file) => file.tables);

        const enums = adapter.disabled?.enums
            ? []
            : extractedEnums.map(mapEnum);

        const enumNames = new Set([
            ...enums.map((item) => item.name),
            ...extractedEnums.map((item) => item.exportName),
        ]);

        const models = attachReferencedBy(
            extractedTables.map((table) => mapTable(table, enumNames))
        );

        return {
            generatedAt: new Date().toISOString(),
            orm: "drizzle",
            version: DRIZZLE_PARSER_VERSION,
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

            target.referencedBy.push({
                model: model.name,
                field: field.name,
            });
        }
    }

    return models;
}

export { parseSchemaFile } from "./ast/parse-source";
export type { ParsedSchemaFile } from "./types/internal";
