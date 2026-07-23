import type { DocSchema } from "@reldoc/core";
import schemaData from "../../schema.json";

export function retrieveSchema(): DocSchema {
    return schemaData as DocSchema;
}
