export type DiagnosticCode =
    | "DUP_SOURCE_ID"
    | "DUP_GROUP_ID"
    | "UNKNOWN_SOURCE"
    | "EMPTY_GROUP"
    | "EMPTY_SCHEMAS"
    | "INVALID_SOURCE_ID"
    | "EMPTY_INCLUDE"
    | "SOURCE_PARSE_FAILED"
    | "DUP_MODEL"
    | "DUP_TABLE_NAME"
    | "DUP_ENUM"
    | "DUP_FIELD"
    | "AMBIGUOUS_NAME"
    | "REL_TARGET_NOT_FOUND"
    | "REL_FIELD_NOT_FOUND"
    | "ENUM_NOT_FOUND"
    | "INDEX_FIELD_NOT_FOUND"
    | "DUP_SCENARIO_ID"
    | "INVALID_SCENARIO_ID"
    | "INVALID_SCENARIO_LABEL"
    | "UNKNOWN_SCHEMA_ID"
    | "EMPTY_SCENARIO_MODELS"
    | "UNKNOWN_MODEL"
    | "UNKNOWN_ENUM"
    | "PATH_MODEL_NOT_IN_SCENARIO"
    | "PATH_RELATION_MISSING"
    | "PATH_OUTSIDE_PROJECT";

export interface UnifiedDiagnostic {
    code: DiagnosticCode;
    message: string;
    sourceId?: string;
    path?: string[];
    related?: {
        sourceId?: string;
        path?: string[];
    };
}

export class UnifiedSchemaValidationError extends Error {
    readonly diagnostics: UnifiedDiagnostic[];

    constructor(diagnostics: UnifiedDiagnostic[]) {
        super(formatDiagnostics(diagnostics));
        this.name = "UnifiedSchemaValidationError";
        this.diagnostics = diagnostics;
    }
}

export function formatDiagnostics(diagnostics: UnifiedDiagnostic[]): string {
    if (diagnostics.length === 0) {
        return "ozzyrm validation failed";
    }

    const lines = diagnostics.map((item, index) => {
        const location = item.path?.length ? ` (${item.path.join(".")})` : "";
        const source = item.sourceId ? ` [${item.sourceId}]` : "";
        return `${index + 1}. ${item.code}${source}${location}: ${item.message}`;
    });

    return `ozzyrm validation failed with ${diagnostics.length} issue(s):\n${lines.join("\n")}`;
}

export function normalizeIdentityKey(value: string): string {
    return value.trim().replace(/^"+|"+$/g, "").toLowerCase();
}

export function physicalModelKeys(model: {
    name: string;
    dbName?: string;
    tableName?: string;
}): string[] {
    const keys = new Set<string>();
    keys.add(normalizeIdentityKey(model.name));

    if (model.tableName) {
        keys.add(normalizeIdentityKey(model.tableName));
        const bare = model.tableName.split(".").pop();
        if (bare) {
            keys.add(normalizeIdentityKey(bare));
        }
    }

    if (model.dbName) {
        keys.add(normalizeIdentityKey(model.dbName));
        const bare = model.dbName.split(".").pop();
        if (bare) {
            keys.add(normalizeIdentityKey(bare));
        }
    }

    return Array.from(keys);
}

export function physicalEnumKeys(item: { name: string; dbName?: string }): string[] {
    const keys = new Set<string>();
    keys.add(normalizeIdentityKey(item.name));
    if (item.dbName) {
        keys.add(normalizeIdentityKey(item.dbName));
        const bare = item.dbName.split(".").pop();
        if (bare) {
            keys.add(normalizeIdentityKey(bare));
        }
    }
    return Array.from(keys);
}
