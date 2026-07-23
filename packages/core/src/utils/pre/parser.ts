import type { DocSchema } from "../types/types";
import type { OrmDocgenAdapter } from "../adapter";

export interface Parser {
    parse(adapter: OrmDocgenAdapter): Promise<DocSchema>;
};