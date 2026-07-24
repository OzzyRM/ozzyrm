import { describe, expect, test } from "bun:test";
import { resolve } from "path";
import { PrismaParser } from "../src/index";

const multiFileDir = resolve(import.meta.dir, "multi-file");

describe("PrismaParser", () => {
    test("parses a single schema file", async () => {
        const parser = new PrismaParser();
        const schema = await parser.parse({
            orm: "prisma",
            include: [resolve(import.meta.dir, "schema.prisma")],
        });

        expect(schema.models.map((model) => model.name)).toContain("User");
        expect(schema.models.map((model) => model.name)).toContain("Post");
        expect(schema.enums.map((item) => item.name)).toContain("Role");
    });

    test("parses a multi-file schema directory with cross-file relations", async () => {
        const parser = new PrismaParser();
        const schema = await parser.parse({
            orm: "prisma",
            include: [multiFileDir],
        });

        expect(schema.models.map((model) => model.name).sort()).toEqual(["Post", "User"]);
        expect(schema.enums.map((item) => item.name)).toEqual(["Role"]);

        const user = schema.models.find((model) => model.name === "User");
        const post = schema.models.find((model) => model.name === "Post");

        expect(user?.fields.find((field) => field.name === "posts")?.relation).toEqual({
            model: "Post",
            field: "id",
            type: "one-to-many",
        });

        expect(post?.fields.find((field) => field.name === "author")?.relation).toEqual({
            model: "User",
            field: "id",
            type: "many-to-one",
        });
    });

    test("parses explicit multi-file include paths", async () => {
        const parser = new PrismaParser();
        const schema = await parser.parse({
            orm: "prisma",
            include: [
                resolve(multiFileDir, "schema.prisma"),
                resolve(multiFileDir, "user.prisma"),
                resolve(multiFileDir, "post.prisma"),
                resolve(multiFileDir, "role.prisma"),
            ],
        });

        expect(schema.models.map((model) => model.name).sort()).toEqual(["Post", "User"]);
        expect(schema.enums.map((item) => item.name)).toEqual(["Role"]);
    });
});
