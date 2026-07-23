interface BadgeProps {
    label: string;
    variant?: "default" | "type" | "constraint";
}

const VARIANTS: Record<NonNullable<BadgeProps["variant"]>, string> = {
    default: "border-border bg-code-bg text-muted",
    type: "border-accent/20 bg-accent/5 text-accent font-mono",
    constraint: "border-border bg-background text-muted",
};

export function Badge({ label, variant = "default" }: BadgeProps) {
    return (
        <span
            className={`inline-flex items-center rounded border px-1.5 py-px text-[11px] leading-4 ${VARIANTS[variant]}`}
        >
            {label}
        </span>
    );
}
