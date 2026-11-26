"use client";

import React from "react";
import {
  Sparkles,
  ArrowRight,
  SlidersHorizontal,
  Brain,
  ShieldCheck,
  Clock,
  BookOpen,
  CheckCircle2,
  FileText,
} from "lucide-react";
import { ActiveTab, ActivityLogItem } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { DEMO_RECENT_ACTIVITY } from "@/lib/mock-data";

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onLoadSample: () => void;
  resultsCount: number;
}

export function DashboardView({
  onNavigate,
  onLoadSample,
  resultsCount,
}: DashboardViewProps) {
  return (
    <div className="space-y-8">
      {/* Welcome & Overview Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-blue-800 text-xs font-semibold mb-3">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Assessment Engineering Workbench</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Welcome to QBench
          </h1>

          <p className="mt-3 text-sm sm:text-base text-slate-600 leading-relaxed">
            QBench is a specialized assessment authoring and verification platform designed for academic educators. It formulates psychometrically balanced examination questions mapped to Bloom&apos;s Revised Taxonomy, complete with plausible distractor analysis, step-by-step marking rubrics, and automated quality auditing.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => onNavigate("generator")}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs sm:text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              <span>Create Question Specification</span>
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </button>

            <button
              type="button"
              onClick={() => {
                onLoadSample();
                onNavigate("results");
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-xs sm:text-sm font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Preview Sample Assessment ({resultsCount} questions)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Three-Stage Workflow Section */}
      <div>
        <div className="mb-4">
          <h2 className="text-base font-bold text-slate-900">
            Three-Stage Assessment Lifecycle
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            How QBench ensures examination rigor, fairness, and cognitive alignment
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Stage 1 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  Stage 1
                </span>
                <SlidersHorizontal className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                Question Generation
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Educators specify subject, topic, syllabus objectives, Bloom&apos;s level, question format, and marks. Generates stems, expected answers, and step-by-step marking schemes using V1, V2, or V3 prompts.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-600">
              Output: Structured questions, answers &amp; rubrics
            </div>
          </div>

          {/* Stage 2 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  Stage 2
                </span>
                <ShieldCheck className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                Independent Quality Review
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A separate AI reviewer audits every question against 7 criteria (factual accuracy, syllabus relevance, Bloom alignment, clarity, answer key, rubric completeness, and marks consistency).
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-600">
              Output: PASS / NEEDS IMPROVEMENT / FAIL &amp; 100-pt rubric
            </div>
          </div>

          {/* Stage 3 */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between shadow-2xs">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-md">
                  Stage 3
                </span>
                <Brain className="w-4 h-4 text-slate-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 mb-1.5">
                Targeted Question Refinement
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Applies surgical fixes only to flagged or selected questions using reviewer feedback—preserving topic, Bloom&apos;s tier, question type, and marks—with a before-and-after diff.
              </p>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] font-medium text-slate-600">
              Output: Corrected items + before/after comparison
            </div>
          </div>
        </div>
      </div>

      {/* Lower Grid: Quick Stats & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: System Capabilities (5 columns) */}
        <div className="lg:col-span-4 space-y-4">
          <Card>
            <CardHeader
              title="Assessment Standards"
              subtitle="Psychometric guidelines enforced by QBench"
            />
            <CardContent className="space-y-4">
              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">
                    Bloom&apos;s Revised Taxonomy:
                  </span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Covers L1 Remember through L6 Create with verb calibration.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">
                    Distractor Psychometrics:
                  </span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Distractors reflect documented student misconceptions, avoiding trivial giveaways.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 text-xs text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900">
                    Granular Marking Rubrics:
                  </span>
                  <p className="text-slate-600 mt-0.5 leading-relaxed">
                    Step-by-step points eliminate subjective grading variance.
                  </p>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => onNavigate("prompt-lab")}
                  className="w-full text-center text-xs font-semibold text-blue-700 hover:text-blue-800 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-lg py-2 transition-colors"
                >
                  Explore Prompt Lab (V1, V2, V3) →
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right: Recent Assessment Activity (8 columns) */}
        <div className="lg:col-span-8">
          <Card>
            <CardHeader
              title={
                <div className="flex items-center justify-between">
                  <span>Sample Assessment Specifications</span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Sample Preview
                  </span>
                </div>
              }
              subtitle="Realistic curriculum examples for quick demonstration (not live user history)"
            />
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {DEMO_RECENT_ACTIVITY.map((item: ActivityLogItem) => (
                  <div
                    key={item.id}
                    className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
                  >
                    <div className="min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs sm:text-sm font-semibold text-slate-900">
                          {item.topic}
                        </span>
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200">
                          {item.bloomLevel}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
                        <span className="font-medium text-slate-700">{item.subject}</span>
                        <span className="text-slate-400">•</span>
                        <span>{item.questionType}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                      <div className="text-left sm:text-right">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                            item.status === "reviewed"
                              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {item.status === "reviewed" ? "Sample Audited" : "Sample Draft"}
                        </span>
                        <div className="flex items-center sm:justify-end gap-1 text-[11px] text-slate-500 mt-1">
                          <Clock className="w-3 h-3" />
                          <span>{item.timestamp}</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          onLoadSample();
                          onNavigate("results");
                        }}
                        className="px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 border border-slate-300 rounded-lg transition-colors"
                      >
                        Inspect
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
