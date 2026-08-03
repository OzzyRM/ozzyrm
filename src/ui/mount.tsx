import { createRoot, type Root } from "react-dom/client";
import { createElement } from "react";
import { SchemaDocs } from "./components/schema-docs";
import { ensureOzzyrmStyles } from "./inject-styles";
import type { OzzyRMDocsOptions } from "./types";

export interface OzzyRMMountHandle {
    update: (next: Partial<OzzyRMDocsOptions>) => void;
    unmount: () => void;
}

/**
 * Framework-agnostic mount.
 * Styles are injected automatically on first mount.
 */
export function mount(
    element: Element,
    options: OzzyRMDocsOptions
): OzzyRMMountHandle {
    ensureOzzyrmStyles();

    let current: OzzyRMDocsOptions = { ...options };
    let root: Root | null = createRoot(element);

    const render = () => {
        if (!root) {
            return;
        }

        root.render(createElement(SchemaDocs, current));
    };

    render();

    return {
        update(next) {
            current = { ...current, ...next };
            render();
        },
        unmount() {
            if (!root) {
                return;
            }

            root.unmount();
            root = null;
            element.replaceChildren();
        },
    };
}
