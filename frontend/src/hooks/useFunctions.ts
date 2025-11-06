import { useState, useEffect } from 'react';
import { FunctionDefinition } from '../types/functions';

const STORAGE_KEY = 'ai-playground-functions';

/**
 * Returns an example function template with proper TypeScript typing
 */
function getExampleTemplate(name: string, description: string): string {
  return `/**
 * ${description || 'Function description'}
 */
export async function ${name}(params: {
  query: string; // The search query
  maxResults?: number; // Maximum number of results to return
}): Promise<{ success: boolean; data: any }> {
  // Your implementation here
  const { query, maxResults = 10 } = params;

  // Example: call an API, process data, etc.
  const results = await fetch(\`https://api.example.com/search?q=\${query}&limit=\${maxResults}\`);
  const data = await results.json();

  return {
    success: true,
    data
  };
}`;
}

/**
 * Returns example functions to initialize the workspace
 */
function getExampleFunctions(): FunctionDefinition[] {
  const now = new Date().toISOString();

  return [
    {
      id: crypto.randomUUID(),
      name: 'getCurrentWeather',
      description: 'Get the current weather for a location',
      code: `/**
 * Get the current weather for a specific location
 */
export async function getCurrentWeather(params: {
  location: string; // City name or coordinates (e.g., "San Francisco" or "37.7749,-122.4194")
  units?: 'celsius' | 'fahrenheit'; // Temperature units (default: celsius)
}): Promise<{
  temperature: number;
  conditions: string;
  humidity: number;
  windSpeed: number;
}> {
  const { location, units = 'celsius' } = params;

  // Example implementation - replace with actual weather API
  const response = await fetch(
    \`https://api.weather.com/v1/current?location=\${encodeURIComponent(location)}&units=\${units}\`
  );

  const data = await response.json();

  return {
    temperature: data.temp,
    conditions: data.weather,
    humidity: data.humidity,
    windSpeed: data.wind_speed
  };
}`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: 'searchDatabase',
      description: 'Search through a database of records',
      code: `/**
 * Search through database records with filters
 */
export async function searchDatabase(params: {
  query: string; // Search query string
  table: string; // Database table name
  limit?: number; // Maximum number of results (default: 100)
  sortBy?: string; // Field to sort by
  sortOrder?: 'asc' | 'desc'; // Sort order (default: asc)
}): Promise<{
  results: Array<Record<string, any>>;
  totalCount: number;
  page: number;
}> {
  const { query, table, limit = 100, sortBy = 'id', sortOrder = 'asc' } = params;

  // Example implementation - replace with actual database query
  const response = await fetch('/api/database/search', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, table, limit, sortBy, sortOrder })
  });

  const data = await response.json();

  return {
    results: data.rows,
    totalCount: data.total,
    page: data.page
  };
}`,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: 'sendEmail',
      description: 'Send an email message',
      code: `/**
 * Send an email to one or more recipients
 */
export async function sendEmail(params: {
  to: string[]; // Array of recipient email addresses
  subject: string; // Email subject line
  body: string; // Email body content
  from?: string; // Sender email address (optional)
  cc?: string[]; // CC recipients (optional)
  attachments?: Array<{ filename: string; url: string }>; // File attachments (optional)
}): Promise<{
  success: boolean;
  messageId: string;
  timestamp: string;
}> {
  const { to, subject, body, from, cc, attachments } = params;

  // Example implementation - replace with actual email service
  const response = await fetch('/api/email/send', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ to, subject, body, from, cc, attachments })
  });

  const data = await response.json();

  return {
    success: data.success,
    messageId: data.id,
    timestamp: new Date().toISOString()
  };
}`,
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function useFunctions() {
  const [functions, setFunctions] = useState<FunctionDefinition[]>([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);

  // Load functions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // Initialize with examples if stored array is empty
        if (Array.isArray(parsed) && parsed.length === 0) {
          const examples = getExampleFunctions();
          setFunctions(examples);
        } else {
          setFunctions(parsed);
        }
      } catch (error) {
        console.error('Failed to load functions from localStorage:', error);
      }
    } else {
      // Initialize with example functions if none exist
      const examples = getExampleFunctions();
      setFunctions(examples);
    }
  }, []);

  // Save functions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(functions));
  }, [functions]);

  const createFunction = (name: string, description: string): FunctionDefinition => {
    const newFunction: FunctionDefinition = {
      id: crypto.randomUUID(),
      name,
      description,
      code: getExampleTemplate(name, description),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFunctions((prev) => [...prev, newFunction]);
    setSelectedFunctionId(newFunction.id);
    return newFunction;
  };

  const updateFunction = (id: string, updates: Partial<Omit<FunctionDefinition, 'id' | 'createdAt'>>) => {
    setFunctions((prev) =>
      prev.map((fn) =>
        fn.id === id
          ? { ...fn, ...updates, updatedAt: new Date().toISOString() }
          : fn
      )
    );
  };

  const deleteFunction = (id: string) => {
    setFunctions((prev) => prev.filter((fn) => fn.id !== id));
    if (selectedFunctionId === id) {
      setSelectedFunctionId(null);
    }
  };

  const getFunction = (id: string): FunctionDefinition | undefined => {
    return functions.find((fn) => fn.id === id);
  };

  const selectedFunction = selectedFunctionId
    ? getFunction(selectedFunctionId)
    : null;

  return {
    functions,
    selectedFunction,
    selectedFunctionId,
    setSelectedFunctionId,
    createFunction,
    updateFunction,
    deleteFunction,
    getFunction,
  };
}
