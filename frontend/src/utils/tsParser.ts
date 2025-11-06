import ts from 'typescript';
import { ParameterSchema, ParameterProperty } from '../types/functions';

/**
 * Parses TypeScript code using the TypeScript compiler API
 * to extract parameter schemas accurately
 */
export function parseParameterSchema(code: string): ParameterSchema | null {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );

  let parameterSchema: ParameterSchema | null = null;

  function visit(node: ts.Node) {
    // Find exported function declarations
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      // Get JSDoc @param tags for descriptions
      const paramDescriptions = new Map<string, string>();
      const jsDocTags = ts.getJSDocCommentsAndTags(node);
      if (jsDocTags && jsDocTags.length > 0) {
        for (const tag of jsDocTags) {
          if (ts.isJSDoc(tag) && tag.tags) {
            for (const jsDocTag of tag.tags) {
              if (ts.isJSDocParameterTag(jsDocTag) && jsDocTag.name) {
                // Get the parameter name text (handles both "params.location" and just "location")
                const fullText = sourceFile.getFullText();
                const nameText = fullText.substring(jsDocTag.name.pos, jsDocTag.name.end).trim();

                // Extract property name from "params.propertyName" format
                const paramMatch = nameText.match(/params\.(\w+)/);
                if (paramMatch && jsDocTag.comment) {
                  const propName = paramMatch[1];
                  let comment = typeof jsDocTag.comment === 'string'
                    ? jsDocTag.comment
                    : Array.isArray(jsDocTag.comment)
                      ? jsDocTag.comment.map(c => c.text).join('')
                      : '';
                  // Strip leading " - " or "- " from JSDoc convention
                  comment = comment.trim().replace(/^-\s*/, '');
                  paramDescriptions.set(propName, comment);
                }
              }
            }
          }
        }
      }

      // Get the first parameter (should be 'params')
      const paramsParam = node.parameters[0];
      if (!paramsParam || !paramsParam.type) {
        return;
      }

      // Check if it's a typed object parameter
      if (ts.isTypeLiteralNode(paramsParam.type)) {
        const properties: Record<string, ParameterProperty> = {};
        const required: string[] = [];

        // Iterate through each property in the type literal
        for (const member of paramsParam.type.members) {
          if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
            const propName = member.name.text;
            const isOptional = !!member.questionToken;

            // Get description from JSDoc @param or inline comment
            let description = paramDescriptions.get(propName) || '';

            // Fallback to inline comment if no JSDoc
            if (!description) {
              const fullText = sourceFile.getFullText();
              const memberText = fullText.substring(member.pos, member.end);
              const commentMatch = memberText.match(/\/\/\s*(.+)/);
              if (commentMatch) {
                description = commentMatch[1].trim();
              }
            }

            // Get type
            let propertyType: ParameterProperty['type'] = 'string';
            if (member.type) {
              propertyType = mapTsTypeToJsonSchema(member.type, sourceFile);
            }

            properties[propName] = {
              type: propertyType,
              description,
            };

            if (!isOptional) {
              required.push(propName);
            }
          }
        }

        parameterSchema = {
          type: 'object',
          properties,
          required,
        };
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return parameterSchema;
}

/**
 * Maps TypeScript AST types to JSON Schema types
 */
function mapTsTypeToJsonSchema(typeNode: ts.TypeNode, sourceFile: ts.SourceFile): ParameterProperty['type'] {
  if (ts.isTypeReferenceNode(typeNode)) {
    const typeName = typeNode.typeName.getText(sourceFile).toLowerCase();
    if (typeName === 'string') return 'string';
    if (typeName === 'number') return 'number';
    if (typeName === 'boolean') return 'boolean';
    if (typeName === 'array') return 'array';
    return 'object';
  }

  if (typeNode.kind === ts.SyntaxKind.StringKeyword) return 'string';
  if (typeNode.kind === ts.SyntaxKind.NumberKeyword) return 'number';
  if (typeNode.kind === ts.SyntaxKind.BooleanKeyword) return 'boolean';

  if (ts.isArrayTypeNode(typeNode)) return 'array';

  if (ts.isUnionTypeNode(typeNode)) {
    // For union types like 'celsius' | 'fahrenheit', return string
    const hasStringLiteral = typeNode.types.some(t => t.kind === ts.SyntaxKind.StringKeyword || ts.isLiteralTypeNode(t));
    if (hasStringLiteral) return 'string';

    const hasNumber = typeNode.types.some(t => t.kind === ts.SyntaxKind.NumberKeyword);
    if (hasNumber) return 'number';
  }

  return 'string';
}

/**
 * Extracts return type using TypeScript compiler API
 */
export function parseReturnType(code: string): string | null {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );

  let returnType: string | null = null;

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (node.type) {
        returnType = node.type.getText(sourceFile);
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return returnType;
}

/**
 * Gets the exported function name using TypeScript compiler API
 */
export function parseExportedFunctionName(code: string): string | null {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );

  let functionName: string | null = null;

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      if (node.name) {
        functionName = node.name.text;
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return functionName;
}

/**
 * Extracts JSDoc comment description from the function
 */
export function parseFunctionDescription(code: string): string | null {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );

  let description: string | null = null;

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      // Get JSDoc tags
      const jsDocTags = ts.getJSDocCommentsAndTags(node);
      if (jsDocTags && jsDocTags.length > 0) {
        for (const tag of jsDocTags) {
          if (ts.isJSDoc(tag) && tag.comment) {
            // Extract the description from the JSDoc comment
            if (typeof tag.comment === 'string') {
              description = tag.comment.trim().replace(/^-\s*/, '');
            } else if (Array.isArray(tag.comment)) {
              description = tag.comment.map(c => c.text).join('').trim().replace(/^-\s*/, '');
            }
            break;
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return description;
}
