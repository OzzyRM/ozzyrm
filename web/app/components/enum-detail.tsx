import type { DocEnum } from "@reldoc/core";
import { enumValueSectionId, sectionId } from "@/lib/section-id";

interface EnumDetailProps {
    enumDef: DocEnum;
}

export function EnumDetail({ enumDef }: EnumDetailProps) {
    return (
        <section
            id={sectionId("enum", enumDef.name)}
            data-section
            className="scroll-mt-6 border-b border-border py-10 last:border-b-0"
        >
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-mono text-lg font-semibold tracking-tight">{enumDef.name}</h2>
                {enumDef.dbName && (
                    <span className="font-mono text-[11px] text-muted">db: {enumDef.dbName}</span>
                )}
            </div>

            {enumDef.description && (
                <p className="mt-2 max-w-2xl text-[13px] text-muted">{enumDef.description}</p>
            )}

            <p className="mt-3 text-[12px] text-muted">{enumDef.values.length} values</p>

            <div className="mt-4 overflow-x-auto rounded-md border border-border">
                <table className="min-w-full text-[13px]">
                    <thead>
                        <tr className="border-b border-border bg-code-bg/50">
                            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
                                Name
                            </th>
                            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase tracking-wide text-muted">
                                DB Name
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {enumDef.values.map((value) => (
                            <tr
                                key={value.name}
                                id={enumValueSectionId(enumDef.name, value.name)}
                                data-field
                                className="scroll-mt-20 border-b border-border last:border-b-0 hover:bg-code-bg/30 data-[highlight=true]:bg-accent/10"
                            >
                                <td className="px-3 py-2 font-mono text-[12px]">{value.name}</td>
                                <td className="px-3 py-2 font-mono text-[12px] text-muted">
                                    {value.dbName ?? "—"}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
