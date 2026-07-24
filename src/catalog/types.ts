import type { DocSchema } from "../utils/types/types";

export interface SchemaCatalogVersion {
    id: string;
    version: string;
    schema: DocSchema;
}

export interface SchemaCatalogGroup {
    id: string;
    file: string;
    orm: DocSchema["orm"];
    versions: SchemaCatalogVersion[];
}

export interface LoadedCatalog {
    catalog: SchemaCatalogGroup[];
    defaultSchemaId: string;
}
