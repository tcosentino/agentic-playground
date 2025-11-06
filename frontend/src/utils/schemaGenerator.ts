import { FunctionDefinition, ParameterSchema, ParameterProperty } from '../types/functions';

/**
 * Anthropic Tool Schema format
 */
export interface AnthropicToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, AnthropicPropertySchema>;
    required: string[];
  };
}

interface AnthropicPropertySchema {
  type: string;
  description: string;
  items?: AnthropicPropertySchema;
  properties?: Record<string, AnthropicPropertySchema>;
  enum?: any[];
}

/**
 * Converts our internal ParameterSchema to Anthropic's tool input_schema format
 */
export function generateAnthropicToolSchema(
  functionDef: FunctionDefinition
): AnthropicToolSchema | null {
  if (!functionDef.validation?.isValid || !functionDef.parameters) {
    return null;
  }

  const inputSchema = convertParameterSchemaToAnthropic(functionDef.parameters);

  return {
    name: functionDef.validation.exportedFunctionName || functionDef.name,
    description: functionDef.description || 'No description provided',
    input_schema: inputSchema,
  };
}

function convertParameterSchemaToAnthropic(schema: ParameterSchema): {
  type: 'object';
  properties: Record<string, AnthropicPropertySchema>;
  required: string[];
} {
  const properties: Record<string, AnthropicPropertySchema> = {};

  for (const [key, prop] of Object.entries(schema.properties)) {
    properties[key] = convertPropertyToAnthropic(prop);
  }

  return {
    type: 'object',
    properties,
    required: schema.required,
  };
}

function convertPropertyToAnthropic(prop: ParameterProperty): AnthropicPropertySchema {
  const anthropicProp: AnthropicPropertySchema = {
    type: prop.type,
    description: prop.description,
  };

  if (prop.items) {
    anthropicProp.items = convertPropertyToAnthropic(prop.items);
  }

  if (prop.properties) {
    anthropicProp.properties = {};
    for (const [key, nestedProp] of Object.entries(prop.properties)) {
      anthropicProp.properties[key] = convertPropertyToAnthropic(nestedProp);
    }
  }

  if (prop.enum) {
    anthropicProp.enum = prop.enum;
  }

  return anthropicProp;
}

/**
 * Generates a JSON Schema representation for display/export
 */
export function generateJSONSchema(functionDef: FunctionDefinition): object | null {
  if (!functionDef.parameters) {
    return null;
  }

  return {
    $schema: 'http://json-schema.org/draft-07/schema#',
    type: 'object',
    title: functionDef.name,
    description: functionDef.description,
    properties: functionDef.parameters.properties,
    required: functionDef.parameters.required,
  };
}

/**
 * Formats tool schema for display in the UI
 */
export function formatToolSchemaForDisplay(functionDef: FunctionDefinition): string {
  const anthropicSchema = generateAnthropicToolSchema(functionDef);
  if (!anthropicSchema) {
    return 'No valid schema available';
  }

  return JSON.stringify(anthropicSchema, null, 2);
}
