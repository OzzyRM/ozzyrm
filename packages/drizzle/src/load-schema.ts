import { readdir, readFile, stat } from "fs/promises";
import { dirname, resolve } from "path";
import ts from "typescript";

const IGNORED_FILES = /\.(test|spec)\.[cm]?tsx?$/i;

function isSchemaSourceFile(filePath: string): boolean {
    return /\.[cm]?tsx?$/i.test(filePath) && !IGNORED_FILES.test(filePath);
}

function collectModuleSpecifiers(sourceFile: ts.SourceFile): string[] {
    const specs: string[] = [];

    const visit = (node: ts.Node) => {
        if (
            (ts.isImportDeclaration(node) || ts.isExportDeclaration(node))
            && node.moduleSpecifier
            && ts.isStringLiteral(node.moduleSpecifier)
        ) {
            specs.push(node.moduleSpecifier.text);
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return specs;
}

async function resolveTypeScriptModule(fromDir: string, spec: string): Promise<string | null> {
    if (!spec.startsWith(".")) {
        return null;
    }

    const normalized = spec.replace(/\.js$/i, "");
    const candidates = [
        resolve(fromDir, `${normalized}.ts`),
        resolve(fromDir, `${normalized}.tsx`),
        resolve(fromDir, normalized, "index.ts"),
        resolve(fromDir, spec),
    ];

    for (const candidate of candidates) {
        if (!isSchemaSourceFile(candidate)) {
            continue;
        }

        try {
            const info = await stat(candidate);
            if (info.isFile()) {
                return candidate;
            }
        } catch {
            continue;
        }
    }

    return null;
}

async function collectImportsFromFile(filePath: string): Promise<string[]> {
    const content = await readFile(filePath, "utf-8");
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS
    );

    const fromDir = dirname(filePath);
    const resolved: string[] = [];

    for (const spec of collectModuleSpecifiers(sourceFile)) {
        const nextPath = await resolveTypeScriptModule(fromDir, spec);
        if (nextPath) {
            resolved.push(nextPath);
        }
    }

    return resolved;
}

async function collectDirectorySchemaFiles(directory: string): Promise<string[]> {
    const entries = await readdir(directory);
    const files: string[] = [];

    for (const entry of entries) {
        const filePath = resolve(directory, entry);

        try {
            const info = await stat(filePath);
            if (info.isFile() && isSchemaSourceFile(filePath)) {
                files.push(filePath);
            }
        } catch {
            continue;
        }
    }

    return files;
}

export async function resolveDrizzleSchemaFiles(include: string[]): Promise<string[]> {
    if (include.length === 0) {
        throw new Error("Drizzle parser requires at least one schema path in adapter.include");
    }

    const discovered = new Set<string>();
    const queue: string[] = [];

    for (const path of include) {
        const info = await stat(path);

        if (info.isDirectory()) {
            queue.push(...await collectDirectorySchemaFiles(path));
            continue;
        }

        if (isSchemaSourceFile(path)) {
            queue.push(resolve(path));
        }
    }

    while (queue.length > 0) {
        const filePath = queue.pop();
        if (!filePath || discovered.has(filePath)) {
            continue;
        }

        discovered.add(filePath);
        queue.push(...await collectImportsFromFile(filePath));
    }

    return Array.from(discovered);
}

export async function expandDrizzleWatchPaths(paths: string[]): Promise<string[]> {
    return resolveDrizzleSchemaFiles(paths);
}
