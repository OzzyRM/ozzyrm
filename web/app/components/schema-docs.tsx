"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { DocSchema } from "@reldoc/core";
import { sectionId } from "@/lib/section-id";
import { EnumDetail } from "./enum-detail";
import { ModelDetail } from "./model-detail";
import { SchemaOverview } from "./schema-overview";
import { Sidebar } from "./ui/sidebar";

interface SchemaDocsProps {
    schema: DocSchema;
}

export function SchemaDocs({ schema }: SchemaDocsProps) {
    const mainRef = useRef<HTMLElement>(null);
    const [activeId, setActiveId] = useState(sectionId("overview"));
    const isScrollingRef = useRef(false);

    const scrollToSection = useCallback((id: string) => {
        const container = mainRef.current;
        const target = container?.querySelector<HTMLElement>(`#${CSS.escape(id)}`);
        if (!target || !container) {
            return;
        }

        isScrollingRef.current = true;
        setActiveId(id);

        container.scrollTo({
            top: target.offsetTop - 16,
            behavior: "smooth",
        });

        window.setTimeout(() => {
            isScrollingRef.current = false;
        }, 600);
    }, []);

    useEffect(() => {
        const container = mainRef.current;
        if (!container) {
            return;
        }

        const sections = container.querySelectorAll<HTMLElement>("[data-section]");
        if (sections.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (isScrollingRef.current) {
                    return;
                }

                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

                const top = visible[0];
                if (top?.target.id) {
                    setActiveId(top.target.id);
                }
            },
            {
                root: container,
                rootMargin: "-10% 0px -70% 0px",
                threshold: [0, 0.25, 0.5],
            }
        );

        sections.forEach((section) => observer.observe(section));
        return () => observer.disconnect();
    }, [schema]);

    return (
        <div className="flex h-screen overflow-hidden bg-background text-foreground">
            <Sidebar schema={schema} activeId={activeId} onNavigate={scrollToSection} />

            <main ref={mainRef} className="flex-1 overflow-y-auto">
                <div className="mx-auto max-w-3xl px-8 py-6 pb-24">
                    <SchemaOverview schema={schema} />

                    {schema.models.map((model) => (
                        <ModelDetail key={model.name} model={model} />
                    ))}

                    {schema.enums.map((enumDef) => (
                        <EnumDetail key={enumDef.name} enumDef={enumDef} />
                    ))}
                </div>
            </main>
        </div>
    );
}
