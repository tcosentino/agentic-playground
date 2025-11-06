export interface AIRequest {
  provider: 'anthropic' | 'openai';
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
  tools?: Array<{
    name: string;
    description: string;
    input_schema: {
      type: 'object';
      properties: Record<string, any>;
      required: string[];
    };
  }>;
}

export interface ToolUse {
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface AIResponse {
  id: string;
  timestamp: string;
  provider: 'anthropic' | 'openai';
  request: {
    raw: any;
    formatted: string;
  };
  response: {
    raw: any;
    formatted: string;
    content: string;
    toolUses?: ToolUse[];
    stopReason?: string;
  };
  duration: number;
}

export interface ErrorResponse {
  error: string;
  details?: any;
}

export interface FunctionDefinition {
  id: string;
  name: string;
  description: string;
  code: string;
  parameters?: any;
  returnType?: string;
  validation?: any;
  createdAt: string;
  updatedAt: string;
}
