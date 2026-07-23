import { defineConfig } from "@reldoc/core";

export default defineConfig({
    orm: "prisma",
    include: ["./packages/prisma/test/schema.prisma"],
    output: "./web",
});

// Switch to drizzle example:
// export default defineConfig({
//     orm: "drizzle",
//     include: ["./examples/drizzle/schema.ts"],
//     output: "./web",
// });
