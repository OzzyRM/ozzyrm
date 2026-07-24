# OzzyRM UI architecture (Swagger-style)

```
@ozzyrm/ui      → single source of truth (React UI + mount())
@ozzyrm/react   → thin Client Component wrapper (useRef + useEffect)
@ozzyrm/cli     → ozzyrm serve (static host for UI build)
@ozzyrm/core    → schema types / generate contracts (not UI)
```

## mount()

```ts
import { mount } from "@ozzyrm/ui";

const handle = mount(document.getElementById("docs")!, {
  catalog,
  basePath: "/docs",
});

handle.update({ catalog: nextCatalog });
handle.unmount();
```

## React (Next.js App Router)

```tsx
"use client";
import { OzzyRMDocs } from "@ozzyrm/react";

<OzzyRMDocs catalog={catalog} basePath="/docs" />
```

Fast Refresh: when `catalog` (or other props) change via Next's module graph,
the effect cleanup unmounts the previous root, then mounts fresh — no duplicate DOM.
