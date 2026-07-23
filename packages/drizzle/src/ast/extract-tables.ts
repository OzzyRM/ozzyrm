import ts from "typescript";
import { DEFAULT_FUNCTION_MODIFIERS, TABLE_FUNCTIONS } from "../constants";
import type { ColumnModifier, ExtractedColumn, ExtractedIndex, ExtractedTable } from "../types/internal";
import {
    expressionToLiteral,
    flattenCallChain,
    getCallName,
    getJsDocDescription,
    getStringLiteral,
    parseReferenceTarget,
} from "./parse-source";

export function extractTables(sourceFile: ts.SourceFile): ExtractedTable[] {
    const tables: ExtractedTable[] = [];

    const visit = (node: ts.Node) => {
        if (ts.isVariableStatement(node)) {
            const table = parseTableStatement(node);
            if (table) {
                tables.push(table);
            }
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return tables;
}

function parseTableStatement(statement: ts.VariableStatement): ExtractedTable | undefined {
    if (statement.declarationList.declarations.length !== 1) {
        return undefined;
    }

    const declaration = statement.declarationList.declarations[0];
    if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) {
        return undefined;
    }

    const callName = getCallName(declaration.initializer.expression);
    if (!callName || !TABLE_FUNCTIONS.has(callName)) {
        return undefined;
    }

    const exportName = ts.isIdentifier(declaration.name) ? declaration.name.text : undefined;
    if (!exportName) {
        return undefined;
    }

    const tableName = getStringLiteral(declaration.initializer.arguments[0]) ?? exportName;
    const columnsNode = declaration.initializer.arguments[1];
    const extraConfigNode = declaration.initializer.arguments[2];

    const columns = parseColumns(columnsNode);
    const { indexes, compoundUnique, compoundId } = parseExtraConfig(extraConfigNode);

    return {
        exportName,
        tableName,
        columns,
        indexes,
        compoundUnique,
        compoundId,
        description: getJsDocDescription(statement),
    };
}

function parseColumns(node: ts.Expression | undefined): ExtractedColumn[] {
    if (!node) {
        return [];
    }

    if (ts.isObjectLiteralExpression(node)) {
        return node.properties.flatMap((property) => {
            if (!ts.isPropertyAssignment(property) || !ts.isIdentifier(property.name)) {
                return [];
            }

            const column = parseColumn(property.name.text, property.initializer, property);
            return column ? [column] : [];
        });
    }

    if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
        const body = ts.isBlock(node.body)
            ? node.body.statements.find(ts.isReturnStatement)?.expression
            : node.body;

        return parseColumns(body);
    }

    return [];
}

function parseColumn(
    name: string,
    initializer: ts.Expression,
    propertyNode: ts.PropertyAssignment
): ExtractedColumn | undefined {
    if (!ts.isCallExpression(initializer) && !hasCallChain(initializer)) {
        return undefined;
    }

    try {
        const { baseCall, methods } = flattenCallChain(initializer);
        const columnType = getCallName(baseCall.expression) ?? "unknown";
        const dbName = getStringLiteral(baseCall.arguments[0]) ?? name;
        const modifiers = methods.flatMap((method) => parseModifier(method.name, method.call));

        return {
            name,
            columnType,
            dbName,
            modifiers,
            description: getJsDocDescription(propertyNode),
        };
    } catch {
        return undefined;
    }
}

function hasCallChain(expression: ts.Expression): boolean {
    if (ts.isCallExpression(expression)) {
        return true;
    }

    return ts.isPropertyAccessExpression(expression) && hasCallChain(expression.expression);
}

function parseModifier(name: string, call: ts.CallExpression): ColumnModifier[] {
    if (name === "primaryKey") {
        return [{ kind: "primaryKey" }];
    }

    if (name === "notNull") {
        return [{ kind: "notNull" }];
    }

    if (name === "unique") {
        return [{ kind: "unique" }];
    }

    if (name === "references") {
        const target = call.arguments[0] ? parseReferenceTarget(call.arguments[0]) : undefined;
        if (!target) {
            return [];
        }

        return [{ kind: "references", table: target.table, field: target.field }];
    }

    if (name === "default" || DEFAULT_FUNCTION_MODIFIERS.has(name)) {
        const literal = call.arguments[0] ? expressionToLiteral(call.arguments[0]) : undefined;
        return [{
            kind: "default",
            modifier: name,
            value: literal ?? name,
        }];
    }

    return [];
}

function parseExtraConfig(node: ts.Expression | undefined): {
    indexes: ExtractedIndex[];
    compoundUnique: string[][];
    compoundId: string[][];
} {
    const indexes: ExtractedIndex[] = [];
    const compoundUnique: string[][] = [];
    const compoundId: string[][] = [];

    if (!node) {
        return { indexes, compoundUnique, compoundId };
    }

    const configBody = ts.isArrowFunction(node) || ts.isFunctionExpression(node)
        ? (ts.isBlock(node.body)
            ? node.body.statements.find(ts.isReturnStatement)?.expression
            : node.body)
        : node;

    if (!configBody) {
        return { indexes, compoundUnique, compoundId };
    }

    const entries = ts.isArrayLiteralExpression(configBody)
        ? configBody.elements
        : [configBody];

    for (const entry of entries) {
        if (!ts.isCallExpression(entry)) {
            continue;
        }

        const fnName = getCallName(entry.expression);
        if (fnName === "index") {
            const index = parseIndexCall(entry);
            if (index) {
                indexes.push(index);
            }
            continue;
        }

        if (fnName === "unique") {
            const fields = parseConstraintFields(entry.arguments[0]);
            if (fields.length > 0) {
                compoundUnique.push(fields);
            }
            continue;
        }

        if (fnName === "primaryKey") {
            const fields = parsePrimaryKeyFields(entry.arguments[0]);
            if (fields.length > 0) {
                compoundId.push(fields);
            }
        }
    }

    return { indexes, compoundUnique, compoundId };
}

function parseIndexCall(call: ts.CallExpression): ExtractedIndex | undefined {
    const name = getStringLiteral(call.arguments[0]);
    const onCall = call.arguments.find((arg) => ts.isCallExpression(arg) && getCallName(arg.expression) === "on");

    if (!onCall || !ts.isCallExpression(onCall)) {
        return { name, fields: [] };
    }

    const fields = onCall.arguments
        .map((arg) => {
            if (ts.isPropertyAccessExpression(arg)) {
                return arg.name.text;
            }

            return undefined;
        })
        .filter((field): field is string => Boolean(field));

    return { name, fields };
}

function parseConstraintFields(node: ts.Expression | undefined): string[] {
    if (!node || !ts.isCallExpression(node) || getCallName(node.expression) !== "on") {
        return [];
    }

    return node.arguments
        .map((arg) => (ts.isPropertyAccessExpression(arg) ? arg.name.text : undefined))
        .filter((field): field is string => Boolean(field));
}

function parsePrimaryKeyFields(node: ts.Expression | undefined): string[] {
    if (!node || !ts.isObjectLiteralExpression(node)) {
        return [];
    }

    const columnsProperty = node.properties.find(
        (property) => ts.isPropertyAssignment(property)
            && ts.isIdentifier(property.name)
            && property.name.text === "columns"
    );

    if (!columnsProperty || !ts.isPropertyAssignment(columnsProperty)) {
        return [];
    }

    if (!ts.isArrayLiteralExpression(columnsProperty.initializer)) {
        return [];
    }

    return columnsProperty.initializer.elements
        .map((element) => (ts.isPropertyAccessExpression(element) ? element.name.text : undefined))
        .filter((field): field is string => Boolean(field));
}
