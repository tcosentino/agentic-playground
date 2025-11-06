import { FunctionDefinition } from '../types/functions';

/**
 * Converts function definition to OpenAI tool schema format
 */
export function toOpenAISchema(functionDef: FunctionDefinition): object {
  if (!functionDef.parameters) {
    return {
      type: 'function',
      function: {
        name: functionDef.name,
        description: functionDef.description,
        parameters: {
          type: 'object',
          properties: {},
          required: []
        }
      }
    };
  }

  const properties: Record<string, any> = {};

  for (const [name, prop] of Object.entries(functionDef.parameters.properties)) {
    properties[name] = {
      type: prop.type,
      ...(prop.description && { description: prop.description })
    };
  }

  return {
    type: 'function',
    function: {
      name: functionDef.name,
      description: functionDef.description,
      parameters: {
        type: 'object',
        properties,
        required: functionDef.parameters.required
      }
    }
  };
}

/**
 * Converts function definition to Anthropic tool schema format
 */
export function toAnthropicSchema(functionDef: FunctionDefinition): object {
  if (!functionDef.parameters) {
    return {
      name: functionDef.name,
      description: functionDef.description,
      input_schema: {
        type: 'object',
        properties: {},
        required: []
      }
    };
  }

  const properties: Record<string, any> = {};

  for (const [name, prop] of Object.entries(functionDef.parameters.properties)) {
    properties[name] = {
      type: prop.type,
      ...(prop.description && { description: prop.description })
    };
  }

  return {
    name: functionDef.name,
    description: functionDef.description,
    input_schema: {
      type: 'object',
      properties,
      required: functionDef.parameters.required
    }
  };
}
