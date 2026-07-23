import { readFile } from "fs/promises";
import { join } from "path";
import type { DocSchema } from "@reldoc/core";
import { env } from "../config/env.config";

export async function retrieveSchema(): Promise<DocSchema> {
    const schemaPath = join(process.cwd(), env.SCHEMA_PATH);

    try {
        const rawFileRead = await readFile(schemaPath, "utf-8");
        return JSON.parse(rawFileRead) as DocSchema;
    } catch {
        throw new Error(
            `Schema not found at "${schemaPath}". Run "bun run generate" from the repo root first.`
        );
    }
}
