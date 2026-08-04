import type { SchemaCatalogGroup } from "../catalog/types";

export type {
    SchemaCatalogGroup,
    SchemaCatalogVersion,
    LoadedCatalog,
} from "../catalog/types";

export interface OzzyRMDocsOptions {
    catalog: SchemaCatalogGroup[];
    defaultSchemaId?: string;
    basePath?: string;
    logoSrc?: string;
}
