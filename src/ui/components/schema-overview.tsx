import type { DocSchema } from "../..";
import { sectionId } from "../lib/section-id";

interface SchemaOverviewProps {
    schema: DocSchema;
}

export function SchemaOverview({ schema }: SchemaOverviewProps) {
    return (
        <section
            id={sectionId("overview")}
            data-section
            className="scroll-mt-6 border-b border-border pb-10"
        >
            <h1 className="text-xl font-semibold tracking-tight">Schema</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-muted">
                Documentation generated from your{" "}
                <span className="font-mono text-[12px] text-foreground">{schema.orm}</span>{" "}
                schema. Scroll to explore models and enums, or use the sidebar to jump to a section.
            </p>

            <dl className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <MetaItem label="ORM" value={schema.orm} mono />
                <MetaItem label="Version" value={schema.version} mono />
                <MetaItem label="Models" value={String(schema.models.length)} />
                <MetaItem label="Enums" value={String(schema.enums.length)} />
            </dl>

            <div className="mt-5 rounded-md border border-border bg-code-bg/40 px-3 py-2.5">
                <p className="text-[11px] font-medium uppercase tracking-wide text-muted">Generated</p>
                <p className="mt-1 font-mono text-[12px]">
                    {new Date(schema.generatedAt).toLocaleString()}
                </p>
                {schema.dataSource?.provider && (
                    <p className="mt-2 font-mono text-[12px] text-muted">
                        provider: {schema.dataSource.provider}
                    </p>
                )}
            </div>
        </section>
    );
}

function MetaItem({
    label,
    value,
    mono,
}: {
    label: string;
    value: string;
    mono?: boolean;
}) {
    return (
        <div className="rounded-md border border-border px-3 py-2">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</dt>
            <dd className={`mt-1 text-[13px] ${mono ? "font-mono text-[12px]" : ""}`}>{value}</dd>
        </div>
    );
}
