"use client";

import React, { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { GeneratorView } from "@/components/generator/GeneratorView";
import { ResultsView } from "@/components/results/ResultsView";
import { QualityReviewView } from "@/components/review/QualityReviewView";
import { PromptLabView } from "@/components/prompts/PromptLabView";
import {
  ActiveTab,
  ApiResponse,
  AssessmentQuestion,
  AssessmentQualityReview,
  QuestionGeneratorFormInput,
  QuestionRefinementResponse,
  RefinedQuestionComparison,
} from "@/types";
import {
  DEMO_ASSESSMENT_QUESTIONS,
  DEMO_QUALITY_REVIEW,
} from "@/lib/mock-data";

export default function HomePage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("dashboard");
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(
    DEMO_ASSESSMENT_QUESTIONS
  );
  const [lastRequirements, setLastRequirements] =
    useState<QuestionGeneratorFormInput | null>(null);
  const [qualityReview, setQualityReview] =
    useState<AssessmentQualityReview | null>(DEMO_QUALITY_REVIEW);
  const [refinementHistory, setRefinementHistory] = useState<
    Record<string, RefinedQuestionComparison>
  >({});

  const [isGenerating, setIsGenerating] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [isRefining, setIsRefining] = useState(false);
  const [refineError, setRefineError] = useState<string | null>(null);

  const buildEffectiveRequirements = (): QuestionGeneratorFormInput => {
    if (lastRequirements) return lastRequirements;
    const first = questions[0];
    return {
      subjectName: first?.subject || "General Computing",
      topic: first?.topic || "Assessment Topic",
      syllabusDetails:
        first?.syllabusObjective ||
        "Evaluate core concepts and problem solving on the specified topic.",
      bloomLevel: first?.bloomLevel || "apply",
      questionType: first?.questionType || "short_answer",
      numQuestions: questions.length || 1,
      marksPerQuestion: first?.marks || 5,
      promptVersion: "V3",
    };
  };

  const handleGeneratedQuestions = (
    newQuestions: AssessmentQuestion[],
    _promptVersionUsed?: string,
    requirements?: QuestionGeneratorFormInput
  ) => {
    setQuestions(newQuestions);
    if (requirements) {
      setLastRequirements(requirements);
    }
    // Keep Stage 2 & Stage 3 separate and economical: never auto-run review or refinement
    setQualityReview(null);
    setRefinementHistory({});
    setReviewError(null);
    setRefineError(null);
    setActiveTab("results");
  };

  const handleRunReview = async () => {
    if (questions.length === 0) return;
    setActiveTab("quality-review");
    setIsReviewing(true);
    setReviewError(null);

    try {
      const response = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: buildEffectiveRequirements(),
          questions,
        }),
      });

      const json: ApiResponse<AssessmentQualityReview> = await response.json();
      if (!response.ok || !json.success) {
        throw new Error(
          json.success === false ? json.error : "Quality review request failed."
        );
      }

      setQualityReview(json.data);
    } catch (err) {
      setReviewError(
        err instanceof Error ? err.message : "Failed to complete quality review."
      );
    } finally {
      setIsReviewing(false);
    }
  };

  const handleRefineQuestions = async (questionIds: string[]) => {
    if (!qualityReview || questionIds.length === 0) return;
    setIsRefining(true);
    setRefineError(null);

    try {
      const items = questionIds
        .map((id) => {
          const question = questions.find((q) => q.id === id);
          const review = qualityReview.questionVerdicts.find(
            (v) => v.questionId === id
          );
          if (!question || !review) return null;
          return { question, review };
        })
        .filter((item): item is NonNullable<typeof item> => Boolean(item));

      if (items.length === 0) {
        throw new Error("No matching reviewed questions found to refine.");
      }

      const response = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requirements: buildEffectiveRequirements(),
          items,
        }),
      });

      const json: ApiResponse<QuestionRefinementResponse> =
        await response.json();
      if (!response.ok || !json.success) {
        throw new Error(
          json.success === false ? json.error : "Question refinement failed."
        );
      }

      const updatedQuestions = [...questions];
      const newComparisons: Record<string, RefinedQuestionComparison> = {
        ...refinementHistory,
      };

      for (const res of json.data.results) {
        if (res.skipped) continue;
        const idx = updatedQuestions.findIndex(
          (q) => q.id === res.originalQuestionId
        );
        if (idx !== -1) {
          const before = updatedQuestions[idx];
          updatedQuestions[idx] = res.refinedQuestion;
          newComparisons[res.originalQuestionId] = {
            originalQuestionId: res.originalQuestionId,
            before,
            after: res.refinedQuestion,
            changesSummary: res.changesSummary,
            issuesAddressed: res.issuesAddressed,
            refinedAt: json.data.timestamp,
          };
        }
      }

      setQuestions(updatedQuestions);
      setRefinementHistory(newComparisons);
    } catch (err) {
      setRefineError(
        err instanceof Error ? err.message : "Failed to refine selected questions."
      );
    } finally {
      setIsRefining(false);
    }
  };

  const handleResetToDemo = () => {
    setQuestions(DEMO_ASSESSMENT_QUESTIONS);
    setLastRequirements(null);
    setQualityReview(DEMO_QUALITY_REVIEW);
    setRefinementHistory({});
    setReviewError(null);
    setRefineError(null);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc] text-slate-900">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        resultsCount={questions.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === "dashboard" && (
          <DashboardView
            onNavigate={setActiveTab}
            onLoadSample={handleResetToDemo}
            resultsCount={questions.length}
          />
        )}

        {activeTab === "generator" && (
          <GeneratorView
            onGenerate={handleGeneratedQuestions}
            isGenerating={isGenerating}
            setIsGenerating={setIsGenerating}
          />
        )}

        {activeTab === "results" && (
          <ResultsView
            questions={questions}
            onNavigate={setActiveTab}
            onResetToDemo={handleResetToDemo}
            onReviewQuestions={handleRunReview}
            isReviewing={isReviewing}
            refinedQuestionIds={Object.keys(refinementHistory)}
          />
        )}

        {activeTab === "quality-review" && (
          <QualityReviewView
            reviewData={qualityReview}
            questions={questions}
            refinementHistory={refinementHistory}
            onNavigate={setActiveTab}
            onRunReview={handleRunReview}
            onRefineQuestions={handleRefineQuestions}
            isReviewing={isReviewing}
            reviewError={reviewError}
            isRefining={isRefining}
            refineError={refineError}
          />
        )}

        {activeTab === "prompt-lab" && <PromptLabView />}
      </main>

      {/* Subtle Academic Footer */}
      <Footer />
    </div>
  );
}
