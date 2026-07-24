# OzzyRM

Schema documentation toolkit for ORM's.

## Install

```bash
bun add ozzyrm
# or: npm i ozzyrm
```

Styles inject automatically no CSS setup required.

## Config (adapter)

```ts
// ozzyrm.config.ts
import { defineProject, prisma, drizzle } from "ozzyrm";

export default defineProject({
  output: "./.ozzyrm",
  schemas: [
    prisma({
      id: "app-1-0-0",
      include: ["./prisma"],
      version: "1.0.0",
    }),
    drizzle({
      id: "db-1-0-0",
      include: ["./src/db/schema.ts"],
    }),
  ],
});
```

## Next.js (App Router)

```tsx
// app/docs/page.tsx as Server Component
import config from "../../ozzyrm.config";
import { OzzyRMDocsFromConfig } from "ozzyrm/react/server";

export default function Page() {
  return <OzzyRMDocsFromConfig config={config} basePath="/docs" />;
}
```

Or load the catalog yourself:

```tsx
import { loadCatalog } from "ozzyrm";
import { OzzyRMDocs } from "ozzyrm/react";
import config from "../ozzyrm.config";

export default async function Page() {
  const { catalog, defaultSchemaId } = await loadCatalog(config);
  return <OzzyRMDocs catalog={catalog} defaultSchemaId={defaultSchemaId} />;
}
```

## CLI

```bash
npx ozzyrm generate   # write ./.ozzyrm/*.json
npx ozzyrm watch      # regenerate on schema change
```

## Develop

```bash
bun install
bun run build
```
