import type { DocSchema } from "../..";
import { enumValueSectionId, fieldSectionId, sectionId } from "./section-id";

export function resolveSidebarActiveId(activeId: string, schema: DocSchema): string {
    for (const model of schema.models) {
        if (sectionId("model", model.name) === activeId) {
            return activeId;
        }

        for (const field of model.fields) {
            if (fieldSectionId(model.name, field.name) === activeId) {
                return sectionId("model", model.name);
            }
        }
    }

    for (const enumDef of schema.enums) {
        if (sectionId("enum", enumDef.name) === activeId) {
            return activeId;
        }

        for (const value of enumDef.values) {
            if (enumValueSectionId(enumDef.name, value.name) === activeId) {
                return sectionId("enum", enumDef.name);
            }
        }
    }

    if (activeId === sectionId("overview")) {
        return activeId;
    }

    return activeId;
}

export function findActiveTargetId(
    container: HTMLElement,
    focalOffset = 120
): string | null {
    const containerRect = container.getBoundingClientRect();
    const focalY = containerRect.top + focalOffset;
    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const atBottom = maxScrollTop <= 0 || container.scrollTop >= maxScrollTop - 8;

    const targets = Array.from(
        container.querySelectorAll<HTMLElement>("[data-section], [data-nav-target]")
    ).filter((element) => element.id);

    if (targets.length === 0) {
        return null;
    }

    if (atBottom) {
        return targets[targets.length - 1]?.id ?? null;
    }

    let active: HTMLElement | null = null;
    let bestTop = -Infinity;

    for (const target of targets) {
        const top = target.getBoundingClientRect().top;

        if (top <= focalY && top > bestTop) {
            bestTop = top;
            active = target;
        }
    }

    if (active?.id) {
        return active.id;
    }

    const firstBelowFocal = targets.find((target) => {
        const top = target.getBoundingClientRect().top;
        return top > focalY;
    });

    if (firstBelowFocal?.id) {
        const index = targets.indexOf(firstBelowFocal);
        if (index > 0) {
            return targets[index - 1]?.id ?? firstBelowFocal.id;
        }
        return firstBelowFocal.id;
    }

    return targets[0]?.id ?? null;
}
