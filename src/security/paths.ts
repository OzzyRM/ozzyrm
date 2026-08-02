import { resolve, sep } from "node:path";

/** True when `target` is `root` or a path strictly under `root`. */
export function isPathInside(root: string, target: string): boolean {
    const rootPath = resolve(root);
    const targetPath = resolve(target);

    if (targetPath === rootPath) {
        return true;
    }

    const prefix = rootPath.endsWith(sep) ? rootPath : `${rootPath}${sep}`;
    return targetPath.startsWith(prefix);
}

/**
 * Resolve a URL pathname to a file under `root`.
 * Rejects null bytes, `..` segments, and any path that escapes root.
 */
export function resolveStaticFile(
    root: string,
    pathname: string
): string | null {
    if (!pathname || pathname.includes("\0")) {
        return null;
    }

    let decoded: string;
    try {
        decoded = decodeURIComponent(pathname);
    } catch {
        return null;
    }

    if (decoded.includes("\0")) {
        return null;
    }

    const relative = decoded.replace(/^\/+/, "") || "index.html";
    const segments = relative.split(/[/\\]/).filter(Boolean);
    if (segments.some((segment) => segment === "..")) {
        return null;
    }

    const rootResolved = resolve(root);
    const candidate = resolve(rootResolved, ...segments);
    if (!isPathInside(rootResolved, candidate)) {
        return null;
    }

    return candidate;
}

/**
 * Resolve `input` against `cwd` and require it stays under cwd when restricted.
 * Returns absolute path or null when outside.
 */
export function resolveProjectPath(
    cwd: string,
    input: string,
    options?: { restrictToCwd?: boolean }
): string | null {
    if (!input || input.includes("\0")) {
        return null;
    }

    const absolute = resolve(cwd, input);
    if (options?.restrictToCwd === false) {
        return absolute;
    }

    if (!isPathInside(cwd, absolute)) {
        return null;
    }

    return absolute;
}
