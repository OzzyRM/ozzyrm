"use client";

import type { DocField } from "@reldoc/core";
import { ArrowRight } from "lucide-react";
import { fieldSectionId } from "@/lib/section-id";
import { Badge } from "./ui/badge";

interface FieldsTableProps {
    fields: DocField[];
    modelName: string;
    onNavigate: (id: string) => void;
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

export function FieldsTable({ fields, modelName, onNavigate }: FieldsTableProps) {
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
                        const rowId = fieldSectionId(modelName, field.name);

                        return (
                            <tr
                                key={field.name}
                                id={rowId}
                                data-nav-target
                                className="border-b border-border align-top transition-colors last:border-b-0 hover:bg-code-bg/30 data-[highlight=true]:bg-accent/10"
                            >
                                <td className="px-3 py-2">
                                    <div>
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
                                            <button
                                                type="button"
                                                onClick={() => onNavigate(
                                                    fieldSectionId(field.relation!.model, field.relation!.field)
                                                )}
                                                className="mt-1 inline-flex items-center gap-1 font-mono text-[11px] text-muted transition-colors hover:text-accent"
                                            >
                                                <ArrowRight className="h-3 w-3 shrink-0" strokeWidth={2} />
                                                <span>{field.relation.model}.{field.relation.field}</span>
                                                <span className="text-muted/60">({field.relation.type})</span>
                                            </button>
                                        )}
                                    </div>
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
