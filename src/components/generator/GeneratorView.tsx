"use client";

import React, { useState } from "react";
import {
  FilePlus2,
  Sparkles,
  RotateCcw,
  Loader2,
  AlertCircle,
  RefreshCw,
  Layers,
} from "lucide-react";
import {
  QuestionGeneratorFormInput,
  QuestionGeneratorFormInputSchema,
  BloomTaxonomyLevel,
  QuestionType,
  AssessmentQuestion,
  ApiResponse,
  QuestionBatchResponse,
} from "@/types";
import { Card, CardContent, CardHeader } from "@/components/common/Card";

interface GeneratorViewProps {
  onGenerate: (
    questions: AssessmentQuestion[],
    promptVersionUsed?: string,
    requirements?: QuestionGeneratorFormInput
  ) => void;
  isGenerating: boolean;
  setIsGenerating: (loading: boolean) => void;
}

const PRESET_SPECIFICATIONS = [
  {
    name: "Operating Systems (Page Replacement)",
    subject: "Operating Systems (CS301)",
    topic: "Virtual Memory Page Replacement Algorithms",
    syllabus:
      "Explain and evaluate virtual memory management, page fault frequencies, and comparative efficiency of FIFO, LRU, and Optimal algorithms under constrained frame allocations.",
    bloom: "apply" as BloomTaxonomyLevel,
    type: "multiple_choice" as QuestionType,
    count: 2,
    marks: 2,
    instructions:
      "Include a numerical reference sequence string with initial empty physical frames. Ensure all 4 distractors represent plausible off-by-one or hit-counting misconceptions.",
  },
  {
    name: "Database Systems (Concurrency & 2PL)",
    subject: "Database Management Systems (CS304)",
    topic: "Concurrency Control & Two-Phase Locking (2PL)",
    syllabus:
      "Analyze serializability, conflict serializability graphs, strict versus conservative 2PL, and deadlock prevention protocols in distributed transactions.",
    bloom: "analyze" as BloomTaxonomyLevel,
    type: "short_answer" as QuestionType,
    count: 1,
    marks: 5,
    instructions:
      "Provide a specific schedule of read/write operations across two concurrent transactions and require conflict graph construction.",
  },
  {
    name: "Computer Networks (Transport Layer)",
    subject: "Computer Networks (CS305)",
    topic: "TCP Congestion Control & Flow Control",
    syllabus:
      "Evaluate Slow Start, Congestion Avoidance, Fast Retransmit, and Fast Recovery (AIMD principles) over high latency wireless links.",
    bloom: "evaluate" as BloomTaxonomyLevel,
    type: "long_answer" as QuestionType,
    count: 1,
    marks: 10,
    instructions:
      "Require comparison of TCP Tahoe vs TCP Reno window growth curves with clear step-by-step marking rubric.",
  },
];

export function GeneratorView({
  onGenerate,
  isGenerating,
  setIsGenerating,
}: GeneratorViewProps) {
  const [formData, setFormData] = useState<QuestionGeneratorFormInput>({
    subjectName: "Operating Systems (CS301)",
    topic: "Process Synchronization & Semaphore Deadlocks",
    syllabusDetails:
      "Analyze critical section mutual exclusion, semaphore primitives (wait/signal), Coffman conditions, and resource allocation graphs.",
    bloomLevel: "analyze",
    questionType: "short_answer",
    numQuestions: 2,
    marksPerQuestion: 5,
    additionalInstructions:
      "Provide clear code snippets or execution traces. Include an explicit partial-credit marking rubric for sub-questions.",
    promptVersion: "V3",
  });

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [generationPhase, setGenerationPhase] = useState<string>("");

  const handleApplyPreset = (preset: (typeof PRESET_SPECIFICATIONS)[0]) => {
    setFormData({
      subjectName: preset.subject,
      topic: preset.topic,
      syllabusDetails: preset.syllabus,
      bloomLevel: preset.bloom,
      questionType: preset.type,
      numQuestions: preset.count,
      marksPerQuestion: preset.marks,
      additionalInstructions: preset.instructions,
      promptVersion: formData.promptVersion || "V3",
    });
    setValidationErrors({});
    setApiError(null);
  };

  const handleReset = () => {
    setFormData({
      subjectName: "",
      topic: "",
      syllabusDetails: "",
      bloomLevel: "apply",
      questionType: "multiple_choice",
      numQuestions: 1,
      marksPerQuestion: 2,
      additionalInstructions: "",
      promptVersion: "V3",
    });
    setValidationErrors({});
    setApiError(null);
  };

  const executeGeneration = async () => {
    setValidationErrors({});
    setApiError(null);

    // Validate with Zod before sending
    const validation = QuestionGeneratorFormInputSchema.safeParse(formData);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.issues.forEach((issue) => {
        const path = issue.path[0] as string;
        if (path) {
          fieldErrors[path] = issue.message;
        }
      });
      setValidationErrors(fieldErrors);
      return;
    }

    setIsGenerating(true);
    setGenerationPhase("Connecting to Gemini Route Handler...");

    const phaseTimer1 = setTimeout(() => {
      setGenerationPhase(
        `Executing Prompt ${formData.promptVersion}: Calibrating ${formData.bloomLevel.toUpperCase()} cognitive verbs...`
      );
    }, 1200);

    const phaseTimer2 = setTimeout(() => {
      setGenerationPhase(
        `Drafting ${formData.numQuestions} ${formData.questionType.replace("_", " ")} item(s) and marking rubrics...`
      );
    }, 2800);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const json: ApiResponse<QuestionBatchResponse> = await response.json();

      if (!response.ok || !json.success) {
        throw new Error(json.success === false ? json.error : "Failed to generate questions.");
      }

      const generatedQuestions = json.data.questions;
      if (!generatedQuestions || generatedQuestions.length === 0) {
        throw new Error("No questions were returned in the API response.");
      }

      onGenerate(generatedQuestions, json.data.promptVersionUsed, formData);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "An unexpected generation error occurred.";
      setApiError(message);
    } finally {
      clearTimeout(phaseTimer1);
      clearTimeout(phaseTimer2);
      setIsGenerating(false);
      setGenerationPhase("");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    executeGeneration();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Question Generator Specification
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Define curriculum parameters, target cognitive depth, and select your prompt version
          </p>
        </div>

        {/* Preset pill buttons */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-600 font-medium hidden sm:inline">
            Load Template:
          </span>
          <div className="flex flex-wrap gap-1.5">
            {PRESET_SPECIFICATIONS.map((preset, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-white hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300 text-slate-700 border border-slate-300 transition-colors shadow-2xs"
              >
                {preset.name.split("(")[0].trim()}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <FilePlus2 className="w-4 h-4 text-blue-600" />
              <span>Examination Parameters &amp; AI Engine</span>
            </div>
          }
          subtitle="Fields marked with an asterisk (*) are mandatory for psychometric calibration"
          action={
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Form</span>
            </button>
          }
        />

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Prompt Version Selector */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-blue-600" />
                  <span>Generator Prompt Strategy</span>
                </label>
                <span className="text-xs text-slate-600">
                  Select prompt engineering version
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* V1 Option */}
                <label
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    formData.promptVersion === "V1"
                      ? "bg-blue-50/50 border-2 border-blue-600 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">V1: Baseline</span>
                    <input
                      type="radio"
                      name="promptVersion"
                      value="V1"
                      checked={formData.promptVersion === "V1"}
                      onChange={() =>
                        setFormData({ ...formData, promptVersion: "V1" })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Simple role-based instruction. Direct generation without strict multi-criteria checks.
                  </p>
                </label>

                {/* V2 Option */}
                <label
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    formData.promptVersion === "V2"
                      ? "bg-blue-50/50 border-2 border-blue-600 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">V2: Structured</span>
                    <input
                      type="radio"
                      name="promptVersion"
                      value="V2"
                      checked={formData.promptVersion === "V2"}
                      onChange={() =>
                        setFormData({ ...formData, promptVersion: "V2" })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Includes role, context, syllabus constraints, detailed guidance, and explicit rubric schema.
                  </p>
                </label>

                {/* V3 Option */}
                <label
                  className={`p-3.5 rounded-lg border text-xs cursor-pointer transition-all ${
                    formData.promptVersion === "V3"
                      ? "bg-blue-50/50 border-2 border-blue-600 shadow-xs"
                      : "bg-white border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-900">V3: Advanced</span>
                      <span className="text-[10px] font-bold tracking-wider uppercase px-1.5 py-0.5 bg-emerald-100 text-emerald-800 border border-emerald-200 rounded">
                        Recommended
                      </span>
                    </div>
                    <input
                      type="radio"
                      name="promptVersion"
                      value="V3"
                      checked={formData.promptVersion === "V3"}
                      onChange={() =>
                        setFormData({ ...formData, promptVersion: "V3" })
                      }
                      className="text-blue-600 focus:ring-blue-500"
                    />
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    Multi-constraint generation with self-audit, mark balance verification, and distractor rigor.
                  </p>
                </label>
              </div>
            </div>

            {/* Subject Name & Topic */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Subject / Course Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.subjectName}
                  onChange={(e) =>
                    setFormData({ ...formData, subjectName: e.target.value })
                  }
                  placeholder="e.g. Operating Systems (CS301)"
                  className={`w-full h-10 px-3.5 py-2 text-sm rounded-lg border ${
                    validationErrors.subjectName
                      ? "border-rose-500 bg-rose-50/40"
                      : "border-slate-300 bg-white"
                  } text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600`}
                />
                {validationErrors.subjectName && (
                  <p className="text-xs text-rose-700 font-medium mt-1">
                    {validationErrors.subjectName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Topic / Sub-Topic <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={formData.topic}
                  onChange={(e) =>
                    setFormData({ ...formData, topic: e.target.value })
                  }
                  placeholder="e.g. Banker's Algorithm & Deadlock Avoidance"
                  className={`w-full h-10 px-3.5 py-2 text-sm rounded-lg border ${
                    validationErrors.topic
                      ? "border-rose-500 bg-rose-50/40"
                      : "border-slate-300 bg-white"
                  } text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600`}
                />
                {validationErrors.topic && (
                  <p className="text-xs text-rose-700 font-medium mt-1">
                    {validationErrors.topic}
                  </p>
                )}
              </div>
            </div>

            {/* Syllabus Details / Learning Objectives */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-900">
                  Syllabus Details &amp; Learning Objectives <span className="text-rose-600">*</span>
                </label>
                <span className="text-xs text-slate-600 font-medium">
                  {formData.syllabusDetails.length}/1000 chars
                </span>
              </div>
              <textarea
                rows={3}
                value={formData.syllabusDetails}
                onChange={(e) =>
                  setFormData({ ...formData, syllabusDetails: e.target.value })
                }
                placeholder="Provide syllabus context or specific learning outcomes. The AI respects your input and will not invent unmentioned modules."
                className={`w-full px-3.5 py-2.5 text-sm rounded-lg border ${
                  validationErrors.syllabusDetails
                    ? "border-rose-500 bg-rose-50/40"
                    : "border-slate-300 bg-white"
                } text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 resize-y`}
              />
              {validationErrors.syllabusDetails && (
                <p className="text-xs text-rose-700 font-medium mt-1">
                  {validationErrors.syllabusDetails}
                </p>
              )}
            </div>

            {/* Cognitive Level, Question Type, Quantity, Marks */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Bloom's Level */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Bloom&apos;s Taxonomy Level
                </label>
                <select
                  value={formData.bloomLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bloomLevel: e.target.value as BloomTaxonomyLevel,
                    })
                  }
                  className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                >
                  <option value="remember">L1: Remember (Recall facts)</option>
                  <option value="understand">L2: Understand (Explain concepts)</option>
                  <option value="apply">L3: Apply (Calculate / Trace)</option>
                  <option value="analyze">L4: Analyze (Deconstruct / Contrast)</option>
                  <option value="evaluate">L5: Evaluate (Justify trade-offs)</option>
                  <option value="create">L6: Create (Synthesize / Design)</option>
                </select>
              </div>

              {/* Question Type */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Question Type
                </label>
                <select
                  value={formData.questionType}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      questionType: e.target.value as QuestionType,
                    })
                  }
                  className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                >
                  <option value="multiple_choice">MCQ (Multiple Choice)</option>
                  <option value="short_answer">Short Answer (3-5 marks)</option>
                  <option value="long_answer">Long Answer (8-10 marks)</option>
                  <option value="descriptive">Descriptive / Design</option>
                </select>
              </div>

              {/* Number of Questions */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Number of Questions
                </label>
                <select
                  value={formData.numQuestions}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      numQuestions: parseInt(e.target.value, 10),
                    })
                  }
                  className="w-full h-10 px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                >
                  <option value={1}>1 Question</option>
                  <option value={2}>2 Questions</option>
                  <option value={3}>3 Questions</option>
                  <option value={4}>4 Questions</option>
                  <option value={5}>5 Questions</option>
                </select>
              </div>

              {/* Marks per Question */}
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Marks per Question
                </label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={formData.marksPerQuestion}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      marksPerQuestion: parseInt(e.target.value, 10) || 1,
                    })
                  }
                  className="w-full h-10 px-3.5 py-2 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
                />
              </div>
            </div>

            {/* Optional Additional Instructions */}
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                Optional Additional Instructions / Constraints
              </label>
              <textarea
                rows={2}
                value={formData.additionalInstructions ?? ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    additionalInstructions: e.target.value,
                  })
                }
                placeholder="e.g. Include a numerical reference trace. Avoid trick questions. Ensure distractors address common student misconceptions."
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600 resize-y"
              />
            </div>

            {/* API Error Banner with Retry */}
            {apiError && (
              <div className="p-4 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-rose-950">
                      Generation Request Failed
                    </p>
                    <p className="mt-0.5 text-rose-800 leading-relaxed">
                      {apiError}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-rose-200/60">
                  <button
                    type="button"
                    onClick={executeGeneration}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded bg-rose-600 hover:bg-rose-700 text-white font-medium text-xs transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Retry Request</span>
                  </button>
                  <span className="text-[11px] text-rose-700">
                    {apiError.includes("API Key") || apiError.includes("not configured")
                      ? "Verify your GEMINI_API_KEY in .env.local or deployment environment variables."
                      : "Temporary model demand or rate-limit errors usually resolve within a few seconds."}
                  </span>
                </div>
              </div>
            )}

            {/* Submit Action & Loading Phase */}
            <div className="pt-2">
              {isGenerating ? (
                <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                    <div>
                      <p className="text-xs font-semibold text-blue-900">
                        Generating via Gemini API (Prompt {formData.promptVersion})...
                      </p>
                      <p className="text-[11px] text-blue-700 mt-0.5">
                        {generationPhase}
                      </p>
                    </div>
                  </div>
                  <span className="text-[11px] font-mono text-blue-600 font-semibold">
                    Live Model
                  </span>
                </div>
              ) : (
                <button
                  type="submit"
                  className="w-full py-2.5 px-4 rounded-md bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>
                    Generate {formData.numQuestions} Question(s) with Prompt {formData.promptVersion}
                  </span>
                </button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
