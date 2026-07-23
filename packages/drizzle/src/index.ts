import { readFile } from "fs/promises";
import type { DocSchema, OrmDocgenAdapter, Parser } from "@reldoc/core";
import { parseSchemaFile } from "./ast/parse-source";
import { DRIZZLE_PARSER_VERSION } from "./constants";
import { mapEnum } from "./map/map-enum";
import { mapTable } from "./map/map-table";

export class DrizzleParser implements Parser {
    async parse(adapter: OrmDocgenAdapter): Promise<DocSchema> {
        if (adapter.include.length === 0) {
            throw new Error("Drizzle parser requires at least one schema path in adapter.include");
        }

        const parsedFiles = await Promise.all(
            adapter.include.map(async (filePath) => {
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

        const models = extractedTables.map((table) => mapTable(table, enumNames));

        return {
            generatedAt: new Date().toISOString(),
            orm: "drizzle",
            version: DRIZZLE_PARSER_VERSION,
            models,
            enums,
        };
    }
}

export { parseSchemaFile } from "./ast/parse-source";
export type { ParsedSchemaFile } from "./types/internal";
