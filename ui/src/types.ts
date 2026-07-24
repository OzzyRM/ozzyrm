import type { DocSchema } from "@ozzyrm/core";

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

export interface OzzyRMDocsOptions {
    catalog: SchemaCatalogGroup[];
    defaultSchemaId?: string;
    basePath?: string;
    logoSrc?: string;
}
