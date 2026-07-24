import type { DocModel } from "../../../utils";
import type { ExtractedTable } from "../types/internal";
import { mapColumn } from "./map-column";

export function mapTable(table: ExtractedTable, enumNames: Set<string>): DocModel {
    return {
        name: table.exportName,
        dbName: table.tableName !== table.exportName ? table.tableName : undefined,
        tableName: table.tableName,
        description: table.description,
        referencedBy: [],
        compoundUnique: table.compoundUnique,
        compoundId: table.compoundId,
        indexes: table.indexes.map((index) => ({
            name: index.name,
            fields: index.fields,
            type: index.type as DocModel["indexes"][number]["type"],
        })),
        fields: table.columns.map((column) => mapColumn(column, enumNames)),
    };
}
