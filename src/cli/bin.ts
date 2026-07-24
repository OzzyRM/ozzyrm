#!/usr/bin/env node
import { generate, watchCatalog } from "../catalog";
import { serve } from "./serve";

async function main() {
    const [command, ...args] = process.argv.slice(2);
    const cwd = process.cwd();
    const configPath = getFlag(args, "--config") ?? "ozzyrm.config.ts";

    if (command === "generate") {
        const result = await generate(undefined, { cwd, configPath });
        console.log(`Generated ${result.files.length} file(s) → ${result.outputDir}`);
        for (const file of result.files) {
            console.log(`  ${file}`);
        }
        return;
    }

    if (command === "watch") {
        await watchCatalog({ cwd, configPath });
        // keep process alive
        await new Promise(() => undefined);
        return;
    }

    if (command === "serve") {
        const root = getFlag(args, "--root") ?? "./dist/docs";
        const port = Number(getFlag(args, "--port") ?? "4173");
        const route = getFlag(args, "--route") ?? "/";
        await serve({ root, port, route });
        return;
    }

    console.log(`OzzyRM CLI

Usage:
  ozzyrm generate [--config ozzyrm.config.ts]
  ozzyrm watch    [--config ozzyrm.config.ts]
  ozzyrm serve    --root <dir> [--port 4173] [--route /docs]

Typical flow:
  1. Create ozzyrm.config.ts with prisma()/drizzle() adapters
  2. ozzyrm watch   # writes ./.ozzyrm/*.json on schema change
  3. loadCatalog(config) in your app, or read .ozzyrm/catalog.json
`);
}

function getFlag(args: string[], name: string): string | undefined {
    const index = args.indexOf(name);
    if (index === -1) {
        return undefined;
    }

    return args[index + 1];
}

main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exit(1);
});
