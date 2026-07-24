import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { DrizzleParser, resolveDrizzleSchemaFiles } from "../src/index";

const multiFileDir = resolve(import.meta.dir, "multi-file");
const entryFile = resolve(multiFileDir, "schema.ts");

describe("resolveDrizzleSchemaFiles", () => {
    test("follows local imports from an entry file", async () => {
        const files = await resolveDrizzleSchemaFiles([entryFile]);

        expect(files.sort()).toEqual([
            resolve(multiFileDir, "enums.ts"),
            resolve(multiFileDir, "posts.ts"),
            resolve(multiFileDir, "schema.ts"),
            resolve(multiFileDir, "users.ts"),
        ].sort());
    });

    test("loads every schema file in a directory", async () => {
        const files = await resolveDrizzleSchemaFiles([multiFileDir]);

        expect(files.sort()).toEqual([
            resolve(multiFileDir, "enums.ts"),
            resolve(multiFileDir, "posts.ts"),
            resolve(multiFileDir, "schema.ts"),
            resolve(multiFileDir, "users.ts"),
        ].sort());
    });
});

describe("DrizzleParser", () => {
    test("parses a single schema file", async () => {
        const parser = new DrizzleParser();
        const schema = await parser.parse({
            orm: "drizzle",
            include: [resolve(import.meta.dir, "schema.ts")],
        });

        expect(schema.models.map((model) => model.name).sort()).toEqual(["posts", "users"]);
        expect(schema.enums.map((item) => item.name)).toEqual(["roleEnum"]);
    });

    test("parses a multi-file schema through import graph", async () => {
        const parser = new DrizzleParser();
        const schema = await parser.parse({
            orm: "drizzle",
            include: [entryFile],
        });

        expect(schema.models.map((model) => model.name).sort()).toEqual(["posts", "users"]);
        expect(schema.enums.map((item) => item.name)).toEqual(["roleEnum"]);

        const posts = schema.models.find((model) => model.name === "posts");
        const users = schema.models.find((model) => model.name === "users");

        expect(posts?.fields.find((field) => field.name === "authorId")?.relation).toEqual({
            model: "users",
            field: "id",
            type: "many-to-one",
        });

        expect(users?.referencedBy).toEqual([
            { model: "posts", field: "authorId" },
        ]);
    });

    test("parses a multi-file schema directory", async () => {
        const parser = new DrizzleParser();
        const schema = await parser.parse({
            orm: "drizzle",
            include: [multiFileDir],
        });

        expect(schema.models.map((model) => model.name).sort()).toEqual(["posts", "users"]);
        expect(schema.enums.map((item) => item.name)).toEqual(["roleEnum"]);
    });
});
