import { readdir, readFile, stat } from "fs/promises";
import { join, resolve } from "path";

const SQL_FILE = /\.(sql)$/i;

export async function resolveSqlSchemaFiles(include: string[]): Promise<string[]> {
    const files = new Set<string>();

    for (const entry of include) {
        const absolute = resolve(entry);
        const info = await stat(absolute);

        if (info.isFile()) {
            if (SQL_FILE.test(absolute)) {
                files.add(absolute);
            }
            continue;
        }

        if (info.isDirectory()) {
            for (const file of await collectSqlFiles(absolute)) {
                files.add(file);
            }
        }
    }

    return Array.from(files).sort();
}

export async function expandSqlWatchPaths(include: string[]): Promise<string[]> {
    const resolved = await resolveSqlSchemaFiles(include);
    const paths = new Set(resolved);

    for (const entry of include) {
        paths.add(resolve(entry));
    }

    return Array.from(paths);
}

export async function loadSqlSources(include: string[]): Promise<Array<{ path: string; content: string }>> {
    const files = await resolveSqlSchemaFiles(include);
    return Promise.all(
        files.map(async (filePath) => ({
            path: filePath,
            content: await readFile(filePath, "utf-8"),
        }))
    );
}

async function collectSqlFiles(dir: string): Promise<string[]> {
    const entries = await readdir(dir, { withFileTypes: true });
    const files: string[] = [];

    for (const entry of entries) {
        const full = join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...(await collectSqlFiles(full)));
            continue;
        }

        if (entry.isFile() && SQL_FILE.test(entry.name)) {
            files.push(full);
        }
    }

    return files;
}
