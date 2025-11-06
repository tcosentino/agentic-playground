import { useState, useEffect } from 'react';
import Select from 'react-select';
import './App.css';
import { AIRequest, AIResponse } from './types';

type Tab = 'content' | 'request' | 'response';

interface ModelOption {
  value: string;
  label: string;
  provider: 'anthropic' | 'openai';
  model: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  { value: 'anthropic-claude-sonnet-4-5-20250929', label: 'Anthropic - Claude Sonnet 4.5', provider: 'anthropic', model: 'claude-sonnet-4-5-20250929' },
  { value: 'anthropic-claude-haiku-4-5-20251001', label: 'Anthropic - Claude Haiku 4.5', provider: 'anthropic', model: 'claude-haiku-4-5-20251001' },
  { value: 'anthropic-claude-opus-4-1-20250805', label: 'Anthropic - Claude Opus 4.1', provider: 'anthropic', model: 'claude-opus-4-1-20250805' },
  { value: 'anthropic-claude-3-5-sonnet-20241022', label: 'Anthropic - Claude 3.5 Sonnet v2', provider: 'anthropic', model: 'claude-3-5-sonnet-20241022' },
  { value: 'anthropic-claude-3-5-haiku-20241022', label: 'Anthropic - Claude 3.5 Haiku', provider: 'anthropic', model: 'claude-3-5-haiku-20241022' },
  { value: 'openai-gpt-4o', label: 'OpenAI - GPT-4o', provider: 'openai', model: 'gpt-4o' },
  { value: 'openai-gpt-4o-mini', label: 'OpenAI - GPT-4o Mini', provider: 'openai', model: 'gpt-4o-mini' },
  { value: 'openai-gpt-4-turbo', label: 'OpenAI - GPT-4 Turbo', provider: 'openai', model: 'gpt-4-turbo' },
  { value: 'openai-o1', label: 'OpenAI - o1', provider: 'openai', model: 'o1' },
  { value: 'openai-o1-mini', label: 'OpenAI - o1 Mini', provider: 'openai', model: 'o1-mini' },
];

function App() {
  const [selectedModel, setSelectedModel] = useState<ModelOption>(MODEL_OPTIONS[0]);
  const [userMessage, setUserMessage] = useState('');
  const [temperature, setTemperature] = useState(1.0);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentResponse, setCurrentResponse] = useState<AIResponse | null>(null);
  const [history, setHistory] = useState<AIResponse[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>('content');

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await fetch('/api/ai/history');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setCurrentResponse(null);
    setSelectedHistoryId(null);

    const request: AIRequest = {
      provider: selectedModel.provider,
      model: selectedModel.model,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
      temperature,
      maxTokens,
    };

    try {
      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Request failed');
      }

      const data: AIResponse = await response.json();
      setCurrentResponse(data);
      await loadHistory();
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('Are you sure you want to clear all history?')) {
      return;
    }

    try {
      await fetch('/api/ai/history', { method: 'DELETE' });
      setHistory([]);
      setCurrentResponse(null);
      setSelectedHistoryId(null);
    } catch (err) {
      console.error('Failed to clear history:', err);
    }
  };

  const selectHistoryItem = (item: AIResponse) => {
    setCurrentResponse(item);
    setSelectedHistoryId(item.id);
  };

  const displayedResponse = currentResponse;

  return (
    <div className="app">
      <h1>AI Agent Playground</h1>

      {/* Top: Request Form */}
      <div className="panel request-panel">
        <h2>New Request</h2>
        <form onSubmit={handleSubmit} className="request-form">
          <div className="form-columns">
            {/* Left column: Message */}
            <div className="form-column-left">
              <div className="form-group">
                <label htmlFor="message">Message</label>
                <textarea
                  id="message"
                  value={userMessage}
                  onChange={(e) => setUserMessage(e.target.value)}
                  placeholder="Enter your message..."
                  required
                  className="tall-textarea"
                />
              </div>
            </div>

            {/* Right column: Options */}
            <div className="form-column-right">
              <div className="form-group">
                <label htmlFor="model">Model</label>
                <Select
                  inputId="model"
                  options={MODEL_OPTIONS}
                  value={selectedModel}
                  onChange={(option) => option && setSelectedModel(option)}
                  isSearchable
                  classNamePrefix="react-select"
                />
              </div>

              <div className="form-row-inline">
                <div className="form-group">
                  <label htmlFor="temperature">Temperature: {temperature}</label>
                  <input
                    id="temperature"
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="maxTokens">Max Tokens</label>
                  <input
                    id="maxTokens"
                    type="number"
                    min="1"
                    max="4096"
                    value={maxTokens}
                    onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                  />
                </div>
              </div>

              <button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send Request'}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bottom: History (left) and Response (right) */}
      <div className="bottom-container">
        {/* History Panel */}
        <div className="panel history-panel">
          <div className="header">
            <h2>History ({history.length})</h2>
            <button className="secondary" onClick={clearHistory}>
              Clear
            </button>
          </div>
          <div className="history-list">
            {history.length === 0 ? (
              <p style={{ color: '#888' }}>No history yet. Make a request to get started.</p>
            ) : (
              history.map((item) => (
                <div
                  key={item.id}
                  className={`history-item ${
                    selectedHistoryId === item.id ? 'selected' : ''
                  }`}
                  onClick={() => selectHistoryItem(item)}
                >
                  <div className="history-header">
                    <div className="history-meta">
                      <span className={`provider-badge ${item.provider}`}>
                        {item.provider.toUpperCase()}
                      </span>
                      <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      <span>{item.duration}ms</span>
                    </div>
                  </div>
                  <div className="history-content">
                    {item.response.content.substring(0, 100)}
                    {item.response.content.length > 100 ? '...' : ''}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Response Panel */}
        <div className="panel response-panel">
          <h2>Response</h2>
          {loading && <p className="loading">Waiting for response...</p>}
          {error && <div className="error">{error}</div>}
          {displayedResponse && (
            <div className="response-content">
              <div className="tabs">
                <button
                  className={`tab ${activeTab === 'content' ? 'active' : ''}`}
                  onClick={() => setActiveTab('content')}
                >
                  Content
                </button>
                <button
                  className={`tab ${activeTab === 'request' ? 'active' : ''}`}
                  onClick={() => setActiveTab('request')}
                >
                  Raw Request
                </button>
                <button
                  className={`tab ${activeTab === 'response' ? 'active' : ''}`}
                  onClick={() => setActiveTab('response')}
                >
                  Raw Response
                </button>
              </div>

              {activeTab === 'content' && (
                <div>
                  <h3>AI Response</h3>
                  <pre>{displayedResponse.response.content}</pre>
                </div>
              )}

              {activeTab === 'request' && (
                <div>
                  <h3>Request Payload</h3>
                  <pre>{displayedResponse.request.formatted}</pre>
                </div>
              )}

              {activeTab === 'response' && (
                <div>
                  <h3>Response Payload</h3>
                  <pre>{displayedResponse.response.formatted}</pre>
                </div>
              )}

              <div className="duration">
                Duration: {displayedResponse.duration}ms
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
