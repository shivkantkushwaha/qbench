"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  AlertTriangle,
  Lightbulb,
  CheckCircle2,
  FileText,
  Loader2,
  Wand2,
  Info,
  AlertCircle,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  Sparkles,
} from "lucide-react";
import {
  AssessmentQualityReview,
  AssessmentQuestion,
  ActiveTab,
  RefinedQuestionComparison,
  CriterionEvaluation,
} from "@/types";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { VerdictBadge } from "@/components/common/Badge";
import { DemoBanner } from "@/components/common/DemoBanner";

interface QualityReviewViewProps {
  reviewData: AssessmentQualityReview | null;
  questions: AssessmentQuestion[];
  refinementHistory: Record<string, RefinedQuestionComparison>;
  onNavigate: (tab: ActiveTab) => void;
  onRunReview: () => void;
  onRefineQuestions: (questionIds: string[]) => void;
  isReviewing: boolean;
  reviewError: string | null;
  isRefining: boolean;
  refineError: string | null;
}

export function QualityReviewView({
  reviewData,
  questions,
  refinementHistory,
  onNavigate,
  onRunReview,
  onRefineQuestions,
  isReviewing,
  reviewError,
  isRefining,
  refineError,
}: QualityReviewViewProps) {
  const [selectedIds, setSelectedIds] = useState<Record<string, boolean>>({});
  const [expandedCriteria, setExpandedCriteria] = useState<Record<string, boolean>>({});
  const [expandedDiffs, setExpandedDiffs] = useState<Record<string, boolean>>({});

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleCriteria = (id: string) => {
    setExpandedCriteria((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleDiff = (id: string) => {
    setExpandedDiffs((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }));
  };

  const selectedQuestionIds = questions
    .map((q) => q.id)
    .filter((id) => Boolean(selectedIds[id]));

  const flaggedQuestionIds = reviewData
    ? reviewData.questionVerdicts
        .filter((v) => v.status === "NEEDS_IMPROVEMENT" || v.status === "FAIL")
        .map((v) => v.questionId)
    : [];

  return (
    <div className="space-y-6">
      {/* Human-in-the-loop Teacher Verification Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 text-xs">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div>
          <span className="font-semibold">
            Teacher Verification Required (AI Assistance Notice):
          </span>{" "}
          AI quality review and targeted refinement are decision-support mechanisms designed to catch common alignment, clarity, and rubric issues. Teachers and examination boards must independently verify all final questions, answer keys, and marking schemes before administering them to students.
        </div>
      </div>

      {reviewData?.isDemo && (
        <DemoBanner message="Showing sample Stage 2 Quality Review data. Click 'Review Questions' to run a live independent AI audit against the 7 assessment criteria." />
      )}

      {/* Header Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2.5 mb-1">
            <h1 className="text-xl font-bold text-slate-900">
              Stage 2 & 3: Quality Review & Refinement
            </h1>
            {reviewData && <VerdictBadge verdict={reviewData.overallStatus} />}
            {reviewData && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-md bg-slate-900 text-white">
                {reviewData.overallScore}/100
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500">
            {reviewData
              ? `Independent audit across ${reviewData.totalQuestions} question(s) • ${reviewData.passedCount} Pass, ${reviewData.needsImprovementCount} Needs Improvement, ${reviewData.failedCount} Fail`
              : `${questions.length} question(s) ready for independent Stage 2 quality review`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onNavigate("results")}
            className="px-3 py-2 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5" />
            <span>View Questions</span>
          </button>

          <button
            type="button"
            onClick={onRunReview}
            disabled={isReviewing || isRefining || questions.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white transition-colors shadow-xs"
          >
            {isReviewing ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Reviewing...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Review Questions</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Loading & Error Banners */}
      {isReviewing && (
        <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
            <p className="text-xs font-medium">
              Running independent Stage 2 AI audit against 7 criteria (factual accuracy, syllabus relevance, Bloom alignment, clarity, answer key, rubric completeness, marks consistency)...
            </p>
          </div>
          <span className="text-[11px] font-mono text-blue-700 font-semibold shrink-0 ml-2">
            Stage 2 API
          </span>
        </div>
      )}

      {reviewError && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 text-xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Quality Review Failed: </span>
              {reviewError}
            </div>
          </div>
          <button
            type="button"
            onClick={onRunReview}
            className="px-2.5 py-1 text-xs font-semibold rounded bg-rose-600 text-white hover:bg-rose-700 shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {isRefining && (
        <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Loader2 className="w-4 h-4 text-indigo-600 animate-spin" />
            <p className="text-xs font-medium">
              Running Stage 3 targeted refinement on selected/flagged questions while preserving topic, Bloom level, question type, and marks...
            </p>
          </div>
          <span className="text-[11px] font-mono text-indigo-700 font-semibold shrink-0 ml-2">
            Stage 3 API
          </span>
        </div>
      )}

      {refineError && (
        <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-2.5 text-xs">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Refinement Failed: </span>
            {refineError}
          </div>
        </div>
      )}

      {/* Not Yet Reviewed Empty State */}
      {!reviewData && !isReviewing && (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <ShieldCheck className="w-10 h-10 text-blue-600 mx-auto mb-3" />
          <h2 className="text-base font-bold text-slate-900">
            Questions Ready for Independent Quality Review
          </h2>
          <p className="text-xs text-slate-600 max-w-xl mx-auto mt-1.5 leading-relaxed">
            Stage 1 generation is complete. To keep API usage economical, Stage 2 Quality Review and Stage 3 Refinement only run when you explicitly trigger them. Click{" "}
            <span className="font-semibold text-slate-900">Review Questions</span>{" "}
            to audit all {questions.length} question(s) against the 7 academic criteria.
          </p>
          <button
            type="button"
            onClick={onRunReview}
            disabled={questions.length === 0}
            className="mt-5 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Review Questions Now</span>
          </button>
        </div>
      )}

      {/* Review Report Content */}
      {reviewData && (
        <>
          {/* Overall Summary & 100-Point Rubric Explanation */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 p-4 rounded-xl bg-white border border-slate-200 space-y-2">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Overall Audit Summary
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">
                {reviewData.overallSummary}
              </p>
              <div className="pt-2 border-t border-slate-100 text-xs text-slate-600 leading-relaxed">
                <span className="font-semibold text-slate-800">
                  100-Point Rubric Explanation:{" "}
                </span>
                {reviewData.rubricExplanation}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 flex flex-col justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                  Verdict Distribution
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200">
                    <div className="text-lg font-bold text-emerald-800">
                      {reviewData.passedCount}
                    </div>
                    <div className="text-[10px] font-semibold text-emerald-700">
                      PASS
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200">
                    <div className="text-lg font-bold text-amber-800">
                      {reviewData.needsImprovementCount}
                    </div>
                    <div className="text-[10px] font-semibold text-amber-700">
                      NEEDS FIX
                    </div>
                  </div>
                  <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200">
                    <div className="text-lg font-bold text-rose-800">
                      {reviewData.failedCount}
                    </div>
                    <div className="text-[10px] font-semibold text-rose-700">
                      FAIL
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-[11px] text-slate-500 mt-3">
                Evaluated:{" "}
                {new Date(reviewData.timestamp).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* 7 Criteria Batch Summary */}
          {reviewData.criterionSummary.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-slate-900 mb-3">
                7-Criterion Audit Breakdown
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {reviewData.criterionSummary.map((c, idx) => (
                  <CriterionCard key={`${c.criterion}-${idx}`} item={c} />
                ))}
              </div>
            </div>
          )}

          {/* Stage 3 Refinement Action Bar */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Wand2 className="w-4 h-4 text-indigo-600" />
                <span>Stage 3: Targeted Question Refinement</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Select questions below or refine all flagged items. Passing questions without issues are preserved without unnecessary rewriting.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => onRefineQuestions(selectedQuestionIds)}
                disabled={
                  isRefining || isReviewing || selectedQuestionIds.length === 0
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-white border border-slate-300 text-slate-800 hover:bg-slate-50 disabled:opacity-50 transition-colors"
              >
                <Wand2 className="w-3.5 h-3.5 text-indigo-600" />
                <span>
                  Refine Selected Questions ({selectedQuestionIds.length})
                </span>
              </button>

              <button
                type="button"
                onClick={() => onRefineQuestions(flaggedQuestionIds)}
                disabled={
                  isRefining || isReviewing || flaggedQuestionIds.length === 0
                }
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-md bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-300 text-white transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Refine All Flagged Questions ({flaggedQuestionIds.length})
                </span>
              </button>
            </div>
          </div>

          {/* Individual Question Verdicts & Before/After Comparisons */}
          <div>
            <h2 className="text-sm font-semibold text-slate-900 mb-3">
              Individual Question Verdicts ({reviewData.questionVerdicts.length})
            </h2>
            <div className="space-y-4">
              {reviewData.questionVerdicts.map((item) => {
                const isSelected = Boolean(selectedIds[item.questionId]);
                const isCriteriaOpen = Boolean(expandedCriteria[item.questionId]);
                const comparison = refinementHistory[item.questionId];
                const isDiffOpen = expandedDiffs[item.questionId] ?? true;

                return (
                  <Card key={item.questionId}>
                    <CardHeader
                      title={
                        <div className="flex flex-wrap items-center gap-2">
                          <label className="inline-flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelect(item.questionId)}
                              className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                              aria-label={`Select Question ${item.questionNumber} for refinement`}
                            />
                            <span className="w-6 h-6 rounded bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                              Q{item.questionNumber}
                            </span>
                            <span className="text-sm font-bold text-slate-900">
                              Question {item.questionNumber}
                            </span>
                          </label>
                          <VerdictBadge verdict={item.status} />
                          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                            {item.score}/100
                          </span>
                          {item.refinementRecommended && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                              Refinement Recommended
                            </span>
                          )}
                          {comparison && (
                            <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Refined
                            </span>
                          )}
                        </div>
                      }
                      subtitle={item.summary}
                      action={
                        item.criterionResults.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleCriteria(item.questionId)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-600 hover:text-slate-900"
                          >
                            <span>
                              {isCriteriaOpen ? "Hide Criteria" : "7 Criteria"}
                            </span>
                            {isCriteriaOpen ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )
                      }
                    />
                    <CardContent className="space-y-3.5">
                      {/* Per-question 7-criterion breakdown */}
                      {isCriteriaOpen && item.criterionResults.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                          {item.criterionResults.map((cr, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded bg-white border border-slate-200 text-xs"
                            >
                              <div className="flex items-center justify-between gap-2 mb-1">
                                <span className="font-semibold text-slate-900">
                                  {cr.label}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono text-[11px] text-slate-600">
                                    {cr.score}/100
                                  </span>
                                  <VerdictBadge verdict={cr.status} />
                                </div>
                              </div>
                              <p className="text-[11px] text-slate-600 leading-relaxed">
                                {cr.explanation}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Issues Found */}
                      {item.issues.length > 0 ? (
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                            <span>Issues Identified ({item.issues.length})</span>
                          </div>
                          {item.issues.map((iss, idx) => (
                            <div
                              key={idx}
                              className="p-3 rounded-lg bg-amber-50/70 border border-amber-200 text-xs space-y-1"
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-200/70 text-amber-900">
                                  {iss.severity}
                                </span>
                                <span className="text-[11px] font-mono text-amber-800">
                                  {iss.criterion}
                                </span>
                                <span className="font-semibold text-slate-900">
                                  {iss.issue}
                                </span>
                              </div>
                              <p className="text-slate-700 leading-relaxed">
                                <span className="font-semibold">Explanation: </span>
                                {iss.explanation}
                              </p>
                              <p className="text-blue-900 leading-relaxed">
                                <span className="font-semibold">
                                  Suggested Correction:{" "}
                                </span>
                                {iss.suggestedCorrection}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50/70 border border-emerald-200 rounded-md px-3 py-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            No issues flagged for this question across the evaluated criteria.
                          </span>
                        </div>
                      )}

                      {/* Suggested Corrections Summary */}
                      {item.suggestedCorrections.length > 0 && (
                        <div className="flex items-start gap-2 text-xs text-slate-700 bg-blue-50/60 p-3 rounded-lg border border-blue-100">
                          <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-semibold text-blue-950 block mb-1">
                              Suggested Corrections:
                            </span>
                            <ul className="list-disc list-inside space-y-0.5">
                              {item.suggestedCorrections.map((corr, idx) => (
                                <li key={idx}>{corr}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      )}

                      {/* Before-and-After Comparison for Refined Questions */}
                      {comparison && (
                        <div className="border border-indigo-200 rounded-xl overflow-hidden bg-indigo-50/30">
                          <button
                            type="button"
                            onClick={() => toggleDiff(item.questionId)}
                            className="w-full px-4 py-2.5 bg-indigo-50 border-b border-indigo-200 flex items-center justify-between text-xs font-semibold text-indigo-950"
                          >
                            <span className="flex items-center gap-2">
                              <ArrowLeftRight className="w-4 h-4 text-indigo-600" />
                              <span>
                                Before & After Refinement Comparison
                              </span>
                            </span>
                            {isDiffOpen ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>

                          {isDiffOpen && (
                            <div className="p-4 space-y-4 text-xs">
                              <div className="p-2.5 rounded bg-white border border-indigo-100 text-slate-700">
                                <span className="font-semibold text-indigo-950">
                                  Changes Summary:{" "}
                                </span>
                                {comparison.changesSummary}
                                {comparison.issuesAddressed.length > 0 && (
                                  <div className="mt-1 text-[11px] text-slate-600">
                                    <span className="font-semibold">
                                      Issues Addressed:{" "}
                                    </span>
                                    {comparison.issuesAddressed.join(" • ")}
                                  </div>
                                )}
                              </div>

                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {/* BEFORE */}
                                <div className="p-3.5 rounded-lg bg-white border border-slate-200 space-y-2.5">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                                    Before Refinement
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-700 mb-0.5">
                                      Question Stem:
                                    </div>
                                    <p className="text-slate-600 whitespace-pre-wrap leading-relaxed">
                                      {comparison.before.questionText}
                                    </p>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-700 mb-0.5">
                                      Expected Answer / Key:
                                    </div>
                                    <p className="text-slate-600 whitespace-pre-wrap">
                                      {comparison.before.expectedAnswer ||
                                        comparison.before.answerKey}
                                    </p>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-700 mb-0.5">
                                      Marking Scheme ({comparison.before.marks} Marks):
                                    </div>
                                    <ul className="list-disc list-inside text-slate-600 space-y-0.5">
                                      {comparison.before.markingScheme.map(
                                        (s, idx) => (
                                          <li key={idx}>
                                            {s.step} ({s.marks}m): {s.criteria}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </div>

                                {/* AFTER */}
                                <div className="p-3.5 rounded-lg bg-white border border-emerald-300 space-y-2.5">
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                                    After Refinement (Active)
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-800 mb-0.5">
                                      Question Stem:
                                    </div>
                                    <p className="text-slate-900 whitespace-pre-wrap leading-relaxed">
                                      {comparison.after.questionText}
                                    </p>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-800 mb-0.5">
                                      Expected Answer / Key:
                                    </div>
                                    <p className="text-slate-900 whitespace-pre-wrap">
                                      {comparison.after.expectedAnswer ||
                                        comparison.after.answerKey}
                                    </p>
                                  </div>
                                  <div>
                                    <div className="font-semibold text-slate-800 mb-0.5">
                                      Marking Scheme ({comparison.after.marks} Marks):
                                    </div>
                                    <ul className="list-disc list-inside text-slate-900 space-y-0.5">
                                      {comparison.after.markingScheme.map(
                                        (s, idx) => (
                                          <li key={idx}>
                                            {s.step} ({s.marks}m): {s.criteria}
                                          </li>
                                        )
                                      )}
                                    </ul>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function CriterionCard({ item }: { item: CriterionEvaluation }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <span className="text-xs font-bold text-slate-900">{item.label}</span>
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200 shrink-0">
            {item.score}/100
          </span>
        </div>

        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full rounded-full ${
              item.status === "PASS"
                ? "bg-emerald-600"
                : item.status === "NEEDS_IMPROVEMENT"
                ? "bg-amber-500"
                : "bg-rose-600"
            }`}
            style={{ width: `${Math.min(Math.max(item.score, 0), 100)}%` }}
          />
        </div>
      </div>

      <p className="text-[11px] text-slate-600 leading-relaxed">
        {item.explanation}
      </p>
    </div>
  );
}
