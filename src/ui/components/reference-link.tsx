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
            className="bg-code-bg px-2 py-0.5 rounded-sm inline-flex items-center gap-1 font-mono text-[10px] text-muted transition-colors hover:text-black"
        >
            <ArrowRight className="h-3 w-3 shrink-0" strokeWidth={2} />
            <span className="font-mono">{model}.{field}</span>
        </button>
    );
}
