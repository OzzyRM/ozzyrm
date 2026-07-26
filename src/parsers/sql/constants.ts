export const SQL_PARSER_VERSION = "0.1.0";

export const STRING_SQL_TYPES = new Set([
    "char",
    "character",
    "varchar",
    "character varying",
    "text",
    "citext",
    "uuid",
    "xml",
    "name",
    "bpchar",
    "bytea",
    "blob",
    "tinyblob",
    "mediumblob",
    "longblob",
    "tinytext",
    "mediumtext",
    "longtext",
]);

export const NUMBER_SQL_TYPES = new Set([
    "smallint",
    "integer",
    "int",
    "int2",
    "int4",
    "int8",
    "bigint",
    "decimal",
    "numeric",
    "real",
    "float",
    "float4",
    "float8",
    "double",
    "double precision",
    "serial",
    "bigserial",
    "smallserial",
    "money",
    "tinyint",
    "mediumint",
]);

export const BOOLEAN_SQL_TYPES = new Set([
    "boolean",
    "bool",
    "bit",
]);

export const DATE_SQL_TYPES = new Set([
    "date",
    "time",
    "timetz",
    "timestamp",
    "timestamptz",
    "timestamp without time zone",
    "timestamp with time zone",
    "time without time zone",
    "time with time zone",
    "interval",
    "datetime",
    "year",
]);

export const JSON_SQL_TYPES = new Set([
    "json",
    "jsonb",
]);

export const DEFAULT_SQL_FUNCTIONS = new Set([
    "now",
    "current_timestamp",
    "current_date",
    "current_time",
    "uuid_generate_v4",
    "gen_random_uuid",
    "nextval",
]);
