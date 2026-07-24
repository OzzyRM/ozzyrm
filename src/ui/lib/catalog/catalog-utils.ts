import type { DocSchema } from "../../..";
import type { SchemaCatalogGroup } from "../../types";

export function findSchemaById(
    catalog: SchemaCatalogGroup[],
    schemaId: string
): { group: SchemaCatalogGroup; version: SchemaCatalogGroup["versions"][number] } | null {
    for (const group of catalog) {
        const version = group.versions.find((entry) => entry.id === schemaId);
        if (version) {
            return { group, version };
        }
    }

    return null;
}

export function findGroupBySchemaId(
    catalog: SchemaCatalogGroup[],
    schemaId: string
): SchemaCatalogGroup | null {
    return findSchemaById(catalog, schemaId)?.group ?? null;
}

export function getSchemaFromCatalog(
    catalog: SchemaCatalogGroup[],
    schemaId: string
): DocSchema | null {
    return findSchemaById(catalog, schemaId)?.version.schema ?? null;
}
