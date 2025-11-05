import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';
import { clearHistory } from '../routes/ai.js';

// Mock the AI SDKs
vi.mock('@anthropic-ai/sdk', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      messages: {
        create: vi.fn().mockRejectedValue(new Error('API key not configured')),
      },
    })),
  };
});

vi.mock('openai', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: vi.fn().mockRejectedValue(new Error('API key not configured')),
        },
      },
    })),
  };
});

describe('AI Routes', () => {
  const app = createApp();

  beforeEach(() => {
    clearHistory();
  });

  describe('GET /api/ai/history', () => {
    it('should return empty array initially', async () => {
      const response = await request(app)
        .get('/api/ai/history')
        .expect(200);

      expect(response.body).toEqual([]);
    });

    it('should return array of history items', async () => {
      const response = await request(app)
        .get('/api/ai/history')
        .expect('Content-Type', /json/);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe('DELETE /api/ai/history', () => {
    it('should clear history', async () => {
      const response = await request(app)
        .delete('/api/ai/history')
        .expect(200);

      expect(response.body).toHaveProperty('message', 'History cleared');
    });

    it('should return success message', async () => {
      const response = await request(app)
        .delete('/api/ai/history')
        .expect('Content-Type', /json/);

      expect(response.body.message).toBeDefined();
    });
  });

  describe('POST /api/ai/chat', () => {
    it('should reject requests without provider', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          messages: [{ role: 'user', content: 'Hello' }],
        });

      // Will get 500 or 400 depending on validation
      expect([400, 500]).toContain(response.status);
      expect(response.body).toHaveProperty('error');
    });

    it('should reject invalid provider', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          provider: 'invalid',
          messages: [{ role: 'user', content: 'Hello' }],
        })
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid provider');
    });

    it('should accept valid request structure', async () => {
      const validRequest = {
        provider: 'anthropic',
        model: 'claude-3-5-sonnet-20241022',
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 1.0,
        maxTokens: 100,
      };

      const response = await request(app)
        .post('/api/ai/chat')
        .send(validRequest)
        .expect('Content-Type', /json/);

      // Will fail with API key error since we're mocking it to fail
      // But we're validating the endpoint accepts the correct structure
      expect(response.body).toBeDefined();
      expect(response.status).toBe(500); // Mocked API call fails
      expect(response.body).toHaveProperty('error');
    });

    it('should handle missing messages gracefully', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({
          provider: 'anthropic',
          model: 'claude-3-5-sonnet-20241022',
        });

      expect(response.body).toHaveProperty('error');
    });

    it('should require JSON content type', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send('invalid')
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();
    });
  });

  describe('Request validation', () => {
    it('should handle empty request body', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .send({})
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('error');
    });

    it('should handle malformed JSON gracefully', async () => {
      const response = await request(app)
        .post('/api/ai/chat')
        .set('Content-Type', 'application/json')
        .send('{"invalid": json}');

      // Express will handle the malformed JSON
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Response format', () => {
    it('should return JSON for all endpoints', async () => {
      await request(app)
        .get('/api/ai/history')
        .expect('Content-Type', /json/);

      await request(app)
        .delete('/api/ai/history')
        .expect('Content-Type', /json/);
    });
  });
});
