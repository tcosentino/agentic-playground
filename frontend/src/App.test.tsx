import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from './test/test-utils';
import userEvent from '@testing-library/user-event';
import App from './App';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('App', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  describe('Initial Render', () => {
    it('should render the app title', () => {
      render(<App />);
      expect(screen.getByText('AI Agent Playground')).toBeInTheDocument();
    });

    it('should render new request panel', () => {
      render(<App />);
      expect(screen.getByText('New Request')).toBeInTheDocument();
    });

    it('should render response panel', () => {
      render(<App />);
      expect(screen.getByText('Response')).toBeInTheDocument();
    });

    it('should render history panel', () => {
      render(<App />);
      expect(screen.getByText(/History/)).toBeInTheDocument();
    });

    it('should render form inputs', () => {
      render(<App />);
      expect(screen.getByLabelText('Provider')).toBeInTheDocument();
      expect(screen.getByLabelText('Model')).toBeInTheDocument();
      expect(screen.getByLabelText('Message')).toBeInTheDocument();
      expect(screen.getByText(/Temperature:/)).toBeInTheDocument();
      expect(screen.getByLabelText('Max Tokens')).toBeInTheDocument();
    });

    it('should have submit button', () => {
      render(<App />);
      expect(screen.getByRole('button', { name: 'Send Request' })).toBeInTheDocument();
    });
  });

  describe('Provider Selection', () => {
    it('should default to Anthropic provider', () => {
      render(<App />);
      const providerSelect = screen.getByLabelText('Provider') as HTMLSelectElement;
      expect(providerSelect.value).toBe('anthropic');
    });

    it('should change to OpenAI provider', async () => {
      const user = userEvent.setup();
      render(<App />);

      const providerSelect = screen.getByLabelText('Provider');
      await user.selectOptions(providerSelect, 'openai');

      expect((providerSelect as HTMLSelectElement).value).toBe('openai');
    });

    it('should update model when provider changes', async () => {
      const user = userEvent.setup();
      render(<App />);

      const providerSelect = screen.getByLabelText('Provider');
      const modelSelect = screen.getByLabelText('Model') as HTMLSelectElement;

      // Initially Anthropic model
      expect(modelSelect.value).toBe('claude-3-5-sonnet-20241022');

      // Switch to OpenAI
      await user.selectOptions(providerSelect, 'openai');

      // Should switch to OpenAI model
      expect(modelSelect.value).toBe('gpt-4-turbo-preview');
    });

    it('should show Anthropic models when Anthropic is selected', () => {
      render(<App />);
      const modelSelect = screen.getByLabelText('Model');

      expect(modelSelect).toHaveTextContent('Claude 3.5 Sonnet');
      expect(modelSelect).toHaveTextContent('Claude 3 Opus');
    });

    it('should show OpenAI models when OpenAI is selected', async () => {
      const user = userEvent.setup();
      render(<App />);

      const providerSelect = screen.getByLabelText('Provider');
      await user.selectOptions(providerSelect, 'openai');

      const modelSelect = screen.getByLabelText('Model');
      expect(modelSelect).toHaveTextContent('GPT-4 Turbo');
      expect(modelSelect).toHaveTextContent('GPT-3.5 Turbo');
    });
  });

  describe('Form Inputs', () => {
    it('should update message input', async () => {
      const user = userEvent.setup();
      render(<App />);

      const messageInput = screen.getByLabelText('Message') as HTMLTextAreaElement;
      await user.type(messageInput, 'Test message');

      expect(messageInput.value).toBe('Test message');
    });

    it('should update temperature', async () => {
      const user = userEvent.setup();
      render(<App />);

      const tempInput = screen.getByLabelText(/Temperature:/) as HTMLInputElement;
      await user.clear(tempInput);
      await user.type(tempInput, '0.5');

      expect(tempInput.value).toBe('0.5');
    });

    it('should update max tokens', async () => {
      const user = userEvent.setup();
      render(<App />);

      const maxTokensInput = screen.getByLabelText('Max Tokens') as HTMLInputElement;
      await user.clear(maxTokensInput);
      await user.type(maxTokensInput, '500');

      expect(maxTokensInput.value).toBe('500');
    });
  });

  describe('Form Submission', () => {
    it('should disable submit button during loading', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<App />);

      const messageInput = screen.getByLabelText('Message');
      await user.type(messageInput, 'Test');

      const submitButton = screen.getByRole('button', { name: 'Send Request' });
      await user.click(submitButton);

      expect(submitButton).toBeDisabled();
      expect(submitButton).toHaveTextContent('Sending...');
    });

    it('should show loading message', async () => {
      const user = userEvent.setup();
      mockFetch.mockImplementation(() => new Promise(() => {}));

      render(<App />);

      const messageInput = screen.getByLabelText('Message');
      await user.type(messageInput, 'Test');

      const submitButton = screen.getByRole('button', { name: 'Send Request' });
      await user.click(submitButton);

      expect(screen.getByText('Waiting for response...')).toBeInTheDocument();
    });

    it('should handle successful API response', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        id: 'test-123',
        timestamp: new Date().toISOString(),
        provider: 'anthropic',
        request: {
          raw: {},
          formatted: '{}',
        },
        response: {
          raw: {},
          formatted: '{}',
          content: 'Test response content',
        },
        duration: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockResponse],
      });

      render(<App />);

      const messageInput = screen.getByLabelText('Message');
      await user.type(messageInput, 'Test');

      const submitButton = screen.getByRole('button', { name: 'Send Request' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Test response content')).toBeInTheDocument();
      });
    });

    it('should handle API error', async () => {
      const user = userEvent.setup();
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Test error' }),
      });

      render(<App />);

      const messageInput = screen.getByLabelText('Message');
      await user.type(messageInput, 'Test');

      const submitButton = screen.getByRole('button', { name: 'Send Request' });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Test error')).toBeInTheDocument();
      });
    });
  });

  describe('Response Tabs', () => {
    beforeEach(async () => {
      const mockResponse = {
        id: 'test-123',
        timestamp: new Date().toISOString(),
        provider: 'anthropic',
        request: {
          raw: { model: 'claude-3-5-sonnet-20241022' },
          formatted: '{"model": "claude-3-5-sonnet-20241022"}',
        },
        response: {
          raw: { id: 'msg-123' },
          formatted: '{"id": "msg-123"}',
          content: 'Test response',
        },
        duration: 100,
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [mockResponse],
      });
    });

    it('should show content tab by default', async () => {
      const user = userEvent.setup();
      render(<App />);

      const messageInput = screen.getByLabelText('Message');
      await user.type(messageInput, 'Test');
      await user.click(screen.getByRole('button', { name: 'Send Request' }));

      await waitFor(() => {
        expect(screen.getByText('Test response')).toBeInTheDocument();
      });
    });

    it('should switch to request tab', async () => {
      const user = userEvent.setup();
      render(<App />);

      const messageInput = screen.getByLabelText('Message');
      await user.type(messageInput, 'Test');
      await user.click(screen.getByRole('button', { name: 'Send Request' }));

      await waitFor(() => {
        expect(screen.getByText('Test response')).toBeInTheDocument();
      });

      const requestTab = screen.getByRole('button', { name: 'Raw Request' });
      await user.click(requestTab);

      expect(screen.getByText('Request Payload')).toBeInTheDocument();
    });

    it('should switch to response tab', async () => {
      const user = userEvent.setup();
      render(<App />);

      const messageInput = screen.getByLabelText('Message');
      await user.type(messageInput, 'Test');
      await user.click(screen.getByRole('button', { name: 'Send Request' }));

      await waitFor(() => {
        expect(screen.getByText('Test response')).toBeInTheDocument();
      });

      const responseTab = screen.getByRole('button', { name: 'Raw Response' });
      await user.click(responseTab);

      expect(screen.getByText('Response Payload')).toBeInTheDocument();
    });
  });

  describe('History', () => {
    it('should show empty history message initially', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText('No history yet. Make a request to get started.')).toBeInTheDocument();
      });
    });

    it('should load history on mount', async () => {
      const mockHistory = [
        {
          id: 'test-1',
          timestamp: new Date().toISOString(),
          provider: 'anthropic',
          request: { raw: {}, formatted: '{}' },
          response: { raw: {}, formatted: '{}', content: 'Response 1' },
          duration: 100,
        },
      ];

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Response 1/)).toBeInTheDocument();
      });
    });

    it('should clear history', async () => {
      const user = userEvent.setup();
      const mockHistory = [
        {
          id: 'test-1',
          timestamp: new Date().toISOString(),
          provider: 'anthropic',
          request: { raw: {}, formatted: '{}' },
          response: { raw: {}, formatted: '{}', content: 'Response 1' },
          duration: 100,
        },
      ];

      // Initial history load
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockHistory,
      });

      render(<App />);

      await waitFor(() => {
        expect(screen.getByText(/Response 1/)).toBeInTheDocument();
      });

      // Mock window.confirm
      const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

      // Mock clear history
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ message: 'History cleared' }),
      });

      const clearButton = screen.getByRole('button', { name: 'Clear History' });
      await user.click(clearButton);

      confirmSpy.mockRestore();
    });
  });
});
