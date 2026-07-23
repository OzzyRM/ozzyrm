import { mkdir, writeFile } from "fs/promises";
import { join } from "path";
import type { DocSchema } from "../utils";

export async function writeSchema(schema: DocSchema, outputPath: string): Promise<string> {
    await mkdir(outputPath, { recursive: true });
    const destination = join(outputPath, "schema.json");
    await writeFile(destination, JSON.stringify(schema, null, 2), "utf-8");
    return destination;
};