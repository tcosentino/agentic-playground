import { useState } from 'react';
import { FunctionDefinition } from '../types/functions';
import './FunctionList.css';

interface FunctionListProps {
  functions: FunctionDefinition[];
  selectedFunctionId: string | null;
  onSelectFunction: (id: string) => void;
  onCreateFunction: (name: string, description: string) => void;
  onDeleteFunction: (id: string) => void;
}

export function FunctionList({
  functions,
  selectedFunctionId,
  onSelectFunction,
  onCreateFunction,
  onDeleteFunction,
}: FunctionListProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newFunctionName, setNewFunctionName] = useState('');
  const [newFunctionDescription, setNewFunctionDescription] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newFunctionName.trim()) {
      onCreateFunction(newFunctionName.trim(), newFunctionDescription.trim());
      setNewFunctionName('');
      setNewFunctionDescription('');
      setShowCreateModal(false);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this function?')) {
      onDeleteFunction(id);
    }
  };

  return (
    <div className="function-list">
      <div className="function-list-header">
        <h3>Functions</h3>
        <button
          className="create-function-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + New Function
        </button>
      </div>

      <div className="function-items">
        {functions.length === 0 ? (
          <div className="empty-state">
            <p>No functions yet</p>
            <p className="empty-state-hint">
              Create a function to get started
            </p>
          </div>
        ) : (
          functions.map((fn) => (
            <div
              key={fn.id}
              className={`function-item ${
                selectedFunctionId === fn.id ? 'selected' : ''
              }`}
              onClick={() => onSelectFunction(fn.id)}
            >
              <div className="function-item-content">
                <div className="function-item-name">{fn.name}</div>
                {fn.description && (
                  <div className="function-item-description">
                    {fn.description}
                  </div>
                )}
                <div className="function-item-meta">
                  Updated {new Date(fn.updatedAt).toLocaleDateString()}
                </div>
              </div>
              <button
                className="delete-function-btn"
                onClick={(e) => handleDelete(fn.id, e)}
                aria-label="Delete function"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create New Function</h3>
              <button
                className="modal-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="form-group">
                <label htmlFor="function-name">Function Name</label>
                <input
                  id="function-name"
                  type="text"
                  value={newFunctionName}
                  onChange={(e) => setNewFunctionName(e.target.value)}
                  placeholder="myFunction"
                  required
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label htmlFor="function-description">Description</label>
                <textarea
                  id="function-description"
                  value={newFunctionDescription}
                  onChange={(e) => setNewFunctionDescription(e.target.value)}
                  placeholder="What does this function do?"
                  rows={3}
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowCreateModal(false)}
                >
                  Cancel
                </button>
                <button type="submit">Create Function</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
