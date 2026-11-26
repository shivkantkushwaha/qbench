import { NextRequest, NextResponse } from "next/server";
import {
  QuestionRefinementRequestSchema,
  QuestionRefinementResponse,
} from "@/lib/schemas/question";
import { refineQuestionsWorkflow } from "@/lib/gemini";
import { handleApiError } from "@/lib/api-error";
import { ApiResponse } from "@/types";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<QuestionRefinementResponse>>> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON format in request body.",
        },
        { status: 400 }
      );
    }

    const parsedInput = QuestionRefinementRequestSchema.parse(body);
    const refinementResult = await refineQuestionsWorkflow(parsedInput);

    return NextResponse.json({
      success: true,
      data: refinementResult,
      message: `Processed refinement for ${refinementResult.results.length} question(s).`,
    });
  } catch (error) {
    return handleApiError<QuestionRefinementResponse>(error);
  }
}
