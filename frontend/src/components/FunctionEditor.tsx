import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FunctionDefinition } from '../types/functions';
import './FunctionEditor.css';

interface FunctionEditorProps {
  functionDef: FunctionDefinition | null;
  onUpdate: (id: string, updates: Partial<FunctionDefinition>) => void;
}

export function FunctionEditor({ functionDef, onUpdate }: FunctionEditorProps) {
  const [localCode, setLocalCode] = useState('');
  const [localName, setLocalName] = useState('');
  const [localDescription, setLocalDescription] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load function data when selection changes
  useEffect(() => {
    if (functionDef) {
      setLocalCode(functionDef.code);
      setLocalName(functionDef.name);
      setLocalDescription(functionDef.description);
      setHasUnsavedChanges(false);
    }
  }, [functionDef?.id]);

  // Track unsaved changes
  useEffect(() => {
    if (functionDef) {
      const hasChanges =
        localCode !== functionDef.code ||
        localName !== functionDef.name ||
        localDescription !== functionDef.description;
      setHasUnsavedChanges(hasChanges);
    }
  }, [localCode, localName, localDescription, functionDef]);

  const handleSave = () => {
    if (functionDef) {
      onUpdate(functionDef.id, {
        code: localCode,
        name: localName,
        description: localDescription,
      });
      setHasUnsavedChanges(false);
    }
  };

  const handleDiscard = () => {
    if (functionDef) {
      setLocalCode(functionDef.code);
      setLocalName(functionDef.name);
      setLocalDescription(functionDef.description);
      setHasUnsavedChanges(false);
    }
  };

  if (!functionDef) {
    return (
      <div className="function-editor-empty">
        <div className="empty-state">
          <p>No function selected</p>
          <p className="empty-state-hint">
            Select a function from the list or create a new one
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="function-editor">
      <div className="function-editor-header">
        <div className="function-editor-info">
          <input
            type="text"
            className="function-name-input"
            value={localName}
            onChange={(e) => setLocalName(e.target.value)}
            placeholder="Function name"
          />
          <input
            type="text"
            className="function-description-input"
            value={localDescription}
            onChange={(e) => setLocalDescription(e.target.value)}
            placeholder="Description"
          />
        </div>
        <div className="function-editor-actions">
          {hasUnsavedChanges && (
            <>
              <span className="unsaved-indicator">Unsaved changes</span>
              <button className="secondary" onClick={handleDiscard}>
                Discard
              </button>
            </>
          )}
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className={hasUnsavedChanges ? 'save-active' : ''}
          >
            Save
          </button>
        </div>
      </div>

      <div className="function-editor-content">
        <Editor
          height="100%"
          defaultLanguage="javascript"
          value={localCode}
          onChange={(value) => setLocalCode(value || '')}
          theme="vs-dark"
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            roundedSelection: false,
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
          }}
        />
      </div>

      <div className="function-editor-footer">
        <div className="function-meta">
          <span>Created: {new Date(functionDef.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(functionDef.updatedAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
