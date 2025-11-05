import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app.js';

describe('App', () => {
  const app = createApp();

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(new Date(response.body.timestamp)).toBeInstanceOf(Date);
    });

    it('should return valid JSON', async () => {
      const response = await request(app)
        .get('/health')
        .expect('Content-Type', /json/);

      expect(response.body).toBeDefined();
    });
  });

  describe('404 handling', () => {
    it('should return 404 for unknown routes', async () => {
      await request(app)
        .get('/unknown-route')
        .expect(404);
    });
  });

  describe('CORS', () => {
    it('should have CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.headers['access-control-allow-origin']).toBeDefined();
    });
  });
});
