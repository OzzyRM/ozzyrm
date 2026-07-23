export const TABLE_FUNCTIONS = new Set([
    "pgTable",
    "mysqlTable",
    "sqliteTable",
]);

export const ENUM_FUNCTIONS = new Set([
    "pgEnum",
    "mysqlEnum",
    "sqliteEnum",
]);

export const JSON_COLUMN_TYPES = new Set([
    "json",
    "jsonb",
]);

export const STRING_COLUMN_TYPES = new Set([
    "text",
    "varchar",
    "char",
    "uuid",
    "string",
]);

export const NUMBER_COLUMN_TYPES = new Set([
    "serial",
    "bigserial",
    "smallserial",
    "integer",
    "int",
    "int2",
    "int4",
    "int8",
    "bigint",
    "smallint",
    "numeric",
    "decimal",
    "real",
    "doublePrecision",
    "float",
    "double",
]);

export const BOOLEAN_COLUMN_TYPES = new Set([
    "boolean",
    "bool",
]);

export const DATE_COLUMN_TYPES = new Set([
    "timestamp",
    "timestamptz",
    "date",
    "datetime",
    "time",
]);

export const DEFAULT_FUNCTION_MODIFIERS = new Set([
    "defaultNow",
    "defaultRandom",
]);

export const DRIZZLE_PARSER_VERSION = "0.1.0";
