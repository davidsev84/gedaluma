export type Role = 'admin' | 'evaluator' | 'ghost';

export interface User {
  id: string;
  name: string;
  role: Role;
  pin: string;
}

export interface Isla {
  id: string;
  name: string;
  location: string;
  manager: string;
}

export interface Evaluation {
  id: string;
  islaId: string;
  evaluatorId: string;
  startTime: string;
  endTime: string | null;
  type: 'internal' | 'ghost';
  totalScore: number;
  status: 'draft' | 'completed';
}

export interface Response {
  id: string;
  evaluationId: string;
  category: string;
  questionId: string;
  score?: number; // legacy/rating
  value?: string | number; // new format for mixed types
  observation?: string;
  photoUrl?: string;
}

export interface Category {
  id: string;
  name: string;
  weight: number; // For ghost client this can be 0
  questions: Question[];
}

export interface Question {
  id: string;
  text: string;
  type?: 'rating' | 'choice' | 'text'; // Default to 'rating' if undefined
  options?: string[];
}
