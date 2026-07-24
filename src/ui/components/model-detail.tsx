import type { DocModel } from "../..";
import { sectionId } from "../lib/section-id";
import { FieldsTable } from "./fields-table";
import { ReferenceLink } from "./reference-link";

interface ModelDetailProps {
    model: DocModel;
    modelNames: Set<string>;
    enumNames: Set<string>;
    onNavigate: (id: string) => void;
}

export function ModelDetail({ model, modelNames, enumNames, onNavigate }: ModelDetailProps) {
    return (
        <section
            id={sectionId("model", model.name)}
            data-section
            className="scroll-mt-6 border-b border-border py-10 last:border-b-0"
        >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-mono text-lg font-semibold tracking-tight">{model.name}</h2>
                {model.dbName && (
                    <span className="font-mono text-[11px] text-muted">table: {model.dbName}</span>
                )}
            </div>

            {model.description && (
                <p className="mt-2 max-w-2xl text-[13px] text-muted">{model.description}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-2 text-[12px] text-muted">
                <span>{model.fields.length} fields</span>
                {model.indexes.length > 0 && <span>· {model.indexes.length} indexes</span>}
                {model.referencedBy.length > 0 && (
                    <span>· referenced by {model.referencedBy.length}</span>
                )}
            </div>

            {model.referencedBy.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                    {model.referencedBy.map((ref) => (
                        <ReferenceLink
                            key={`${ref.model}.${ref.field}`}
                            model={ref.model}
                            field={ref.field}
                            onNavigate={onNavigate}
                        />
                    ))}
                </div>
            )}

            {model.indexes.length > 0 && (
                <div className="mt-5">
                    <h3 className="mb-2 text-[12px] font-medium text-muted">Indexes</h3>
                    <div className="space-y-1.5">
                        {model.indexes.map((index) => (
                            <div
                                key={index.name ?? index.fields.join("-")}
                                className="rounded-md border border-border px-3 py-2 font-mono text-[11px]"
                            >
                                {index.name && <span className="text-foreground">{index.name}</span>}
                                {index.name && <span className="text-muted"> · </span>}
                                <span className="text-muted">{index.fields.join(", ")}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="mt-6">
                <h3 className="mb-3 text-[12px] font-medium text-muted">Fields</h3>
                <FieldsTable
                    fields={model.fields}
                    modelName={model.name}
                    modelNames={modelNames}
                    enumNames={enumNames}
                    onNavigate={onNavigate}
                />
            </div>
        </section>
    );
}
