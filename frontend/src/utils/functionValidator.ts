import { FunctionValidation, ValidationError, ParameterSchema, ReturnTypeSchema } from '../types/functions';
import { parseParameterSchema, parseReturnType, parseFunctionDescription, parseReturnTypeSchema } from './tsParser';

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
 * Extracts parameter schema from TypeScript function signature using TS compiler API
 */
export function extractParameterSchema(code: string): ParameterSchema | null {
  return parseParameterSchema(code);
}

/**
 * Extracts return type from TypeScript function signature using TS compiler API
 */
export function extractReturnType(code: string): string | null {
  return parseReturnType(code);
}

/**
 * Extracts JSDoc description from function
 */
export function extractFunctionDescription(code: string): string | null {
  return parseFunctionDescription(code);
}

/**
 * Generates a complete validation with schema extraction
 */
export function validateAndExtractSchema(code: string): {
  validation: FunctionValidation;
  parameters: ParameterSchema | null;
  returnType: string | null;
  returnTypeSchema: ReturnTypeSchema | null;
  description: string | null;
} {
  const validation = validateFunctionCode(code);
  const parameters = extractParameterSchema(code);
  const returnType = extractReturnType(code);
  const returnTypeSchema = parseReturnTypeSchema(code);
  const description = extractFunctionDescription(code);

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

  // Add warning for missing JSDoc description
  if (validation.isValid && !description) {
    validation.errors.push({
      message: 'No JSDoc description found. Add a /** ... */ comment above the function.',
      severity: 'warning',
    });
  }

  // Add warnings for missing parameter descriptions
  if (validation.isValid && parameters) {
    const missingDescriptions: string[] = [];
    for (const [paramName, param] of Object.entries(parameters.properties)) {
      if (!param.description || param.description.trim() === '') {
        missingDescriptions.push(paramName);
      }
    }
    if (missingDescriptions.length > 0) {
      validation.errors.push({
        message: `Missing JSDoc descriptions for parameters: ${missingDescriptions.join(', ')}. Add @param tags in JSDoc comment.`,
        severity: 'warning',
      });
    }
  }

  return {
    validation,
    parameters,
    returnType,
    returnTypeSchema,
    description,
  };
}
