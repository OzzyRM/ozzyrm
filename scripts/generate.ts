import { generateSchema } from "./lib/schema";

async function main() {
    const destination = await generateSchema();
    console.log(`Generated schema → ${destination}`);
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
