export * from "../lib/schemas/common";
export * from "../lib/schemas/question";
export * from "../lib/schemas/experiment";

export type ActiveTab =
  | "dashboard"
  | "generator"
  | "results"
  | "quality-review"
  | "prompt-lab";

export interface ActivityLogItem {
  id: string;
  timestamp: string;
  subject: string;
  topic: string;
  questionType: string;
  count: number;
  bloomLevel: string;
  status: "generated" | "reviewed" | "draft";
}

export interface PromptVersionData {
  version: "V1" | "V2" | "V3";
  title: string;
  tagline: string;
  purpose: string;
  architectureTechnique: string;
  systemPrompt: string;
  userPromptTemplate: string;
  strengths: string[];
  weaknesses: string[];
  evolutionReason: string;
  recommendedFor: string;
}

/**
 * Standard API Response envelope
 */
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
      message?: string;
    }
  | {
      success: false;
      error: string;
      details?: unknown;
    };

/**
 * System Health Check response
 */
export interface HealthStatus {
  status: "ok" | "degraded";
  timestamp: string;
  geminiConfigured: boolean;
  model: string;
}

/**
 * Browser localStorage saved question record
 */
export interface SavedQuestionRecord {
  id: string;
  savedAt: string;
  question: import("../lib/schemas/question").GeneratedQuestion;
}

/**
 * Before-and-after record for refined questions (Stage 3)
 */
export interface RefinedQuestionComparison {
  originalQuestionId: string;
  before: import("../lib/schemas/question").AssessmentQuestion;
  after: import("../lib/schemas/question").AssessmentQuestion;
  changesSummary: string;
  issuesAddressed: string[];
  refinedAt: string;
}
