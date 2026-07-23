import { watch } from "fs";
import { generateSchema, getWatchedPaths } from "./lib/schema";

let timer: ReturnType<typeof setTimeout> | undefined;

async function regenerate(label: string) {
    clearTimeout(timer);
    timer = setTimeout(async () => {
        try {
            const destination = await generateSchema();
            console.log(`[reldoc] ${label} → updated ${destination}`);
        } catch (error) {
            console.error("[reldoc] generate failed:", error instanceof Error ? error.message : error);
        }
    }, 200);
}

async function main() {
    const paths = await getWatchedPaths();

    for (const path of paths) {
        watch(path, () => regenerate(path));
        console.log(`[reldoc] watching ${path}`);
    }

    await regenerate("initial");
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
