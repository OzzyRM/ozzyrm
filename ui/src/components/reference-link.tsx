import { ArrowRight } from "lucide-react";
import { fieldSectionId } from "../lib/section-id";

interface ReferenceLinkProps {
    model: string;
    field: string;
    onNavigate: (id: string) => void;
}

export function ReferenceLink({ model, field, onNavigate }: ReferenceLinkProps) {
    return (
        <button
            type="button"
            onClick={() => onNavigate(fieldSectionId(model, field))}
            className="inline-flex items-center gap-1 rounded border border-border bg-code-bg/40 px-2 py-0.5 font-mono text-[11px] text-muted transition-colors hover:border-accent/30 hover:text-accent"
        >
            <ArrowRight className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span>{model}.{field}</span>
        </button>
    );
}
