import { z } from "zod";
import {
  DifficultyLevelSchema,
  QuestionTypeSchema,
  BloomTaxonomyLevelSchema,
} from "./common";

export const PromptVersionSchema = z.enum(["V1", "V2", "V3"]).default("V3");
export type PromptVersion = z.infer<typeof PromptVersionSchema>;

/**
 * Multiple Choice Option schema
 */
export const QuestionOptionSchema = z.object({
  id: z.string().describe("Option identifier (A, B, C, D)"),
  text: z.string().min(1, "Option text cannot be empty"),
  isCorrect: z.boolean().describe("Whether this option is the correct answer"),
  distractorRationale: z
    .string()
    .optional()
    .describe("Pedagogical explanation of why this option is correct or a plausible distractor"),
});

/**
 * Step-by-step marking rubric point
 */
export const RubricStepSchema = z.object({
  step: z.coerce.string().describe("Step name, milestone, or criterion"),
  marks: z.coerce.number().describe("Marks allocated to this step"),
  criteria: z.coerce.string().describe("Specific scoring guidance for the examiner"),
});

/**
 * Quality check report schema
 */
export const QualityCheckReportSchema = z.object({
  overallScore: z.coerce.number().min(1).max(10).default(9),
  passedQualityThreshold: z.boolean().default(true),
  clarityScore: z.coerce.number().min(1).max(10).default(9),
  relevanceScore: z.coerce.number().min(1).max(10).default(9),
  difficultyAlignmentScore: z.coerce.number().min(1).max(10).default(9),
  bloomAlignmentScore: z.coerce.number().min(1).max(10).default(9),
  critique: z.coerce.string().default("Well calibrated assessment item."),
  distractorQuality: z.string().optional(),
  improvements: z.array(z.string()).default([]),
});

/**
 * Complete assessment question item
 */
export const AssessmentQuestionSchema = z.object({
  id: z.coerce.string().describe("Unique Question ID"),
  questionNumber: z.coerce.number().default(1),
  subject: z.coerce.string(),
  courseOrSubject: z.string().optional(),
  title: z.string().optional(),
  topic: z.coerce.string(),
  syllabusObjective: z.string().optional(),
  difficulty: DifficultyLevelSchema.optional().default("medium"),
  questionType: QuestionTypeSchema,
  bloomLevel: BloomTaxonomyLevelSchema,
  marks: z.coerce.number(),
  questionText: z.coerce.string().min(5, "Question text must be at least 5 characters"),
  options: z.array(QuestionOptionSchema).optional(),
  expectedAnswer: z
    .coerce
    .string()
    .optional()
    .default("")
    .describe("Expected model answer or solution summary"),
  answerKey: z
    .coerce
    .string()
    .optional()
    .default("")
    .describe("Short answer key or selected option identifier"),
  markingScheme: z
    .array(RubricStepSchema)
    .default([])
    .describe("Marking scheme with criteria and marks"),
  bloomExplanation: z
    .coerce
    .string()
    .optional()
    .default("")
    .describe("Short explanation of why the question matches the selected Bloom's level"),
  syllabusFidelityNote: z
    .string()
    .optional()
    .describe("Note on how the question respects the user-provided syllabus or acknowledged limitations"),
  isDemo: z.boolean().default(false),
  qualityCheck: QualityCheckReportSchema.optional(),
});

/**
 * Request schema for generating questions via API
 */
export const QuestionGeneratorFormInputSchema = z.object({
  subjectName: z
    .string()
    .min(2, "Subject name must be at least 2 characters")
    .max(100, "Subject name too long"),
  topic: z
    .string()
    .min(2, "Topic must be at least 2 characters")
    .max(150, "Topic too long"),
  syllabusDetails: z
    .string()
    .min(3, "Please provide syllabus details or learning objectives")
    .max(1000, "Syllabus details must not exceed 1000 characters"),
  bloomLevel: BloomTaxonomyLevelSchema,
  questionType: QuestionTypeSchema,
  numQuestions: z.number().min(1).max(10).default(1),
  marksPerQuestion: z.number().min(1).max(50).default(5),
  additionalInstructions: z.string().max(800).optional(),
  promptVersion: PromptVersionSchema.default("V3"),
});

/**
 * Batch output from the Gemini API
 */
export const QuestionBatchResponseSchema = z.object({
  questions: z.array(AssessmentQuestionSchema),
  syllabusFidelitySummary: z.string().optional(),
  promptVersionUsed: PromptVersionSchema,
});

/**
 * Stage 2 & 3 Statuses and Criteria
 */
export const ReviewStatusSchema = z.enum(["PASS", "NEEDS_IMPROVEMENT", "FAIL"]);
export type ReviewStatus = z.infer<typeof ReviewStatusSchema>;

export const ReviewCriterionIdSchema = z.enum([
  "factual_correctness",
  "topic_syllabus_relevance",
  "bloom_alignment",
  "clarity_unambiguity",
  "answer_key_correctness",
  "marking_scheme_completeness",
  "marks_consistency",
]);
export type ReviewCriterionId = z.infer<typeof ReviewCriterionIdSchema>;

export const CriterionEvaluationSchema = z.object({
  criterion: z.string(),
  label: z.string(),
  status: ReviewStatusSchema,
  score: z.coerce.number().min(0).max(100),
  explanation: z.string(),
});
export type CriterionEvaluation = z.infer<typeof CriterionEvaluationSchema>;

export const QuestionIssueSchema = z.object({
  severity: z.enum(["critical", "moderate", "minor"]).default("moderate"),
  criterion: z.string(),
  issue: z.string(),
  explanation: z.string(),
  suggestedCorrection: z.string(),
});
export type QuestionIssue = z.infer<typeof QuestionIssueSchema>;

/**
 * Quality Review Verdict for an individual question (Stage 2)
 */
export const QuestionReviewVerdictSchema = z.object({
  questionId: z.string(),
  questionNumber: z.coerce.number(),
  status: ReviewStatusSchema,
  score: z.coerce.number().min(0).max(100),
  summary: z.string(),
  criterionResults: z.array(CriterionEvaluationSchema).default([]),
  issues: z.array(QuestionIssueSchema).default([]),
  suggestedCorrections: z.array(z.string()).default([]),
  refinementRecommended: z.boolean().default(false),
});

/**
 * Complete Assessment Quality Review Report (Stage 2)
 */
export const AssessmentQualityReviewSchema = z.object({
  overallStatus: ReviewStatusSchema,
  overallScore: z.coerce.number().min(0).max(100),
  rubricExplanation: z.string(),
  overallSummary: z.string(),
  timestamp: z.string(),
  totalQuestions: z.coerce.number(),
  passedCount: z.coerce.number(),
  needsImprovementCount: z.coerce.number().default(0),
  failedCount: z.coerce.number().default(0),
  criterionSummary: z.array(CriterionEvaluationSchema).default([]),
  questionVerdicts: z.array(QuestionReviewVerdictSchema),
  isDemo: z.boolean().optional().default(false),
});

/**
 * Stage 2 API Request Schema
 */
export const QualityReviewRequestSchema = z.object({
  requirements: QuestionGeneratorFormInputSchema,
  questions: z.array(AssessmentQuestionSchema).min(1, "At least one question is required for review"),
});
export type QualityReviewRequest = z.infer<typeof QualityReviewRequestSchema>;

/**
 * Stage 3 Refinement Request & Response Schemas
 */
export const RefinementItemInputSchema = z.object({
  question: AssessmentQuestionSchema,
  review: QuestionReviewVerdictSchema,
});

export const QuestionRefinementRequestSchema = z.object({
  requirements: QuestionGeneratorFormInputSchema,
  items: z.array(RefinementItemInputSchema).min(1, "At least one question must be selected for refinement"),
});
export type QuestionRefinementRequest = z.infer<typeof QuestionRefinementRequestSchema>;

export const RefinedQuestionResultSchema = z.object({
  originalQuestionId: z.string(),
  refinedQuestion: AssessmentQuestionSchema,
  changesSummary: z.string(),
  issuesAddressed: z.array(z.string()).default([]),
  skipped: z.boolean().optional().default(false),
});
export type RefinedQuestionResult = z.infer<typeof RefinedQuestionResultSchema>;

export const QuestionRefinementResponseSchema = z.object({
  results: z.array(RefinedQuestionResultSchema),
  timestamp: z.string(),
});
export type QuestionRefinementResponse = z.infer<typeof QuestionRefinementResponseSchema>;

/**
 * Legacy schema compatibility
 */
export const QuestionGenerationInputSchema = z.object({
  topic: z.string().min(2),
  courseOrSubject: z.string().optional().default("General Computing"),
  subjectName: z.string().optional().default("General Computing"),
  syllabusDetails: z.string().optional().default("General learning objectives"),
  difficulty: DifficultyLevelSchema.optional().default("medium"),
  questionType: QuestionTypeSchema.default("multiple_choice"),
  bloomLevel: BloomTaxonomyLevelSchema.default("apply"),
  targetAudience: z.string().optional().default("Undergraduate Students"),
  additionalInstructions: z.string().optional(),
  numQuestions: z.number().optional().default(1),
  marksPerQuestion: z.number().optional().default(5),
  promptVersion: PromptVersionSchema.default("V3"),
});

export const GeneratedQuestionSchema = AssessmentQuestionSchema.extend({
  title: z.string().optional().default("Generated Question"),
  correctAnswer: z.string().optional().default(""),
  modelAnswerOrRubric: z.string().optional().default(""),
  qualityCheck: QualityCheckReportSchema.optional().default({
    overallScore: 9,
    passedQualityThreshold: true,
    clarityScore: 9,
    relevanceScore: 9,
    difficultyAlignmentScore: 9,
    bloomAlignmentScore: 9,
    critique: "Well calibrated assessment item.",
    improvements: [],
  }),
  metadata: z
    .object({
      model: z.string(),
      generatedAt: z.string(),
    })
    .optional(),
});

export type QuestionOption = z.infer<typeof QuestionOptionSchema>;
export type RubricStep = z.infer<typeof RubricStepSchema>;
export type AssessmentQuestion = z.infer<typeof AssessmentQuestionSchema>;
export type QuestionBatchResponse = z.infer<typeof QuestionBatchResponseSchema>;
export type QuestionReviewVerdict = z.infer<typeof QuestionReviewVerdictSchema>;
export type AssessmentQualityReview = z.infer<typeof AssessmentQualityReviewSchema>;
export type QuestionGeneratorFormInput = z.infer<typeof QuestionGeneratorFormInputSchema>;

export type QualityCheckReport = z.infer<typeof QualityCheckReportSchema>;
export type QuestionGenerationInput = z.infer<typeof QuestionGenerationInputSchema>;
export type GeneratedQuestion = z.infer<typeof GeneratedQuestionSchema>;
