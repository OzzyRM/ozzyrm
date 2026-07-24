import { readdir, readFile, stat } from "fs/promises";
import { basename, join } from "path";
import { getConfig, getDMMF, loadSchemaContext } from "@prisma/internals";
import type { GetDMMFOptions } from "@prisma/internals";

type PrismaDatamodel = NonNullable<GetDMMFOptions["datamodel"]>;

export interface LoadedPrismaSchema {
    datamodel: PrismaDatamodel;
    sourcePaths: string[];
}

export async function expandPrismaWatchPaths(paths: string[]): Promise<string[]> {
    const expanded: string[] = [];

    for (const path of paths) {
        const info = await stat(path);

        if (info.isDirectory()) {
            const entries = await readdir(path);
            for (const entry of entries) {
                if (entry.endsWith(".prisma")) {
                    expanded.push(join(path, entry));
                }
            }
            continue;
        }

        expanded.push(path);
    }

    return expanded;
}

export async function loadPrismaSchema(include: string[]): Promise<LoadedPrismaSchema> {
    if (include.length === 0) {
        throw new Error("Prisma parser requires at least one schema path in adapter.include");
    }

    if (include.length === 1) {
        const path = include[0];
        const info = await stat(path);

        if (info.isDirectory()) {
            const context = await loadSchemaContext({
                schemaPath: { cliProvidedPath: path },
            });

            return {
                datamodel: context.schemaFiles,
                sourcePaths: context.schemaFiles.map(([filePath]) => filePath),
            };
        }

        return {
            datamodel: await readFile(path, "utf-8"),
            sourcePaths: [path],
        };
    }

    const datamodel: Array<[string, string]> = [];
    const sourcePaths: string[] = [];

    for (const path of include) {
        const info = await stat(path);

        if (info.isDirectory()) {
            const context = await loadSchemaContext({
                schemaPath: { cliProvidedPath: path },
            });

            for (const [filePath, content] of context.schemaFiles) {
                datamodel.push([basename(filePath), content]);
                sourcePaths.push(filePath);
            }
            continue;
        }

        datamodel.push([basename(path), await readFile(path, "utf-8")]);
        sourcePaths.push(path);
    }

    return { datamodel, sourcePaths };
}

export async function parsePrismaDatamodel(datamodel: PrismaDatamodel) {
    const [dmmf, config] = await Promise.all([
        getDMMF({ datamodel }),
        getConfig({ datamodel }),
    ]);

    return { dmmf, config };
}
