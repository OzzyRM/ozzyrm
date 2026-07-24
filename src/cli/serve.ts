import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";

const MIME: Record<string, string> = {
    ".html": "text/html; charset=utf-8",
    ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".svg": "image/svg+xml",
};

export interface ServeOptions {
    /** static build directory (from ozzyrm/ui / app export) */
    root: string;
    port?: number;
    /** route prefix, e.g. /docs */
    route?: string;
}

/**
 * Thin static server for `ozzyrm serve`.
 * Serves a prebuilt UI bundle; rendering stays in ozzyrm/ui.
 */
export async function serve(options: ServeOptions): Promise<{ close: () => Promise<void> }> {
    const root = resolve(options.root);
    const port = options.port ?? 4173;
    const route = normalizeRoute(options.route ?? "/");

    const server = createServer(async (req, res) => {
        try {
            const url = new URL(req.url ?? "/", `http://localhost:${port}`);
            let pathname = url.pathname;

            if (route !== "/" && pathname.startsWith(route)) {
                pathname = pathname.slice(route.length) || "/";
            }

            const filePath = join(root, pathname === "/" ? "index.html" : pathname);
            const content = await readFile(filePath);
            res.writeHead(200, {
                "Content-Type": MIME[extname(filePath)] ?? "application/octet-stream",
            });
            res.end(content);
        } catch {
            res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
            res.end("Not found");
        }
    });

    await new Promise<void>((resolveListen) => {
        server.listen(port, resolveListen);
    });

    console.log(`OzzyRM serving ${root} at http://localhost:${port}${route}`);

    return {
        close: () =>
            new Promise((resolveClose, reject) => {
                server.close((error) => (error ? reject(error) : resolveClose()));
            }),
    };
}

function normalizeRoute(route: string): string {
    if (!route.startsWith("/")) {
        return `/${route}`;
    }

    return route.endsWith("/") && route.length > 1 ? route.slice(0, -1) : route;
}
