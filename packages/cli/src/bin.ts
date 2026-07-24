#!/usr/bin/env node
import { serve } from "./serve";

async function main() {
    const [command, ...args] = process.argv.slice(2);

    if (command === "serve") {
        const root = getFlag(args, "--root") ?? "./dist/docs";
        const port = Number(getFlag(args, "--port") ?? "4173");
        const route = getFlag(args, "--route") ?? "/";
        await serve({ root, port, route });
        return;
    }

    console.log(`OzzyRM CLI

Usage:
  ozzyrm serve --root <dir> [--port 4173] [--route /docs]

Notes:
  - UI rendering lives in @ozzyrm/ui (mount)
  - @ozzyrm/react wraps mount for Next.js App Router
  - generate command will land in a later release
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
