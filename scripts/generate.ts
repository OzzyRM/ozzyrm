import { generateAllSchemas } from "./lib/schema";

async function main() {
    const destinations = await generateAllSchemas();
    console.log(`Generated ${destinations.length} schema(s):`);
    for (const path of destinations) {
        console.log(`  ${path}`);
    }
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
