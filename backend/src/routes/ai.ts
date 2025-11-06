import { Router } from 'express';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { AIRequest, AIResponse } from '../types.js';
import { IStorage } from '../storage/index.js';

const router = Router();

// Storage instance will be injected
let storage: IStorage;

export const setStorage = (storageInstance: IStorage) => {
  storage = storageInstance;
};

// Export for testing
export const getHistory = async () => storage.getHistory();
export const clearHistoryData = async () => storage.clearHistory();

// Initialize API clients lazily to ensure env vars are loaded
let anthropic: Anthropic | null = null;
let openai: OpenAI | null = null;

const getAnthropicClient = () => {
  if (!anthropic) {
    anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }
  return anthropic;
};

const getOpenAIClient = () => {
  if (!openai) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
};

router.post('/chat', async (req, res) => {
  try {
    const aiRequest: AIRequest = req.body;
    const startTime = Date.now();

    let result: AIResponse;

    if (aiRequest.provider === 'anthropic') {
      // Prepare Anthropic request
      const anthropicRequest: any = {
        model: aiRequest.model || 'claude-3-5-sonnet-20241022',
        max_tokens: aiRequest.maxTokens || 1024,
        messages: aiRequest.messages,
        temperature: aiRequest.temperature,
      };

      // Add tools if provided
      if (aiRequest.tools && aiRequest.tools.length > 0) {
        anthropicRequest.tools = aiRequest.tools;
      }

      console.log('=== ANTHROPIC REQUEST ===');
      console.log(JSON.stringify(anthropicRequest, null, 2));

      const response = await getAnthropicClient().messages.create(anthropicRequest);

      console.log('=== ANTHROPIC RESPONSE ===');
      console.log(JSON.stringify(response, null, 2));

      // Extract all content blocks (text and tool_use)
      const textContent = response.content
        .filter((block: any) => block.type === 'text')
        .map((block: any) => block.text)
        .join('\n');

      const toolUses = response.content
        .filter((block: any) => block.type === 'tool_use')
        .map((block: any) => ({
          id: block.id,
          name: block.name,
          input: block.input,
        }));

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
          content: textContent,
          toolUses: toolUses.length > 0 ? toolUses : undefined,
          stopReason: response.stop_reason || undefined,
        },
        duration: Date.now() - startTime,
      };
    } else if (aiRequest.provider === 'openai') {
      // Prepare OpenAI request
      const openaiRequest: any = {
        model: aiRequest.model || 'gpt-4-turbo-preview',
        messages: aiRequest.messages,
        temperature: aiRequest.temperature,
        max_tokens: aiRequest.maxTokens,
      };

      console.log('=== OPENAI REQUEST ===');
      console.log(JSON.stringify(openaiRequest, null, 2));

      const response = await getOpenAIClient().chat.completions.create(openaiRequest);

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

    // Save to storage
    await storage.saveHistory(result);

    res.json(result);
  } catch (error: any) {
    console.error('Error:', error);
    res.status(500).json({
      error: error.message || 'An error occurred',
      details: error.response?.data || error,
    });
  }
});

router.get('/history', async (req, res) => {
  try {
    const history = await storage.getHistory();
    res.json(history);
  } catch (error: any) {
    console.error('Error loading history:', error);
    res.status(500).json({ error: 'Failed to load history' });
  }
});

router.delete('/history', async (req, res) => {
  try {
    await storage.clearHistory();
    res.json({ message: 'History cleared' });
  } catch (error: any) {
    console.error('Error clearing history:', error);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

export default router;
