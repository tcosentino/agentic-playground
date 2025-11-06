import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FunctionDefinition } from '../types/functions';
import { validateAndExtractSchema } from '../utils/functionValidator';
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
      // Validate and extract schema before saving
      const { validation, parameters, returnType } = validateAndExtractSchema(localCode);

      onUpdate(functionDef.id, {
        code: localCode,
        name: localName,
        description: localDescription,
        validation,
        parameters: parameters || undefined,
        returnType: returnType || undefined,
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
          defaultLanguage="typescript"
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
        {functionDef.validation && functionDef.validation.errors.length > 0 && (
          <div className="validation-errors">
            <h4>Validation Messages:</h4>
            {functionDef.validation.errors.map((error, idx) => (
              <div key={idx} className={`validation-error ${error.severity}`}>
                <span className="error-severity">{error.severity.toUpperCase()}</span>
                {error.line && <span className="error-line">Line {error.line}:</span>}
                <span className="error-message">{error.message}</span>
              </div>
            ))}
          </div>
        )}

        {functionDef.parameters && (
          <div className="schema-info">
            <h4>Detected Parameters:</h4>
            <div className="schema-details">
              {Object.entries(functionDef.parameters.properties).map(([name, prop]) => (
                <div key={name} className="param-info">
                  <span className="param-name">{name}</span>
                  <span className="param-type">{prop.type}</span>
                  {functionDef.parameters!.required.includes(name) && (
                    <span className="param-required">required</span>
                  )}
                  {prop.description && (
                    <span className="param-description">- {prop.description}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {functionDef.returnType && (
          <div className="return-type-info">
            <h4>Return Type:</h4>
            <code>{functionDef.returnType}</code>
          </div>
        )}

        <div className="function-meta">
          <span>Created: {new Date(functionDef.createdAt).toLocaleString()}</span>
          <span>Updated: {new Date(functionDef.updatedAt).toLocaleString()}</span>
        </div>
      </div>
    </div>
  );
}
