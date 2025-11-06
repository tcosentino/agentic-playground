import { AIResponse } from '../types.js';
import { FunctionDefinition } from '../types.js';

/**
 * Storage interface that can be implemented with different backends
 * (file system, database, cloud storage, etc.)
 */
export interface IStorage {
  // History operations
  saveHistory(response: AIResponse): Promise<void>;
  getHistory(limit?: number): Promise<AIResponse[]>;
  clearHistory(): Promise<void>;

  // Function operations
  saveFunctions(functions: FunctionDefinition[]): Promise<void>;
  getFunctions(): Promise<FunctionDefinition[]>;
}
