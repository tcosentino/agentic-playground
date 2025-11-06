import { useFunctions } from '../hooks/useFunctions';
import { FunctionList } from './FunctionList';
import { FunctionEditor } from './FunctionEditor';
import './Functions.css';

export function Functions() {
  const {
    functions,
    selectedFunction,
    selectedFunctionId,
    setSelectedFunctionId,
    createFunction,
    updateFunction,
    deleteFunction,
    loadExamples,
  } = useFunctions();

  return (
    <div className="functions-container">
      <div className="functions-sidebar">
        <FunctionList
          functions={functions}
          selectedFunctionId={selectedFunctionId}
          onSelectFunction={setSelectedFunctionId}
          onCreateFunction={createFunction}
          onDeleteFunction={deleteFunction}
          onLoadExamples={loadExamples}
        />
      </div>
      <div className="functions-main">
        <FunctionEditor
          functionDef={selectedFunction || null}
          onUpdate={updateFunction}
        />
      </div>
      <div className="functions-sidebar-right">
        <div className="sidebar-section">
          <h3>Parameters</h3>
          {selectedFunction?.parameters ? (
            <div className="parameters-panel">
              {Object.entries(selectedFunction.parameters.properties).map(([name, prop]) => (
                <div key={name} className="parameter-item">
                  <div className="parameter-header">
                    <span className="parameter-name">{name}</span>
                    {selectedFunction.parameters?.required.includes(name) ? (
                      <span className="parameter-badge required">required</span>
                    ) : (
                      <span className="parameter-badge optional">optional</span>
                    )}
                  </div>
                  <div className="parameter-type">{prop.type}</div>
                  {prop.description && (
                    <div className="parameter-description">{prop.description}</div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="parameters-empty">
              {selectedFunction ? 'No parameters detected' : 'Select a function to view parameters'}
            </div>
          )}
        </div>

        {selectedFunction?.returnType && (
          <div className="sidebar-section">
            <h3>Return Type</h3>
            <div className="return-type-display">
              <code>{selectedFunction.returnType}</code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
