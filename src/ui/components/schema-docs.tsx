"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { OzzyRMDocsOptions, SchemaCatalogGroup } from "../types";
import { findSchemaById } from "../lib/catalog/catalog-utils";
import { sectionId } from "../lib/section-id";
import { findActiveTargetId } from "../lib/scroll-spy";
import { highlightElement, scrollContainerToTarget } from "../lib/scroll-to-target";
import { EnumDetail } from "./enum-detail";
import { GlossaryProvider } from "./glossary-provider";
import { ModelDetail } from "./model-detail";
import { SchemaOverview } from "./schema-overview";
import { Sidebar } from "./ui/sidebar";
import { SourceSidebar } from "./ui/source-sidebar";

export type SchemaDocsProps = OzzyRMDocsOptions;

const SCROLL_LOCK_MS = 900;

export function SchemaDocs({
    catalog,
    defaultSchemaId,
    basePath = "/",
    logoSrc,
}: SchemaDocsProps) {
    const resolvedDefaultId = defaultSchemaId ?? catalog[0]?.versions[0]?.id ?? "";
    const mainRef = useRef<HTMLElement>(null);
    const [activeSchemaId, setActiveSchemaId] = useState(resolvedDefaultId);
    const [activeId, setActiveId] = useState(sectionId("overview"));
    const isScrollingRef = useRef(false);

    useEffect(() => {
        setActiveSchemaId(resolvedDefaultId);
        setActiveId(sectionId("overview"));
    }, [resolvedDefaultId, catalog]);

    const activeSelection = findSchemaById(catalog, activeSchemaId);
    const schema = activeSelection?.version.schema;

    const handleSchemaChange = useCallback((id: string) => {
        setActiveSchemaId(id);
        setActiveId(sectionId("overview"));
        mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
    }, []);

    const scrollToSection = useCallback((id: string) => {
        const container = mainRef.current;
        const target = container?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
        if (!target || !container) {
            return;
        }

        isScrollingRef.current = true;
        setActiveId(id);

        scrollContainerToTarget(container, target);
        highlightElement(target);

        window.setTimeout(() => {
            isScrollingRef.current = false;
        }, SCROLL_LOCK_MS);
    }, []);

    useEffect(() => {
        setActiveId(sectionId("overview"));
        mainRef.current?.scrollTo({ top: 0, behavior: "instant" });
    }, [activeSchemaId]);

    useEffect(() => {
        const container = mainRef.current;
        if (!container || !schema) {
            return;
        }

        let frame = 0;

        const updateActive = () => {
            if (isScrollingRef.current) {
                return;
            }

            const nextId = findActiveTargetId(container);
            if (nextId) {
                setActiveId(nextId);
            }
        };

        const onScroll = () => {
            cancelAnimationFrame(frame);
            frame = requestAnimationFrame(updateActive);
        };

        updateActive();
        container.addEventListener("scroll", onScroll, { passive: true });

        return () => {
            cancelAnimationFrame(frame);
            container.removeEventListener("scroll", onScroll);
        };
    }, [schema]);

    if (!schema || !activeSelection) {
        return (
            <div className="flex h-screen items-center justify-center text-[13px] text-muted">
                No schema loaded. Run <code className="font-mono">ozzyrm generate</code> first.
            </div>
        );
    }

    const modelNames = new Set(schema.models.map((model: { name: string }) => model.name));
    const enumNames = new Set(schema.enums.map((enumDef: { name: string }) => enumDef.name));

    return (
        <GlossaryProvider>
            <div
                className="ozzyrm-root flex h-screen overflow-hidden bg-background text-foreground"
                data-base-path={basePath}
            >
                <SourceSidebar
                    catalog={catalog as SchemaCatalogGroup[]}
                    activeSchemaId={activeSchemaId}
                    onSchemaChange={handleSchemaChange}
                    logoSrc={logoSrc}
                />

                <Sidebar
                    schema={schema}
                    activeId={activeId}
                    onNavigate={scrollToSection}
                />

                <main ref={mainRef} className="flex-1 overflow-y-auto bg-background">
                    <div className="mx-auto max-w-3xl px-8 py-6 pb-24">
                        <SchemaOverview schema={schema} />

                        {schema.models.map((model: (typeof schema.models)[number]) => (
                            <ModelDetail
                                key={model.name}
                                model={model}
                                modelNames={modelNames}
                                enumNames={enumNames}
                                onNavigate={scrollToSection}
                            />
                        ))}

                        {schema.enums.map((enumDef: (typeof schema.enums)[number]) => (
                            <EnumDetail key={enumDef.name} enumDef={enumDef} />
                        ))}
                    </div>
                </main>
            </div>
        </GlossaryProvider>
    );
}
