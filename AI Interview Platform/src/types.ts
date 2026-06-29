export type TopicType = "DSA" | "DBMS" | "OS" | "System Design" | "OOPs";
export type LanguageType = "Python" | "JavaScript" | "Java" | "C++" | "Go";
export type DifficultyType = "Easy" | "Medium" | "Hard";
export type AiEngineType = "Auto" | "Gemini" | "DeepSeek";

export interface CodingChallenge {
  problem: string;
  starterCode: string;
  solution: string;
}

export interface Question {
  id: number;
  question: string;
  answer: string;
  followUp: string;
  codingChallenge: CodingChallenge;
}

export interface CodeEvaluation {
  score: number;
  passed: boolean;
  feedback: string;
  timeComplexity: string;
  spaceComplexity: string;
  suggestions: string[];
  improvedCode: string;
}

export interface PrepSession {
  id: string;
  topic: TopicType;
  language: LanguageType;
  difficulty: DifficultyType;
  questions: Question[];
  createdAt: string;
  bookmarked: boolean;
  userAttempts?: Record<number, {
    code: string;
    evaluation?: CodeEvaluation;
    timestamp: string;
  }>;
}
