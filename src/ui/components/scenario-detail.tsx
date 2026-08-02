"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DocSchema, DocScenario } from "../..";
import { sectionId } from "../lib/section-id";
import { Badge } from "./ui/badge";
import { SchemaErd, type ErdHighlight } from "./erd/schema-erd";

interface ScenarioDetailProps {
    scenario: DocScenario;
    schema: DocSchema;
    onNavigate?: (sectionId: string) => void;
}

const STEP_MS = 1200;

export function ScenarioDetail({
    scenario,
    schema,
    onNavigate,
}: ScenarioDetailProps) {
    const id = sectionId("scenario", scenario.id);
    const canTest = scenario.path.length >= 2;
    const [step, setStep] = useState(0);
    const [testing, setTesting] = useState(false);
    const [playing, setPlaying] = useState(false);
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const stopPlay = useCallback(() => {
        if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
        }
        setPlaying(false);
    }, []);

    useEffect(() => () => stopPlay(), [stopPlay]);

    useEffect(() => {
        stopPlay();
        setStep(0);
        setTesting(false);
    }, [scenario.id, stopPlay]);

    const highlight = useMemo((): ErdHighlight | undefined => {
        if (!canTest || !testing) return undefined;

        const activeNodes = scenario.path.slice(0, step + 1);
        const activeEdges = scenario.pathEdges.filter((edge) => {
            const si = scenario.path.indexOf(edge.source);
            const ti = scenario.path.indexOf(edge.target);
            if (si < 0 || ti < 0) return false;
            return Math.max(si, ti) <= step;
        });

        return {
            activeNodes,
            activeEdges,
            dimOthers: true,
        };
    }, [canTest, testing, scenario.path, scenario.pathEdges, step]);

    const onToggleTest = useCallback(() => {
        if (playing) {
            stopPlay();
            setTesting(false);
            setStep(0);
            return;
        }

        setTesting(true);
        setPlaying(true);
        setStep(0);
        let current = 0;
        timerRef.current = setInterval(() => {
            current += 1;
            if (current >= scenario.path.length) {
                stopPlay();
                // leave final highlight visible briefly, then clear
                window.setTimeout(() => {
                    setTesting(false);
                    setStep(0);
                }, STEP_MS);
                return;
            }
            setStep(current);
        }, STEP_MS);
    }, [playing, scenario.path.length, stopPlay]);

    return (
        <section id={id} data-section className="scroll-mt-6 py-10">
            <div className="mx-auto max-w-3xl">
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                    {scenario.label}
                </h2>
                {scenario.description ? (
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">
                        {scenario.description}
                    </p>
                ) : null}

                <div className="mt-4 flex flex-wrap gap-1.5">
                    {scenario.models.map((name) => (
                        <Badge
                            key={`m-${name}`}
                            label={name}
                            variant="model"
                            onClick={() => onNavigate?.(sectionId("model", name))}
                        />
                    ))}
                    {scenario.enums.map((name) => (
                        <Badge
                            key={`e-${name}`}
                            label={name}
                            variant="type"
                            onClick={() => onNavigate?.(sectionId("enum", name))}
                        />
                    ))}
                </div>

                <SchemaErd
                    schema={schema}
                    onNavigate={onNavigate}
                    modelFilter={scenario.models}
                    highlight={highlight}
                    title="Scenario flow"
                    testAction={
                        canTest
                            ? {
                                  playing,
                                  onToggle: onToggleTest,
                              }
                            : undefined
                    }
                />
            </div>
        </section>
    );
}
