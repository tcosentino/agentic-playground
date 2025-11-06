import ts from 'typescript';

/**
 * Generates JSDoc comment for a function based on its signature
 */
export function generateJSDoc(code: string): string | null {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );

  let jsDocComment: string | null = null;

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      const functionName = node.name?.text || 'function';
      const params: Array<{ name: string; type: string; optional: boolean }> = [];
      const returns: Array<{ name: string; type: string }> = [];

      // Extract parameters
      const firstParam = node.parameters[0];
      if (firstParam && firstParam.type && ts.isTypeLiteralNode(firstParam.type)) {
        for (const member of firstParam.type.members) {
          if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
            const paramName = member.name.text;
            const paramType = member.type ? member.type.getText(sourceFile) : 'any';
            const isOptional = !!member.questionToken;
            params.push({ name: paramName, type: paramType, optional: isOptional });
          }
        }
      }

      // Extract return type properties
      if (node.type) {
        let returnTypeNode: ts.TypeNode = node.type;

        // Unwrap Promise<...>
        if (ts.isTypeReferenceNode(returnTypeNode) && returnTypeNode.typeName.getText(sourceFile) === 'Promise') {
          if (returnTypeNode.typeArguments && returnTypeNode.typeArguments.length > 0) {
            returnTypeNode = returnTypeNode.typeArguments[0];
          }
        }

        // Extract properties from object type
        if (ts.isTypeLiteralNode(returnTypeNode)) {
          for (const member of returnTypeNode.members) {
            if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
              const propName = member.name.text;
              const propType = member.type ? member.type.getText(sourceFile) : 'any';
              returns.push({ name: propName, type: propType });
            }
          }
        }
      }

      // Build JSDoc comment
      const lines: string[] = [];
      lines.push('/**');
      lines.push(` * ${functionName} - Add description here`);

      // Add @param tags
      for (const param of params) {
        const optionalText = param.optional ? ' (optional)' : '';
        lines.push(` * @param params.${param.name} - Description for ${param.name}${optionalText}`);
      }

      // Add @returns tags
      for (const ret of returns) {
        lines.push(` * @returns ${ret.name} - Description for ${ret.name}`);
      }

      lines.push(' */');

      jsDocComment = lines.join('\n');
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return jsDocComment;
}

/**
 * Adds JSDoc comment to code if it doesn't have one
 */
export function addJSDocToCode(code: string): string {
  const jsDoc = generateJSDoc(code);
  if (!jsDoc) return code;

  // Find the export function line
  const lines = code.split('\n');
  let insertIndex = -1;

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim().startsWith('export')) {
      insertIndex = i;
      break;
    }
  }

  if (insertIndex === -1) return code;

  // Insert JSDoc above the export
  lines.splice(insertIndex, 0, jsDoc);
  return lines.join('\n');
}

/**
 * Updates existing JSDoc to add missing @param and @returns tags
 */
export function updateJSDoc(code: string): string {
  const sourceFile = ts.createSourceFile(
    'temp.ts',
    code,
    ts.ScriptTarget.Latest,
    true
  );

  let updatedCode = code;

  function visit(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword)) {
      // Get existing JSDoc
      const jsDocTags = ts.getJSDocCommentsAndTags(node);
      if (!jsDocTags || jsDocTags.length === 0) return;

      const existingParams = new Set<string>();
      const existingReturns = new Set<string>();

      // Parse existing @param and @returns tags
      for (const tag of jsDocTags) {
        if (ts.isJSDoc(tag) && tag.tags) {
          for (const jsDocTag of tag.tags) {
            if (ts.isJSDocParameterTag(jsDocTag)) {
              const fullText = sourceFile.getFullText();
              const nameText = fullText.substring(jsDocTag.name.pos, jsDocTag.name.end).trim();
              const paramMatch = nameText.match(/params\.(\w+)/);
              if (paramMatch) {
                existingParams.add(paramMatch[1]);
              }
            }
            if (ts.isJSDocReturnTag(jsDocTag) || jsDocTag.tagName.text === 'returns' || jsDocTag.tagName.text === 'return') {
              if (jsDocTag.comment) {
                const commentText = typeof jsDocTag.comment === 'string'
                  ? jsDocTag.comment
                  : Array.isArray(jsDocTag.comment)
                    ? jsDocTag.comment.map(c => c.text).join('')
                    : '';
                const propMatch = commentText.match(/(\w+)\s*-/);
                if (propMatch) {
                  existingReturns.add(propMatch[1]);
                }
              }
            }
          }
        }
      }

      // Find missing params
      const missingParams: Array<{ name: string; optional: boolean }> = [];
      const firstParam = node.parameters[0];
      if (firstParam && firstParam.type && ts.isTypeLiteralNode(firstParam.type)) {
        for (const member of firstParam.type.members) {
          if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
            const paramName = member.name.text;
            if (!existingParams.has(paramName)) {
              missingParams.push({ name: paramName, optional: !!member.questionToken });
            }
          }
        }
      }

      // Find missing returns
      const missingReturns: string[] = [];
      if (node.type) {
        let returnTypeNode: ts.TypeNode = node.type;

        if (ts.isTypeReferenceNode(returnTypeNode) && returnTypeNode.typeName.getText(sourceFile) === 'Promise') {
          if (returnTypeNode.typeArguments && returnTypeNode.typeArguments.length > 0) {
            returnTypeNode = returnTypeNode.typeArguments[0];
          }
        }

        if (ts.isTypeLiteralNode(returnTypeNode)) {
          for (const member of returnTypeNode.members) {
            if (ts.isPropertySignature(member) && member.name && ts.isIdentifier(member.name)) {
              const propName = member.name.text;
              if (!existingReturns.has(propName)) {
                missingReturns.push(propName);
              }
            }
          }
        }
      }

      // Add missing tags to JSDoc
      if (missingParams.length > 0 || missingReturns.length > 0) {
        const jsDocNode = jsDocTags[0];
        if (ts.isJSDoc(jsDocNode)) {
          const jsDocText = sourceFile.getFullText().substring(jsDocNode.pos, jsDocNode.end);

          // Find the closing */
          const closingIndex = jsDocText.lastIndexOf('*/');
          if (closingIndex !== -1) {
            const newTags: string[] = [];

            for (const param of missingParams) {
              const optionalText = param.optional ? ' (optional)' : '';
              newTags.push(` * @param params.${param.name} - Description for ${param.name}${optionalText}`);
            }

            for (const ret of missingReturns) {
              newTags.push(` * @returns ${ret} - Description for ${ret}`);
            }

            const before = updatedCode.substring(0, jsDocNode.pos + closingIndex);
            const after = updatedCode.substring(jsDocNode.pos + closingIndex);
            updatedCode = before + '\n' + newTags.join('\n') + '\n' + after;
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return updatedCode;
}
