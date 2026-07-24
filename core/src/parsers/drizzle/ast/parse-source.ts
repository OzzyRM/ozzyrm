import ts from "typescript";
import type { ParsedSchemaFile } from "../types/internal";
import { extractEnums } from "./extract-enums";
import { extractTables } from "./extract-tables";

export function parseSchemaFile(content: string, filePath: string): ParsedSchemaFile {
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
    );

    return {
        enums: extractEnums(sourceFile),
        tables: extractTables(sourceFile),
    };
}

export function getCallName(expression: ts.Expression): string | undefined {
    if (ts.isIdentifier(expression)) {
        return expression.text;
    }

    if (ts.isPropertyAccessExpression(expression)) {
        return expression.name.text;
    }

    return undefined;
}

export function getStringLiteral(node: ts.Node | undefined): string | undefined {
    if (!node) {
        return undefined;
    }

    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
        return node.text;
    }

    return undefined;
}

export function getJsDocDescription(node: ts.Node): string | undefined {
    const docs = ts.getJSDocCommentsAndTags(node);
    for (const doc of docs) {
        if (ts.isJSDoc(doc) && doc.comment) {
            return typeof doc.comment === "string"
                ? doc.comment.trim()
                : doc.comment.map((part) => part.text).join("").trim();
        }
    }

    return undefined;
}

export function flattenCallChain(expression: ts.Expression): {
    baseCall: ts.CallExpression;
    methods: Array<{ name: string; call: ts.CallExpression }>;
} {
    const methods: Array<{ name: string; call: ts.CallExpression }> = [];
    let current: ts.Expression = expression;

    while (ts.isCallExpression(current)) {
        if (ts.isPropertyAccessExpression(current.expression)) {
            methods.unshift({
                name: current.expression.name.text,
                call: current,
            });
            current = current.expression.expression;
            continue;
        }

        break;
    }

    if (!ts.isCallExpression(current)) {
        throw new Error("Expected a call expression chain");
    }

    return { baseCall: current, methods };
}

export function parseReferenceTarget(expression: ts.Expression): { table: string; field: string } | undefined {
    if (!ts.isArrowFunction(expression)) {
        return undefined;
    }

    const body = expression.body;
    if (!ts.isPropertyAccessExpression(body)) {
        return undefined;
    }

    const field = body.name.text;
    const tableExpression = body.expression;

    if (ts.isIdentifier(tableExpression)) {
        return { table: tableExpression.text, field };
    }

    return undefined;
}

export function expressionToLiteral(expression: ts.Expression): string | undefined {
    if (ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) {
        return expression.text;
    }

    if (ts.isNumericLiteral(expression)) {
        return expression.text;
    }

    if (expression.kind === ts.SyntaxKind.TrueKeyword) {
        return "true";
    }

    if (expression.kind === ts.SyntaxKind.FalseKeyword) {
        return "false";
    }

    if (ts.isPrefixUnaryExpression(expression) && expression.operator === ts.SyntaxKind.MinusToken) {
        const operand = expressionToLiteral(expression.operand);
        return operand ? `-${operand}` : undefined;
    }

    return undefined;
}
