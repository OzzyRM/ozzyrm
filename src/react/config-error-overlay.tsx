"use client";

import { Check, Copy } from "lucide-react";
import { useCallback, useState } from "react";

export interface ConfigErrorDiagnostic {
    code: string;
    message: string;
    sourceId?: string;
    path?: string[];
}

export interface ConfigErrorOverlayProps {
    message: string;
    diagnostics?: ConfigErrorDiagnostic[];
    /** optional playground conflict scenario label */
    scenario?: string;
}

const font =
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
const mono =
    'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace';

/**
 * Next.js-style error popup for ozzyrm config / schema validation failures.
 * Fixed overlay, selectable message, icon copy control.
 */
export function ConfigErrorOverlay({
    message,
    diagnostics = [],
    scenario,
}: ConfigErrorOverlayProps) {
    const [copied, setCopied] = useState(false);

    const copy = useCallback(async () => {
        try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
        } catch {
            // selection still works
        }
    }, [message]);

    const primary =
        diagnostics[0]?.message ??
        (diagnostics.length > 1
            ? `Validation failed with ${diagnostics.length} issues`
            : "Validation failed");

    const countLabel =
        diagnostics.length > 1
            ? `${diagnostics.length} issues`
            : diagnostics.length === 1
              ? "1 issue"
              : null;

    return (
        <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="ozzyrm-error-title"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 9999,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 20,
                background: "rgba(0, 0, 0, 0.4)",
                fontFamily: font,
                color: "#000",
            }}
        >
            <div
                style={{
                    position: "relative",
                    width: "100%",
                    maxWidth: 640,
                    maxHeight: "min(78vh, 640px)",
                    overflow: "auto",
                    background: "#fff",
                    borderRadius: 6,
                    boxShadow:
                        "0 0 0 1px rgba(0,0,0,0.06), 0 16px 48px rgba(0,0,0,0.22)",
                }}
            >
                <button
                    type="button"
                    onClick={copy}
                    aria-label={copied ? "Copied" : "Copy error"}
                    title={copied ? "Copied" : "Copy error"}
                    style={{
                        position: "absolute",
                        top: 14,
                        right: 14,
                        zIndex: 1,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: 32,
                        height: 32,
                        border: "none",
                        borderRadius: 6,
                        background: copied ? "#111" : "transparent",
                        color: copied ? "#fff" : "#666",
                        cursor: "pointer",
                    }}
                >
                    {copied ? (
                        <Check size={15} strokeWidth={2.25} aria-hidden />
                    ) : (
                        <Copy size={15} strokeWidth={2} aria-hidden />
                    )}
                </button>

                <div style={{ padding: "28px 32px 32px" }}>
                    <div
                        style={{
                            display: "flex",
                            flexWrap: "wrap",
                            alignItems: "center",
                            gap: "6px 10px",
                            marginBottom: 10,
                            paddingRight: 36,
                        }}
                    >
                        <p
                            style={{
                                margin: 0,
                                color: "#e00",
                                fontSize: 13,
                                fontWeight: 500,
                                letterSpacing: "-0.01em",
                            }}
                        >
                            Config Validation Error
                        </p>
                        {countLabel ? (
                            <span
                                style={{
                                    color: "#999",
                                    fontSize: 12,
                                    fontWeight: 400,
                                }}
                            >
                                · {countLabel}
                            </span>
                        ) : null}
                        {scenario ? (
                            <span
                                style={{
                                    color: "#999",
                                    fontSize: 12,
                                    fontFamily: mono,
                                }}
                            >
                                · {scenario}
                            </span>
                        ) : null}
                    </div>

                    <h1
                        id="ozzyrm-error-title"
                        style={{
                            margin: "0 0 20px",
                            maxWidth: "92%",
                            fontSize: 20,
                            fontWeight: 500,
                            letterSpacing: "-0.025em",
                            lineHeight: 1.35,
                            color: "#111",
                        }}
                    >
                        {primary}
                    </h1>

                    {diagnostics.length > 0 ? (
                        <div
                            style={{
                                display: "grid",
                                gap: 0,
                                borderTop: "1px solid #eee",
                            }}
                        >
                            {diagnostics.map((item, index) => (
                                <div
                                    key={`${item.code}-${index}`}
                                    style={{
                                        padding: "14px 0",
                                        borderBottom:
                                            index < diagnostics.length - 1
                                                ? "1px solid #f0f0f0"
                                                : "none",
                                    }}
                                >
                                    <div
                                        style={{
                                            display: "flex",
                                            flexWrap: "wrap",
                                            alignItems: "baseline",
                                            gap: "4px 8px",
                                            marginBottom: 6,
                                            fontFamily: mono,
                                            fontSize: 12,
                                            lineHeight: 1.4,
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: "#e00",
                                                fontWeight: 500,
                                            }}
                                        >
                                            {item.code}
                                        </span>
                                        {item.sourceId ? (
                                            <span style={{ color: "#888" }}>
                                                {item.sourceId}
                                            </span>
                                        ) : null}
                                        {item.path?.length ? (
                                            <span style={{ color: "#bbb" }}>
                                                {item.path.join(" › ")}
                                            </span>
                                        ) : null}
                                    </div>
                                    <p
                                        style={{
                                            margin: 0,
                                            fontSize: 14,
                                            fontWeight: 400,
                                            color: "#333",
                                            lineHeight: 1.55,
                                            letterSpacing: "-0.01em",
                                        }}
                                    >
                                        {item.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <pre
                            style={{
                                margin: 0,
                                padding: 0,
                                background: "transparent",
                                border: "none",
                                color: "#444",
                                fontSize: 13,
                                lineHeight: 1.6,
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                fontFamily: mono,
                                userSelect: "text",
                            }}
                        >
                            {message}
                        </pre>
                    )}
                </div>
            </div>
        </div>
    );
}
