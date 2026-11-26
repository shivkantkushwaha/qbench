import { NextRequest, NextResponse } from "next/server";
import {
  QualityReviewRequestSchema,
  AssessmentQualityReview,
} from "@/lib/schemas/question";
import { reviewQuestionsWorkflow } from "@/lib/gemini";
import { handleApiError } from "@/lib/api-error";
import { ApiResponse } from "@/types";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<AssessmentQualityReview>>> {
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

    const parsedInput = QualityReviewRequestSchema.parse(body);
    const reviewReport = await reviewQuestionsWorkflow(parsedInput);

    return NextResponse.json({
      success: true,
      data: reviewReport,
      message: `Completed independent quality review for ${reviewReport.totalQuestions} question(s).`,
    });
  } catch (error) {
    return handleApiError<AssessmentQualityReview>(error);
  }
}
