# AI Agent Playground

A TypeScript-based playground for exploring AI agents with support for both Anthropic and OpenAI APIs. This application allows you to send requests to AI models, view raw request/response payloads, and maintain a history of interactions.

## Features

- **Multiple AI Providers**: Support for both Anthropic (Claude) and OpenAI (GPT) models
- **Raw Request/Response Inspection**: View the exact JSON payloads sent and received
- **Request History**: Keep track of all your API interactions with timestamps and durations
- **Real-time Console Logging**: Backend logs all requests/responses to the console
- **Modern Stack**: Built with TypeScript, React, Vite, and Express

## Project Structure

```
agentic-playground/
├── backend/           # Node.js + Express API server
│   ├── src/
│   │   ├── index.ts          # Main server file
│   │   ├── types.ts          # TypeScript types
│   │   └── routes/
│   │       └── ai.ts         # AI API routes
│   ├── package.json
│   └── tsconfig.json
├── frontend/          # React + Vite app
│   ├── src/
│   │   ├── App.tsx           # Main React component
│   │   ├── App.css           # Styles
│   │   ├── types.ts          # TypeScript types
│   │   └── main.tsx          # Entry point
│   ├── index.html
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── package.json       # Root workspace config
```

## Prerequisites

- Node.js 18+ and npm
- API keys for the services you want to use:
  - Anthropic API key (for Claude models)
  - OpenAI API key (for GPT models)

## Setup

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Configure environment variables**:
   Create a `.env` file in the `backend` directory:
   ```bash
   cp backend/.env.example backend/.env
   ```

   Edit `backend/.env` and add your API keys:
   ```
   PORT=3002
   ANTHROPIC_API_KEY=your_anthropic_api_key_here
   OPENAI_API_KEY=your_openai_api_key_here
   ```

3. **Start the development servers**:
   ```bash
   npm run dev
   ```

   This will start:
   - Backend API server on `http://localhost:3002`
   - Frontend dev server on `http://localhost:5174`

4. **Open the app**:
   Navigate to `http://localhost:5174` in your browser

## Usage

### Making Requests

1. Select your AI provider (Anthropic or OpenAI)
2. Choose the model you want to use
3. Enter your message
4. Adjust temperature and max tokens if needed
5. Click "Send Request"

### Viewing Responses

The response panel has three tabs:
- **Content**: The AI-generated response text
- **Raw Request**: The complete JSON payload sent to the API
- **Raw Response**: The complete JSON response received from the API

### History

All requests are stored in the history panel at the bottom. Click on any history item to view its details again.

## API Endpoints

The backend exposes the following endpoints:

- `POST /api/ai/chat` - Send a chat request to an AI provider
- `GET /api/ai/history` - Retrieve request history
- `DELETE /api/ai/history` - Clear request history
- `GET /health` - Health check endpoint

### Example Request

```bash
curl -X POST http://localhost:3002/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "anthropic",
    "model": "claude-3-5-sonnet-20241022",
    "messages": [
      {
        "role": "user",
        "content": "Hello, how are you?"
      }
    ],
    "temperature": 1.0,
    "maxTokens": 1024
  }'
```

## Console Logging

The backend logs all raw requests and responses to the console, making it easy to debug and understand the exact API interactions:

```
=== ANTHROPIC REQUEST ===
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1024,
  "messages": [...]
}

=== ANTHROPIC RESPONSE ===
{
  "id": "msg_123...",
  "type": "message",
  "role": "assistant",
  "content": [...]
}
```

## Available Models

### Anthropic (Claude)
- `claude-3-5-sonnet-20241022` - Claude 3.5 Sonnet (latest)
- `claude-3-opus-20240229` - Claude 3 Opus (most capable)
- `claude-3-sonnet-20240229` - Claude 3 Sonnet (balanced)
- `claude-3-haiku-20240307` - Claude 3 Haiku (fastest)

### OpenAI (GPT)
- `gpt-4-turbo-preview` - GPT-4 Turbo (latest)
- `gpt-4` - GPT-4 (most capable)
- `gpt-3.5-turbo` - GPT-3.5 Turbo (fastest)

## Development

### Run backend only:
```bash
npm run dev:backend
```

### Run frontend only:
```bash
npm run dev:frontend
```

### Build for production:
```bash
npm run build
```

## Testing

The project includes comprehensive test suites for both frontend and backend using Vitest.

### Run all tests:
```bash
npm test
```

### Run backend tests only:
```bash
npm run test:backend
```

### Run frontend tests only:
```bash
npm run test:frontend
```

### Run tests in watch mode:
```bash
npm run test:watch
```

### Generate coverage reports:
```bash
npm run test:coverage
```

### Test Coverage

**Backend Tests:**
- API endpoint testing with Supertest
- Health check validation
- Route validation and error handling
- Request/response format validation
- History management

**Frontend Tests:**
- Component rendering
- User interactions (form inputs, button clicks)
- Provider and model selection
- API integration with mocked responses
- Error handling and loading states
- Response tab switching
- History loading and clearing

### Testing Stack

- **Vitest** - Fast unit test framework
- **React Testing Library** - React component testing
- **@testing-library/user-event** - User interaction simulation
- **Supertest** - HTTP assertion library for backend
- **jsdom** - DOM implementation for testing

## Tech Stack

### Frontend
- React 18
- TypeScript
- Vite
- CSS (no framework, custom styling)

### Backend
- Node.js
- Express
- TypeScript
- Anthropic SDK
- OpenAI SDK

## Future Enhancements

Some ideas for expanding this playground:

- Add streaming support for real-time responses
- Implement conversation threads (multi-turn conversations)
- Add support for system prompts
- Export/import conversation history
- Add more AI providers (Cohere, Mistral, etc.)
- Implement tools/function calling
- Add token counting and cost estimation
- Save presets for common requests

## License

MIT
