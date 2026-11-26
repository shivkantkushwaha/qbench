import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";
import {
  QuestionGeneratorFormInputSchema,
  QuestionBatchResponse,
} from "@/lib/schemas/question";
import { generateQuestionsWorkflow } from "@/lib/gemini";
import { ApiResponse } from "@/types";

export async function POST(
  req: NextRequest
): Promise<NextResponse<ApiResponse<QuestionBatchResponse>>> {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid JSON format in request body. Please ensure valid JSON is sent.",
        },
        { status: 400 }
      );
    }

    // Validate request parameters against Zod schema
    const parsedInput = QuestionGeneratorFormInputSchema.parse(body);

    // Call server-side Gemini service with official @google/genai SDK
    const result = await generateQuestionsWorkflow(parsedInput);

    return NextResponse.json({
      success: true,
      data: result,
      message: `Successfully generated ${result.questions.length} question(s) using prompt ${result.promptVersionUsed}`,
    });
  } catch (error) {
    // Handle Zod input validation errors
    if (error instanceof ZodError) {
      const fieldErrors = error.flatten().fieldErrors;
      const firstErrorMessage =
        Object.values(fieldErrors).flat()[0] || "Invalid input parameters";

      return NextResponse.json(
        {
          success: false,
          error: `Validation Error: ${firstErrorMessage}`,
          details: fieldErrors,
        },
        { status: 400 }
      );
    }

    // Handle missing API key, rate limits, or Gemini API errors
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected server error occurred";

    let statusCode = 500;
    if (errorMessage.includes("Rate Limit") || errorMessage.includes("Quota")) {
      statusCode = 429;
    } else if (errorMessage.includes("Invalid Gemini API Key") || errorMessage.includes("not configured")) {
      statusCode = 401;
    }

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}
