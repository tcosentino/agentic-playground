export interface Message {
  role: string;
  content: string;
}

export interface AIRequest {
  provider: 'anthropic' | 'openai';
  model: string;
  messages: Message[];
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
  };
  duration: number;
}
