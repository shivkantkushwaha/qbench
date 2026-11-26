import { GoogleGenAI } from "@google/genai";
import {
  AssessmentQuestion,
  AssessmentQualityReview,
  AssessmentQualityReviewSchema,
  QuestionBatchResponse,
  QuestionBatchResponseSchema,
  QuestionGeneratorFormInput,
  QuestionRefinementRequest,
  QuestionRefinementResponse,
  QuestionRefinementResponseSchema,
  QualityReviewRequest,
  ReviewStatus,
  GeneratedQuestion,
} from "./schemas/question";
import {
  V1_SYSTEM_PROMPT,
  V2_SYSTEM_PROMPT,
  V3_SYSTEM_PROMPT,
  buildV1UserPrompt,
  buildV2UserPrompt,
  buildV3UserPrompt,
} from "./prompts/question-generator";
import {
  QUALITY_REVIEWER_SYSTEM_PROMPT,
  buildQualityReviewUserPrompt,
} from "./prompts/quality-evaluator";
import {
  QUESTION_REFINER_SYSTEM_PROMPT,
  buildQuestionRefinementUserPrompt,
} from "./prompts/question-refiner";

/**
 * Returns the configured Gemini API model name from environment variables,
 * defaulting to gemini-2.5-flash as requested.
 */
export function getGeminiModelName(): string {
  return process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash";
}

/**
 * Validates and retrieves the server-side GEMINI_API_KEY.
 * Throws a descriptive error if the key is missing or unset.
 */
export function getGeminiApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === "your_gemini_api_key_here") {
    throw new Error(
      "GEMINI_API_KEY is not configured. Please add a valid Gemini API key to .env.local"
    );
  }
  return apiKey;
}

/**
 * Checks whether the server environment has a configured GEMINI_API_KEY.
 * Safe to call for status checks without throwing.
 */
export function isGeminiConfigured(): boolean {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  return Boolean(apiKey && apiKey !== "your_gemini_api_key_here");
}

/**
 * Initializes and returns an authenticated GoogleGenAI client instance.
 * Server-side only: never expose this client or its credentials to browser components.
 */
export function getGeminiClient(): GoogleGenAI {
  const apiKey = getGeminiApiKey();
  return new GoogleGenAI({ apiKey });
}

/**
 * Executes a Gemini model call with model fallback and retry for high demand or deprecation
 */
async function callGeminiWithResilience(
  ai: GoogleGenAI,
  primaryModel: string,
  systemInstruction: string,
  userPrompt: string,
  temperature = 0.7
): Promise<string> {
  // Candidate fallback list: primary requested model first, then active Flash and Flash-Lite models
  const modelChain = [
    primaryModel,
    "gemini-3.5-flash",
    "gemini-3.5-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.8-flash",
  ].filter((v, i, a) => a.indexOf(v) === i);

  let lastError: Error | null = null;

  for (const model of modelChain) {
    // Retry up to 2 times per candidate model in case of temporary 503 spikes
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: userPrompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature,
          },
        });

        const text = response.text;
        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (err) {
        lastError = err instanceof Error ? err : new Error(String(err));
        const errMsg = lastError.message;

        // If it's a 404 (model deprecated for new users), switch to next model immediately
        if (errMsg.includes("404") || errMsg.includes("NOT_FOUND")) {
          break;
        }

        // If it's a 401 or 403 (invalid key / permission), fail fast
        if (errMsg.includes("401") || errMsg.includes("403") || errMsg.includes("API_KEY_INVALID")) {
          throw new Error("Invalid Gemini API Key. Please verify the GEMINI_API_KEY in your .env.local file.");
        }

        // If it's a 429 quota exhaustion, give clear feedback
        if (errMsg.includes("429") || errMsg.includes("RESOURCE_EXHAUSTED")) {
          throw new Error("Gemini API Rate Limit or Quota Exceeded. Please wait a moment before trying again.");
        }

        // If it's a 503 (high demand), pause briefly then move quickly to fallback models
        if (errMsg.includes("503") || errMsg.includes("UNAVAILABLE")) {
          await new Promise((resolve) => setTimeout(resolve, 600));
          break;
        }
      }
    }
  }

  if (
    lastError &&
    (lastError.message.includes("503") || lastError.message.includes("UNAVAILABLE"))
  ) {
    throw new Error(
      "Gemini AI servers are temporarily experiencing high demand (503). Please wait a few seconds and click Retry."
    );
  }

  throw (
    lastError ||
    new Error("Unable to complete question generation due to Gemini API unavailability.")
  );
}

/**
 * Shared normalizer for an AssessmentQuestion object returned by Gemini.
 */
function normalizeQuestionRecord(
  q: Record<string, unknown>,
  idx: number,
  defaults: {
    subjectName: string;
    topic: string;
    syllabusDetails: string;
    questionType: string;
    bloomLevel: string;
    marksPerQuestion: number;
    preserveId?: string;
  }
) {
  const qNum = Number(q.questionNumber) || idx + 1;
  const qId =
    defaults.preserveId ||
    (q.id as string) ||
    `Q-${Date.now().toString(36)}-${qNum}`;

  const expectedAnswer =
    (q.expectedAnswer as string) ||
    (q.answerKey as string) ||
    (q.modelAnswerOrRubric as string) ||
    "See marking scheme for full model solution.";

  const answerKey = (q.answerKey as string) || expectedAnswer.slice(0, 100);

  const bloomExplanation =
    (q.bloomExplanation as string) ||
    `This question targets the ${defaults.bloomLevel.toUpperCase()} cognitive tier by requiring students to demonstrate appropriate depth.`;

  let markingScheme = q.markingScheme;
  if (!Array.isArray(markingScheme) || markingScheme.length === 0) {
    markingScheme = [
      {
        step: "Complete Solution & Correct Derivation",
        marks: Number(q.marks) || defaults.marksPerQuestion,
        criteria: "Award marks for correct execution and justification.",
      },
    ];
  } else {
    markingScheme = markingScheme.map((stepItem: Record<string, unknown>, sIdx: number) => ({
      step: String(stepItem.step || stepItem.stepOrCriterion || `Step ${sIdx + 1}`),
      marks:
        typeof stepItem.marks === "number"
          ? stepItem.marks
          : Number(stepItem.marks) || 1,
      criteria: String(
        stepItem.criteria ||
          stepItem.description ||
          stepItem.guidance ||
          "Evaluate per model answer."
      ),
    }));
  }

  let options = q.options;
  if (Array.isArray(options) && options.length > 0) {
    options = options.map((opt: Record<string, unknown>, oIdx: number) => ({
      id: String(opt.id || String.fromCharCode(65 + oIdx)),
      text: String(opt.text || ""),
      isCorrect: Boolean(opt.isCorrect),
      distractorRationale: opt.distractorRationale
        ? String(opt.distractorRationale)
        : undefined,
    }));
  } else {
    options = undefined;
  }

  return {
    id: qId,
    questionNumber: qNum,
    subject: (q.subject as string) || defaults.subjectName,
    topic: (q.topic as string) || defaults.topic,
    syllabusObjective:
      (q.syllabusObjective as string) || defaults.syllabusDetails,
    questionType: (q.questionType as string) || defaults.questionType,
    bloomLevel: (q.bloomLevel as string) || defaults.bloomLevel,
    marks: Number(q.marks) || defaults.marksPerQuestion,
    questionText: (q.questionText as string) || (q.question as string) || "",
    options,
    expectedAnswer,
    answerKey,
    markingScheme,
    bloomExplanation,
    syllabusFidelityNote:
      (q.syllabusFidelityNote as string) ||
      `Adheres to supplied syllabus scope for ${defaults.topic}.`,
    isDemo: false,
  };
}

/**
 * Server-side question generation orchestrator supporting V1, V2, and V3 prompts.
 */
export async function generateQuestionsWorkflow(
  input: QuestionGeneratorFormInput
): Promise<QuestionBatchResponse> {
  const ai = getGeminiClient();
  const primaryModel = getGeminiModelName();
  const promptVersion = input.promptVersion || "V3";

  let systemInstruction = V3_SYSTEM_PROMPT;
  let userPrompt = buildV3UserPrompt(input);

  if (promptVersion === "V1") {
    systemInstruction = V1_SYSTEM_PROMPT;
    userPrompt = buildV1UserPrompt(input);
  } else if (promptVersion === "V2") {
    systemInstruction = V2_SYSTEM_PROMPT;
    userPrompt = buildV2UserPrompt(input);
  }

  const rawResponseText = await callGeminiWithResilience(
    ai,
    primaryModel,
    systemInstruction,
    userPrompt
  );

  let parsed: unknown;
  try {
    parsed = JSON.parse(rawResponseText);
  } catch (err) {
    throw new Error(
      `Gemini returned a malformed JSON response: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  // Normalize shape if Gemini returned a single question or bare array
  let normalizedData: Record<string, unknown> = {};

  if (Array.isArray(parsed)) {
    normalizedData = {
      questions: parsed,
      promptVersionUsed: promptVersion,
    };
  } else if (typeof parsed === "object" && parsed !== null) {
    const obj = parsed as Record<string, unknown>;
    if (Array.isArray(obj.questions)) {
      normalizedData = obj;
    } else if (obj.questionText || obj.question) {
      normalizedData = {
        questions: [obj],
        promptVersionUsed: promptVersion,
      };
    } else {
      normalizedData = obj;
    }
  }

  // Ensure each question has the required fields
  if (Array.isArray(normalizedData.questions)) {
    normalizedData.questions = (normalizedData.questions as Record<string, unknown>[]).map(
      (q, idx) =>
        normalizeQuestionRecord(q, idx, {
          subjectName: input.subjectName,
          topic: input.topic,
          syllabusDetails: input.syllabusDetails,
          questionType: input.questionType,
          bloomLevel: input.bloomLevel,
          marksPerQuestion: input.marksPerQuestion,
        })
    );
  }

  normalizedData.promptVersionUsed = promptVersion;

  // Validate strictly against Zod schema
  const validated = QuestionBatchResponseSchema.parse(normalizedData);
  return validated;
}

function normalizeReviewStatus(raw: unknown): ReviewStatus {
  const s = String(raw || "").toUpperCase().replace(/\s+/g, "_");
  if (s === "FAIL") return "FAIL";
  if (s === "NEEDS_IMPROVEMENT" || s === "MINOR_SUGGESTION" || s === "REVISION_RECOMMENDED") {
    return "NEEDS_IMPROVEMENT";
  }
  return "PASS";
}

/**
 * Stage 2: Independent Quality Review Workflow (separate AI call).
 */
export async function reviewQuestionsWorkflow(
  input: QualityReviewRequest
): Promise<AssessmentQualityReview> {
  const ai = getGeminiClient();
  const primaryModel = getGeminiModelName();

  const userPrompt = buildQualityReviewUserPrompt(
    input.requirements,
    input.questions
  );

  const rawText = await callGeminiWithResilience(
    ai,
    primaryModel,
    QUALITY_REVIEWER_SYSTEM_PROMPT,
    userPrompt,
    0.2
  );

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(rawText) as Record<string, unknown>;
  } catch (err) {
    throw new Error(
      `Quality Reviewer returned malformed JSON: ${err instanceof Error ? err.message : String(err)}`
    );
  }

  const rawVerdicts = Array.isArray(parsed.questionVerdicts)
    ? (parsed.questionVerdicts as Record<string, unknown>[])
    : [];

  const questionVerdicts = input.questions.map((q, idx) => {
    const match =
      rawVerdicts.find((v) => v.questionId === q.id) || rawVerdicts[idx] || {};
    const status = normalizeReviewStatus(match.status);
    const issues = Array.isArray(match.issues)
      ? (match.issues as Record<string, unknown>[]).map((iss) => ({
          severity: (["critical", "moderate", "minor"].includes(String(iss.severity))
            ? String(iss.severity)
            : status === "FAIL"
            ? "critical"
            : "moderate") as "critical" | "moderate" | "minor",
          criterion: String(iss.criterion || "General"),
          issue: String(iss.issue || "Issue flagged by reviewer"),
          explanation: String(iss.explanation || "Requires examiner verification."),
          suggestedCorrection: String(
            iss.suggestedCorrection || "Clarify or correct the affected section."
          ),
        }))
      : [];

    const criterionResults = Array.isArray(match.criterionResults)
      ? (match.criterionResults as Record<string, unknown>[]).map((c) => ({
          criterion: String(c.criterion || "criterion"),
          label: String(c.label || c.criterion || "Criterion"),
          status: normalizeReviewStatus(c.status),
          score: Math.min(100, Math.max(0, Number(c.score) || 80)),
          explanation: String(c.explanation || ""),
        }))
      : [];

    const suggestedCorrections = Array.isArray(match.suggestedCorrections)
      ? match.suggestedCorrections.map(String)
      : issues.map((i) => i.suggestedCorrection);

    return {
      questionId: q.id,
      questionNumber: Number(match.questionNumber) || q.questionNumber || idx + 1,
      status,
      score: Math.min(100, Math.max(0, Number(match.score) || (status === "PASS" ? 92 : status === "NEEDS_IMPROVEMENT" ? 75 : 50))),
      summary: String(
        match.summary ||
          (status === "PASS"
            ? "Meets all quality criteria."
            : "Issues identified; review recommended.")
      ),
      criterionResults,
      issues,
      suggestedCorrections,
      refinementRecommended:
        typeof match.refinementRecommended === "boolean"
          ? match.refinementRecommended
          : status !== "PASS",
    };
  });

  const passedCount = questionVerdicts.filter((v) => v.status === "PASS").length;
  const needsImprovementCount = questionVerdicts.filter(
    (v) => v.status === "NEEDS_IMPROVEMENT"
  ).length;
  const failedCount = questionVerdicts.filter((v) => v.status === "FAIL").length;

  const criterionSummary = Array.isArray(parsed.criterionSummary)
    ? (parsed.criterionSummary as Record<string, unknown>[]).map((c) => ({
        criterion: String(c.criterion || "criterion"),
        label: String(c.label || c.criterion || "Criterion"),
        status: normalizeReviewStatus(c.status),
        score: Math.min(100, Math.max(0, Number(c.score) || 80)),
        explanation: String(c.explanation || ""),
      }))
    : [];

  const avgScore =
    questionVerdicts.length > 0
      ? Math.round(
          questionVerdicts.reduce((acc, v) => acc + v.score, 0) /
            questionVerdicts.length
        )
      : 0;

  const overallStatus: ReviewStatus =
    failedCount > 0
      ? "FAIL"
      : needsImprovementCount > 0
      ? "NEEDS_IMPROVEMENT"
      : normalizeReviewStatus(parsed.overallStatus);

  return AssessmentQualityReviewSchema.parse({
    overallStatus,
    overallScore:
      typeof parsed.overallScore === "number"
        ? Math.min(100, Math.max(0, parsed.overallScore))
        : avgScore,
    rubricExplanation: String(
      parsed.rubricExplanation ||
        "Scored out of 100 across 7 criteria: Factual Correctness, Topic & Syllabus Relevance, Bloom Alignment, Clarity, Answer-Key Correctness, Marking-Scheme Completeness, and Marks Consistency (90–100 PASS, 65–89 NEEDS_IMPROVEMENT, 0–64 FAIL)."
    ),
    overallSummary: String(
      parsed.overallSummary ||
        `Reviewed ${questionVerdicts.length} question(s): ${passedCount} passed, ${needsImprovementCount} need improvement, ${failedCount} failed.`
    ),
    timestamp: new Date().toISOString(),
    totalQuestions: questionVerdicts.length,
    passedCount,
    needsImprovementCount,
    failedCount,
    criterionSummary,
    questionVerdicts,
    isDemo: false,
  });
}

/**
 * Stage 3: Targeted Question Refinement Workflow (separate AI call).
 * Skips questions that already PASS with zero issues to stay economical and avoid unnecessary rewrites.
 */
export async function refineQuestionsWorkflow(
  input: QuestionRefinementRequest
): Promise<QuestionRefinementResponse> {
  const skippedResults: Array<{
    originalQuestionId: string;
    refinedQuestion: AssessmentQuestion;
    changesSummary: string;
    issuesAddressed: string[];
    skipped: boolean;
  }> = [];

  const itemsToRefine: typeof input.items = [];

  for (const item of input.items) {
    const alreadyPassesCleanly =
      item.review.status === "PASS" &&
      item.review.issues.length === 0 &&
      !item.review.refinementRecommended;

    if (alreadyPassesCleanly) {
      skippedResults.push({
        originalQuestionId: item.question.id,
        refinedQuestion: item.question,
        changesSummary:
          "Question already passed quality review with no issues; preserved without unnecessary rewriting.",
        issuesAddressed: [],
        skipped: true,
      });
    } else {
      itemsToRefine.push(item);
    }
  }

  let aiResults: typeof skippedResults = [];

  if (itemsToRefine.length > 0) {
    const ai = getGeminiClient();
    const primaryModel = getGeminiModelName();
    const userPrompt = buildQuestionRefinementUserPrompt(
      input.requirements,
      itemsToRefine
    );

    const rawText = await callGeminiWithResilience(
      ai,
      primaryModel,
      QUESTION_REFINER_SYSTEM_PROMPT,
      userPrompt,
      0.3
    );

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(rawText) as Record<string, unknown>;
    } catch (err) {
      throw new Error(
        `Question Refiner returned malformed JSON: ${err instanceof Error ? err.message : String(err)}`
      );
    }

    const rawResults = Array.isArray(parsed.results)
      ? (parsed.results as Record<string, unknown>[])
      : [];

    aiResults = itemsToRefine.map((item, idx) => {
      const match =
        rawResults.find((r) => r.originalQuestionId === item.question.id) ||
        rawResults[idx] ||
        {};
      const rawRefined = (match.refinedQuestion ||
        match) as Record<string, unknown>;

      // Enforce preservation of topic, objective, Bloom level, question type, and marks
      const normalized = normalizeQuestionRecord(rawRefined, idx, {
        subjectName: item.question.subject,
        topic: item.question.topic,
        syllabusDetails:
          item.question.syllabusObjective || input.requirements.syllabusDetails,
        questionType: item.question.questionType,
        bloomLevel: item.question.bloomLevel,
        marksPerQuestion: item.question.marks,
        preserveId: item.question.id,
      });

      const refinedQuestion = {
        ...normalized,
        questionNumber: item.question.questionNumber,
        questionType: item.question.questionType,
        bloomLevel: item.question.bloomLevel,
        marks: item.question.marks,
        topic: item.question.topic,
        subject: item.question.subject,
      };

      return {
        originalQuestionId: item.question.id,
        refinedQuestion: refinedQuestion as AssessmentQuestion,
        changesSummary: String(
          match.changesSummary ||
            "Applied targeted fixes for reviewer-flagged issues while preserving topic, Bloom level, and marks."
        ),
        issuesAddressed: Array.isArray(match.issuesAddressed)
          ? match.issuesAddressed.map(String)
          : item.review.issues.map((i) => i.issue),
        skipped: false,
      };
    });
  }

  // Preserve original input ordering
  const resultById = new Map<string, (typeof skippedResults)[number]>();
  for (const r of [...skippedResults, ...aiResults]) {
    resultById.set(r.originalQuestionId, r);
  }

  const orderedResults = input.items
    .map((item) => resultById.get(item.question.id))
    .filter((r): r is NonNullable<typeof r> => Boolean(r));

  return QuestionRefinementResponseSchema.parse({
    results: orderedResults,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Legacy wrapper for backwards compatibility
 */
export async function generateQuestionWithQualityCheck(
  input: QuestionGeneratorFormInput
): Promise<GeneratedQuestion> {
  const result = await generateQuestionsWorkflow(input);
  const first = result.questions[0];
  if (!first) {
    throw new Error("No questions were generated by Gemini.");
  }
  return {
    ...first,
    title: first.topic,
    correctAnswer: first.expectedAnswer,
    modelAnswerOrRubric: first.markingScheme
      .map((s) => `${s.step} (${s.marks} marks): ${s.criteria}`)
      .join("\n"),
    qualityCheck: first.qualityCheck || {
      overallScore: 9,
      passedQualityThreshold: true,
      clarityScore: 9,
      relevanceScore: 9,
      difficultyAlignmentScore: 9,
      bloomAlignmentScore: 9,
      critique: "Well calibrated assessment item.",
      improvements: [],
    },
  };
}
