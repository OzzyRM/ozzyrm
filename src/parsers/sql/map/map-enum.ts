import type { DocEnum } from "../../../utils";
import type { ExtractedSqlEnum } from "../types/internal";

export function mapSqlEnum(item: ExtractedSqlEnum): DocEnum {
    return {
        name: item.name,
        dbName: item.schema ? `${item.schema}.${item.name}` : undefined,
        values: item.values.map((value) => ({ name: value })),
        description: item.description,
    };
}
