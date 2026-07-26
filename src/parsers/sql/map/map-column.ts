import type { DocField, FieldDefault, FieldKind, FieldType } from "../../../utils";
import {
    BOOLEAN_SQL_TYPES,
    DATE_SQL_TYPES,
    DEFAULT_SQL_FUNCTIONS,
    JSON_SQL_TYPES,
    NUMBER_SQL_TYPES,
    STRING_SQL_TYPES,
} from "../constants";
import type { ExtractedSqlColumn } from "../types/internal";

export function mapSqlColumn(column: ExtractedSqlColumn, enumNames: Set<string>): DocField {
    const kind = resolveKind(column, enumNames);

    return {
        name: column.name,
        kind,
        type: resolveFieldType(column, kind, enumNames),
        nativeType: formatNativeType(column),
        nativeDbType: {
            name: column.sqlType,
            args: column.typeArgs,
        },
        enumName: kind === "enum" ? column.sqlType : undefined,
        isList: column.isList,
        isOptional: column.isOptional,
        isUnique: column.isUnique,
        isPrimary: column.isPrimary,
        isReadOnly: false,
        isGenerated: column.isGenerated,
        isUpdatedAt: false,
        hasDefault: column.hasDefault,
        default: column.hasDefault ? mapDefault(column.defaultValue) : undefined,
        relation: column.references
            ? {
                model: column.references.table,
                field: column.references.column,
                type: "many-to-one",
            }
            : undefined,
        description: column.description,
    };
}

function resolveKind(column: ExtractedSqlColumn, enumNames: Set<string>): FieldKind {
    if (enumNames.has(column.sqlType) || enumNames.has(stripSchema(column.sqlType))) {
        return "enum";
    }

    return "scalar";
}

function resolveFieldType(
    column: ExtractedSqlColumn,
    kind: FieldKind,
    enumNames: Set<string>
): FieldType {
    if (kind === "enum" || enumNames.has(column.sqlType) || enumNames.has(stripSchema(column.sqlType))) {
        return "enum";
    }

    if (column.references) {
        return "relation";
    }

    const normalized = column.sqlType.toLowerCase();

    if (JSON_SQL_TYPES.has(normalized)) {
        return "json";
    }
    if (STRING_SQL_TYPES.has(normalized)) {
        return "string";
    }
    if (NUMBER_SQL_TYPES.has(normalized)) {
        return "number";
    }
    if (BOOLEAN_SQL_TYPES.has(normalized)) {
        return "boolean";
    }
    if (DATE_SQL_TYPES.has(normalized)) {
        return "date";
    }

    return "unknown";
}

function formatNativeType(column: ExtractedSqlColumn): string {
    if (column.typeArgs.length === 0) {
        return column.sqlType;
    }

    return `${column.sqlType}(${column.typeArgs.join(", ")})`;
}

function mapDefault(value?: string): FieldDefault | undefined {
    if (!value) {
        return undefined;
    }

    const trimmed = value.trim();
    const fnMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
    if (fnMatch) {
        const name = fnMatch[1]!.toLowerCase();
        return {
            kind: DEFAULT_SQL_FUNCTIONS.has(name) || name.endsWith("_uuid") ? "function" : "expression",
            value: fnMatch[1]!,
        };
    }

    if (/^(now|current_timestamp|current_date|current_time)$/i.test(trimmed)) {
        return { kind: "function", value: trimmed };
    }

    if (
        (trimmed.startsWith("'") && trimmed.endsWith("'"))
        || (trimmed.startsWith('"') && trimmed.endsWith('"'))
        || /^-?\d+(\.\d+)?$/.test(trimmed)
        || /^(true|false|null)$/i.test(trimmed)
    ) {
        return {
            kind: "value",
            value: trimmed.replace(/^['"]|['"]$/g, ""),
        };
    }

    return { kind: "expression", value: trimmed };
}

function stripSchema(typeName: string): string {
    const parts = typeName.split(".");
    return parts[parts.length - 1]!;
}
