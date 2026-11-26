import { NextResponse } from "next/server";
import { isGeminiConfigured, getGeminiModelName } from "@/lib/gemini";
import { ApiResponse, HealthStatus } from "@/types";

export async function GET(): Promise<NextResponse<ApiResponse<HealthStatus>>> {
  try {
    const configured = isGeminiConfigured();
    const model = getGeminiModelName();

    return NextResponse.json({
      success: true,
      data: {
        status: configured ? "ok" : "degraded",
        timestamp: new Date().toISOString(),
        geminiConfigured: configured,
        model,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Health check failed",
      },
      { status: 500 }
    );
  }
}
