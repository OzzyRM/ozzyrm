import { z } from "zod";

const envSchema = z.object({
    SCHEMA_PATH: z.string().default("schema.json"),
});

export const env = envSchema.parse({
    SCHEMA_PATH: process.env.SCHEMA_PATH,
});
