export type ColumnModifier =
    | { kind: "primaryKey" }
    | { kind: "notNull" }
    | { kind: "unique" }
    | { kind: "default"; value: string; modifier: string }
    | { kind: "references"; table: string; field: string };

export interface ExtractedColumn {
    name: string;
    columnType: string;
    dbName?: string;
    modifiers: ColumnModifier[];
    description?: string;
}

export interface ExtractedIndex {
    name?: string;
    fields: string[];
    type?: string;
}

export interface ExtractedTable {
    exportName: string;
    tableName: string;
    columns: ExtractedColumn[];
    indexes: ExtractedIndex[];
    compoundUnique: string[][];
    compoundId: string[][];
    description?: string;
}

export interface ExtractedEnum {
    exportName: string;
    enumName: string;
    values: string[];
    description?: string;
}

export interface ParsedSchemaFile {
    enums: ExtractedEnum[];
    tables: ExtractedTable[];
}
