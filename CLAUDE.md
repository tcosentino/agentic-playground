# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AI Agent Playground is a TypeScript-based application for exploring AI agents. It provides a UI for sending requests to Anthropic (Claude) and OpenAI (GPT) models, viewing raw request/response payloads, and maintaining request history.

## Architecture

### Workspace Structure

This is an npm workspace monorepo with two packages:
- **frontend**: React + Vite application (TypeScript)
- **backend**: Express API server (TypeScript, ES modules)

Both workspaces share TypeScript types (`AIRequest`, `AIResponse`) but are defined separately in each package.

### Backend Architecture

- **Entry**: `backend/src/index.ts` loads env vars and starts Express server
- **App Factory**: `backend/src/app.ts` exports `createApp()` function (enables testing)
- **API Routes**: `backend/src/routes/ai.ts` handles all AI provider interactions
- **State**: In-memory history array (max 50 items, newest first)
- **Logging**: All raw requests/responses logged to console with provider-specific formatting

The backend acts as a proxy between the frontend and AI provider SDKs, normalizing responses into a common `AIResponse` format.

### Frontend Architecture

- **Single Component**: `frontend/src/App.tsx` contains all UI logic
- **State Management**: React useState hooks (no external state library)
- **Layout**: Three-panel layout - Request form, Response viewer with tabs, History list
- **Data Flow**: User submits → POST to `/api/ai/chat` → Display response → Reload history

### Type Definitions

Both packages define:
- `AIRequest`: Provider, model, messages, temperature, maxTokens
- `AIResponse`: Normalized response with raw/formatted request/response, content, duration

### API Endpoints

- `POST /api/ai/chat` - Proxy to AI provider (returns `AIResponse`)
- `GET /api/ai/history` - Return in-memory history array
- `DELETE /api/ai/history` - Clear history
- `GET /health` - Health check

## Common Commands

### Development

```bash
npm run dev              # Start both frontend and backend concurrently
npm run dev:backend      # Backend only (port 3002)
npm run dev:frontend     # Frontend only (port 5174)
```

### Testing

```bash
npm test                 # Run all tests (backend + frontend)
npm run test:backend     # Backend tests only
npm run test:frontend    # Frontend tests only
npm run test:watch       # Watch mode for both
npm run test:coverage    # Generate coverage reports
```

Backend tests use Supertest for HTTP assertions. Frontend tests use React Testing Library with jsdom.

### Building

```bash
npm run build            # Build both packages (frontend build, backend tsc)
```

### Backend Environment

Create `backend/.env` with:
```
PORT=3002
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
```

## Key Implementation Details

### Provider Request Normalization

The backend normalizes different provider APIs into a unified `AIResponse`:
- Anthropic: `response.content[0].text` → `result.response.content`
- OpenAI: `response.choices[0].message.content` → `result.response.content`

Both providers store raw request/response objects plus formatted JSON strings.

### History Management

- History is in-memory only (resets on server restart)
- Limited to 50 items via `history.unshift()` + conditional `history.pop()`
- Exported `getHistory()` and `clearHistory()` functions for testing

### Frontend-Backend Communication

Frontend proxies through Vite dev server (`/api/*` routes). The backend uses CORS middleware to allow cross-origin requests during development.

### Testing Strategy

- Backend: Test app factory pattern, routes, request validation, history management
- Frontend: Test component rendering, user interactions, API integration (mocked), tab switching
- Both use Vitest as test runner
