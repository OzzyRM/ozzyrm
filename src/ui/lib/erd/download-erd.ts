import { toPng } from "html-to-image";

export async function downloadErdPng(
    element: HTMLElement,
    fileName = "schema-erd.png"
): Promise<void> {
    const dataUrl = await toPng(element, {
        cacheBust: true,
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        filter: (node) => {
            if (!(node instanceof HTMLElement)) {
                return true;
            }
            return (
                !node.classList.contains("erd-toolbar") &&
                !node.classList.contains("erd-canvas__test")
            );
        },
    });

    const link = document.createElement("a");
    link.download = fileName;
    link.href = dataUrl;
    link.click();
}
