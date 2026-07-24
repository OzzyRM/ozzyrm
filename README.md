# OzzyRM

Schema documentation toolkit for Prisma & Drizzle.

## Install

```bash
bun add ozzyrm
# or: npm i ozzyrm / pnpm add ozzyrm
```

## Usage

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

```tsx
"use client";
import { OzzyRMDocs } from "ozzyrm/react";

export default function Page() {
  return <OzzyRMDocs catalog={catalog} basePath="/" />;
}
```

Optional lower-level API:

```ts
import { mount } from "ozzyrm/ui";
```

## Develop

```bash
bun install
bun run build
```

Local playground (`web/`), generate scripts (`scripts/`), and `ozzyrm.config.ts` are gitignored.
