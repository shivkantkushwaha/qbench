import { GeneratedQuestion } from "../schemas/question";
import { SavedQuestionRecord } from "@/types";

const STORAGE_KEY = "qbench_saved_questions_v1";

/**
 * Safely retrieves saved questions from browser localStorage.
 */
export function getSavedQuestions(): SavedQuestionRecord[] {
  if (typeof window === "undefined") {
    return [];
  }
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Failed to load questions from localStorage:", error);
    return [];
  }
}

/**
 * Appends a newly generated question to localStorage history.
 */
export function saveQuestionToHistory(
  question: GeneratedQuestion
): SavedQuestionRecord {
  const existing = getSavedQuestions();
  const record: SavedQuestionRecord = {
    id: question.id,
    savedAt: new Date().toISOString(),
    question,
  };

  // Keep latest 25 items to ensure localStorage remains lightweight
  const updated = [record, ...existing.filter((item) => item.id !== question.id)].slice(
    0,
    25
  );

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save question to localStorage:", error);
  }

  return record;
}

/**
 * Deletes a single question from localStorage by ID.
 */
export function removeQuestionFromHistory(id: string): void {
  if (typeof window === "undefined") return;
  try {
    const existing = getSavedQuestions();
    const filtered = existing.filter((item) => item.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("Failed to remove question from localStorage:", error);
  }
}

/**
 * Clears all saved questions from browser localStorage.
 */
export function clearQuestionHistory(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear localStorage history:", error);
  }
}
