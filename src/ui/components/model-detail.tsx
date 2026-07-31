import type { DocModel } from "../..";
import { sectionId } from "../lib/section-id";
import { FieldsTable } from "./fields-table";
import { ReferenceLink } from "./reference-link";
import { Badge } from "./ui/badge";

interface ModelDetailProps {
    model: DocModel;
    modelNames: Set<string>;
    enumNames: Set<string>;
    onNavigate: (id: string) => void;
}

export function ModelDetail({ model, modelNames, enumNames, onNavigate }: ModelDetailProps) {
    const tableName = model.dbName ?? model.tableName;

    return (
        <section
            id={sectionId("model", model.name)}
            data-section
            className="scroll-mt-6 py-10"
        >
            <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold capitalize">{model.name}</h2>
                {tableName ? <Badge label={`table: ${tableName}`} /> : null}
                {model.source ? (
                    <Badge label={`from: ${model.source.id}`} orm={model.source.orm} />
                ) : null}
            </div>

            {model.description && (
                <p className="mt-2 max-w-2xl text-[13px] text-muted">{model.description}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="text-muted text-xs underline ">{model.fields.length} fields</span>
                {model.indexes.length > 0 ? (
                    <Badge label={`${model.indexes.length} indexes`} />
                ) : null}
                {model.referencedBy.length > 0 ? (
                    <span className="text-muted text-xs underline ">referenced by {model.referencedBy.length}</span>
                ) : null}
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
