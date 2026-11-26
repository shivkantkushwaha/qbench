"use client";

import React, { useState } from "react";
import {
  FileText,
  Copy,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  CheckCircle2,
  FileDown,
  Sparkles,
} from "lucide-react";
import { AssessmentQuestion, ActiveTab } from "@/types";
import {
  BloomBadge,
  QuestionTypeBadge,
  MarksBadge,
} from "@/components/common/Badge";
import { DemoBanner } from "@/components/common/DemoBanner";

interface ResultsViewProps {
  questions: AssessmentQuestion[];
  onNavigate: (tab: ActiveTab) => void;
  onResetToDemo: () => void;
  onReviewQuestions?: () => void;
  isReviewing?: boolean;
  refinedQuestionIds?: string[];
  isLoading?: boolean;
}

export function ResultsView({
  questions,
  onNavigate,
  onResetToDemo,
  onReviewQuestions,
  isReviewing = false,
  refinedQuestionIds = [],
  isLoading = false,
}: ResultsViewProps) {
  const [copiedAll, setCopiedAll] = useState(false);
  const [copiedQuestionId, setCopiedQuestionId] = useState<string | null>(null);
  const [expandedSchemes, setExpandedSchemes] = useState<Record<string, boolean>>({
    [questions[0]?.id || ""]: true,
  });

  const hasDemoItems = questions.some((q) => q.isDemo);
  const totalMarks = questions.reduce((acc, q) => acc + q.marks, 0);

  const toggleScheme = (id: string) => {
    setExpandedSchemes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleCopySingle = async (q: AssessmentQuestion) => {
    let text = `Question ${q.questionNumber} (${q.marks} Marks) [ID: ${q.id} | ${q.questionType.toUpperCase()} | Bloom: ${q.bloomLevel.toUpperCase()}]\n\n${q.questionText}\n\n`;

    if (q.options && q.options.length > 0) {
      text +=
        "Options:\n" +
        q.options.map((opt) => `${opt.id}) ${opt.text}${opt.isCorrect ? " [CORRECT]" : ""}`).join("\n") +
        "\n\n";
    }

    text += `Expected Answer / Model Solution:\n${q.expectedAnswer || q.answerKey}\n\n`;
    text += `Bloom's Taxonomy Calibration (${q.bloomLevel}):\n${q.bloomExplanation}\n\n`;
    text += `Marking Scheme:\n`;
    text += q.markingScheme
      .map((s) => `- ${s.step} (${s.marks} Marks): ${s.criteria}`)
      .join("\n");

    try {
      await navigator.clipboard.writeText(text);
      setCopiedQuestionId(q.id);
      setTimeout(() => setCopiedQuestionId(null), 2000);
    } catch (err) {
      console.error("Failed to copy question:", err);
    }
  };

  const handleCopyAll = async () => {
    let fullPaper = `QBENCH EXAMINATION ASSESSMENT PAPER\n`;
    fullPaper += `Total Questions: ${questions.length} | Total Marks: ${totalMarks}\n`;
    fullPaper += `========================================\n\n`;

    questions.forEach((q) => {
      fullPaper += `Q${q.questionNumber} [${q.marks} Marks | ${q.questionType.replace("_", " ").toUpperCase()} | Bloom: ${q.bloomLevel.toUpperCase()}]\n`;
      fullPaper += `Topic: ${q.topic} (${q.subject})\n`;
      fullPaper += `----------------------------------------\n`;
      fullPaper += `${q.questionText}\n\n`;

      if (q.options && q.options.length > 0) {
        fullPaper += "Options:\n";
        q.options.forEach((opt) => {
          fullPaper += `  [${opt.id}] ${opt.text}${opt.isCorrect ? " (CORRECT)" : ""}\n`;
        });
        fullPaper += "\n";
      }

      fullPaper += `ANSWER KEY:\n${q.answerKey}\n\n`;
      fullPaper += `MARKING SCHEME:\n`;
      q.markingScheme.forEach((step) => {
        fullPaper += `  • ${step.step} [${step.marks} Marks]: ${step.criteria}\n`;
      });
      fullPaper += `\n========================================\n\n`;
    });

    try {
      await navigator.clipboard.writeText(fullPaper);
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } catch (err) {
      console.error("Failed to copy full paper:", err);
    }
  };

  const handleDownloadMarkdown = () => {
    let md = `# Assessment Examination Paper\n\n`;
    md += `**Subject:** ${questions[0]?.subject || "Assessment"}\n`;
    md += `**Total Questions:** ${questions.length} | **Total Marks:** ${totalMarks}\n\n`;
    md += `---\n\n`;

    questions.forEach((q) => {
      md += `### Question ${q.questionNumber} (${q.marks} Marks)\n\n`;
      md += `*Type: ${q.questionType.replace("_", " ")} | Bloom's Level: ${q.bloomLevel} | Topic: ${q.topic}*\n\n`;
      md += `${q.questionText}\n\n`;

      if (q.options && q.options.length > 0) {
        md += `#### Options\n\n`;
        q.options.forEach((opt) => {
          md += `- **[${opt.id}]** ${opt.text} ${opt.isCorrect ? "*(Correct)*" : ""}\n`;
        });
        md += `\n`;
      }

      md += `#### Answer Key\n\n${q.answerKey}\n\n`;
      md += `#### Marking Scheme\n\n`;
      md += `| Step / Criterion | Marks | Assessment Notes |\n`;
      md += `| :--- | :---: | :--- |\n`;
      q.markingScheme.forEach((step) => {
        md += `| ${step.step} | ${step.marks} | ${step.criteria} |\n`;
      });
      md += `\n---\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `qbench-assessment-${Date.now()}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadJSON = () => {
    const jsonStr = JSON.stringify(questions, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `qbench-assessment-${Date.now()}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block animate-spin w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full mb-4"></div>
        <h3 className="text-sm font-semibold text-slate-800">
          Loading Assessment Results...
        </h3>
        <p className="text-xs text-slate-500 mt-1">
          Formatting question stems and step-by-step rubrics.
        </p>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-12 text-center max-w-lg mx-auto">
        <FileText className="w-10 h-10 text-slate-300 mx-auto mb-3" />
        <h3 className="text-base font-bold text-slate-900">
          No Assessment Questions in View
        </h3>
        <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
          Generate new questions using the Question Generator, or reload the realistic sample assessment dataset.
        </p>
        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onResetToDemo}
            className="px-3.5 py-2 text-xs font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
          >
            Load Sample Assessment
          </button>
          <button
            type="button"
            onClick={() => onNavigate("generator")}
            className="px-3.5 py-2 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Open Generator Form
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {hasDemoItems && (
        <DemoBanner message="The questions below are realistic sample assessment items for curriculum preview. Every item includes Bloom tier alignment, answer keys, and marking rubrics." />
      )}

      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-200 rounded-xl p-4 sm:px-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900">
              Generated Assessment Paper
            </h1>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              {questions.length} {questions.length === 1 ? "Question" : "Questions"}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200">
              {totalMarks} Total Marks
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Subject: {questions[0]?.subject || "Multiple Courses"}
          </p>
        </div>

        {/* Global Paper Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors"
            title="Copy entire exam paper to clipboard"
          >
            {copiedAll ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700 font-semibold">Copied Paper!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Paper</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleDownloadMarkdown}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors"
            title="Export as Markdown"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Markdown</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors"
            title="Export as JSON"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>JSON</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (onReviewQuestions) {
                onReviewQuestions();
              } else {
                onNavigate("quality-review");
              }
            }}
            disabled={isReviewing}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white shadow-xs transition-colors"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{isReviewing ? "Reviewing..." : "Review Questions"}</span>
          </button>
        </div>
      </div>

      {/* Question Items List */}
      <div className="space-y-6">
        {questions.map((q) => {
          const isExpanded = Boolean(expandedSchemes[q.id]);
          const isSingleCopied = copiedQuestionId === q.id;

          return (
            <div
              key={q.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs"
            >
              {/* Question Header Strip */}
              <div className="px-5 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="w-7 h-7 rounded-md bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    Q{q.questionNumber}
                  </span>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-200/80 text-slate-700 font-semibold">
                    ID: {q.id}
                  </span>
                  <QuestionTypeBadge type={q.questionType} />
                  <BloomBadge level={q.bloomLevel} />
                  <MarksBadge marks={q.marks} />

                  {q.isDemo && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                      Sample Item
                    </span>
                  )}

                  {refinedQuestionIds.includes(q.id) && (
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Refined
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500 truncate max-w-xs hidden md:inline">
                    Topic: {q.topic}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopySingle(q)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 transition-colors"
                  >
                    {isSingleCopied ? (
                      <>
                        <Check className="w-3 h-3 text-emerald-600" />
                        <span className="text-emerald-700 font-semibold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Question Body */}
              <div className="p-5 sm:p-6 space-y-5">
                {/* Topic / Objective Banner */}
                {q.syllabusObjective && (
                  <div className="text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded border border-slate-200">
                    <span className="font-semibold text-slate-700">Objective:</span>{" "}
                    {q.syllabusObjective}
                  </div>
                )}

                {/* Question Stem */}
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
                    Question Stem
                  </h3>
                  <div className="text-sm font-medium text-slate-900 leading-relaxed whitespace-pre-line">
                    {q.questionText}
                  </div>
                </div>

                {/* Multiple Choice Options (if MCQ) */}
                {q.options && q.options.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                      Multiple Choice Options
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-lg border text-xs sm:text-sm ${
                            opt.isCorrect
                              ? "bg-emerald-50/70 border-emerald-300 text-slate-900"
                              : "bg-white border-slate-200 text-slate-800"
                          }`}
                        >
                          <div className="flex items-start gap-2.5">
                            <span
                              className={`w-5 h-5 shrink-0 rounded flex items-center justify-center font-bold text-xs ${
                                opt.isCorrect
                                  ? "bg-emerald-600 text-white"
                                  : "bg-slate-100 text-slate-700 border border-slate-300"
                              }`}
                            >
                              {opt.id}
                            </span>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span className={opt.isCorrect ? "font-semibold" : ""}>
                                  {opt.text}
                                </span>
                                {opt.isCorrect && (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                                    <CheckCircle2 className="w-3 h-3 text-emerald-700" />
                                    Correct Key
                                  </span>
                                )}
                              </div>
                              {opt.distractorRationale && (
                                <p className="mt-1 text-xs text-slate-500 italic">
                                  Psychometric Note: {opt.distractorRationale}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Expected Answer / Model Solution */}
                <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">
                      Expected Answer & Model Solution
                    </h4>
                    {q.answerKey && (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-900 font-semibold">
                        Key: {q.answerKey}
                      </span>
                    )}
                  </div>
                  <div className="text-xs sm:text-sm font-medium text-slate-800 whitespace-pre-line leading-relaxed">
                    {q.expectedAnswer || q.answerKey}
                  </div>
                </div>

                {/* Bloom's Cognitive Calibration Explanation */}
                {q.bloomExplanation && (
                  <div className="p-3.5 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-indigo-900 mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Bloom&apos;s Level Match ({q.bloomLevel.toUpperCase()}):</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">
                      {q.bloomExplanation}
                    </p>
                  </div>
                )}

                {/* Syllabus Fidelity & Limitations Note */}
                {q.syllabusFidelityNote && (
                  <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-600">
                    <span className="font-semibold text-slate-800">Syllabus Scope Note: </span>
                    <span>{q.syllabusFidelityNote}</span>
                  </div>
                )}

                {/* Expandable Step-by-Step Marking Scheme */}
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => toggleScheme(q.id)}
                    className="w-full px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 text-xs font-semibold flex items-center justify-between transition-colors"
                  >
                    <span className="flex items-center gap-1.5">
                      <span>Step-by-Step Marking Rubric</span>
                      <span className="text-[11px] font-normal text-slate-500">
                        ({q.markingScheme.length} scoring criteria)
                      </span>
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-white border-t border-slate-200">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500">
                              <th className="pb-2 font-semibold">Evaluation Step / Criterion</th>
                              <th className="pb-2 font-semibold text-center w-24">Marks</th>
                              <th className="pb-2 font-semibold">Scoring Guidance & Requirements</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {q.markingScheme.map((step, sIdx) => (
                              <tr key={sIdx} className="hover:bg-slate-50">
                                <td className="py-2.5 pr-4 font-medium text-slate-900">
                                  {step.step}
                                </td>
                                <td className="py-2.5 px-2 text-center font-bold text-blue-700">
                                  {step.marks}
                                </td>
                                <td className="py-2.5 text-slate-600">
                                  {step.criteria}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
