import { useState, useEffect } from 'react';
import { FunctionDefinition } from '../types/functions';
import { validateAndExtractSchema } from '../utils/functionValidator';

const STORAGE_KEY = 'ai-playground-functions';

/**
 * Returns an example function template with proper TypeScript typing
 */
function getExampleTemplate(name: string, description: string): string {
  return `/**
 * ${description || 'Function description'}
 * @param params.query - The search query
 * @param params.maxResults - Maximum number of results to return
 */
export async function ${name}(params: {
  query: string;
  maxResults?: number;
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

  const weatherCode = `/**
 * Get the current weather for a specific location
 * @param params.location - City name or coordinates (e.g., "San Francisco" or "37.7749,-122.4194")
 * @param params.units - Temperature units (default: celsius)
 * @returns temperature - Current temperature in specified units
 * @returns conditions - Weather conditions description
 * @returns humidity - Humidity percentage
 * @returns windSpeed - Wind speed in km/h or mph
 */
export async function getCurrentWeather(params: {
  location: string;
  units?: 'celsius' | 'fahrenheit';
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
}`;

  const searchCode = `/**
 * Search through database records with filters
 * @param params.query - Search query string
 * @param params.table - Database table name
 * @param params.limit - Maximum number of results (default: 100)
 * @param params.sortBy - Field to sort by
 * @param params.sortOrder - Sort order (default: asc)
 * @returns results - Array of matching database records
 * @returns totalCount - Total number of matching records
 * @returns page - Current page number
 */
export async function searchDatabase(params: {
  query: string;
  table: string;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
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
}`;

  const emailCode = `/**
 * Send an email to one or more recipients
 * @param params.to - Array of recipient email addresses
 * @param params.subject - Email subject line
 * @param params.body - Email body content
 * @param params.from - Sender email address (optional)
 * @param params.cc - CC recipients (optional)
 * @param params.attachments - File attachments (optional)
 * @returns success - Whether the email was sent successfully
 * @returns messageId - Unique identifier for the sent message
 * @returns timestamp - ISO timestamp when the email was sent
 */
export async function sendEmail(params: {
  to: string[];
  subject: string;
  body: string;
  from?: string;
  cc?: string[];
  attachments?: Array<{ filename: string; url: string }>;
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
}`;

  const invalidCode = `// This function has multiple validation issues
export async function processData(data) {
  // Missing JSDoc comment
  // Missing parameter type annotation
  // Missing return type
  // Missing parameter descriptions

  const result = await fetch('/api/process', {
    method: 'POST',
    body: JSON.stringify(data)
  });

  return result.json();
}`;

  // Validate and extract schemas for each example
  const weatherSchema = validateAndExtractSchema(weatherCode);
  const searchSchema = validateAndExtractSchema(searchCode);
  const emailSchema = validateAndExtractSchema(emailCode);
  const invalidSchema = validateAndExtractSchema(invalidCode);

  return [
    {
      id: crypto.randomUUID(),
      name: 'getCurrentWeather',
      description: 'Get the current weather for a location',
      code: weatherCode,
      validation: weatherSchema.validation,
      parameters: weatherSchema.parameters || undefined,
      returnType: weatherSchema.returnType || undefined,
      returnTypeSchema: weatherSchema.returnTypeSchema || undefined,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: 'searchDatabase',
      description: 'Search through a database of records',
      code: searchCode,
      validation: searchSchema.validation,
      parameters: searchSchema.parameters || undefined,
      returnType: searchSchema.returnType || undefined,
      returnTypeSchema: searchSchema.returnTypeSchema || undefined,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: 'sendEmail',
      description: 'Send an email message',
      code: emailCode,
      validation: emailSchema.validation,
      parameters: emailSchema.parameters || undefined,
      returnType: emailSchema.returnType || undefined,
      returnTypeSchema: emailSchema.returnTypeSchema || undefined,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: crypto.randomUUID(),
      name: 'processData',
      description: 'Example with validation issues',
      code: invalidCode,
      validation: invalidSchema.validation,
      parameters: invalidSchema.parameters || undefined,
      returnType: invalidSchema.returnType || undefined,
      returnTypeSchema: invalidSchema.returnTypeSchema || undefined,
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
          setSelectedFunctionId(examples[0]?.id || null);
        } else {
          setFunctions(parsed);
          setSelectedFunctionId(parsed[0]?.id || null);
        }
      } catch (error) {
        console.error('Failed to load functions from localStorage:', error);
      }
    } else {
      // Initialize with example functions if none exist
      const examples = getExampleFunctions();
      setFunctions(examples);
      setSelectedFunctionId(examples[0]?.id || null);
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

  const loadExamples = () => {
    const examples = getExampleFunctions();
    setFunctions(examples);
    setSelectedFunctionId(examples[0]?.id || null);
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
    loadExamples,
  };
}
