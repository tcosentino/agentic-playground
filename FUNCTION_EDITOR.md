# Function Editor Guide

The Function Editor allows you to create and manage custom TypeScript functions that can be used as tools with AI models.

## Function Format Requirements

### 1. Single Export
Each function file must export **exactly one function**:

```typescript
// ✅ Correct - single named export
export async function searchWeb(params: {...}) {...}

// ❌ Wrong - multiple exports
export function foo() {}
export function bar() {}

// ❌ Wrong - default export
export default function search() {}
```

### 2. Parameter Schema
Functions must accept a single `params` object with TypeScript type annotations:

```typescript
export async function searchWeb(params: {
  query: string;          // Required parameter
  maxResults?: number;    // Optional parameter (note the ?)
  filters?: string[];     // Optional array
}): Promise<ResultType> {
  // Implementation
}
```

### 3. Return Type Annotation
Always include a return type annotation:

```typescript
// ✅ Correct - with return type
export async function search(params: {...}): Promise<SearchResult[]> {
  return results;
}

// ⚠️  Warning - missing return type (will work but show warning)
export async function search(params: {...}) {
  return results;
}
```

### 4. Parameter Descriptions
Use inline comments to describe parameters (these become part of the AI tool schema):

```typescript
export async function searchWeb(params: {
  query: string;        // The search query to execute
  maxResults?: number;  // Maximum number of results (default: 10)
  language?: string;    // Language code (e.g., 'en', 'es')
}): Promise<SearchResult[]> {
  // ...
}
```

## Complete Example

```typescript
/**
 * Searches the web for information on a given topic
 */
export async function searchWeb(params: {
  query: string;        // The search query
  maxResults?: number;  // Maximum results to return
  includeImages?: boolean; // Whether to include image results
}): Promise<{
  results: Array<{
    title: string;
    url: string;
    snippet: string;
  }>;
  totalResults: number;
}> {
  const { query, maxResults = 10, includeImages = false } = params;

  // Your implementation here
  const response = await fetch(\`https://api.example.com/search?q=\${query}\`);
  const data = await response.json();

  return {
    results: data.results.slice(0, maxResults),
    totalResults: data.total
  };
}
```

## Validation & Schema Extraction

When you save a function, the editor:

1. **Validates** that you have exactly one exported function
2. **Extracts parameter schema** from TypeScript types
3. **Generates JSON Schema** compatible with AI tool use APIs
4. **Shows validation errors/warnings** in the footer

### Validation Levels

- **ERROR** (red): Must fix before the function can be used
  - Missing export
  - Multiple exports
  - Invalid syntax

- **WARNING** (yellow): Function works but improvements recommended
  - Missing parameter schema
  - Missing return type annotation
  - No parameter descriptions

## Detected Schema Display

After saving, you'll see:

### Parameters Section
Shows each parameter with:
- **Name** (green)
- **Type** (blue badge)
- **Required/Optional** status (orange badge if required)
- **Description** (from inline comments)

### Return Type Section
Displays the extracted TypeScript return type

## Generated Tool Schema

The editor generates an Anthropic-compatible tool schema like:

```json
{
  "name": "searchWeb",
  "description": "Searches the web for information on a given topic",
  "input_schema": {
    "type": "object",
    "properties": {
      "query": {
        "type": "string",
        "description": "The search query"
      },
      "maxResults": {
        "type": "number",
        "description": "Maximum results to return"
      }
    },
    "required": ["query"]
  }
}
```

## Tips

1. **Start with the template** - New functions come with an example template
2. **Use TypeScript types** - They automatically generate the schema
3. **Add comments** - Inline comments become parameter descriptions for the AI
4. **Keep it simple** - One clear purpose per function
5. **Test incrementally** - Save often to see validation feedback

## Supported Types

The editor currently supports these TypeScript types:
- `string`
- `number`
- `boolean`
- `array` (e.g., `string[]`)
- `object` (nested objects)

Complex types like unions and generics may not extract correctly.
