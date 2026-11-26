import { NextRequest, NextResponse } from "next/server";
import {
  AssessmentQualityReview,
  QuestionGeneratorFormInputSchema,
} from "@/lib/schemas/question";
import {
  ExperimentRunRequestSchema,
  PromptExperimentResult,
} from "@/lib/schemas/experiment";
import {
  generateQuestionsWorkflow,
  reviewQuestionsWorkflow,
  refineQuestionsWorkflow,
} from "@/lib/gemini";
import { handleApiError } from "@/lib/api-error";
import { ApiResponse } from "@/types";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<Omit<PromptExperimentResult, "runId" | "testCaseId" | "testCaseName">>>> {
  const startedAt = Date.now();
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid JSON format in request body." },
        { status: 400 }
      );
    }

    const { promptVersion, input, includeAutomatedReview } =
      ExperimentRunRequestSchema.parse(body);

    // Check input against the strict generation schema so edge-case test inputs
    // (missing topic, empty syllabus, invalid marks, overly long topic) return
    // a structured validation_error record for side-by-side comparison.
    const inputCheck = QuestionGeneratorFormInputSchema.safeParse({
      ...input,
      promptVersion,
    });

    if (!inputCheck.success) {
      const issues = inputCheck.error.issues
        .map((i) => `${i.path.join(".") || "input"}: ${i.message}`)
        .join("; ");

      return NextResponse.json({
        success: true,
        data: {
          promptVersion,
          inputSnapshot: input,
          status: "validation_error",
          errorMessage: `Input Validation Rejected: ${issues}`,
          generatedQuestions: [],
          automatedReview: null,
          refinementResults: [],
          finalQuestions: [],
          stagesExecuted: ["Input Schema Validation (Rejected)"],
          durationMs: Date.now() - startedAt,
          executedAt: new Date().toISOString(),
        },
      });
    }

    const validatedInput = inputCheck.data;
    const stagesExecuted: string[] = [];

    // Stage 1: Question Generation (V1, V2, or V3)
    const genResult = await generateQuestionsWorkflow(validatedInput);
    stagesExecuted.push(`Stage 1: Generation (${promptVersion})`);

    let automatedReview: AssessmentQualityReview | null = null;
    let refinementResults: Awaited<ReturnType<typeof refineQuestionsWorkflow>>["results"] = [];
    let finalQuestions = genResult.questions;

    // V3 is the multi-stage pipeline: Generation -> Independent Review -> Targeted Refinement
    if (promptVersion === "V3" || includeAutomatedReview) {
      automatedReview = await reviewQuestionsWorkflow({
        requirements: validatedInput,
        questions: genResult.questions,
      });
      stagesExecuted.push("Stage 2: Independent Quality Review");

      if (promptVersion === "V3") {
        const flaggedItems = genResult.questions
          .map((q) => {
            const verdict = automatedReview?.questionVerdicts.find(
              (v) => v.questionId === q.id
            );
            return verdict &&
              (verdict.status === "NEEDS_IMPROVEMENT" ||
                verdict.status === "FAIL" ||
                verdict.refinementRecommended)
              ? { question: q, review: verdict }
              : null;
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x));

        if (flaggedItems.length > 0) {
          const refineOut = await refineQuestionsWorkflow({
            requirements: validatedInput,
            items: flaggedItems,
          });
          refinementResults = refineOut.results;
          stagesExecuted.push(
            `Stage 3: Targeted Refinement (${flaggedItems.length} flagged)`
          );

          finalQuestions = genResult.questions.map((q) => {
            const refined = refinementResults.find(
              (r) => r.originalQuestionId === q.id && !r.skipped
            );
            return refined ? refined.refinedQuestion : q;
          });
        } else {
          stagesExecuted.push("Stage 3: Refinement Skipped (All Passed Review)");
        }
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        promptVersion,
        inputSnapshot: input,
        status: "success",
        generatedQuestions: genResult.questions,
        automatedReview,
        refinementResults,
        finalQuestions,
        stagesExecuted,
        durationMs: Date.now() - startedAt,
        executedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
