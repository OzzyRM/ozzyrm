import type { GlossaryCategory } from "../../lib/glossary/entries";
import { hasGlossaryEntry } from "../../lib/glossary/lookup";

interface BadgeProps {
    label: string;
    variant?: "default" | "type" | "constraint" | "model" | "nobg";
    onClick?: () => void;
    glossaryCategory?: GlossaryCategory;
    onGlossaryClick?: (label: string, category: GlossaryCategory) => void;
}

const VARIANTS: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "border-border bg-code-bg text-muted",
    type: "border-black/20 bg-black/5 text-black font-mono",
    model: "border-black/30 bg-black/10 text-black",
    constraint: "border-border bg-background text-muted",
    nobg: "bg-transparent hover:bg-transparent hover:underline text-muted"
};

export function Badge({
    label,
    variant = "default",
    onClick,
    glossaryCategory,
    onGlossaryClick,
}: BadgeProps) {
    const hasGlossary = Boolean(
        glossaryCategory
        && onGlossaryClick
        && hasGlossaryEntry(label, glossaryCategory)
    );
    const interactive = Boolean(onClick || hasGlossary);

    const className = [
        "inline-flex items-center rounded px-1.5 py-px text-[11px] leading-4 transition-colors",
        VARIANTS[variant],
        interactive
            ? "cursor-pointer hover:border-black/40 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
            : "",
    ].join(" ");

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={className}
                aria-label={`Go to ${label}`}
            >
                {label}
            </button>
        );
    }

    if (hasGlossary && glossaryCategory && onGlossaryClick) {
        return (
            <button
                type="button"
                onClick={() => onGlossaryClick(label, glossaryCategory)}
                className={className}
                aria-label={`Learn about ${label}`}
            >
                {label}
            </button>
        );
    }

    return <span className={className}>{label}</span>;
}
