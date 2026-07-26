import type { DocModel } from "../../../utils";
import type { ExtractedSqlTable } from "../types/internal";
import { mapSqlColumn } from "./map-column";

export function mapSqlTable(table: ExtractedSqlTable, enumNames: Set<string>): DocModel {
    return {
        name: table.name,
        dbName: table.schema ? `${table.schema}.${table.name}` : undefined,
        tableName: table.name,
        description: table.description,
        fields: table.columns.map((column) => mapSqlColumn(column, enumNames)),
        referencedBy: [],
        compoundUnique: table.compoundUnique,
        compoundId: table.compoundId,
        indexes: table.indexes,
    };
}
