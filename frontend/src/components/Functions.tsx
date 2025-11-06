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
    </div>
  );
}
