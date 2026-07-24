import type { DocField, FieldDefault, FieldKind, FieldRelation, FieldType } from "@ozzyrm/core";
import {
    BOOLEAN_COLUMN_TYPES,
    DATE_COLUMN_TYPES,
    DEFAULT_FUNCTION_MODIFIERS,
    JSON_COLUMN_TYPES,
    NUMBER_COLUMN_TYPES,
    STRING_COLUMN_TYPES,
} from "../constants";
import type { ColumnModifier, ExtractedColumn } from "../types/internal";

export function mapColumn(column: ExtractedColumn, enumNames: Set<string>): DocField {
    const modifiers = column.modifiers;
    const reference = modifiers.find((modifier) => modifier.kind === "references");
    const defaultModifier = modifiers.find((modifier) => modifier.kind === "default");
    const kind = resolveKind(column, enumNames, reference);

    return {
        name: column.name,
        dbName: column.dbName !== column.name ? column.dbName : undefined,
        kind,
        type: resolveFieldType(column.columnType, kind, enumNames),
        nativeType: column.columnType,
        enumName: kind === "enum" ? column.columnType : undefined,
        isList: false,
        isOptional: !modifiers.some((modifier) => modifier.kind === "notNull"),
        isUnique: modifiers.some((modifier) => modifier.kind === "unique"),
        isPrimary: modifiers.some((modifier) => modifier.kind === "primaryKey"),
        isReadOnly: false,
        isGenerated: isGeneratedColumn(column.columnType, modifiers),
        isUpdatedAt: false,
        hasDefault: Boolean(defaultModifier),
        default: defaultModifier ? mapDefault(defaultModifier) : undefined,
        relation: reference ? mapRelation(reference) : undefined,
        description: column.description,
    };
}

function resolveKind(
    column: ExtractedColumn,
    enumNames: Set<string>,
    reference: ColumnModifier | undefined
): FieldKind {
    if (reference) {
        return "scalar";
    }

    if (enumNames.has(column.columnType) || enumNames.has(column.name)) {
        return "enum";
    }

    return "scalar";
}

function resolveFieldType(columnType: string, kind: FieldKind, enumNames: Set<string>): FieldType {
    if (kind === "enum" || enumNames.has(columnType)) {
        return "enum";
    }

    const normalized = columnType.toLowerCase();

    if (JSON_COLUMN_TYPES.has(normalized)) {
        return "json";
    }

    if (STRING_COLUMN_TYPES.has(normalized)) {
        return "string";
    }

    if (NUMBER_COLUMN_TYPES.has(normalized)) {
        return "number";
    }

    if (BOOLEAN_COLUMN_TYPES.has(normalized)) {
        return "boolean";
    }

    if (DATE_COLUMN_TYPES.has(normalized)) {
        return "date";
    }

    return "unknown";
}

function mapRelation(reference: ColumnModifier): FieldRelation | undefined {
    if (reference.kind !== "references") {
        return undefined;
    }

    return {
        model: reference.table,
        field: reference.field,
        type: "many-to-one",
    };
}

function mapDefault(modifier: ColumnModifier): FieldDefault | undefined {
    if (modifier.kind !== "default") {
        return undefined;
    }

    if (DEFAULT_FUNCTION_MODIFIERS.has(modifier.modifier)) {
        return {
            kind: "function",
            value: modifier.modifier,
        };
    }

    if (modifier.modifier === "default") {
        return {
            kind: "value",
            value: modifier.value,
        };
    }

    return {
        kind: "function",
        value: modifier.modifier,
    };
}

function isGeneratedColumn(columnType: string, modifiers: ColumnModifier[]): boolean {
    const normalized = columnType.toLowerCase();
    if (normalized === "serial" || normalized.endsWith("serial")) {
        return true;
    }

    return modifiers.some(
        (modifier) => modifier.kind === "default"
            && DEFAULT_FUNCTION_MODIFIERS.has(modifier.modifier)
    );
}
