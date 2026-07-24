# Publish OzzyRM to npm (public install)

Uji lokal tetap bisa pakai `file:`. Panduan ini untuk **poin 2**: publish ke npmjs supaya `/test` bisa `npm i @ozzyrm/react` seperti user publik.

## 0. Prasyarat

1. Akun di [npmjs.com](https://www.npmjs.com/signup)
2. Di terminal:

```bash
npm login
npm whoami
```

3. Scope `@ozzyrm/*` butuh **organization** atau username `ozzyrm`:
   - Buka https://www.npmjs.com/org/create
   - Buat org bernama `ozzyrm` (gratis untuk public packages)
   - Atau ganti nama package ke scope user kamu, mis. `@rizain/ozzyrm-react`

## 1. Build

Dari root monorepo:

```bash
bun run --cwd core build
bun run --cwd ui build
bun run --cwd react build
```

## 2. Publish (urut dependency)

```bash
# 1) types / core dulu (dipakai @ozzyrm/ui)
cd core
npm publish --access public

# 2) UI core
cd ../ui
npm publish --access public

# 3) React wrapper
cd ../react
npm publish --access public
```

Cek di browser:
- https://www.npmjs.com/package/@ozzyrm/core
- https://www.npmjs.com/package/@ozzyrm/ui
- https://www.npmjs.com/package/@ozzyrm/react

## 3. Pakai di `/test` seperti user publik

Di `test/package.json`:

```json
{
  "dependencies": {
    "@ozzyrm/react": "^0.1.0",
    "@ozzyrm/ui": "^0.1.0",
    "next": "16.2.11",
    "react": "19.2.4",
    "react-dom": "19.2.4"
  }
}
```

```bash
cd test
rm -rf node_modules package-lock.json
npm install
# atau: bun add @ozzyrm/react@^0.1.0
```

`next.config.ts`:

```ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@ozzyrm/react", "@ozzyrm/ui"],
};

export default nextConfig;
```

`app/page.tsx` (contoh):

```tsx
"use client";

import { OzzyRMDocs } from "@ozzyrm/react";
import type { SchemaCatalogGroup } from "@ozzyrm/react";

const catalog: SchemaCatalogGroup[] = [
  // isi dari hasil generate, atau import JSON catalog
];

export default function Page() {
  return <OzzyRMDocs catalog={catalog} basePath="/" />;
}
```

## 4. Update versi setelah perubahan

Setiap publish ulang, naikkan version (semver):

```bash
# di react/ misalnya
npm version patch   # 0.1.0 → 0.1.1
npm publish --access public
```

Lalu di `/test`: `npm update @ozzyrm/react`

## Catatan penting

| Item | Status |
|---|---|
| Harus login npm? | Ya, untuk publish |
| Harus bayar? | Tidak, package public gratis |
| Org `@ozzyrm` | Harus dibuat dulu di npm (atau ganti scope) |
| `@ozzyrm/core` | Juga harus di-publish (dependency `@ozzyrm/ui`) |
| Monorepo lokal | Tetap jalan; workspace resolve by package name |

## Troubleshooting

- **`ENEEDAUTH`** → `npm login`
- **`404 Not Found` / scope** → buat org `ozzyrm` atau publish dengan `--access public`
- **`403 Forbidden`** → nama package sudah dipakai orang lain; ganti scope/nama
- **Install masih `file:`** → hapus `file:` dari `package.json`, lalu `npm install @ozzyrm/react@^0.1.0`
