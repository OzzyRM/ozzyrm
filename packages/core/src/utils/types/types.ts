/**
 * Suppport field type definitions
 */
export type FieldType = "string" | "number" | "boolean" | "date" | "json" | "enum" | "relation" | "unknown";

/**
 * Support array indexes types 
 */
export type IndexesArray = "BTree" | "Hash" | "Gist" | "Gin" | "SpGist" | "Brin";

/**
 * Support providers (not affecting anything)
 */
export type ProviderEnums = "postgresql" | "mysql" | "sqlite" | "sqlserver" | "mongodb" | "cockroachdb";

/**
 * Supported ORMs for OzzyRM
 */
export type SupportedORMs = "prisma" | "drizzle";

/**
 * Support field relation
 */
export interface FieldRelation {
    model: string;
    field: string;
    type: "one-to-one" | "one-to-many" | "many-to-one" | "many-to-many";
};

/**
 * Support kind of field
 */
export type FieldKind = "scalar" | "object" | "enum" | "unsupported";

export interface FieldDefault {
    kind: "value" | "function" | "expression";
    // RAW value for kind=value, function name for kind=function, and expression for kind=expression
    value: string;
    // Functions args if kind=function, e.g. cuid(), uuid(), now(), autoincrement()
    args?: unknown[];
}

/**
 * Support documented attributes/metadata in field
 */
export interface DocField {
    // -- IDENTITY --
    name: string;
    // Actual column name in db if @map is used
    dbName?: string;

    // -- TYPE SYSTEM --
    kind: FieldKind;
    type: FieldType;
    // Original type string from ORM e.g. "String", "Int", "uuid", "text"
    nativeType?: string;
    // Native db type from @db. * attribute e.g. ["Uuid", []] or ["Varchar", [255]]
    nativeDbType?: { name: string; args: unknown[] };
    // If type is enum, the enum name
    enumName?: string;
    // If field is a list/array
    isList: boolean;

    // -- CONSTRAINT --
    isOptional: boolean;
    isUnique: boolean;
    isPrimary: boolean;
    // Set to true if FK is held on another models side (vr field)
    isReadOnly: boolean

    // -- GENERATION & DEFAULTS --
    isGenerated: boolean;
    // @updatedAt (Prisma auto-updates on write)
    isUpdatedAt: boolean;
    hasDefault: boolean;
    default?: FieldDefault;

    // -- RELATION --
    relation?: FieldRelation;

    // -- DOCS --
    // from /// triple-slash comments in schema
    description?: string;
};

/**
 * 
 */
export interface DocModel {
    name: string;
    // Actual table name in db if @@map is used
    dbName?: string;
    // Ordinary table name
    tableName?: string;
    description?: string;
    fields: DocField[];
    referencedBy: Array<{ model: string, field: string; relationName?: string }>;

    // @@unique, @@id compound constraints
    compoundUnique: string[][];
    compoundId: string[][];

    // @@Index
    indexes: Array<{ name?: string; fields: string[]; type?: IndexesArray }>
};

export interface DocEnum {
    name: string;
    // Actual db enum name if @map is used
    dbName?: string;
    values: Array<{ name: string; dbName?: string }>;
    description?: string;
};

export interface DocSchema {
    generatedAt: string;
    orm: SupportedORMs;
    // ORM versioning helping drafted ORMs
    version: string;
    // **! FOR OUTPUT IS REDACTED !**
    dataSource?: { provider: ProviderEnums; url?: string };
    models: DocModel[];
    enums: DocEnum[];
};