import { useState, useEffect } from 'react';
import { FunctionDefinition } from '../types/functions';

const STORAGE_KEY = 'ai-playground-functions';

export function useFunctions() {
  const [functions, setFunctions] = useState<FunctionDefinition[]>([]);
  const [selectedFunctionId, setSelectedFunctionId] = useState<string | null>(null);

  // Load functions from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setFunctions(parsed);
      } catch (error) {
        console.error('Failed to load functions from localStorage:', error);
      }
    }
  }, []);

  // Save functions to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(functions));
  }, [functions]);

  const createFunction = (name: string, description: string): FunctionDefinition => {
    const newFunction: FunctionDefinition = {
      id: crypto.randomUUID(),
      name,
      description,
      code: `function ${name}() {\n  // Your code here\n  \n}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setFunctions((prev) => [...prev, newFunction]);
    setSelectedFunctionId(newFunction.id);
    return newFunction;
  };

  const updateFunction = (id: string, updates: Partial<Omit<FunctionDefinition, 'id' | 'createdAt'>>) => {
    setFunctions((prev) =>
      prev.map((fn) =>
        fn.id === id
          ? { ...fn, ...updates, updatedAt: new Date().toISOString() }
          : fn
      )
    );
  };

  const deleteFunction = (id: string) => {
    setFunctions((prev) => prev.filter((fn) => fn.id !== id));
    if (selectedFunctionId === id) {
      setSelectedFunctionId(null);
    }
  };

  const getFunction = (id: string): FunctionDefinition | undefined => {
    return functions.find((fn) => fn.id === id);
  };

  const selectedFunction = selectedFunctionId
    ? getFunction(selectedFunctionId)
    : null;

  return {
    functions,
    selectedFunction,
    selectedFunctionId,
    setSelectedFunctionId,
    createFunction,
    updateFunction,
    deleteFunction,
    getFunction,
  };
}
