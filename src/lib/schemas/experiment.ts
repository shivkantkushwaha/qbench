import { z } from "zod";
import {
  AssessmentQuestion,
  AssessmentQualityReview,
  PromptVersion,
  RefinedQuestionResult,
} from "./question";

export const ExperimentInputSchema = z.object({
  subjectName: z.string(),
  topic: z.string(),
  syllabusDetails: z.string(),
  bloomLevel: z.string(),
  questionType: z.string(),
  numQuestions: z.number(),
  marksPerQuestion: z.number(),
  additionalInstructions: z.string().optional(),
});

export type ExperimentInput = z.infer<typeof ExperimentInputSchema>;

export interface ExperimentTestCase {
  id: string;
  name: string;
  category: string;
  description: string;
  expectedBehavior: string;
  input: ExperimentInput;
}

export type HumanEvaluationCriterionKey =
  | "factualCorrectness"
  | "syllabusRelevance"
  | "bloomAlignment"
  | "clarity"
  | "answerKeyQuality"
  | "markingSchemeQuality";

export const HUMAN_EVALUATION_CRITERIA: Array<{
  key: HumanEvaluationCriterionKey;
  label: string;
  description: string;
}> = [
  {
    key: "factualCorrectness",
    label: "Factual Correctness",
    description: "Domain facts, formulas, traces, and technical claims are accurate.",
  },
  {
    key: "syllabusRelevance",
    label: "Syllabus Relevance",
    description: "Stays within the provided topic and learning objectives without hallucinated modules.",
  },
  {
    key: "bloomAlignment",
    label: "Bloom's Level Alignment",
    description: "Cognitive demand genuinely matches the requested Bloom's taxonomy tier.",
  },
  {
    key: "clarity",
    label: "Clarity",
    description: "Question stem is unambiguous, well-structured, and self-contained.",
  },
  {
    key: "answerKeyQuality",
    label: "Answer-Key Quality",
    description: "Expected answer / correct option is accurate, complete, and clear.",
  },
  {
    key: "markingSchemeQuality",
    label: "Marking-Scheme Quality",
    description: "Rubric steps are objective, granular, and sum to the exact total marks.",
  },
];

export interface HumanEvaluationRecord {
  overallVerdict: "PASS" | "FAIL";
  criteria: Record<HumanEvaluationCriterionKey, "PASS" | "FAIL" | "UNRATED">;
  comments: string;
  evaluatorName?: string;
  evaluatedAt: string;
}

export interface PromptExperimentResult {
  runId: string;
  testCaseId: string;
  testCaseName: string;
  promptVersion: PromptVersion;
  inputSnapshot: ExperimentInput;
  status: "success" | "validation_error" | "api_error";
  errorMessage?: string;
  generatedQuestions: AssessmentQuestion[];
  automatedReview?: AssessmentQualityReview | null;
  refinementResults?: RefinedQuestionResult[];
  finalQuestions: AssessmentQuestion[];
  stagesExecuted: string[];
  durationMs: number;
  executedAt: string;
  humanEvaluation?: HumanEvaluationRecord;
}

export const ExperimentRunRequestSchema = z.object({
  promptVersion: z.enum(["V1", "V2", "V3"]),
  input: ExperimentInputSchema,
  includeAutomatedReview: z.boolean().optional().default(false),
});

export type ExperimentRunRequest = z.infer<typeof ExperimentRunRequestSchema>;
