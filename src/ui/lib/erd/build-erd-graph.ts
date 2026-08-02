import type { DocField, DocModel, DocSchema } from "../../..";
import type { Edge, Node } from "@xyflow/react";
import { MarkerType } from "@xyflow/react";

export const ERD_NODE_WIDTH = 240;
export const ERD_FIELD_ROW_HEIGHT = 22;
export const ERD_NODE_HEADER_HEIGHT = 36;
export const ERD_NODE_PADDING_Y = 8;

export interface ErdFieldRow {
    name: string;
    typeLabel: string;
    isPrimary: boolean;
    isForeign: boolean;
    isOptional: boolean;
}

export interface ErdModelNodeData extends Record<string, unknown> {
    name: string;
    fields: ErdFieldRow[];
    onNavigate?: (sectionId: string) => void;
}

export type ErdModelNode = Node<ErdModelNodeData, "model">;

export function fieldHandleId(fieldName: string): string {
    return `field-${fieldName}`;
}

const CARDINALITY_LABEL: Record<
    NonNullable<DocField["relation"]>["type"],
    string
> = {
    "one-to-one": "1:1",
    "one-to-many": "1:N",
    "many-to-one": "N:1",
    "many-to-many": "N:N",
};

const CARDINALITY_PRIORITY: Record<
    NonNullable<DocField["relation"]>["type"],
    number
> = {
    "many-to-one": 0,
    "one-to-one": 1,
    "many-to-many": 2,
    "one-to-many": 3,
};

function fieldTypeLabel(field: DocField): string {
    if (field.relation) {
        return field.relation.model;
    }
    return field.enumName ?? field.nativeType ?? field.type;
}

function toFieldRows(model: DocModel): ErdFieldRow[] {
    return model.fields.map((field) => ({
        name: field.name,
        typeLabel: fieldTypeLabel(field),
        isPrimary: field.isPrimary,
        isForeign: Boolean(field.relation),
        isOptional: field.isOptional,
    }));
}

export function estimateNodeHeight(fieldCount: number): number {
    return (
        ERD_NODE_HEADER_HEIGHT
        + ERD_NODE_PADDING_Y
        + Math.max(fieldCount, 1) * ERD_FIELD_ROW_HEIGHT
        + ERD_NODE_PADDING_Y
    );
}

interface RelationCandidate {
    source: string;
    target: string;
    sourceField: string;
    targetField: string;
    type: NonNullable<DocField["relation"]>["type"];
    isSelfRef: boolean;
}

function collectRelations(schema: DocSchema): RelationCandidate[] {
    const candidates: RelationCandidate[] = [];

    for (const model of schema.models) {
        for (const field of model.fields) {
            if (!field.relation) {
                continue;
            }

            candidates.push({
                source: model.name,
                target: field.relation.model,
                sourceField: field.name,
                targetField: field.relation.field,
                type: field.relation.type,
                isSelfRef: model.name === field.relation.model,
            });
        }
    }

    return candidates;
}

/**
 * Dedupe to one edge per directed model pair (after PK→FK normalisation).
 * Among multiple FK fields from the same pair, keep the most representative
 * (lowest CARDINALITY_PRIORITY) and collect all cardinality labels for the edge.
 */
function dedupeByModelPair(
    candidates: RelationCandidate[],
    modelsByName: Map<string, DocModel>
): Array<RelationCandidate & { extraLabels: string[] }> {
    // sort so lowest-priority (FK-owning) wins first
    const sorted = [...candidates].sort(
        (a, b) => CARDINALITY_PRIORITY[a.type] - CARDINALITY_PRIORITY[b.type]
    );

    const pairMap = new Map<
        string,
        RelationCandidate & { extraLabels: string[] }
    >();

    for (const c of sorted) {
        const normalized = normalizePkToFk(c, modelsByName);
        const pairKey = `${normalized.source}->${normalized.target}`;

        const existing = pairMap.get(pairKey);
        if (existing) {
            // accumulate distinct labels for the merged edge
            const label = CARDINALITY_LABEL[c.type === "many-to-one" ? "one-to-many" : c.type];
            if (!existing.extraLabels.includes(label)) {
                existing.extraLabels.push(label);
            }
        } else {
            pairMap.set(pairKey, { ...c, extraLabels: [] });
        }
    }

    return [...pairMap.values()];
}

function normalizePkToFk(
    edge: RelationCandidate,
    modelsByName: Map<string, DocModel>
): RelationCandidate {
    if (edge.isSelfRef) {
        return edge;
    }

    if (edge.type === "many-to-one") {
        const pkModel = modelsByName.get(edge.target);
        const pkField =
            pkModel?.fields.find((f) => f.isPrimary)?.name ?? edge.targetField;

        return {
            ...edge,
            source: edge.target,
            target: edge.source,
            sourceField: pkField,
            targetField: edge.sourceField,
            type: "one-to-many",
        };
    }

    if (edge.type === "one-to-many" || edge.type === "one-to-one") {
        const pkModel = modelsByName.get(edge.source);
        const pkField =
            pkModel?.fields.find((f) => f.isPrimary)?.name ?? edge.sourceField;

        return { ...edge, sourceField: pkField };
    }

    return edge;
}

export function buildErdGraph(
    schema: DocSchema,
    options?: { modelFilter?: string[] }
): {
    nodes: ErdModelNode[];
    edges: Edge[];
    /** self-referential edge ids — skip from dagre layout input */
    selfRefEdgeIds: Set<string>;
} {
    const filter = options?.modelFilter?.length
        ? new Set(options.modelFilter)
        : null;

    const models = filter
        ? schema.models.filter((m) => filter.has(m.name))
        : schema.models;

    const modelsByName = new Map(models.map((model) => [model.name, model]));

    const nodes: ErdModelNode[] = models.map((model) => {
        const fields = toFieldRows(model);
        return {
            id: model.name,
            type: "model",
            position: { x: 0, y: 0 },
            data: { name: model.name, fields },
            style: { width: ERD_NODE_WIDTH },
        };
    });

    const relations = collectRelations({ ...schema, models }).filter(
        (r) => !filter || (filter.has(r.source) && filter.has(r.target))
    );

    const deduped = dedupeByModelPair(relations, modelsByName);
    const selfRefEdgeIds = new Set<string>();

    const edges: Edge[] = deduped.map((raw) => {
        const relation = normalizePkToFk(raw, modelsByName);
        const baseLabel =
            raw.type === "many-to-one"
                ? CARDINALITY_LABEL["one-to-many"]
                : CARDINALITY_LABEL[raw.type];

        const allLabels = [baseLabel, ...raw.extraLabels];
        const label = allLabels.join(" / ");

        const id = raw.isSelfRef
            ? `self-${raw.source}.${raw.sourceField}`
            : `${relation.source}.${relation.sourceField}->${relation.target}.${relation.targetField}`;

        if (raw.isSelfRef) {
            selfRefEdgeIds.add(id);
        }

        return {
            id,
            source: raw.isSelfRef ? raw.source : relation.source,
            target: raw.isSelfRef ? raw.target : relation.target,
            label,
            type: "default",
            animated: false,
            markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 10,
                height: 10,
                color: "var(--muted)",
            },
            style: {
                stroke: "var(--muted)",
                strokeWidth: 1.25,
                opacity: raw.isSelfRef ? 0.3 : 0.65,
            },
            labelStyle: {
                fill: "var(--muted)",
                fontSize: 9,
                fontWeight: 500,
            },
            labelBgStyle: { fill: "var(--background)", fillOpacity: 0.92 },
            labelBgPadding: [3, 1] as [number, number],
            labelBgBorderRadius: 2,
            zIndex: 0,
        };
    });

    return { nodes, edges, selfRefEdgeIds };
}
