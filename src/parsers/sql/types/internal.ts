export interface ExtractedSqlColumn {
    name: string;
    sqlType: string;
    typeArgs: unknown[];
    isList: boolean;
    isOptional: boolean;
    isUnique: boolean;
    isPrimary: boolean;
    isGenerated: boolean;
    hasDefault: boolean;
    defaultValue?: string;
    references?: { table: string; column: string };
    description?: string;
}

export interface ExtractedSqlTable {
    name: string;
    schema?: string;
    columns: ExtractedSqlColumn[];
    compoundUnique: string[][];
    compoundId: string[][];
    indexes: Array<{ name?: string; fields: string[] }>;
    description?: string;
}

export interface ExtractedSqlEnum {
    name: string;
    schema?: string;
    values: string[];
    description?: string;
}

export interface ParsedSqlSchema {
    tables: ExtractedSqlTable[];
    enums: ExtractedSqlEnum[];
    provider?: "postgresql" | "mysql" | "sqlite" | "sqlserver";
}
