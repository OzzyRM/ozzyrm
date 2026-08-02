export type {
    SchemaCatalogGroup,
    SchemaCatalogVersion,
    LoadedCatalog,
} from "./types";
export {
    loadCatalog,
    loadConfigFile,
    normalizeProjectConfig,
    schemaFileLabel,
    normalizeVersion,
    schemaGroupId,
    DEFAULT_SCHEMA_VERSION,
} from "./load-catalog";
export {
    resolveScenarios,
    collectRelatedModelPairs,
} from "./resolve-scenarios";
export { generate, type GenerateResult } from "./generate";
export {
    watchCatalog,
    resolveWatchConfig,
    collectWatchPaths,
    type WatchOptions,
    type ResolvedWatchConfig,
} from "./watch";
export {
    mergeUnifiedSchema,
    type MergeUnifiedInput,
    type ParsedSourceEntry,
} from "./merge-unified";
export {
    UnifiedSchemaValidationError,
    formatDiagnostics,
    type UnifiedDiagnostic,
    type DiagnosticCode,
} from "./validation";
