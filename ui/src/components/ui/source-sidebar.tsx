"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
    type MouseEvent as ReactMouseEvent,
} from "react";
import type { SchemaCatalogGroup } from "../../types";

interface SourceSidebarProps {
    catalog: SchemaCatalogGroup[];
    activeSchemaId: string;
    onSchemaChange: (id: string) => void;
    logoSrc?: string;
}

const MIN_WIDTH = 180;
const MAX_WIDTH = 320;
const DEFAULT_WIDTH = 220;
const COLLAPSED_WIDTH = 60;

function fileInitial(file: string): string {
    const base = file.replace(/\.[^.]+$/, "");
    return (base.charAt(0) || file.charAt(0)).toUpperCase();
}

export function SourceSidebar({
    catalog,
    activeSchemaId,
    onSchemaChange,
    logoSrc = "/logo.svg",
}: SourceSidebarProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [width, setWidth] = useState(DEFAULT_WIDTH);
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
    const dragging = useRef(false);
    const startX = useRef(0);
    const startWidth = useRef(DEFAULT_WIDTH);

    const activeGroupId = useMemo(
        () => catalog.find((group) => group.versions.some((version) => version.id === activeSchemaId))?.id,
        [catalog, activeSchemaId]
    );

    useEffect(() => {
        if (!activeGroupId) {
            return;
        }

        setExpandedGroups((current) => ({
            ...current,
            [activeGroupId]: true,
        }));
    }, [activeGroupId]);

    const sidebarWidth = collapsed ? COLLAPSED_WIDTH : width;

    const toggleGroup = useCallback((groupId: string) => {
        setExpandedGroups((current) => ({
            ...current,
            [groupId]: !current[groupId],
        }));
    }, []);

    const onResizeStart = useCallback((event: ReactMouseEvent<HTMLButtonElement>) => {
        if (collapsed) {
            return;
        }

        dragging.current = true;
        startX.current = event.clientX;
        startWidth.current = width;
        event.preventDefault();
    }, [collapsed, width]);

    useEffect(() => {
        const onMouseMove = (event: globalThis.MouseEvent) => {
            if (!dragging.current) {
                return;
            }

            const next = startWidth.current + (event.clientX - startX.current);
            setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, next)));
        };

        const onMouseUp = () => {
            dragging.current = false;
        };

        window.addEventListener("mousemove", onMouseMove);
        window.addEventListener("mouseup", onMouseUp);

        return () => {
            window.removeEventListener("mousemove", onMouseMove);
            window.removeEventListener("mouseup", onMouseUp);
        };
    }, []);

    return (
        <aside
            className="relative flex shrink-0 flex-col border-r border-border bg-sidebar transition-[width] duration-200 ease-out"
            style={{ width: sidebarWidth }}
        >
            <div className={`border-b border-border ${collapsed ? "px-2 py-3" : "px-3 py-3"}`}>
                <div className={`flex items-center ${collapsed ? "justify-center" : ""}`}>
                    <img
                        src={logoSrc}
                        alt="OzzyRM"
                        width={28}
                        height={28}
                        className="h-5 w-auto shrink-0"
                    />
                </div>
            </div>

            <nav className={`flex-1 overflow-y-auto py-3 ${collapsed ? "px-1.5" : "px-2"}`}>
                {!collapsed && (
                    <p className="mb-2 px-2 text-[11px] font-medium uppercase tracking-wider text-muted">
                        Schemas
                    </p>
                )}

                <div className="space-y-1">
                    {catalog.map((group) => {
                        const expanded = expandedGroups[group.id] ?? true;
                        const groupActive = group.versions.some((version) => version.id === activeSchemaId);

                        if (collapsed) {
                            const activeVersion =
                                group.versions.find((version) => version.id === activeSchemaId)
                                ?? group.versions[0];

                            return (
                                <button
                                    key={group.id}
                                    type="button"
                                    title={`${group.file} (${activeVersion.version})`}
                                    onClick={() => onSchemaChange(activeVersion.id)}
                                    className={`flex h-9 w-full items-center justify-center rounded-md transition-colors ${
                                        groupActive
                                            ? "bg-accent/10 text-foreground"
                                            : "text-muted hover:bg-background/60 hover:text-foreground"
                                    }`}
                                >
                                    <span className="font-mono text-[12px] font-semibold">
                                        {fileInitial(group.file)}
                                    </span>
                                </button>
                            );
                        }

                        return (
                            <div key={group.id}>
                                <button
                                    type="button"
                                    onClick={() => toggleGroup(group.id)}
                                    className={`relative w-full truncate py-1 pl-2 text-left font-mono text-[13px] transition-colors ${
                                        groupActive
                                            ? "font-medium text-foreground"
                                            : "text-muted hover:text-foreground"
                                    }`}
                                >
                                    {group.file}
                                </button>

                                {expanded && (
                                    <div className="space-y-0.5">
                                        {group.versions.map((version) => {
                                            const active = version.id === activeSchemaId;

                                            return (
                                                <button
                                                    key={version.id}
                                                    type="button"
                                                    onClick={() => onSchemaChange(version.id)}
                                                    className={`relative w-full truncate py-1 pl-5 text-left font-mono text-[13px] transition-colors ${
                                                        active
                                                            ? "font-medium text-foreground before:absolute before:left-0 before:top-1/2 before:h-3.5 before:w-0.5 before:-translate-y-1/2 before:rounded-full before:bg-accent"
                                                            : "text-muted hover:text-foreground"
                                                    }`}
                                                >
                                                    {version.version}
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </nav>

            <div className={`border-t border-border ${collapsed ? "px-1.5 py-2" : "px-2 py-2"}`}>
                <button
                    type="button"
                    onClick={() => setCollapsed((value) => !value)}
                    title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                    className={`flex items-center rounded-md text-muted transition-colors hover:bg-background/60 hover:text-foreground ${
                        collapsed
                            ? "mx-auto h-9 w-9 justify-center"
                            : "h-8 w-full gap-2 px-2"
                    }`}
                >
                    {collapsed ? (
                        <PanelLeftOpen className="h-3.5 w-3.5" />
                    ) : (
                        <>
                            <PanelLeftClose className="h-3.5 w-3.5 shrink-0" />
                            <span className="text-xs">Collapse</span>
                        </>
                    )}
                </button>
            </div>

            {!collapsed && (
                <button
                    type="button"
                    aria-label="Resize sidebar"
                    onMouseDown={onResizeStart}
                    className="absolute -right-1 top-0 z-10 h-full w-2 cursor-col-resize hover:bg-accent/20"
                />
            )}
        </aside>
    );
}
