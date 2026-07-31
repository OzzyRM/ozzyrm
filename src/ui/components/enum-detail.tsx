import type { DocEnum } from "../..";
import { enumValueSectionId, sectionId } from "../lib/section-id";
import { Badge } from "./ui/badge";

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
            <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold ">{enumDef.name}</h2>
                {enumDef.dbName ? <Badge label={`db: ${enumDef.dbName}`} /> : null}
                {enumDef.source ? (
                    <Badge label={`from: ${enumDef.source.id}`} orm={enumDef.source.orm} />
                ) : null}
                <Badge label={`${enumDef.values.length} values`} />
            </div>

            {enumDef.description && (
                <p className="mt-2 max-w-2xl text-[13px] text-muted">{enumDef.description}</p>
            )}

            <div className="mt-4 overflow-x-auto rounded-md border border-border">
                <table className="min-w-full text-[13px]">
                    <thead>
                        <tr className="border-b border-border bg-code-bg/50">
                            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-muted">
                                Name
                            </th>
                            <th className="px-3 py-2 text-left text-[11px] font-medium uppercase text-muted">
                                DB Name
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {enumDef.values.map((value) => (
                            <tr
                                key={value.name}
                                id={enumValueSectionId(enumDef.name, value.name)}
                                data-nav-target
                                className="border-b border-border transition-colors last:border-b-0 hover:bg-code-bg/30 data-[highlight=true]:bg-black/10"
                            >
                                <td className="px-3 py-2 font-mono text-[12px]">
                                    {value.name}
                                </td>
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
