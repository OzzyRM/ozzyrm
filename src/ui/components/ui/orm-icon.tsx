import {
    Database,
    DrizzleOrm,
    Layers,
    PrismaOrm,
} from "@boxicons/react";
import type { SupportedORMs } from "../../..";

type OrmKind = SupportedORMs;

interface OrmIconProps {
    orm: OrmKind;
    className?: string;
}

/** Compact brand marks for schema source badges (Boxicons) */
export function OrmIcon({ orm, className = "h-3 w-3 shrink-0" }: OrmIconProps) {
    if (orm === "prisma") {
        return <PrismaOrm className={className} aria-hidden />;
    }

    if (orm === "drizzle") {
        return <DrizzleOrm className={className} aria-hidden />;
    }

    if (orm === "sql") {
        return <Database className={className} aria-hidden />;
    }

    return <Layers className={className} aria-hidden />;
}
