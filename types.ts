
export enum ToolType {
  PEN = 'PEN',
  ERASER = 'ERASER',
  POINTER = 'POINTER',
  ARROW = 'ARROW',
}

export interface Point {
  x: number;
  y: number;
}

export interface Stroke {
  points: Point[];
  color: string;
  width: number;
  tool: ToolType;
}

export enum ElementType {
  MATH = 'MATH',
  TEXT = 'TEXT',
  GRAPH = 'GRAPH'
}

export interface GraphDataPoint {
  x: number;
  y: number;
}

export enum ElementState {
  PENDING_DECISION = 'PENDING_DECISION', // User sees text and buttons [Resolve] [Cancel]
  RESOLVED = 'RESOLVED' // User sees result or graph
}

export interface BoardElement {
  id: string;
  type: ElementType;
  state: ElementState;
  x: number;
  y: number;
  content: string; // The recognized math/text (e.g. "x² + 2x")
  solution?: string; // The result (e.g. "= 4")
  graphData?: GraphDataPoint[]; // Data for charts
  latex?: string;
  solutionLatex?: string;
  width?: number;
  height?: number;
}

export interface AISolution {
  type: ElementType;
  recognizedText: string;
  solutionText?: string;
  graphData?: { x: number, y: number }[];
  latex?: string;
  solutionLatex?: string;
}


