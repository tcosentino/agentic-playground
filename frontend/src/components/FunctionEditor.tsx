import { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import { FunctionDefinition } from '../types/functions';
import { validateAndExtractSchema } from '../utils/functionValidator';
import { addJSDocToCode, updateJSDoc, addParameterTypes, addReturnType } from '../utils/autoFix';
import './FunctionEditor.css';

interface FunctionEditorProps {
  functionDef: FunctionDefinition | null;
  onUpdate: (id: string, updates: Partial<FunctionDefinition>) => void;
}

export function FunctionEditor({ functionDef, onUpdate }: FunctionEditorProps) {
  const [localCode, setLocalCode] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load function data when selection changes
  useEffect(() => {
    if (functionDef) {
      setLocalCode(functionDef.code);
      setHasUnsavedChanges(false);
    }
  }, [functionDef?.id]);

  // Track unsaved changes
  useEffect(() => {
    if (functionDef) {
      const hasChanges = localCode !== functionDef.code;
      setHasUnsavedChanges(hasChanges);
    }
  }, [localCode, functionDef]);

  const handleSave = () => {
    if (functionDef) {
      // Validate and extract schema before saving
      const { validation, parameters, returnType, returnTypeSchema, description, functionName } = validateAndExtractSchema(localCode);

      onUpdate(functionDef.id, {
        code: localCode,
        name: functionName || functionDef.name,
        description: description || '',
        validation,
        parameters: parameters || undefined,
        returnType: returnType || undefined,
        returnTypeSchema: returnTypeSchema || undefined,
      });
      setHasUnsavedChanges(false);
    }
  };

  const handleDiscard = () => {
    if (functionDef) {
      setLocalCode(functionDef.code);
      setHasUnsavedChanges(false);
    }
  };

  const handleAutoFix = (fixType: 'add-jsdoc' | 'update-jsdoc' | 'add-param-types' | 'add-return-type') => {
    if (fixType === 'add-jsdoc') {
      const fixedCode = addJSDocToCode(localCode);
      setLocalCode(fixedCode);
    } else if (fixType === 'update-jsdoc') {
      const fixedCode = updateJSDoc(localCode);
      setLocalCode(fixedCode);
    } else if (fixType === 'add-param-types') {
      const fixedCode = addParameterTypes(localCode);
      setLocalCode(fixedCode);
    } else if (fixType === 'add-return-type') {
      const fixedCode = addReturnType(localCode);
      setLocalCode(fixedCode);
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
          <div className="function-name-display">{functionDef.name}</div>
          {functionDef.description && (
            <div className="function-description-display">{functionDef.description}</div>
          )}
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

      {functionDef.validation && functionDef.validation.errors.length > 0 && (
        <div className="validation-errors-banner">
          {functionDef.validation.errors.map((error, idx) => {
            // Determine if this error is auto-fixable
            let fixButton: JSX.Element | null = null;

            if (error.message.includes('No JSDoc description found')) {
              fixButton = (
                <button
                  className="auto-fix-btn"
                  onClick={() => handleAutoFix('add-jsdoc')}
                  title="Auto-generate JSDoc comment"
                >
                  Fix
                </button>
              );
            } else if (error.message.includes('Missing JSDoc descriptions for parameters')) {
              fixButton = (
                <button
                  className="auto-fix-btn"
                  onClick={() => handleAutoFix('update-jsdoc')}
                  title="Add missing @param tags"
                >
                  Fix
                </button>
              );
            } else if (error.message.includes('No parameter schema detected')) {
              fixButton = (
                <button
                  className="auto-fix-btn"
                  onClick={() => handleAutoFix('add-param-types')}
                  title="Add parameter type annotation"
                >
                  Fix
                </button>
              );
            } else if (error.message.includes('No return type annotation found')) {
              fixButton = (
                <button
                  className="auto-fix-btn"
                  onClick={() => handleAutoFix('add-return-type')}
                  title="Add return type annotation"
                >
                  Fix
                </button>
              );
            }

            return (
              <div key={idx} className={`validation-error ${error.severity}`}>
                <div className="validation-error-content">
                  <span className="error-severity">{error.severity.toUpperCase()}</span>
                  {error.line && <span className="error-line">Line {error.line}:</span>}
                  <span className="error-message">{error.message}</span>
                </div>
                {fixButton}
              </div>
            );
          })}
        </div>
      )}

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
    </div>
  );
}
