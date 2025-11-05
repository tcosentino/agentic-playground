export interface FunctionDefinition {
  id: string;
  name: string;
  description: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface FunctionsState {
  functions: FunctionDefinition[];
  selectedFunctionId: string | null;
}
