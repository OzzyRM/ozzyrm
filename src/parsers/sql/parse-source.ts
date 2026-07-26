import type {
    ExtractedSqlColumn,
    ExtractedSqlEnum,
    ExtractedSqlTable,
    ParsedSqlSchema,
} from "./types/internal";

/**
 * Lightweight SQL DDL parser for documentation.
 * Supports CREATE TABLE, CREATE TYPE AS ENUM, CREATE INDEX,
 * and ALTER TABLE ADD CONSTRAINT / FOREIGN KEY.
 */
export function parseSqlSource(content: string): ParsedSqlSchema {
    const cleaned = stripComments(content);
    const statements = splitStatements(cleaned);

    const tables = new Map<string, ExtractedSqlTable>();
    const enums: ExtractedSqlEnum[] = [];
    let provider: ParsedSqlSchema["provider"];

    for (const statement of statements) {
        const upper = statement.toUpperCase();

        if (upper.includes("ENGINE=INNODB") || upper.includes("ENGINE = INNODB")) {
            provider = "mysql";
        }

        const enumDef = parseCreateEnum(statement);
        if (enumDef) {
            enums.push(enumDef);
            continue;
        }

        const table = parseCreateTable(statement);
        if (table) {
            tables.set(tableKey(table), table);
            continue;
        }

        const index = parseCreateIndex(statement);
        if (index) {
            const table = tables.get(index.tableKey);
            if (table) {
                table.indexes.push({ name: index.name, fields: index.fields });
            }
            continue;
        }

        const alterFk = parseAlterForeignKey(statement);
        if (alterFk) {
            applyForeignKey(tables.get(alterFk.tableKey), alterFk);
            continue;
        }
    }

    return {
        tables: Array.from(tables.values()),
        enums,
        provider,
    };
}

function stripComments(sql: string): string {
    return sql
        .replace(/\/\*[\s\S]*?\*\//g, " ")
        .replace(/--[^\n]*/g, " ");
}

function splitStatements(sql: string): string[] {
    const parts: string[] = [];
    let current = "";
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < sql.length; i += 1) {
        const ch = sql[i]!;
        const prev = sql[i - 1];

        if (ch === "'" && prev !== "\\" && !inDouble) {
            inSingle = !inSingle;
        } else if (ch === '"' && prev !== "\\" && !inSingle) {
            inDouble = !inDouble;
        }

        if (ch === ";" && !inSingle && !inDouble) {
            const trimmed = current.trim();
            if (trimmed) {
                parts.push(trimmed);
            }
            current = "";
            continue;
        }

        current += ch;
    }

    const trailing = current.trim();
    if (trailing) {
        parts.push(trailing);
    }

    return parts;
}

function unquoteIdent(value: string): string {
    return value
        .trim()
        .replace(/^"+|"+$/g, "")
        .replace(/^`+|`+$/g, "")
        .replace(/^\[+|\]+$/g, "");
}

function splitIdent(raw: string): { schema?: string; name: string } {
    const cleaned = unquoteIdent(raw);
    const parts = cleaned.split(".").map((part) => unquoteIdent(part));
    if (parts.length >= 2) {
        return { schema: parts[parts.length - 2], name: parts[parts.length - 1]! };
    }
    return { name: parts[0]! };
}

function tableKey(table: { schema?: string; name: string }): string {
    return table.schema ? `${table.schema}.${table.name}` : table.name;
}

function parseCreateEnum(statement: string): ExtractedSqlEnum | null {
    const match = statement.match(
        /CREATE\s+TYPE\s+([^\s(]+)\s+AS\s+ENUM\s*\(([\s\S]+)\)/i
    );
    if (!match) {
        return null;
    }

    const ident = splitIdent(match[1]!);
    const values = splitCsv(match[2]!)
        .map((value) => value.trim().replace(/^'+|'+$/g, "").replace(/''/g, "'"))
        .filter(Boolean);

    return {
        name: ident.name,
        schema: ident.schema,
        values,
    };
}

function parseCreateTable(statement: string): ExtractedSqlTable | null {
    const match = statement.match(
        /CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([^\s(]+)\s*\(([\s\S]+)\)/i
    );
    if (!match) {
        return null;
    }

    const ident = splitIdent(match[1]!);
    const body = match[2]!;
    const lines = splitTopLevelCommas(body);

    const columns: ExtractedSqlColumn[] = [];
    const compoundUnique: string[][] = [];
    const compoundId: string[][] = [];
    const indexes: Array<{ name?: string; fields: string[] }> = [];

    for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed) {
            continue;
        }

        const upper = trimmed.toUpperCase();

        if (upper.startsWith("PRIMARY KEY")) {
            const fields = extractParenList(trimmed);
            if (fields.length === 1) {
                const column = columns.find((item) => item.name === fields[0]);
                if (column) {
                    column.isPrimary = true;
                    column.isOptional = false;
                }
            } else if (fields.length > 1) {
                compoundId.push(fields);
            }
            continue;
        }

        if (upper.startsWith("UNIQUE")) {
            const fields = extractParenList(trimmed);
            if (fields.length === 1) {
                const column = columns.find((item) => item.name === fields[0]);
                if (column) {
                    column.isUnique = true;
                }
            } else if (fields.length > 1) {
                compoundUnique.push(fields);
            }
            continue;
        }

        if (upper.startsWith("FOREIGN KEY") || upper.startsWith("CONSTRAINT")) {
            const fk = parseInlineForeignKey(trimmed);
            if (fk) {
                applyInlineFk(columns, fk);
            }
            continue;
        }

        if (
            upper.startsWith("CHECK")
            || upper.startsWith("INDEX")
            || upper.startsWith("KEY ")
            || upper.startsWith("FULLTEXT")
            || upper.startsWith("SPATIAL")
        ) {
            continue;
        }

        const column = parseColumnDefinition(trimmed);
        if (column) {
            columns.push(column);
        }
    }

    return {
        name: ident.name,
        schema: ident.schema,
        columns,
        compoundUnique,
        compoundId,
        indexes,
    };
}

function parseColumnDefinition(line: string): ExtractedSqlColumn | null {
    const match = line.match(/^([`"[\w.]+)\s+(.+)$/i);
    if (!match) {
        return null;
    }

    const name = unquoteIdent(match[1]!);
    if (/^(PRIMARY|UNIQUE|FOREIGN|CONSTRAINT|CHECK|INDEX|KEY)$/i.test(name)) {
        return null;
    }

    let rest = match[2]!.trim();
    const typeMatch = rest.match(
        /^([a-zA-Z][a-zA-Z0-9_\s]*?)(?:\s*\(([^)]*)\))?(\s*\[\])?(?:\s+|$)/i
    );
    if (!typeMatch) {
        return null;
    }

    const sqlType = typeMatch[1]!.trim().replace(/\s+/g, " ").toLowerCase();
    const typeArgs = typeMatch[2]
        ? typeMatch[2].split(",").map((part) => {
            const value = part.trim();
            const asNumber = Number(value);
            return Number.isFinite(asNumber) && value !== "" ? asNumber : value;
        })
        : [];
    const isList = Boolean(typeMatch[3]);
    rest = rest.slice(typeMatch[0].length).trim();

    const upper = rest.toUpperCase();
    const isPrimary = /\bPRIMARY\s+KEY\b/.test(upper);
    const isUnique = /\bUNIQUE\b/.test(upper);
    const isOptional = !/\bNOT\s+NULL\b/.test(upper) && !isPrimary;
    const isGenerated =
        /\bGENERATED\b/.test(upper)
        || /\bSERIAL\b/i.test(sqlType)
        || /\bIDENTITY\b/.test(upper)
        || /\bAUTO_INCREMENT\b/.test(upper);

    let defaultValue: string | undefined;
    const defaultMatch = rest.match(/\bDEFAULT\s+((?:'[^']*')|(?:"[^"]*")|(?:\([^)]*\))|(?:[^\s,]+))/i);
    if (defaultMatch) {
        defaultValue = defaultMatch[1]!.trim();
    }

    let references: ExtractedSqlColumn["references"];
    const refMatch = rest.match(
        /\bREFERENCES\s+([`"[\w.]+)\s*(?:\(([^)]+)\))?/i
    );
    if (refMatch) {
        const target = splitIdent(refMatch[1]!);
        references = {
            table: target.name,
            column: refMatch[2] ? unquoteIdent(refMatch[2].split(",")[0]!) : "id",
        };
    }

    return {
        name,
        sqlType,
        typeArgs,
        isList,
        isOptional,
        isUnique,
        isPrimary,
        isGenerated,
        hasDefault: Boolean(defaultValue),
        defaultValue,
        references,
    };
}

function parseInlineForeignKey(line: string): {
    columns: string[];
    table: string;
    refColumns: string[];
} | null {
    const match = line.match(
        /FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([`"[\w.]+)\s*(?:\(([^)]+)\))?/i
    );
    if (!match) {
        return null;
    }

    return {
        columns: splitCsv(match[1]!).map(unquoteIdent),
        table: splitIdent(match[2]!).name,
        refColumns: match[3]
            ? splitCsv(match[3]).map(unquoteIdent)
            : ["id"],
    };
}

function applyInlineFk(
    columns: ExtractedSqlColumn[],
    fk: { columns: string[]; table: string; refColumns: string[] }
): void {
    fk.columns.forEach((columnName, index) => {
        const column = columns.find((item) => item.name === columnName);
        if (!column) {
            return;
        }

        column.references = {
            table: fk.table,
            column: fk.refColumns[index] ?? fk.refColumns[0] ?? "id",
        };
    });
}

function parseCreateIndex(statement: string): {
    tableKey: string;
    name?: string;
    fields: string[];
} | null {
    const match = statement.match(
        /CREATE\s+(?:UNIQUE\s+)?INDEX\s+(?:IF\s+NOT\s+EXISTS\s+)?([`"[\w.]+)\s+ON\s+([`"[\w.]+)\s*\(([^)]+)\)/i
    );
    if (!match) {
        return null;
    }

    const table = splitIdent(match[2]!);
    return {
        name: unquoteIdent(match[1]!),
        tableKey: tableKey(table),
        fields: splitCsv(match[3]!).map((field) => unquoteIdent(field.split(/\s+/)[0]!)),
    };
}

function parseAlterForeignKey(statement: string): {
    tableKey: string;
    columns: string[];
    table: string;
    refColumns: string[];
} | null {
    const match = statement.match(
        /ALTER\s+TABLE\s+([`"[\w.]+)\s+ADD\s+(?:CONSTRAINT\s+[`"[\w.]+\s+)?FOREIGN\s+KEY\s*\(([^)]+)\)\s*REFERENCES\s+([`"[\w.]+)\s*(?:\(([^)]+)\))?/i
    );
    if (!match) {
        return null;
    }

    const table = splitIdent(match[1]!);
    return {
        tableKey: tableKey(table),
        columns: splitCsv(match[2]!).map(unquoteIdent),
        table: splitIdent(match[3]!).name,
        refColumns: match[4]
            ? splitCsv(match[4]).map(unquoteIdent)
            : ["id"],
    };
}

function applyForeignKey(
    table: ExtractedSqlTable | undefined,
    fk: { columns: string[]; table: string; refColumns: string[] }
): void {
    if (!table) {
        return;
    }

    applyInlineFk(table.columns, fk);
}

function extractParenList(text: string): string[] {
    const match = text.match(/\(([^)]+)\)/);
    if (!match) {
        return [];
    }

    return splitCsv(match[1]!).map((field) => unquoteIdent(field.split(/\s+/)[0]!));
}

function splitCsv(value: string): string[] {
    const parts: string[] = [];
    let current = "";
    let depth = 0;
    let inSingle = false;
    let inDouble = false;

    for (let i = 0; i < value.length; i += 1) {
        const ch = value[i]!;

        if (ch === "'" && !inDouble) {
            inSingle = !inSingle;
        } else if (ch === '"' && !inSingle) {
            inDouble = !inDouble;
        } else if (!inSingle && !inDouble) {
            if (ch === "(") {
                depth += 1;
            } else if (ch === ")") {
                depth = Math.max(0, depth - 1);
            } else if (ch === "," && depth === 0) {
                parts.push(current.trim());
                current = "";
                continue;
            }
        }

        current += ch;
    }

    if (current.trim()) {
        parts.push(current.trim());
    }

    return parts;
}

function splitTopLevelCommas(body: string): string[] {
    return splitCsv(body);
}
