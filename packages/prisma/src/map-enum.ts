import type { DatamodelEnum as DmmfEnum } from "@prisma/dmmf";
import type { DocEnum } from "@ozzyrm/core";

export function mapEnum(enumDef: DmmfEnum): DocEnum {
    return {
        name: enumDef.name,
        dbName: enumDef.dbName ?? undefined,
        description: enumDef.documentation ?? undefined,
        values: enumDef.values.map((value) => ({
            name: value.name,
            dbName: value.dbName ?? undefined,
        })),
    };
};