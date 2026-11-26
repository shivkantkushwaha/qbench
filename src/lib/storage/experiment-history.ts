import { PromptExperimentResult } from "../schemas/experiment";

const EXPERIMENT_STORAGE_KEY = "qbench_prompt_experiments_v1";

export function createExperimentRunId(version: string): string {
  return `exp-${version}-${Date.now()}`;
}

/**
 * Safely retrieves saved prompt experiment records from browser localStorage.
 */
export function getExperimentRecords(): PromptExperimentResult[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(EXPERIMENT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load experiment records from localStorage:", error);
    return [];
  }
}

/**
 * Saves or updates an experiment record in browser localStorage.
 */
export function saveExperimentRecord(
  record: PromptExperimentResult
): PromptExperimentResult[] {
  const existing = getExperimentRecords();
  const updated = [
    record,
    ...existing.filter((item) => item.runId !== record.runId),
  ].slice(0, 50);

  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to save experiment record to localStorage:", error);
    }
  }
  return updated;
}

/**
 * Deletes a single experiment record by runId.
 */
export function deleteExperimentRecord(
  runId: string
): PromptExperimentResult[] {
  const existing = getExperimentRecords();
  const updated = existing.filter((item) => item.runId !== runId);
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(EXPERIMENT_STORAGE_KEY, JSON.stringify(updated));
    } catch (error) {
      console.error("Failed to delete experiment record:", error);
    }
  }
  return updated;
}

/**
 * Clears all saved experiment records from localStorage.
 */
export function clearExperimentRecords(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(EXPERIMENT_STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear experiment records:", error);
  }
}

function escapeCsvCell(value: unknown): string {
  const str = String(value ?? "");
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/**
 * Builds a CSV string from actual recorded experiment results.
 */
export function buildExperimentsCsv(records: PromptExperimentResult[]): string {
  const headers = [
    "Run ID",
    "Executed At",
    "Test Case ID",
    "Test Case Name",
    "Prompt Version",
    "Execution Status",
    "Stages Executed",
    "Duration (ms)",
    "Subject",
    "Topic",
    "Bloom Level",
    "Question Type",
    "Marks Per Question",
    "Final Question Stem",
    "Automated Reviewer Status (AI Assistance)",
    "Automated Reviewer Score (AI Assistance)",
    "Human Evaluator Verdict",
    "Human: Factual Correctness",
    "Human: Syllabus Relevance",
    "Human: Bloom Alignment",
    "Human: Clarity",
    "Human: Answer-Key Quality",
    "Human: Marking-Scheme Quality",
    "Human Evaluator Comments",
    "Error Message",
  ];

  const rows = records.map((r) => {
    const q = r.finalQuestions[0];
    const he = r.humanEvaluation;
    return [
      r.runId,
      r.executedAt,
      r.testCaseId,
      r.testCaseName,
      r.promptVersion,
      r.status,
      r.stagesExecuted.join(" -> "),
      r.durationMs,
      r.inputSnapshot.subjectName,
      r.inputSnapshot.topic,
      r.inputSnapshot.bloomLevel,
      r.inputSnapshot.questionType,
      r.inputSnapshot.marksPerQuestion,
      q?.questionText || "",
      r.automatedReview?.overallStatus || "Not Run",
      r.automatedReview?.overallScore ?? "",
      he?.overallVerdict || "Not Evaluated",
      he?.criteria.factualCorrectness || "UNRATED",
      he?.criteria.syllabusRelevance || "UNRATED",
      he?.criteria.bloomAlignment || "UNRATED",
      he?.criteria.clarity || "UNRATED",
      he?.criteria.answerKeyQuality || "UNRATED",
      he?.criteria.markingSchemeQuality || "UNRATED",
      he?.comments || "",
      r.errorMessage || "",
    ].map(escapeCsvCell);
  });

  return [headers.map(escapeCsvCell).join(","), ...rows.map((r) => r.join(","))].join("\r\n");
}
