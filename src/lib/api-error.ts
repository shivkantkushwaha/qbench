import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { ApiResponse } from "@/types";

/**
 * Shared API route error handler for Zod validation, auth, rate-limit, and server errors.
 */
export function handleApiError<T>(error: unknown): NextResponse<ApiResponse<T>> {
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

  const errorMessage =
    error instanceof Error ? error.message : "An unexpected server error occurred";

  let statusCode = 500;
  if (errorMessage.includes("Rate Limit") || errorMessage.includes("Quota")) {
    statusCode = 429;
  } else if (
    errorMessage.includes("Invalid Gemini API Key") ||
    errorMessage.includes("not configured")
  ) {
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
