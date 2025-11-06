import { FunctionValidation, ValidationError, ParameterSchema, ParameterProperty } from '../types/functions';

/**
 * Validates that the code has exactly one exported function
 */
export function validateFunctionCode(code: string): FunctionValidation {
  const errors: ValidationError[] = [];
  let hasExport = false;
  let exportedFunctionName: string | undefined;

  // Check for exported function
  const exportRegex = /export\s+(async\s+)?function\s+(\w+)/g;
  const exportMatches = Array.from(code.matchAll(exportRegex));

  if (exportMatches.length === 0) {
    errors.push({
      message: 'No exported function found. You must export exactly one function.',
      severity: 'error',
    });
  } else if (exportMatches.length > 1) {
    errors.push({
      message: `Found ${exportMatches.length} exported functions. Only one export is allowed.`,
      severity: 'error',
    });
  } else {
    hasExport = true;
    exportedFunctionName = exportMatches[0][2];
  }

  // Check for default exports (not allowed)
  if (/export\s+default/.test(code)) {
    errors.push({
      message: 'Default exports are not allowed. Use "export function name()" instead.',
      severity: 'error',
    });
  }

  // Check for arrow function exports
  const arrowExportRegex = /export\s+const\s+(\w+)\s*=\s*(async\s*)?\([^)]*\)\s*=>/;
  const arrowMatch = code.match(arrowExportRegex);
  if (arrowMatch) {
    if (!exportedFunctionName) {
      hasExport = true;
      exportedFunctionName = arrowMatch[1];
    }
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    hasExport,
    exportedFunctionName,
    errors,
  };
}

/**
 * Extracts parameter schema from TypeScript function signature
 * This is a simplified parser - in production, you'd use @typescript/compiler API
 */
export function extractParameterSchema(code: string): ParameterSchema | null {
  // Match function signature with typed parameters
  const functionRegex = /export\s+(?:async\s+)?function\s+\w+\s*\(\s*params\s*:\s*\{([^}]+)\}/;
  const match = code.match(functionRegex);

  if (!match) {
    return null;
  }

  const paramsString = match[1];
  const properties: Record<string, ParameterProperty> = {};
  const required: string[] = [];

  // Parse each parameter line
  const paramLines = paramsString.split(/[,;]/).map(l => l.trim()).filter(l => l);

  for (const line of paramLines) {
    const paramMatch = line.match(/(\w+)(\?)?:\s*([\w\[\]<>]+)(?:\/\/\s*(.*))?/);
    if (paramMatch) {
      const [, name, optional, type, comment] = paramMatch;

      properties[name] = {
        type: mapTypeScriptTypeToJsonSchema(type),
        description: comment?.trim() || '',
      };

      if (!optional) {
        required.push(name);
      }
    }
  }

  return {
    type: 'object',
    properties,
    required,
  };
}

/**
 * Maps TypeScript types to JSON Schema types
 */
function mapTypeScriptTypeToJsonSchema(tsType: string): ParameterProperty['type'] {
  const normalized = tsType.toLowerCase().replace(/\s/g, '');

  if (normalized.includes('string')) return 'string';
  if (normalized.includes('number')) return 'number';
  if (normalized.includes('boolean')) return 'boolean';
  if (normalized.includes('[]') || normalized.includes('array')) return 'array';

  return 'object';
}

/**
 * Extracts return type from TypeScript function signature
 */
export function extractReturnType(code: string): string | null {
  // Match Promise<Type> or Type return types
  const returnTypeRegex = /export\s+(?:async\s+)?function\s+\w+\s*\([^)]*\)\s*:\s*(?:Promise<)?([^>{]+)>?/;
  const match = code.match(returnTypeRegex);

  if (match) {
    return match[1].trim();
  }

  return null;
}

/**
 * Generates a complete validation with schema extraction
 */
export function validateAndExtractSchema(code: string): {
  validation: FunctionValidation;
  parameters: ParameterSchema | null;
  returnType: string | null;
} {
  const validation = validateFunctionCode(code);
  const parameters = extractParameterSchema(code);
  const returnType = extractReturnType(code);

  // Add warnings for missing schemas
  if (validation.isValid && !parameters) {
    validation.errors.push({
      message: 'No parameter schema detected. Use "params: { name: type }" format.',
      severity: 'warning',
    });
  }

  if (validation.isValid && !returnType) {
    validation.errors.push({
      message: 'No return type annotation found. Add ": ReturnType" after parameters.',
      severity: 'warning',
    });
  }

  return {
    validation,
    parameters,
    returnType,
  };
}
