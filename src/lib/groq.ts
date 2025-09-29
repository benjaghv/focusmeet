// src/lib/groq.ts

export interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type GroqModel = 'llama-3.3-70b-versatile';

export const GROQ_MODELS: GroqModel[] = ['llama-3.3-70b-versatile'];

export interface GroqResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export interface AnalysisResult {
  shortSummary: string;
  detailedSummary: string;
  keyPoints: string[];
  decisions: string[];
  tasks: Array<{
    description: string;
    responsible: string;
  }>;
}