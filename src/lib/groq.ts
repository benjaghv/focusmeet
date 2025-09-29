// src/lib/groq.ts

export interface GroqMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export type GroqModel = 
  | 'llama3-8b-8192'
  | 'llama3-70b-8192'
  | 'mixtral-8x7b-32768'
  | 'meta-llama/llama-4-scout-17b-16e-instruct';

export const GROQ_MODELS: GroqModel[] = [
  'llama3-70b-8192',                     // Más potente
  'meta-llama/llama-4-scout-17b-16e-instruct',  // Modelo especializado
  'mixtral-8x7b-32768',                  // Buen balance
  'llama3-8b-8192'                      // Más rápido
];

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