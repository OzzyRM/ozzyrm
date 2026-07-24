import { resolve, join } from "path";
import { writeSchema, postProcess } from "./core/src/process";
import type { OrmDocgenAdapter, SupportedORMs } from "./core/src/utils";

async function loadConfig(): Promise<OrmDocgenAdapter> {
    const configPath = resolve(process.cwd(), "ozzyrm.config.ts");
    const mod = await import(configPath);
    return mod.default ?? mod;
};

async function loadParserForConfig(orm: SupportedORMs) {
    switch(orm) {
        case "prisma":
            const { PrismaParser } = await import("@ozzyrm/parser-prisma"); 
        case "drizzle":
            const {  }
    }
};