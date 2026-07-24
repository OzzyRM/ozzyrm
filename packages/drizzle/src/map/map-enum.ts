import type { DocEnum } from "@ozzyrm/core";
import type { ExtractedEnum } from "../types/internal";

export function mapEnum(enumDef: ExtractedEnum): DocEnum {
    return {
        name: enumDef.exportName,
        dbName: enumDef.enumName !== enumDef.exportName ? enumDef.enumName : undefined,
        description: enumDef.description,
        values: enumDef.values.map((value) => ({ name: value })),
    };
}
