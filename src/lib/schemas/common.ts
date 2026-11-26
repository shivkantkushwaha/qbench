import { z } from "zod";

export const DifficultyLevelSchema = z.enum(["easy", "medium", "hard"]);
export type DifficultyLevel = z.infer<typeof DifficultyLevelSchema>;

export const QuestionTypeSchema = z.enum([
  "multiple_choice",
  "short_answer",
  "long_answer",
  "descriptive",
  "problem_solving",
  "conceptual",
]);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

export const BloomTaxonomyLevelSchema = z.enum([
  "remember",
  "understand",
  "apply",
  "analyze",
  "evaluate",
  "create",
]);
export type BloomTaxonomyLevel = z.infer<typeof BloomTaxonomyLevelSchema>;
