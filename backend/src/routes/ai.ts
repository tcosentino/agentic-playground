import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AIRequest, AIResponse } from '../types.js';

const router = Router();

// In-memory storage for request history
const history: AIResponse[] = [];

// Export for testing
export const getHistory = () => history;
export const clearHistory = () => {
  history.length = 0;
};

// Initialize API clients
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || '',
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

router.post('/chat', async (req, res) => {
  try {
    const aiRequest: AIRequest = req.body;
    const startTime = Date.now();

    let result: AIResponse;

    if (aiRequest.provider === 'anthropic') {
      // Prepare Anthropic request
      const anthropicRequest = {
        model: aiRequest.model || 'claude-3-5-sonnet-20241022',
        max_tokens: aiRequest.maxTokens || 1024,
        messages: aiRequest.messages,
        temperature: aiRequest.temperature,
      };

      console.log('=== ANTHROPIC REQUEST ===');
      console.log(JSON.stringify(anthropicRequest, null, 2));

      const response = await anthropic.messages.create(anthropicRequest);

      console.log('=== ANTHROPIC RESPONSE ===');
      console.log(JSON.stringify(response, null, 2));

      const content = response.content[0].type === 'text'
        ? response.content[0].text
        : '';

      result = {
        id: response.id,
        timestamp: new Date().toISOString(),
        provider: 'anthropic',
        request: {
          raw: anthropicRequest,
          formatted: JSON.stringify(anthropicRequest, null, 2),
        },
        response: {
          raw: response,
          formatted: JSON.stringify(response, null, 2),
          content,
        },
        duration: Date.now() - startTime,
      };
    } else if (aiRequest.provider === 'openai') {
      // Prepare OpenAI request
      const openaiRequest = {
        model: aiRequest.model || 'gpt-4-turbo-preview',
        messages: aiRequest.messages,
        temperature: aiRequest.temperature,
        max_tokens: aiRequest.maxTokens,
      };

      console.log('=== OPENAI REQUEST ===');
      console.log(JSON.stringify(openaiRequest, null, 2));

      const response = await openai.chat.completions.create(openaiRequest);

      console.log('=== OPENAI RESPONSE ===');
      console.log(JSON.stringify(response, null, 2));

      const content = response.choices[0]?.message?.content || '';

      result = {
        id: response.id,
        timestamp: new Date().toISOString(),
        provider: 'openai',
        request: {
          raw: openaiRequest,
          formatted: JSON.stringify(openaiRequest, null, 2),
        },
        response: {
          raw: response,
          formatted: JSON.stringify(response, null, 2),
          content,
        },
        duration: Date.now() - startTime,
      };
    } else {
      return res.status(400).json({ error: 'Invalid provider' });
    }

    // Add to history
    history.unshift(result);

    // Keep only last 50 items
    if (history.length > 50) {
      history.pop();
    }

    res.json(result);
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message || 'An error occurred',
      details: error.response?.data || error,
    });
  }
});

router.get('/history', (req, res) => {
  res.json(history);
});

router.delete('/history', (req, res) => {
  history.length = 0;
  res.json({ message: 'History cleared' });
});

export default router;
