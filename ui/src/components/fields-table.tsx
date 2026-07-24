"use client";

import type { DocField } from "@ozzyrm/core";
import { ArrowRight } from "lucide-react";
import { useGlossary } from "./glossary-provider";
import { fieldSectionId, sectionId } from "../lib/section-id";
import { Badge } from "./ui/badge";

interface FieldsTableProps {
    fields: DocField[];
    modelName: string;
    modelNames: Set<string>;
    enumNames: Set<string>;
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

function resolveTypeNavigation(
    typeLabel: string,
    field: DocField,
    modelNames: Set<string>,
    enumNames: Set<string>
): { kind: "model" | "enum"; name: string } | null {
    if (field.relation?.model && modelNames.has(field.relation.model)) {
        return { kind: "model", name: field.relation.model };
    }

    if (modelNames.has(typeLabel)) {
        return { kind: "model", name: typeLabel };
    }

    if (field.enumName && enumNames.has(field.enumName)) {
        return { kind: "enum", name: field.enumName };
    }

    if (enumNames.has(typeLabel)) {
        return { kind: "enum", name: typeLabel };
    }

    return null;
}

export function FieldsTable({
    fields,
    modelName,
    modelNames,
    enumNames,
    onNavigate,
}: FieldsTableProps) {
    const { openGlossary } = useGlossary();

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
                        const typeNavigation = resolveTypeNavigation(
                            typeLabel,
                            field,
                            modelNames,
                            enumNames
                        );
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
                                            <div className="mt-1 flex flex-wrap items-center gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => onNavigate(
                                                        fieldSectionId(field.relation!.model, field.relation!.field)
                                                    )}
                                                    className="inline-flex items-center gap-1 font-mono text-[11px] text-muted transition-colors hover:text-accent"
                                                >
                                                    <ArrowRight className="h-3 w-3 shrink-0" strokeWidth={2} />
                                                    <span>{field.relation.model}.{field.relation.field}</span>
                                                </button>
                                                <Badge
                                                    label={field.relation.type}
                                                    variant="constraint"
                                                    glossaryCategory="attribute"
                                                    onGlossaryClick={openGlossary}
                                                />
                                            </div>
                                        )}
                                    </div>
                                </td>
                                <td className="px-3 py-2">
                                    <Badge
                                        label={typeLabel}
                                        variant={typeNavigation?.kind === "model" ? "model" : "type"}
                                        onClick={
                                            typeNavigation
                                                ? () => onNavigate(sectionId(typeNavigation.kind, typeNavigation.name))
                                                : undefined
                                        }
                                        glossaryCategory="type"
                                        onGlossaryClick={openGlossary}
                                    />
                                    {field.nativeDbType && (
                                        <div className="mt-1">
                                            <Badge
                                                label={`@${field.nativeDbType.name}`}
                                                variant="default"
                                                glossaryCategory="type"
                                                onGlossaryClick={(label) =>
                                                    openGlossary(label.replace(/^@/, ""), "type")
                                                }
                                            />
                                            {field.nativeDbType.args.length > 0 && (
                                                <span className="ml-1 font-mono text-[11px] text-muted">
                                                    ({field.nativeDbType.args.join(", ")})
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex flex-wrap gap-1">
                                        {constraints.length > 0 ? (
                                            constraints.map((item) => (
                                                <Badge
                                                    key={item}
                                                    label={item}
                                                    variant="constraint"
                                                    glossaryCategory="attribute"
                                                    onGlossaryClick={openGlossary}
                                                />
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
