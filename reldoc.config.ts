import { defineProject } from "@reldoc/core";

export default defineProject({
    output: "./web/schemas",
    schemas: [
        {
            id: "schema-prisma-1-0-0",
            file: "schema.prisma",
            version: "1.0.0",
            orm: "prisma",
            include: ["./packages/prisma/test/schema.prisma"],
        },
        {
            id: "schema-prisma-2-0-0",
            file: "schema.prisma",
            version: "2.0.0",
            orm: "prisma",
            include: ["./packages/prisma/test/schema-v2.prisma"],
        },
        {
            id: "schema-prisma-3-0-0",
            file: "schema.prisma",
            version: "3.0.0",
            orm: "prisma",
            include: ["./packages/prisma/test/schema-v3.prisma"],
        },
        {
            id: "schema-prisma-multi-1-0-0",
            file: "multi-file",
            version: "1.0.0",
            orm: "prisma",
            include: ["./packages/prisma/test/multi-file"],
        },
        {
            id: "schema-drizzle-1-0-0",
            file: "schema.ts",
            orm: "drizzle",
            include: ["./packages/drizzle/test/schema.ts"],
        },
        {
            id: "schema-drizzle-multi-1-0-0",
            file: "multi-file",
            version: "1.0.0",
            orm: "drizzle",
            include: ["./packages/drizzle/test/multi-file/schema.ts"],
        },
    ],
});
