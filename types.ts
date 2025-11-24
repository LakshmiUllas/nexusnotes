export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: number;
  lastModified: number;
  aiSummary?: string;
}

export interface Chapter {
  id: string;
  title: string;
  description?: string;
  notes: Note[];
  createdAt: number;
}

export interface Subject {
  id: string;
  title: string;
  code?: string; // e.g., CS101
  color: string; // Tailwind color class name e.g., 'bg-blue-500'
  icon?: string;
  chapters: Chapter[];
  createdAt: number;
}

export type ViewState = 'SUBJECTS' | 'CHAPTERS' | 'NOTES';

export interface BreadcrumbItem {
  id: string;
  label: string;
  type: ViewState;
}

export enum AIActionType {
  SUMMARIZE = 'SUMMARIZE',
  QUIZ = 'QUIZ',
  ELABORATE = 'ELABORATE',
  FIX_GRAMMAR = 'FIX_GRAMMAR'
}