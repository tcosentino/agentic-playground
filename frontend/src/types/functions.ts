export interface ParameterProperty {
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  description: string;
  items?: ParameterProperty; // For arrays
  properties?: Record<string, ParameterProperty>; // For nested objects
  enum?: any[];
}

export interface ParameterSchema {
  type: 'object';
  properties: Record<string, ParameterProperty>;
  required: string[];
}

export interface ValidationError {
  line?: number;
  message: string;
  severity: 'error' | 'warning';
}

export interface FunctionValidation {
  isValid: boolean;
  hasExport: boolean;
  exportedFunctionName?: string;
  errors: ValidationError[];
}

export interface ReturnTypeSchema {
  [key: string]: {
    type: string;
    description?: string;
  };
}

export interface FunctionDefinition {
  id: string;
  name: string;
  description: string;
  code: string;
  parameters?: ParameterSchema;
  returnType?: string;
  returnTypeSchema?: ReturnTypeSchema;
  validation?: FunctionValidation;
  createdAt: string;
  updatedAt: string;
}

export interface FunctionsState {
  functions: FunctionDefinition[];
  selectedFunctionId: string | null;
}
