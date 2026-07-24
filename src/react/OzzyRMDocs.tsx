"use client";

import { useEffect, useRef } from "react";
import {
    mount,
    type OzzyRMDocsOptions,
    type OzzyRMMountHandle,
    type SchemaCatalogGroup,
} from "../ui";

export interface OzzyRMDocsProps {
    catalog: SchemaCatalogGroup[];
    basePath?: string;
    defaultSchemaId?: string;
    logoSrc?: string;
    className?: string;
}

/**
 * Thin React wrapper (SwaggerUI-react style).
 * All UI logic lives in ozzyrm/ui mount() this only manages the host DOM node.
 *
 * Fast Refresh / prop changes:
 * - cleanup unmounts the previous root before remounting
 * - catalog identity changes (Next module graph) re-trigger the effect
 */
export function OzzyRMDocs({
    catalog,
    basePath = "/",
    defaultSchemaId,
    logoSrc,
    className,
}: OzzyRMDocsProps) {
    const hostRef = useRef<HTMLDivElement>(null);
    const handleRef = useRef<OzzyRMMountHandle | null>(null);

    useEffect(() => {
        const host = hostRef.current;
        if (!host) {
            return;
        }

        handleRef.current?.unmount();
        handleRef.current = null;
        host.replaceChildren();

        const options: OzzyRMDocsOptions = {
            catalog,
            basePath,
            defaultSchemaId,
            logoSrc,
        };

        handleRef.current = mount(host, options);

        return () => {
            handleRef.current?.unmount();
            handleRef.current = null;
            host.replaceChildren();
        };
    }, [catalog, basePath, defaultSchemaId, logoSrc]);

    return (
        <div
            ref={hostRef}
            className={className}
            data-ozzyrm-docs=""
            data-base-path={basePath}
            style={{ height: "100%", minHeight: "100vh" }}
        />
    );
}
