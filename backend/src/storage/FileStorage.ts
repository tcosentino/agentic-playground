import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { IStorage } from './IStorage.js';
import { AIResponse, FunctionDefinition } from '../types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * File-based storage implementation
 * Stores data as JSON files in a data directory
 */
export class FileStorage implements IStorage {
  private dataDir: string;
  private historyFile: string;
  private functionsFile: string;
  private historyCache: AIResponse[] = [];
  private maxHistoryItems: number;

  constructor(dataDir?: string, maxHistoryItems: number = 50) {
    this.dataDir = dataDir || path.join(__dirname, '..', '..', 'data');
    this.historyFile = path.join(this.dataDir, 'history.json');
    this.functionsFile = path.join(this.dataDir, 'functions.json');
    this.maxHistoryItems = maxHistoryItems;
  }

  /**
   * Ensures the data directory exists
   */
  private async ensureDataDir(): Promise<void> {
    try {
      await fs.access(this.dataDir);
    } catch {
      await fs.mkdir(this.dataDir, { recursive: true });
    }
  }

  /**
   * Loads history from disk into cache
   */
  private async loadHistoryCache(): Promise<void> {
    try {
      const data = await fs.readFile(this.historyFile, 'utf-8');
      this.historyCache = JSON.parse(data);
    } catch (error: any) {
      // File doesn't exist yet or is invalid
      if (error.code === 'ENOENT') {
        this.historyCache = [];
      } else {
        console.error('Error loading history cache:', error);
        this.historyCache = [];
      }
    }
  }

  /**
   * Saves history cache to disk
   */
  private async saveHistoryCache(): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(
      this.historyFile,
      JSON.stringify(this.historyCache, null, 2),
      'utf-8'
    );
  }

  /**
   * Initialize storage (load caches)
   */
  async initialize(): Promise<void> {
    await this.ensureDataDir();
    await this.loadHistoryCache();
  }

  // History operations
  async saveHistory(response: AIResponse): Promise<void> {
    // Add to beginning of array
    this.historyCache.unshift(response);

    // Trim to max size
    if (this.historyCache.length > this.maxHistoryItems) {
      this.historyCache = this.historyCache.slice(0, this.maxHistoryItems);
    }

    await this.saveHistoryCache();
  }

  async getHistory(limit?: number): Promise<AIResponse[]> {
    if (limit) {
      return this.historyCache.slice(0, limit);
    }
    return [...this.historyCache];
  }

  async clearHistory(): Promise<void> {
    this.historyCache = [];
    await this.saveHistoryCache();
  }

  // Function operations
  async saveFunctions(functions: FunctionDefinition[]): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(
      this.functionsFile,
      JSON.stringify(functions, null, 2),
      'utf-8'
    );
  }

  async getFunctions(): Promise<FunctionDefinition[]> {
    try {
      const data = await fs.readFile(this.functionsFile, 'utf-8');
      return JSON.parse(data);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }
}
