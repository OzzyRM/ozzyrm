import type { ReactNode } from "react";
import type { SupportedORMs } from "../../..";
import type { GlossaryCategory } from "../../lib/glossary/entries";
import { hasGlossaryEntry } from "../../lib/glossary/lookup";
import { OrmIcon } from "./orm-icon";

interface BadgeProps {
    label?: string;
    /** when set, shows brand icon instead of text like "(prisma)" */
    orm?: SupportedORMs;
    variant?: "default" | "type" | "constraint" | "model" | "nobg";
    onClick?: () => void;
    glossaryCategory?: GlossaryCategory;
    onGlossaryClick?: (label: string, category: GlossaryCategory) => void;
    children?: ReactNode;
}

const VARIANTS: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "border-border bg-code-bg text-muted",
    type: "border-black/20 bg-black/5 text-black font-mono",
    model: "border-black/30 bg-black/10 text-black",
    constraint: "border-border bg-background text-muted",
    nobg: "bg-transparent hover:bg-transparent hover:underline text-muted",
};

export function Badge({
    label,
    orm,
    variant = "default",
    onClick,
    glossaryCategory,
    onGlossaryClick,
    children,
}: BadgeProps) {
    const glossaryLabel = label ?? "";
    const hasGlossary = Boolean(
        glossaryCategory
        && onGlossaryClick
        && glossaryLabel
        && hasGlossaryEntry(glossaryLabel, glossaryCategory)
    );
    const interactive = Boolean(onClick || hasGlossary);

    const className = [
        "inline-flex items-center gap-1 rounded px-1.5 py-px text-[11px] leading-4 transition-colors",
        VARIANTS[variant],
        interactive
            ? "cursor-pointer hover:border-black/40 hover:bg-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/30"
            : "",
    ].join(" ");

    const content = (
        <>
            {label ? <span>{label}</span> : null}
            {orm ? <OrmIcon orm={orm} /> : null}
            {children}
        </>
    );

    const ariaLabel = [label, orm].filter(Boolean).join(" · ") || undefined;

    if (onClick) {
        return (
            <button
                type="button"
                onClick={onClick}
                className={className}
                aria-label={ariaLabel ? `Go to ${ariaLabel}` : undefined}
            >
                {content}
            </button>
        );
    }

    if (hasGlossary && glossaryCategory && onGlossaryClick) {
        return (
            <button
                type="button"
                onClick={() => onGlossaryClick(glossaryLabel, glossaryCategory)}
                className={className}
                aria-label={`Learn about ${glossaryLabel}`}
            >
                {content}
            </button>
        );
    }

    return (
        <span className={className} title={ariaLabel}>
            {content}
        </span>
    );
}
