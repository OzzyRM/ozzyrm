import type { DocField } from "@reldoc/core";
import { Badge } from "./ui/badge";

interface FieldsTableProps {
    fields: DocField[];
}

function formatDefault(field: DocField): string {
    if (!field.default) {
        return "—";
    }

    if (field.default.kind === "function") {
        const args = field.default.args?.length
            ? `(${field.default.args.join(", ")})`
            : "()";
        return `${field.default.value}${args}`;
    }

    return field.default.value;
}

function formatConstraints(field: DocField): string[] {
    const items: string[] = [];

    if (field.isPrimary) items.push("PK");
    if (field.isUnique) items.push("unique");
    if (!field.isOptional) items.push("required");
    if (field.isList) items.push("list");
    if (field.isUpdatedAt) items.push("updatedAt");
    if (field.isReadOnly) items.push("readOnly");

    return items;
}

export function FieldsTable({ fields }: FieldsTableProps) {
    return (
        <div className="overflow-x-auto rounded-md border border-border">
            <table className="min-w-full text-[13px]">
                <thead>
                    <tr className="border-b border-border bg-code-bg/50">
                        <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
                            Field
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
                            Type
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
                            Attributes
                        </th>
                        <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
                            Default
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {fields.map((field) => {
                        const constraints = formatConstraints(field);
                        const typeLabel = field.enumName ?? field.nativeType ?? field.type;

                        return (
                            <tr
                                key={field.name}
                                className="border-b border-border align-top last:border-b-0 hover:bg-code-bg/30"
                            >
                                <td className="px-3 py-2">
                                    <div className="font-mono text-[12px] font-medium">{field.name}</div>
                                    {field.dbName && field.dbName !== field.name && (
                                        <div className="mt-0.5 font-mono text-[11px] text-muted">
                                            @{field.dbName}
                                        </div>
                                    )}
                                    {field.description && (
                                        <div className="mt-1 text-[12px] text-muted">{field.description}</div>
                                    )}
                                    {field.relation && (
                                        <div className="mt-1 font-mono text-[11px] text-muted">
                                            → {field.relation.model}.{field.relation.field}
                                            <span className="ml-1 text-muted/70">({field.relation.type})</span>
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2">
                                    <Badge label={typeLabel} variant="type" />
                                    {field.nativeDbType && (
                                        <div className="mt-1 font-mono text-[11px] text-muted">
                                            @{field.nativeDbType.name}
                                            {field.nativeDbType.args.length > 0
                                                ? `(${field.nativeDbType.args.join(", ")})`
                                                : ""}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-1">
                                        {constraints.length > 0 ? (
                                            constraints.map((item) => (
                                                <Badge key={item} label={item} variant="constraint" />
                                            ))
                                        ) : (
                                            <span className="text-muted">—</span>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-2 font-mono text-[11px] text-muted">
                                    {formatDefault(field)}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
