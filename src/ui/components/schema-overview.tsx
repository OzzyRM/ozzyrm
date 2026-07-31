import type { DocSchema } from "../..";
import { sectionId } from "../lib/section-id";
import { Badge } from "./ui/badge";

interface SchemaOverviewProps {
    schema: DocSchema;
}

export function SchemaOverview({ schema }: SchemaOverviewProps) {
    const isUnified = schema.orm === "unified";
    const mergedFrom = schema.sources ?? [];
    const generatedLabel = new Date(schema.generatedAt).toLocaleString();

    return (
        <section
            id={sectionId("overview")}
            data-section
            className="scroll-mt-6 pt-10 pb-10"
        >
            <div className="flex flex-wrap items-center gap-1.5">
                <Badge orm={schema.orm} label={schema.orm === "unified" ? "unified" : undefined} />
                <Badge label={schema.version} />
                <Badge label={`${schema.models.length} models`} />
                <Badge label={`${schema.enums.length} enums`} />
                <Badge label={generatedLabel} />
                {schema.dataSource?.provider ? (
                    <Badge label={schema.dataSource.provider} />
                ) : null}
            </div>

            <h1 className="mt-3 text-3xl font-semibold">
                {isUnified ? "Unified schema" : "Schema"}
            </h1>

            <p className="mt-2 max-w-2xl text-[13px] text-muted">
                {isUnified ? (
                    <>
                        Documentation generated from a merged graph
                        {mergedFrom.length > 0 ? " across multiple sources" : ""}.
                        Scroll to explore models and enums, or use the sidebar to jump to a section.
                    </>
                ) : (
                    <>
                        Documentation generated from your {schema.orm} schema.
                        Scroll to explore models and enums, or use the sidebar to jump to a section.
                    </>
                )}
            </p>

            {isUnified && mergedFrom.length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-1.5">
                    {mergedFrom.map((source) => (
                        <Badge
                            key={source.id}
                            label={source.id}
                            orm={source.orm}
                        />
                    ))}
                </div>
            ) : null}
        </section>
    );
}
