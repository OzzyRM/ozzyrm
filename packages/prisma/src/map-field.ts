import type { Field as DmmfField } from "@prisma/dmmf";
import type { DocField, FieldDefault, FieldKind, FieldRelation, FieldType } from "@reldoc/core";

const SCALAR_TYPE_MAP: Record<string, FieldType> = {
    String: "string",
    Int: "number",
    BigInt: "number",
    Float: "number",
    Decimal: "number",
    Boolean: "boolean",
    DateTime: "date",
    Json: "json",
    Bytes: "unknown",
};

export function mapField(field: DmmfField, enumNames: Set<string>): DocField {
    const kind = mapKind(field);

    return {
        name: field.name,
        dbName: field.dbName ?? undefined,
        kind,
        type: mapFieldType(field, kind),
        nativeType: field.type,
        nativeDbType: field.nativeType
            ? { name: field.nativeType[0], args: [...field.nativeType[1]] }
            : undefined,
        enumName: kind === "enum" ? field.type : undefined,
        isList: field.isList,
        isOptional: !field.isRequired,
        isUnique: field.isUnique,
        isPrimary: field.isId,
        isReadOnly: field.isReadOnly,
        isGenerated: field.isGenerated ?? false,
        isUpdatedAt: field.isUpdatedAt ?? false,
        hasDefault: field.hasDefaultValue,
        default: field.hasDefaultValue ? mapDefault(field.default) : undefined,
        relation: kind === "object" ? mapRelation(field) : undefined,
        description: field.documentation ?? undefined,
    };
}

function mapKind(field: DmmfField): FieldKind {
    return field.kind as FieldKind;
}

function mapFieldType(field: DmmfField, kind: FieldKind): FieldType {
    if (kind === "object") {
        return "relation";
    }

    if (kind === "enum") {
        return "enum";
    }

    if (kind === "unsupported") {
        return "unknown";
    }

    return SCALAR_TYPE_MAP[field.type] ?? "unknown";
}

function mapRelation(field: DmmfField): FieldRelation {
    const hasForeignKey = (field.relationFromFields?.length ?? 0) > 0;

    let type: FieldRelation["type"];
    if (field.isList) {
        type = hasForeignKey ? "many-to-many" : "one-to-many";
    } else {
        type = hasForeignKey ? "many-to-one" : "one-to-one";
    }

    return {
        model: field.type,
        field: field.relationToFields?.[0] ?? "id",
        type,
    };
}

function mapDefault(
    value: DmmfField["default"]
): FieldDefault | undefined {
    if (value === undefined) {
        return undefined;
    }

    if (typeof value === "object" && value !== null && "name" in value) {
        return {
            kind: "function",
            value: value.name,
            args: [...value.args],
        };
    }

    if (Array.isArray(value)) {
        return {
            kind: "value",
            value: JSON.stringify([...value]),
        };
    }

    return {
        kind: "value",
        value: String(value),
    };
}
