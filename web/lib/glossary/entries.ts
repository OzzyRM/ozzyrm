export type GlossaryCategory = "type" | "attribute";

export interface GlossaryEntry {
    key: string;
    label: string;
    category: GlossaryCategory;
    summary: string;
    description: string;
    example?: string;
}

export const GLOSSARY_ENTRIES: GlossaryEntry[] = [
    {
        key: "string",
        label: "String",
        category: "type",
        summary: "Text values such as names, emails, or identifiers stored as text.",
        description:
            "String fields hold human-readable or textual data. In SQL they usually map to VARCHAR, TEXT, or CHAR columns. Use strings for emails, slugs, titles, and UUIDs stored as text.",
        example: 'email String @unique @db.VarChar(255)',
    },
    {
        key: "number",
        label: "Number",
        category: "type",
        summary: "Numeric values including integers, decimals, and auto-increment IDs.",
        description:
            "Number fields represent quantities, counters, foreign keys, or auto-increment primary keys. Examples include Int, BigInt, serial, integer, and decimal types.",
        example: "authorId Int // foreign key to another row",
    },
    {
        key: "boolean",
        label: "Boolean",
        category: "type",
        summary: "True or false values.",
        description:
            "Boolean fields store yes/no flags such as isPublished, isActive, or acceptedTerms. They map to BOOLEAN columns in most databases.",
        example: "isActive Boolean @default(true)",
    },
    {
        key: "date",
        label: "Date / DateTime",
        category: "type",
        summary: "Points in time such as createdAt or publishedAt.",
        description:
            "Date and datetime fields store timestamps or calendar dates. Common ORM types include DateTime, timestamp, timestamptz, and date.",
        example: "createdAt DateTime @default(now())",
    },
    {
        key: "json",
        label: "JSON",
        category: "type",
        summary: "Structured data stored as JSON documents.",
        description:
            "JSON fields store flexible structured data such as settings, metadata, or nested objects without creating separate tables.",
        example: 'metadata Json // { "theme": "dark" }',
    },
    {
        key: "enum",
        label: "Enum",
        category: "type",
        summary: "A fixed set of allowed string values.",
        description:
            "Enums restrict a field to predefined values such as USER or ADMIN. They improve type safety and keep invalid states out of the database.",
        example: 'role Role @default(USER) // enum Role { USER ADMIN }',
    },
    {
        key: "relation",
        label: "Relation",
        category: "type",
        summary: "A link between two models or tables.",
        description:
            "Relations connect records across models. They can be one-to-one, one-to-many, many-to-one, or many-to-many depending on where the foreign key lives.",
        example: "author User @relation(fields: [authorId], references: [id])",
    },
    {
        key: "unknown",
        label: "Unknown",
        category: "type",
        summary: "A type the parser could not classify.",
        description:
            "This usually means the schema uses a custom or unsupported type. Check the native type annotation or database mapping in your schema file.",
    },
    {
        key: "text",
        label: "text",
        category: "type",
        summary: "Unbounded or large text column, common in Drizzle and SQL.",
        description:
            "The text type is typically used for emails, descriptions, and content fields. It maps to TEXT in PostgreSQL.",
        example: 'email: text("email").notNull()',
    },
    {
        key: "serial",
        label: "serial",
        category: "type",
        summary: "Auto-incrementing integer primary key in PostgreSQL.",
        description:
            "Serial columns automatically generate increasing integer IDs when a new row is inserted. They are commonly used as primary keys.",
        example: 'id: serial("id").primaryKey()',
    },
    {
        key: "integer",
        label: "integer",
        category: "type",
        summary: "Whole number column, often used for foreign keys.",
        description:
            "Integer columns store whole numbers. In Drizzle they are often used for foreign keys referencing another table's id.",
        example: 'authorId: integer("author_id").references(() => users.id)',
    },
    {
        key: "timestamp",
        label: "timestamp",
        category: "type",
        summary: "Date and time value without timezone by default.",
        description:
            "Timestamp columns store when an event happened, such as createdAt or publishedAt. Some dialects also offer timestamptz for timezone-aware values.",
        example: 'createdAt: timestamp("created_at").defaultNow()',
    },
    {
        key: "uuid",
        label: "Uuid",
        category: "type",
        summary: "Universally unique identifier stored as UUID.",
        description:
            "UUID columns store 128-bit identifiers. They are useful for distributed systems where auto-increment IDs are not ideal.",
        example: 'id String @id @default(uuid()) @db.Uuid',
    },
    {
        key: "varchar",
        label: "VarChar",
        category: "type",
        summary: "Variable-length string with an optional max length.",
        description:
            "VARCHAR stores text up to a defined length. It is useful when you want to limit storage and validate maximum input size at the database level.",
        example: 'title String @db.VarChar(255)',
    },
    {
        key: "int",
        label: "Int",
        category: "type",
        summary: "32-bit integer, common in Prisma schemas.",
        description:
            "Int represents a standard integer column. Use it for counts, foreign keys, and numeric flags when BigInt is not required.",
        example: "viewCount Int @default(0)",
    },
    {
        key: "datetime",
        label: "DateTime",
        category: "type",
        summary: "Prisma's date and time scalar type.",
        description:
            "DateTime maps to timestamp-like columns in the database. Prisma can auto-update it with @updatedAt.",
        example: "updatedAt DateTime @updatedAt",
    },
    {
        key: "pk",
        label: "PK",
        category: "attribute",
        summary: "Primary key — uniquely identifies each row in a table.",
        description:
            "Every table should have a primary key. It guarantees each record can be referenced unambiguously by relations and queries.",
        example: "id String @id",
    },
    {
        key: "unique",
        label: "unique",
        category: "attribute",
        summary: "Values in this column must not repeat across rows.",
        description:
            "A unique constraint ensures no two rows share the same value for this field. Common examples are email addresses and usernames.",
        example: "email String @unique",
    },
    {
        key: "required",
        label: "required",
        category: "attribute",
        summary: "The field must always have a value.",
        description:
            "Required fields cannot be null. In Prisma that means the field is not optional. In Drizzle that usually means .notNull() was applied.",
        example: "title String // required by default in Prisma",
    },
    {
        key: "list",
        label: "list",
        category: "attribute",
        summary: "The field stores an array of values.",
        description:
            "List fields hold multiple values in a single column or represent one-to-many relation collections such as posts on a User model.",
        example: "tags String[]",
    },
    {
        key: "updatedat",
        label: "updatedAt",
        category: "attribute",
        summary: "Automatically set when the record is updated.",
        description:
            "Prisma's @updatedAt attribute updates the timestamp whenever the row changes. Useful for audit trails and sync logic.",
        example: "updatedAt DateTime @updatedAt",
    },
    {
        key: "readonly",
        label: "readOnly",
        category: "attribute",
        summary: "The field is managed by the relation, not written directly.",
        description:
            "Read-only fields often appear on the non-owning side of a relation. The foreign key lives on another model.",
        example: "posts Post[] // virtual relation field on User",
    },
    {
        key: "one-to-one",
        label: "one-to-one",
        category: "attribute",
        summary: "Each row on one side maps to exactly one row on the other.",
        description:
            "One-to-one relations link two records exclusively. Example: User has one Profile and Profile belongs to one User.",
    },
    {
        key: "one-to-many",
        label: "one-to-many",
        category: "attribute",
        summary: "One parent record can have many related child records.",
        description:
            "One-to-many is the most common relation shape. Example: one User has many Posts, while each Post belongs to one User.",
    },
    {
        key: "many-to-one",
        label: "many-to-one",
        category: "attribute",
        summary: "Many records on this side point to one record on the other.",
        description:
            "Many-to-one is the inverse view of one-to-many. The foreign key usually lives on the many side, such as Post.authorId referencing User.id.",
    },
    {
        key: "many-to-many",
        label: "many-to-many",
        category: "attribute",
        summary: "Records on both sides can relate to many records on the other.",
        description:
            "Many-to-many relations often need a join table. Example: students enrolled in many courses and courses having many students.",
    },
];

export const GLOSSARY_ALIASES: Record<string, string> = {
    pk: "pk",
    primarykey: "pk",
    "primary-key": "pk",
    string: "string",
    str: "string",
    number: "number",
    num: "number",
    bigint: "number",
    float: "number",
    decimal: "number",
    int: "int",
    int4: "number",
    int8: "number",
    serial: "serial",
    bigserial: "serial",
    smallserial: "serial",
    boolean: "boolean",
    bool: "boolean",
    date: "date",
    datetime: "datetime",
    timestamptz: "timestamp",
    timestamp: "timestamp",
    json: "json",
    jsonb: "json",
    enum: "enum",
    relation: "relation",
    object: "relation",
    unknown: "unknown",
    text: "text",
    uuid: "uuid",
    varchar: "varchar",
    char: "string",
    unique: "unique",
    required: "required",
    notnull: "required",
    list: "list",
    array: "list",
    updatedat: "updatedat",
    readonly: "readonly",
    "one-to-one": "one-to-one",
    "one-to-many": "one-to-many",
    "many-to-one": "many-to-one",
    "many-to-many": "many-to-many",
};
