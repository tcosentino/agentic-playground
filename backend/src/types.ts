export interface AIRequest {
  provider: 'anthropic' | 'openai';
  model: string;
  messages: Array<{
    role: string;
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
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

export interface ErrorResponse {
  error: string;
  details?: any;
}
