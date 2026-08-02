"use client";

import { Handle, Position, type NodeProps } from "@xyflow/react";
import type { ErdModelNodeData } from "../../lib/erd/build-erd-graph";
import { sectionId } from "../../lib/section-id";

/** four sides × source/target so edges can attach from any direction */
export function ModelNode({ data }: NodeProps & { data: ErdModelNodeData }) {
    const goToModel = () => {
        data.onNavigate?.(sectionId("model", data.name));
    };

    return (
        <div className="erd-model-node">
            <Handle id="l-t" type="target" position={Position.Left} className="erd-handle" />
            <Handle id="l-s" type="source" position={Position.Left} className="erd-handle erd-handle--ghost" />
            <Handle id="r-s" type="source" position={Position.Right} className="erd-handle" />
            <Handle id="r-t" type="target" position={Position.Right} className="erd-handle erd-handle--ghost" />
            <Handle id="t-t" type="target" position={Position.Top} className="erd-handle" />
            <Handle id="t-s" type="source" position={Position.Top} className="erd-handle erd-handle--ghost" />
            <Handle id="b-s" type="source" position={Position.Bottom} className="erd-handle" />
            <Handle id="b-t" type="target" position={Position.Bottom} className="erd-handle erd-handle--ghost" />

            <button
                type="button"
                className="erd-model-node__header nodrag nopan"
                onClick={goToModel}
                title={`Go to ${data.name}`}
            >
                {data.name}
            </button>

            <ul className="erd-model-node__fields">
                {data.fields.length === 0 ? (
                    <li className="erd-model-node__field erd-model-node__field--empty">
                        No fields
                    </li>
                ) : (
                    data.fields.map((field) => (
                        <li key={field.name} className="erd-model-node__field">
                            <span className="erd-model-node__field-name">
                                {field.isPrimary ? (
                                    <span className="erd-model-node__key" title="Primary key">
                                        PK
                                    </span>
                                ) : null}
                                {field.isForeign ? (
                                    <span className="erd-model-node__key" title="Foreign / relation">
                                        FK
                                    </span>
                                ) : null}
                                <span className={field.isOptional ? "text-muted" : undefined}>
                                    {field.name}
                                    {field.isOptional ? "?" : ""}
                                </span>
                            </span>
                            <span className="erd-model-node__field-type">
                                {field.typeLabel}
                            </span>
                        </li>
                    ))
                )}
            </ul>
        </div>
    );
}
