import { useState, useEffect } from 'react';
import './App.css';
import { AIRequest, AIResponse } from './types';
import { Functions } from './components/Functions';

type Tab = 'content' | 'request' | 'response';
type MainTab = 'playground' | 'functions';

function App() {
  const [mainTab, setMainTab] = useState<MainTab>('playground');
  const [provider, setProvider] = useState<'anthropic' | 'openai'>('anthropic');
  const [model, setModel] = useState('claude-3-5-sonnet-20241022');
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
      provider,
      model,
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
      <div className="app-header">
        <h1>AI Agent Playground</h1>
        <div className="main-tabs">
          <button
            className={`main-tab ${mainTab === 'playground' ? 'active' : ''}`}
            onClick={() => setMainTab('playground')}
          >
            Playground
          </button>
          <button
            className={`main-tab ${mainTab === 'functions' ? 'active' : ''}`}
            onClick={() => setMainTab('functions')}
          >
            Functions
          </button>
        </div>
      </div>

      {mainTab === 'functions' ? (
        <Functions />
      ) : (
        <>
          <div className="container">
            {/* Request Panel */}
        <div className="panel">
          <h2>New Request</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="provider">Provider</label>
              <select
                id="provider"
                value={provider}
                onChange={(e) => {
                  const newProvider = e.target.value as 'anthropic' | 'openai';
                  setProvider(newProvider);
                  setModel(
                    newProvider === 'anthropic'
                      ? 'claude-3-5-sonnet-20241022'
                      : 'gpt-4-turbo-preview'
                  );
                }}
              >
                <option value="anthropic">Anthropic</option>
                <option value="openai">OpenAI</option>
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="model">Model</label>
              <select id="model" value={model} onChange={(e) => setModel(e.target.value)}>
                {provider === 'anthropic' ? (
                  <>
                    <option value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</option>
                    <option value="claude-3-opus-20240229">Claude 3 Opus</option>
                    <option value="claude-3-sonnet-20240229">Claude 3 Sonnet</option>
                    <option value="claude-3-haiku-20240307">Claude 3 Haiku</option>
                  </>
                ) : (
                  <>
                    <option value="gpt-4-turbo-preview">GPT-4 Turbo</option>
                    <option value="gpt-4">GPT-4</option>
                    <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  </>
                )}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message</label>
              <textarea
                id="message"
                value={userMessage}
                onChange={(e) => setUserMessage(e.target.value)}
                placeholder="Enter your message..."
                required
              />
            </div>

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

            <button type="submit" disabled={loading}>
              {loading ? 'Sending...' : 'Send Request'}
            </button>
          </form>
        </div>

        {/* Response Panel */}
        <div className="panel">
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

      {/* History Panel */}
      <div className="panel history-panel">
        <div className="header">
          <h2>History ({history.length})</h2>
          <button className="secondary" onClick={clearHistory}>
            Clear History
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
                    <span>{new Date(item.timestamp).toLocaleString()}</span>
                    <span>{item.duration}ms</span>
                  </div>
                </div>
                <div className="history-content">
                  {item.response.content.substring(0, 150)}
                  {item.response.content.length > 150 ? '...' : ''}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
        </>
      )}
    </div>
  );
}

export default App;
