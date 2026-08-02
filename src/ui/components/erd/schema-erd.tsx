"use client";

import {
    Background,
    Controls,
    MiniMap,
    ReactFlow,
    ReactFlowProvider,
    useEdgesState,
    useNodesState,
    useReactFlow,
    type Edge,
    type NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Download, Maximize2, Play, RotateCcw, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { DocSchema } from "../../..";
import {
    buildErdGraph,
    estimateNodeHeight,
    ERD_NODE_WIDTH,
    type ErdModelNode,
} from "../../lib/erd/build-erd-graph";
import { downloadErdPng } from "../../lib/erd/download-erd";
import { layoutErdGraph, orientEdges } from "../../lib/erd/layout-erd";
import { ModelNode } from "./model-node";
import { MarkerType } from "@xyflow/react";

const nodeTypes: NodeTypes = { model: ModelNode };

const LARGE_THRESHOLD = 10;
const LARGE_ZOOM = 0.45;

export interface ErdHighlight {
    /** model names currently in the active path prefix */
    activeNodes: string[];
    /** undirected pairs currently highlighted */
    activeEdges: Array<{ source: string; target: string }>;
    dimOthers?: boolean;
}

export interface ErdTestAction {
    playing: boolean;
    onToggle: () => void;
}

interface SchemaErdProps {
    schema: DocSchema;
    onNavigate?: (sectionId: string) => void;
    /** when set, only these models appear in the graph */
    modelFilter?: string[];
    highlight?: ErdHighlight;
    title?: string;
    /** optional path-test control rendered in the ERD toolbar */
    testAction?: ErdTestAction;
}

function schemaLayoutKey(schema: DocSchema, modelFilter?: string[]): string {
    return [
        schema.orm,
        schema.version,
        schema.generatedAt,
        modelFilter?.join(",") ?? schema.models.map((m) => m.name).join(","),
    ].join("|");
}

function canvasHeight(modelCount: number): number {
    if (modelCount <= 6) return 400;
    if (modelCount <= 12) return 560;
    return 720;
}

function pairKey(a: string, b: string): string {
    return [a, b].sort().join("<->");
}

function applyHighlight(
    nodes: ErdModelNode[],
    edges: Edge[],
    highlight?: ErdHighlight
): { nodes: ErdModelNode[]; edges: Edge[] } {
    if (!highlight || highlight.activeNodes.length === 0) {
        return {
            nodes: nodes.map((node) => ({
                ...node,
                className: undefined,
                style: {
                    ...node.style,
                    opacity: 1,
                    outline: undefined,
                    outlineOffset: undefined,
                    transition: "opacity 0.45s ease, outline-color 0.45s ease",
                },
                zIndex: 2,
            })),
            edges: edges.map((edge) => ({
                ...edge,
                animated: false,
                style: {
                    ...edge.style,
                    stroke: "var(--muted)",
                    strokeWidth: 1.25,
                    opacity: 0.65,
                    transition: "opacity 0.45s ease, stroke 0.45s ease, stroke-width 0.45s ease",
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 10,
                    height: 10,
                    color: "var(--muted)",
                },
                zIndex: 0,
            })),
        };
    }

    const activeNodes = new Set(highlight.activeNodes);
    const activeEdges = new Set(
        highlight.activeEdges.map((e) => pairKey(e.source, e.target))
    );
    const dim = highlight.dimOthers !== false;

    return {
        nodes: nodes.map((node) => {
            const active = activeNodes.has(node.id);
            return {
                ...node,
                className: active ? "erd-node--active" : dim ? "erd-node--dim" : undefined,
                style: {
                    ...node.style,
                    opacity: active ? 1 : dim ? 0.22 : 1,
                    outline: active ? "2px solid #111" : undefined,
                    outlineOffset: active ? 2 : undefined,
                    transition: "opacity 0.45s ease, outline-color 0.45s ease",
                },
                zIndex: active ? 4 : 2,
            };
        }),
        edges: edges.map((edge) => {
            const active = activeEdges.has(pairKey(edge.source, edge.target));
            return {
                ...edge,
                animated: active,
                style: {
                    ...edge.style,
                    stroke: active ? "#111" : "var(--muted)",
                    strokeWidth: active ? 2.25 : 1.25,
                    opacity: active ? 1 : dim ? 0.12 : 0.65,
                    transition: "opacity 0.45s ease, stroke 0.45s ease, stroke-width 0.45s ease",
                },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    width: 10,
                    height: 10,
                    color: active ? "#111" : "var(--muted)",
                },
                zIndex: active ? 3 : 0,
            };
        }),
    };
}

function buildLaidOutGraph(
    schema: DocSchema,
    onNavigate?: (sectionId: string) => void,
    modelFilter?: string[]
): { nodes: ErdModelNode[]; edges: Edge[] } {
    const { nodes, edges, selfRefEdgeIds } = buildErdGraph(schema, { modelFilter });

    const withNavigate = nodes.map((node) => ({
        ...node,
        data: { ...node.data, onNavigate },
    }));

    const laidOut = layoutErdGraph(withNavigate, edges, selfRefEdgeIds);

    const sized = laidOut.map((node) => {
        const height = estimateNodeHeight(node.data.fields.length);
        return {
            ...node,
            width: ERD_NODE_WIDTH,
            height,
            style: { ...node.style, width: ERD_NODE_WIDTH, height },
            zIndex: 2,
        };
    });

    return {
        nodes: sized,
        edges: orientEdges(sized, edges),
    };
}

function freshNodes(nodes: ErdModelNode[]): ErdModelNode[] {
    return nodes.map((n) => ({
        ...n,
        position: { ...n.position },
        selected: false,
        dragging: false,
    }));
}

function SchemaErdCanvas({
    schema,
    onNavigate,
    modelFilter,
    highlight,
    title = "Entity relationship",
    testAction,
}: SchemaErdProps) {
    const layoutKey = schemaLayoutKey(schema, modelFilter);
    const [baseNodes, setBaseNodes] = useState<ErdModelNode[]>([]);
    const [baseEdges, setBaseEdges] = useState<Edge[]>([]);
    const [nodes, setNodes, onNodesChange] = useNodesState<ErdModelNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [downloading, setDownloading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { fitView, setViewport } = useReactFlow();

    const modelCount = modelFilter?.length ?? schema.models.length;
    const isLarge = modelCount >= LARGE_THRESHOLD;

    const scheduleView = useCallback(() => {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            if (isLarge) {
                setViewport({ x: 10, y: 10, zoom: LARGE_ZOOM });
            } else {
                fitView({ padding: 0.15, duration: 0, minZoom: 0.1, maxZoom: 1.5 });
            }
            timerRef.current = null;
        }, 100);
    }, [fitView, setViewport, isLarge]);

    const applyLayout = useCallback(() => {
        const next = buildLaidOutGraph(schema, onNavigate, modelFilter);
        setBaseNodes(freshNodes(next.nodes));
        setBaseEdges(next.edges.map((e) => ({ ...e })));
        scheduleView();
    }, [schema, onNavigate, modelFilter, scheduleView]);

    useEffect(() => {
        applyLayout();
        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [layoutKey]);

    useEffect(() => {
        const next = applyHighlight(baseNodes, baseEdges, highlight);
        setNodes(next.nodes);
        setEdges(next.edges);
    }, [baseNodes, baseEdges, highlight, setNodes, setEdges]);

    const onInit = useCallback(() => scheduleView(), [scheduleView]);

    const onFit = useCallback(() => {
        fitView({ padding: 0.08, duration: 200, minZoom: 0.04, maxZoom: 1.5 });
    }, [fitView]);

    const onDownload = useCallback(async () => {
        const viewport = wrapperRef.current?.querySelector(
            ".react-flow__viewport"
        ) as HTMLElement | null;
        if (!viewport) return;
        setDownloading(true);
        try {
            await downloadErdPng(viewport, `${schema.orm}-schema-erd.png`);
        } finally {
            setDownloading(false);
        }
    }, [schema.orm]);

    const height = canvasHeight(modelCount);

    return (
        <div className="erd-shell mt-6" ref={wrapperRef}>
            <div className="erd-toolbar">
                <span className="erd-toolbar__title">{title}</span>
                <div className="erd-toolbar__actions">
                    <button
                        type="button"
                        className="erd-toolbar__btn"
                        onClick={onFit}
                        title="Fit view"
                    >
                        <Maximize2 aria-hidden className="erd-toolbar__icon" />
                        <span>Fit</span>
                    </button>
                    <button
                        type="button"
                        className="erd-toolbar__btn"
                        onClick={applyLayout}
                        title="Reset layout"
                    >
                        <RotateCcw aria-hidden className="erd-toolbar__icon" />
                        <span>Reset</span>
                    </button>
                    <button
                        type="button"
                        className="erd-toolbar__btn"
                        onClick={onDownload}
                        disabled={downloading}
                        title="Download PNG"
                    >
                        <Download aria-hidden className="erd-toolbar__icon" />
                        <span>{downloading ? "Saving…" : "Download"}</span>
                    </button>
                </div>
            </div>

            <div className="erd-canvas" style={{ height }}>
                {testAction ? (
                    <div className="erd-canvas__overlay">
                        <button
                            type="button"
                            className="erd-toolbar__btn"
                            onClick={testAction.onToggle}
                            title={testAction.playing ? "Stop path test" : "Test path"}
                        >
                            {testAction.playing ? (
                                <Square aria-hidden className="erd-toolbar__icon" />
                            ) : (
                                <Play aria-hidden className="erd-toolbar__icon" />
                            )}
                            <span>{testAction.playing ? "Stop" : "Test"}</span>
                        </button>
                    </div>
                ) : null}
                <ReactFlow
                    nodes={nodes}
                    edges={edges}
                    onNodesChange={onNodesChange}
                    onEdgesChange={onEdgesChange}
                    onInit={onInit}
                    nodeTypes={nodeTypes}
                    nodesDraggable
                    nodesConnectable={false}
                    elementsSelectable
                    panOnScroll
                    zoomOnScroll
                    minZoom={0.04}
                    maxZoom={2}
                    proOptions={{ hideAttribution: true }}
                    defaultEdgeOptions={{ type: "default" }}
                >
                    <Background gap={20} size={1} color="var(--border)" />
                    <Controls showInteractive={false} />
                    <MiniMap
                        pannable
                        zoomable
                        className="erd-minimap"
                        maskColor="rgba(0,0,0,0.06)"
                        style={{ width: 96, height: 64 }}
                    />
                </ReactFlow>
            </div>
        </div>
    );
}

export function SchemaErd(props: SchemaErdProps) {
    const count = props.modelFilter?.length ?? props.schema.models.length;
    if (count === 0) return null;

    return (
        <ReactFlowProvider>
            <SchemaErdCanvas {...props} />
        </ReactFlowProvider>
    );
}
