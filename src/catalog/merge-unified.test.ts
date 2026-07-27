import { describe, expect, test } from "bun:test";
import type { DocSchema } from "../utils/types/types";
import { mergeUnifiedSchema } from "./merge-unified";
import { UnifiedSchemaValidationError } from "./validation";
import { defineProject, prisma, sql, loadCatalog } from "../index";

function emptySchema(orm: DocSchema["orm"], overrides: Partial<DocSchema> = {}): DocSchema {
    return {
        generatedAt: new Date().toISOString(),
        orm,
        version: "1.0.0",
        models: [],
        enums: [],
        ...overrides,
    };
}

describe("mergeUnifiedSchema", () => {
    test("resolves sql relation to prisma model via physical table alias", () => {
        const prismaSchema = emptySchema("prisma", {
            models: [
                {
                    name: "User",
                    dbName: "users",
                    fields: [
                        {
                            name: "id",
                            kind: "scalar",
                            type: "string",
                            isList: false,
                            isOptional: false,
                            isUnique: false,
                            isPrimary: true,
                            isReadOnly: false,
                            isGenerated: false,
                            isUpdatedAt: false,
                            hasDefault: false,
                        },
                    ],
                    referencedBy: [],
                    compoundUnique: [],
                    compoundId: [],
                    indexes: [],
                },
            ],
        });

        const sqlSchema = emptySchema("sql", {
            models: [
                {
                    name: "posts",
                    tableName: "posts",
                    fields: [
                        {
                            name: "author_id",
                            kind: "scalar",
                            type: "relation",
                            isList: false,
                            isOptional: false,
                            isUnique: false,
                            isPrimary: false,
                            isReadOnly: false,
                            isGenerated: false,
                            isUpdatedAt: false,
                            hasDefault: false,
                            relation: {
                                model: "users",
                                field: "id",
                                type: "many-to-one",
                            },
                        },
                    ],
                    referencedBy: [],
                    compoundUnique: [],
                    compoundId: [],
                    indexes: [],
                },
            ],
        });

        const merged = mergeUnifiedSchema({
            definition: {
                id: "company",
                sources: ["app-prisma", "legacy-sql"],
                version: "1.0.0",
            },
            members: [
                {
                    id: "app-prisma",
                    orm: "prisma",
                    file: "schema.prisma",
                    schema: prismaSchema,
                },
                {
                    id: "legacy-sql",
                    orm: "sql",
                    file: "schema.sql",
                    schema: sqlSchema,
                },
            ],
        });

        expect(merged.orm).toBe("unified");
        expect(merged.sources?.map((item) => item.id)).toEqual(["app-prisma", "legacy-sql"]);
        expect(merged.models.map((item) => item.name).sort()).toEqual(["User", "posts"]);

        const posts = merged.models.find((item) => item.name === "posts")!;
        expect(posts.fields[0]!.relation?.model).toBe("User");

        const user = merged.models.find((item) => item.name === "User")!;
        expect(user.referencedBy).toEqual([{ model: "posts", field: "author_id" }]);
        expect(user.source?.id).toBe("app-prisma");
    });

    test("fails on duplicate physical table identity", () => {
        const left = emptySchema("prisma", {
            models: [
                {
                    name: "User",
                    dbName: "users",
                    fields: [],
                    referencedBy: [],
                    compoundUnique: [],
                    compoundId: [],
                    indexes: [],
                },
            ],
        });
        const right = emptySchema("sql", {
            models: [
                {
                    name: "users",
                    tableName: "users",
                    fields: [],
                    referencedBy: [],
                    compoundUnique: [],
                    compoundId: [],
                    indexes: [],
                },
            ],
        });

        expect(() =>
            mergeUnifiedSchema({
                definition: { id: "company", sources: ["a", "b"] },
                members: [
                    { id: "a", orm: "prisma", file: "a", schema: left },
                    { id: "b", orm: "sql", file: "b", schema: right },
                ],
            })
        ).toThrow(UnifiedSchemaValidationError);
    });

    test("fails on wrong relation target", () => {
        const prismaSchema = emptySchema("prisma", {
            models: [
                {
                    name: "User",
                    fields: [
                        {
                            name: "id",
                            kind: "scalar",
                            type: "string",
                            isList: false,
                            isOptional: false,
                            isUnique: false,
                            isPrimary: true,
                            isReadOnly: false,
                            isGenerated: false,
                            isUpdatedAt: false,
                            hasDefault: false,
                        },
                    ],
                    referencedBy: [],
                    compoundUnique: [],
                    compoundId: [],
                    indexes: [],
                },
            ],
        });
        const sqlSchema = emptySchema("sql", {
            models: [
                {
                    name: "posts",
                    fields: [
                        {
                            name: "author_id",
                            kind: "scalar",
                            type: "relation",
                            isList: false,
                            isOptional: false,
                            isUnique: false,
                            isPrimary: false,
                            isReadOnly: false,
                            isGenerated: false,
                            isUpdatedAt: false,
                            hasDefault: false,
                            relation: {
                                model: "accounts",
                                field: "id",
                                type: "many-to-one",
                            },
                        },
                    ],
                    referencedBy: [],
                    compoundUnique: [],
                    compoundId: [],
                    indexes: [],
                },
            ],
        });

        try {
            mergeUnifiedSchema({
                definition: { id: "company", sources: ["a", "b"] },
                members: [
                    { id: "a", orm: "prisma", file: "a", schema: prismaSchema },
                    { id: "b", orm: "sql", file: "b", schema: sqlSchema },
                ],
            });
            throw new Error("expected validation error");
        } catch (error) {
            expect(error).toBeInstanceOf(UnifiedSchemaValidationError);
            const codes = (error as UnifiedSchemaValidationError).diagnostics.map(
                (item) => item.code
            );
            expect(codes).toContain("REL_TARGET_NOT_FOUND");
        }
    });

    test("aggregates unknown source and empty group diagnostics", () => {
        try {
            mergeUnifiedSchema({
                definition: { id: "company", sources: ["only-one"] },
                members: [],
            });
            throw new Error("expected validation error");
        } catch (error) {
            expect(error).toBeInstanceOf(UnifiedSchemaValidationError);
            const codes = (error as UnifiedSchemaValidationError).diagnostics.map(
                (item) => item.code
            );
            expect(codes).toContain("EMPTY_GROUP");
            expect(codes).toContain("UNKNOWN_SOURCE");
        }
    });

    test("fails when relation field is missing on target", () => {
        const prismaSchema = emptySchema("prisma", {
            models: [
                {
                    name: "User",
                    dbName: "users",
                    fields: [
                        {
                            name: "id",
                            kind: "scalar",
                            type: "string",
                            isList: false,
                            isOptional: false,
                            isUnique: false,
                            isPrimary: true,
                            isReadOnly: false,
                            isGenerated: false,
                            isUpdatedAt: false,
                            hasDefault: false,
                        },
                    ],
                    referencedBy: [],
                    compoundUnique: [],
                    compoundId: [],
                    indexes: [],
                },
            ],
        });
        const sqlSchema = emptySchema("sql", {
            models: [
                {
                    name: "posts",
                    fields: [
                        {
                            name: "author_id",
                            kind: "scalar",
                            type: "relation",
                            isList: false,
                            isOptional: false,
                            isUnique: false,
                            isPrimary: false,
                            isReadOnly: false,
                            isGenerated: false,
                            isUpdatedAt: false,
                            hasDefault: false,
                            relation: {
                                model: "users",
                                field: "missing_id",
                                type: "many-to-one",
                            },
                        },
                    ],
                    referencedBy: [],
                    compoundUnique: [],
                    compoundId: [],
                    indexes: [],
                },
            ],
        });

        try {
            mergeUnifiedSchema({
                definition: { id: "company", sources: ["a", "b"] },
                members: [
                    { id: "a", orm: "prisma", file: "a", schema: prismaSchema },
                    { id: "b", orm: "sql", file: "b", schema: sqlSchema },
                ],
            });
            throw new Error("expected validation error");
        } catch (error) {
            expect(error).toBeInstanceOf(UnifiedSchemaValidationError);
            const codes = (error as UnifiedSchemaValidationError).diagnostics.map(
                (item) => item.code
            );
            expect(codes).toContain("REL_FIELD_NOT_FOUND");
        }
    });
});

describe("loadCatalog unified integration", () => {
    test("replaces member sources with unified entry and resolves cross refs", async () => {
        const config = defineProject({
            schemas: [
                prisma({
                    id: "app-prisma",
                    include: ["./fixtures/unified/app.prisma"],
                    file: "app.prisma",
                }),
                sql({
                    id: "legacy-sql",
                    include: ["./fixtures/unified/legacy.sql"],
                    file: "legacy.sql",
                }),
            ],
            unified: [
                {
                    id: "company-schema",
                    sources: ["app-prisma", "legacy-sql"],
                    file: "company",
                    version: "1.0.0",
                },
            ],
        });

        const loaded = await loadCatalog(config, { cwd: process.cwd() });
        const ids = loaded.catalog.flatMap((group) =>
            group.versions.map((version) => version.id)
        );

        expect(ids).toContain("company-schema");
        expect(ids).not.toContain("app-prisma");
        expect(ids).not.toContain("legacy-sql");

        const unified = loaded.catalog
            .flatMap((group) => group.versions)
            .find((version) => version.id === "company-schema")!;

        expect(unified.schema.orm).toBe("unified");
        expect(unified.schema.sources?.map((item) => item.id).sort()).toEqual([
            "app-prisma",
            "legacy-sql",
        ]);

        const posts = unified.schema.models.find((item) => item.name === "posts")!;
        expect(posts.fields.find((field) => field.name === "author_id")?.relation?.model).toBe(
            "User"
        );
    });

    test("rejects conflicting overlapping fixtures with diagnostics", async () => {
        const config = defineProject({
            schemas: [
                prisma({
                    id: "app-prisma",
                    include: ["./fixtures/prisma/schema.prisma"],
                }),
                sql({
                    id: "legacy-sql",
                    include: ["./fixtures/sql/schema.sql"],
                }),
            ],
            unified: [
                {
                    id: "company-schema",
                    sources: ["app-prisma", "legacy-sql"],
                },
            ],
        });

        try {
            await loadCatalog(config, { cwd: process.cwd() });
            throw new Error("expected validation error");
        } catch (error) {
            expect(error).toBeInstanceOf(UnifiedSchemaValidationError);
            expect((error as UnifiedSchemaValidationError).diagnostics.length).toBeGreaterThan(0);
        }
    });
});
