import ts from "typescript";
import { ENUM_FUNCTIONS } from "../constants";
import type { ExtractedEnum } from "../types/internal";
import { getCallName, getJsDocDescription, getStringLiteral } from "./parse-source";

export function extractEnums(sourceFile: ts.SourceFile): ExtractedEnum[] {
    const enums: ExtractedEnum[] = [];

    const visit = (node: ts.Node) => {
        if (ts.isVariableStatement(node)) {
            const enumDef = parseEnumStatement(node);
            if (enumDef) {
                enums.push(enumDef);
            }
        }

        ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return enums;
}

function parseEnumStatement(statement: ts.VariableStatement): ExtractedEnum | undefined {
    if (statement.declarationList.declarations.length !== 1) {
        return undefined;
    }

    const declaration = statement.declarationList.declarations[0];
    if (!declaration.initializer || !ts.isCallExpression(declaration.initializer)) {
        return undefined;
    }

    const callName = getCallName(declaration.initializer.expression);
    if (!callName || !ENUM_FUNCTIONS.has(callName)) {
        return undefined;
    }

    const exportName = ts.isIdentifier(declaration.name) ? declaration.name.text : undefined;
    if (!exportName) {
        return undefined;
    }

    const enumName = getStringLiteral(declaration.initializer.arguments[0]) ?? exportName;
    const values = parseEnumValues(declaration.initializer.arguments[1]);

    return {
        exportName,
        enumName,
        values,
        description: getJsDocDescription(statement),
    };
}

function parseEnumValues(node: ts.Expression | undefined): string[] {
    if (!node || !ts.isArrayLiteralExpression(node)) {
        return [];
    }

    return node.elements
        .map((element) => getStringLiteral(element))
        .filter((value): value is string => Boolean(value));
}
