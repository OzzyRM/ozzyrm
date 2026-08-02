import { Graph, layout } from "@dagrejs/dagre";
import type { Edge } from "@xyflow/react";
import { Position } from "@xyflow/react";
import {
    ERD_NODE_WIDTH,
    estimateNodeHeight,
    type ErdModelNode,
} from "./build-erd-graph";

/** vertical gap between nodes in the same rank — tall is fine for readability */
const NODE_SEP = 160;
/** horizontal gap between ranks (left → right) */
const RANK_SEP = 320;
const MARGIN = 60;

/** Push nodes in the same rank so they never overlap vertically. */
function enforceVerticalGaps(
    nodes: ErdModelNode[],
    positions: Map<string, { x: number; y: number }>
): void {
    const ranks = new Map<number, string[]>();
    for (const [id, pos] of positions) {
        const key = Math.round(pos.x / 20) * 20;
        const list = ranks.get(key) ?? [];
        list.push(id);
        ranks.set(key, list);
    }

    for (const ids of ranks.values()) {
        ids.sort((a, b) => positions.get(a)!.y - positions.get(b)!.y);

        for (let i = 1; i < ids.length; i++) {
            const prev = ids[i - 1];
            const cur = ids[i];
            const prevNode = nodes.find((n) => n.id === prev);
            const prevH = estimateNodeHeight(prevNode?.data.fields.length ?? 1);
            const prevPos = positions.get(prev)!;
            const curPos = positions.get(cur)!;
            const minY = prevPos.y + prevH + NODE_SEP;
            if (curPos.y < minY) {
                positions.set(cur, { x: curPos.x, y: minY });
            }
        }
    }
}

/**
 * Stretch rank x-positions to a fixed RANK_SEP so columns never sit too close.
 */
function stretchRanks(
    positions: Map<string, { x: number; y: number }>
): void {
    const xs = [
        ...new Set(
            [...positions.values()].map((p) => Math.round(p.x / 10) * 10)
        ),
    ].sort((a, b) => a - b);

    if (xs.length <= 1) return;

    const xMap = new Map<number, number>();
    let cursor = MARGIN;
    for (const x of xs) {
        xMap.set(x, cursor);
        cursor += ERD_NODE_WIDTH + RANK_SEP;
    }

    for (const [id, pos] of positions) {
        const key = Math.round(pos.x / 10) * 10;
        const nx = xMap.get(key);
        if (nx !== undefined) {
            positions.set(id, { x: nx, y: pos.y });
        }
    }
}

/**
 * Pick handles so the line always leaves the facing side of each node.
 */
export function orientEdges(nodes: ErdModelNode[], edges: Edge[]): Edge[] {
    const pos = new Map(nodes.map((n) => [n.id, n.position]));
    const height = new Map(
        nodes.map((n) => [n.id, estimateNodeHeight(n.data.fields.length)])
    );

    return edges.map((edge) => {
        const s = pos.get(edge.source);
        const t = pos.get(edge.target);
        if (!s || !t) return edge;

        const sH = height.get(edge.source) ?? 100;
        const tH = height.get(edge.target) ?? 100;
        const sCx = s.x + ERD_NODE_WIDTH / 2;
        const tCx = t.x + ERD_NODE_WIDTH / 2;
        const sCy = s.y + sH / 2;
        const tCy = t.y + tH / 2;
        const dx = tCx - sCx;
        const dy = tCy - sCy;

        if (Math.abs(dx) >= Math.abs(dy) * 0.35) {
            if (dx >= 0) {
                return {
                    ...edge,
                    sourceHandle: "r-s",
                    targetHandle: "l-t",
                    sourcePosition: Position.Right,
                    targetPosition: Position.Left,
                };
            }
            return {
                ...edge,
                sourceHandle: "l-s",
                targetHandle: "r-t",
                sourcePosition: Position.Left,
                targetPosition: Position.Right,
            };
        }

        if (dy >= 0) {
            return {
                ...edge,
                sourceHandle: "b-s",
                targetHandle: "t-t",
                sourcePosition: Position.Bottom,
                targetPosition: Position.Top,
            };
        }
        return {
            ...edge,
            sourceHandle: "t-s",
            targetHandle: "b-t",
            sourcePosition: Position.Top,
            targetPosition: Position.Bottom,
        };
    });
}

export function layoutErdGraph(
    nodes: ErdModelNode[],
    edges: Edge[],
    selfRefEdgeIds?: Set<string>
): ErdModelNode[] {
    const layoutEdges = edges.filter((e) => !selfRefEdgeIds?.has(e.id));

    const touchedIds = new Set<string>();
    for (const e of layoutEdges) {
        touchedIds.add(e.source);
        touchedIds.add(e.target);
    }

    const connectedNodes = nodes.filter((n) => touchedIds.has(n.id));
    const isolatedNodes = nodes.filter((n) => !touchedIds.has(n.id));
    const positioned = new Map<string, { x: number; y: number }>();

    if (connectedNodes.length > 0) {
        const graph = new Graph({ compound: false, multigraph: false });
        graph.setDefaultEdgeLabel(() => ({}));
        graph.setGraph({
            rankdir: "LR",
            nodesep: NODE_SEP,
            ranksep: RANK_SEP,
            marginx: MARGIN,
            marginy: MARGIN,
            acyclicer: "greedy",
            ranker: "network-simplex",
        });

        for (const node of connectedNodes) {
            const h = estimateNodeHeight(node.data.fields.length);
            graph.setNode(node.id, { width: ERD_NODE_WIDTH, height: h });
        }

        // all edges → proper multi-rank left-to-right layering
        for (const e of layoutEdges) {
            if (
                graph.hasNode(e.source) &&
                graph.hasNode(e.target) &&
                !graph.hasEdge(e.source, e.target)
            ) {
                graph.setEdge(e.source, e.target, {});
            }
        }

        layout(graph);

        for (const node of connectedNodes) {
            const laid = graph.node(node.id);
            if (!laid) continue;
            const w = laid.width ?? ERD_NODE_WIDTH;
            const h = laid.height ?? estimateNodeHeight(node.data.fields.length);
            positioned.set(node.id, {
                x: laid.x - w / 2,
                y: laid.y - h / 2,
            });
        }

        stretchRanks(positioned);
        enforceVerticalGaps(connectedNodes, positioned);
    }

    if (isolatedNodes.length > 0) {
        let bottomY = MARGIN;
        for (const node of connectedNodes) {
            const pos = positioned.get(node.id);
            if (!pos) continue;
            bottomY = Math.max(
                bottomY,
                pos.y + estimateNodeHeight(node.data.fields.length)
            );
        }

        const startY = bottomY + NODE_SEP * 2;
        const cols = 3;
        const gapX = ERD_NODE_WIDTH + RANK_SEP;

        isolatedNodes.forEach((node, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const h = estimateNodeHeight(node.data.fields.length);
            positioned.set(node.id, {
                x: MARGIN + col * gapX,
                y: startY + row * (h + NODE_SEP),
            });
        });
    }

    return nodes.map((node) => {
        const pos = positioned.get(node.id);
        return pos
            ? {
                  ...node,
                  position: pos,
                  style: { ...node.style, width: ERD_NODE_WIDTH },
                  zIndex: 2,
              }
            : node;
    });
}
