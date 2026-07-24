export function scrollContainerToTarget(
    container: HTMLElement,
    target: HTMLElement
): void {
    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const targetTop = container.scrollTop + (targetRect.top - containerRect.top);

    const isTall = targetRect.height > container.clientHeight * 0.45;
    const idealScrollTop = isTall
        ? targetTop - container.clientHeight * 0.35
        : targetTop + targetRect.height / 2 - container.clientHeight / 2;

    const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    const nextTop = Math.min(Math.max(0, idealScrollTop), maxScrollTop);

    container.scrollTo({
        top: nextTop,
        behavior: "smooth",
    });
}

export function highlightElement(target: HTMLElement, durationMs = 1800): void {
    target.dataset.highlight = "true";
    window.setTimeout(() => {
        delete target.dataset.highlight;
    }, durationMs);
}
