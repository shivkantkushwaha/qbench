"use client";

import React, { useState, useEffect } from "react";
import {
  FlaskConical,
  Code2,
  CheckCircle2,
  Info,
  Copy,
  Check,
  Layers,
  Terminal,
  Play,
  Loader2,
  Save,
  Download,
  FileSpreadsheet,
  Trash2,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  ShieldAlert,
  ClipboardCheck,
} from "lucide-react";
import {
  ApiResponse,
  ExperimentInput,
  ExperimentTestCase,
  HUMAN_EVALUATION_CRITERIA,
  HumanEvaluationCriterionKey,
  HumanEvaluationRecord,
  PromptExperimentResult,
  PromptVersion,
} from "@/types";
import { PROMPT_VERSIONS } from "@/lib/mock-data";
import { DEFAULT_EXPERIMENT_TEST_CASES } from "@/lib/experiment-test-cases";
import {
  buildExperimentsCsv,
  clearExperimentRecords,
  createExperimentRunId,
  deleteExperimentRecord,
  getExperimentRecords,
  saveExperimentRecord,
} from "@/lib/storage/experiment-history";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { VerdictBadge } from "@/components/common/Badge";

type VersionRunState = {
  loading: boolean;
  result: PromptExperimentResult | null;
};

function createEmptyEvaluation(): HumanEvaluationRecord {
  return {
    overallVerdict: "PASS",
    criteria: {
      factualCorrectness: "UNRATED",
      syllabusRelevance: "UNRATED",
      bloomAlignment: "UNRATED",
      clarity: "UNRATED",
      answerKeyQuality: "UNRATED",
      markingSchemeQuality: "UNRATED",
    },
    comments: "",
    evaluatedAt: new Date().toISOString(),
  };
}

export function PromptLabView() {
  // Architecture Inspector state
  const [inspectedVersion, setInspectedVersion] = useState<PromptVersion>("V3");
  const [showPromptDetails, setShowPromptDetails] = useState<boolean>(false);
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  // Test cases state (editable in-session)
  const [testCases, setTestCases] = useState<ExperimentTestCase[]>(
    DEFAULT_EXPERIMENT_TEST_CASES
  );
  const [selectedTestCaseId, setSelectedTestCaseId] = useState<string>(
    DEFAULT_EXPERIMENT_TEST_CASES[0].id
  );
  const [versionsToRun, setVersionsToRun] = useState<Record<PromptVersion, boolean>>({
    V1: true,
    V2: true,
    V3: true,
  });
  const [includeAutomatedReviewForV1V2, setIncludeAutomatedReviewForV1V2] =
    useState<boolean>(true);

  // Side-by-side live comparison state
  const [runStates, setRunStates] = useState<Record<PromptVersion, VersionRunState>>({
    V1: { loading: false, result: null },
    V2: { loading: false, result: null },
    V3: { loading: false, result: null },
  });

  // Human evaluations keyed by PromptVersion for current comparison
  const [draftEvaluations, setDraftEvaluations] = useState<
    Record<PromptVersion, HumanEvaluationRecord>
  >({
    V1: createEmptyEvaluation(),
    V2: createEmptyEvaluation(),
    V3: createEmptyEvaluation(),
  });

  // Saved localStorage records
  const [savedRecords, setSavedRecords] = useState<PromptExperimentResult[]>([]);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  useEffect(() => {
    queueMicrotask(() => {
      setSavedRecords(getExperimentRecords());
    });
  }, []);

  const currentPrompt =
    PROMPT_VERSIONS.find((p) => p.version === inspectedVersion) ||
    PROMPT_VERSIONS[2];

  const activeTestCase =
    testCases.find((tc) => tc.id === selectedTestCaseId) || testCases[0];

  const updateActiveInput = <K extends keyof ExperimentInput>(
    field: K,
    value: ExperimentInput[K]
  ) => {
    setTestCases((prev) =>
      prev.map((tc) =>
        tc.id === activeTestCase.id
          ? { ...tc, input: { ...tc.input, [field]: value } }
          : tc
      )
    );
  };

  const handleResetTestCase = () => {
    const original = DEFAULT_EXPERIMENT_TEST_CASES.find(
      (tc) => tc.id === activeTestCase.id
    );
    if (!original) return;
    setTestCases((prev) =>
      prev.map((tc) => (tc.id === original.id ? { ...original } : tc))
    );
  };

  const handleCopyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSection(label);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const runSingleVersion = async (version: PromptVersion) => {
    setRunStates((prev) => ({
      ...prev,
      [version]: { loading: true, result: null },
    }));

    try {
      const response = await fetch("/api/experiment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          promptVersion: version,
          input: activeTestCase.input,
          includeAutomatedReview: includeAutomatedReviewForV1V2,
        }),
      });

      const json: ApiResponse<
        Omit<PromptExperimentResult, "runId" | "testCaseId" | "testCaseName">
      > = await response.json();

      if (!response.ok || !json.success) {
        const errResult: PromptExperimentResult = {
          runId: createExperimentRunId(version),
          testCaseId: activeTestCase.id,
          testCaseName: activeTestCase.name,
          promptVersion: version,
          inputSnapshot: { ...activeTestCase.input },
          status: "api_error",
          errorMessage:
            json.success === false ? json.error : "Experiment request failed.",
          generatedQuestions: [],
          automatedReview: null,
          refinementResults: [],
          finalQuestions: [],
          stagesExecuted: ["API Error"],
          durationMs: 0,
          executedAt: new Date().toISOString(),
        };
        setRunStates((prev) => ({
          ...prev,
          [version]: { loading: false, result: errResult },
        }));
        return;
      }

      const fullResult: PromptExperimentResult = {
        ...json.data,
        runId: createExperimentRunId(version),
        testCaseId: activeTestCase.id,
        testCaseName: activeTestCase.name,
      };

      setRunStates((prev) => ({
        ...prev,
        [version]: { loading: false, result: fullResult },
      }));
      setDraftEvaluations((prev) => ({
        ...prev,
        [version]: createEmptyEvaluation(),
      }));
    } catch (err) {
      const errResult: PromptExperimentResult = {
        runId: createExperimentRunId(version),
        testCaseId: activeTestCase.id,
        testCaseName: activeTestCase.name,
        promptVersion: version,
        inputSnapshot: { ...activeTestCase.input },
        status: "api_error",
        errorMessage:
          err instanceof Error ? err.message : "Network error during experiment.",
        generatedQuestions: [],
        automatedReview: null,
        refinementResults: [],
        finalQuestions: [],
        stagesExecuted: ["Network Error"],
        durationMs: 0,
        executedAt: new Date().toISOString(),
      };
      setRunStates((prev) => ({
        ...prev,
        [version]: { loading: false, result: errResult },
      }));
    }
  };

  const handleRunSelectedVersions = async () => {
    const selected: PromptVersion[] = (["V1", "V2", "V3"] as PromptVersion[]).filter(
      (v) => versionsToRun[v]
    );
    if (selected.length === 0) return;
    await Promise.all(selected.map((v) => runSingleVersion(v)));
  };

  const handleCriterionChange = (
    version: PromptVersion,
    key: HumanEvaluationCriterionKey,
    val: "PASS" | "FAIL"
  ) => {
    setDraftEvaluations((prev) => ({
      ...prev,
      [version]: {
        ...prev[version],
        criteria: {
          ...prev[version].criteria,
          [key]: val,
        },
      },
    }));
  };

  const handleSaveRun = (version: PromptVersion) => {
    const result = runStates[version].result;
    if (!result) return;
    const evaluation: HumanEvaluationRecord = {
      ...draftEvaluations[version],
      evaluatedAt: new Date().toISOString(),
    };
    const recordToSave: PromptExperimentResult = {
      ...result,
      humanEvaluation: evaluation,
    };
    const updated = saveExperimentRecord(recordToSave);
    setSavedRecords(updated);
    setSavedNotice(`Saved ${version} experiment (${activeTestCase.name}) to localStorage.`);
    setTimeout(() => setSavedNotice(null), 3000);
  };

  const handleDeleteRecord = (runId: string) => {
    setSavedRecords(deleteExperimentRecord(runId));
  };

  const handleClearRecords = () => {
    clearExperimentRecords();
    setSavedRecords([]);
  };

  const handleExportJSON = () => {
    const blob = new Blob([JSON.stringify(savedRecords, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qbench-experiments-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csv = buildExperimentsCsv(savedRecords);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `qbench-experiments-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const isAnyRunning =
    runStates.V1.loading || runStates.V2.loading || runStates.V3.loading;
  const hasAnyResult = Boolean(
    runStates.V1.result || runStates.V2.result || runStates.V3.result
  );

  return (
    <div className="space-y-6">
      {/* Academic Integrity Disclaimer */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-blue-950 text-xs">
        <Info className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div>
            <span className="font-semibold">
              Prompt Engineering Experimentation Lab:
            </span>{" "}
            Run the exact same test case across <strong>V1 (Baseline / Zero-shot)</strong>,{" "}
            <strong>V2 (Structured with Constraints & Examples)</strong>, and{" "}
            <strong>V3 (Multi-Stage: Generation + Independent Review + Refinement)</strong>{" "}
            to observe actual differences in output quality and guardrail behavior.
          </div>
          <div className="text-blue-900/90">
            <strong>Important:</strong> Automated AI reviewer feedback is an assistance signal and{" "}
            <u>does not prove correctness</u>. Human evaluation via the 6-criterion rubric below is the authoritative record. Only actual recorded runs are displayed — no fabricated benchmark numbers are used.
          </div>
        </div>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-600" />
            <span>Prompt Experimentation Lab</span>
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Controlled A/B/C testing across V1, V2, and V3 with 12 editable test cases, human evaluation rubric, and CSV/JSON export
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowPromptDetails((v) => !v)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 self-start sm:self-auto"
        >
          <Code2 className="w-3.5 h-3.5 text-blue-600" />
          <span>{showPromptDetails ? "Hide Prompt Templates" : "Inspect Prompt Templates"}</span>
          {showPromptDetails ? (
            <ChevronUp className="w-3.5 h-3.5" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

      {/* Prompt Version Cards (Select Version to Inspect) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {PROMPT_VERSIONS.map((pv) => {
          const isSelected = inspectedVersion === pv.version;
          const isEnabledForRun = versionsToRun[pv.version];
          return (
            <div
              key={pv.version}
              onClick={() => setInspectedVersion(pv.version)}
              className={`p-4 rounded-xl border cursor-pointer transition-all ${
                isSelected
                  ? "bg-white border-blue-600 shadow-xs ring-1 ring-blue-600/20"
                  : "bg-white border-slate-200 hover:border-slate-300"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-bold px-2 py-0.5 rounded ${
                      isSelected
                        ? "bg-blue-600 text-white"
                        : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {pv.version}
                  </span>
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                    {pv.version === "V1"
                      ? "Baseline / Zero-shot"
                      : pv.version === "V2"
                      ? "Structured + Examples"
                      : "3-Stage Pipeline"}
                  </span>
                </div>

                <label
                  onClick={(e) => e.stopPropagation()}
                  className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={isEnabledForRun}
                    onChange={() =>
                      setVersionsToRun((prev) => ({
                        ...prev,
                        [pv.version]: !prev[pv.version],
                      }))
                    }
                    className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600"
                  />
                  <span>Run</span>
                </label>
              </div>

              <h3 className="text-sm font-bold text-slate-900">{pv.title}</h3>
              <p className="text-xs text-slate-500 mt-1">{pv.tagline}</p>
            </div>
          );
        })}
      </div>

      {/* Collapsible Prompt Architecture Inspector */}
      {showPromptDetails && (
        <Card>
          <CardHeader
            title={
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>
                  {currentPrompt.version}: {currentPrompt.title}
                </span>
              </div>
            }
            subtitle={currentPrompt.purpose}
          />
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Architecture Technique
                </span>
                <p className="text-xs font-semibold text-slate-900">
                  {currentPrompt.architectureTechnique}
                </p>
              </div>
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                  Recommended Use
                </span>
                <p className="text-xs font-semibold text-slate-900">
                  {currentPrompt.recommendedFor}
                </p>
              </div>
            </div>

            <div className="border border-slate-200 rounded-lg overflow-hidden">
              <div className="px-4 py-2 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-800">
                <span className="flex items-center gap-2">
                  <Terminal className="w-3.5 h-3.5 text-slate-500" />
                  System Prompt
                </span>
                <button
                  type="button"
                  onClick={() => handleCopyText(currentPrompt.systemPrompt, "sys")}
                  className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-slate-900"
                >
                  {copiedSection === "sys" ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono bg-slate-950 text-slate-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                {currentPrompt.systemPrompt}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Case Suite & Editable Input Runner */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-blue-600" />
              <span>Test-Case Suite & Shared Input Runner ({testCases.length} Editable Cases)</span>
            </div>
          }
          subtitle="Select a sample test case or edit any field below, then run selected prompt versions on the exact same input."
          action={
            <button
              type="button"
              onClick={handleResetTestCase}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Case</span>
            </button>
          }
        />
        <CardContent className="space-y-4">
          {/* Test Case Selector Strip */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-2">
              Select Sample Test Case:
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {testCases.map((tc) => {
                const active = tc.id === activeTestCase.id;
                return (
                  <button
                    key={tc.id}
                    type="button"
                    onClick={() => setSelectedTestCaseId(tc.id)}
                    className={`text-left p-3 rounded-lg border text-xs transition-all ${
                      active
                        ? "bg-blue-50/80 border-2 border-blue-600 text-slate-900 shadow-xs"
                        : "bg-white border-slate-200 text-slate-800 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-slate-900 truncate">{tc.name}</span>
                      {active && (
                        <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white shrink-0">
                          Selected
                        </span>
                      )}
                    </div>
                    <span className="inline-block text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {tc.category}
                    </span>
                  </button>
                );
              })}
            </div>
            <div className="mt-2.5 p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
              <strong className="text-slate-900">Case Purpose:</strong> {activeTestCase.description}{" "}
              <span className="text-slate-600">
                (Expected: {activeTestCase.expectedBehavior})
              </span>
            </div>
          </div>

          {/* Editable Test Input Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                Subject Name
              </label>
              <input
                type="text"
                value={activeTestCase.input.subjectName}
                onChange={(e) => updateActiveInput("subjectName", e.target.value)}
                className="w-full h-9 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                Topic <span className="font-normal text-slate-600">(clear to test missing topic)</span>
              </label>
              <input
                type="text"
                value={activeTestCase.input.topic}
                onChange={(e) => updateActiveInput("topic", e.target.value)}
                className="w-full h-9 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                Syllabus Details / Learning Objectives <span className="font-normal text-slate-600">(clear to test empty syllabus)</span>
              </label>
              <textarea
                rows={2}
                value={activeTestCase.input.syllabusDetails}
                onChange={(e) =>
                  updateActiveInput("syllabusDetails", e.target.value)
                }
                className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 md:col-span-2">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Bloom&apos;s Level
                </label>
                <select
                  value={activeTestCase.input.bloomLevel}
                  onChange={(e) => updateActiveInput("bloomLevel", e.target.value)}
                  className="w-full h-9 px-2.5 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  <option value="remember">Remember</option>
                  <option value="understand">Understand</option>
                  <option value="apply">Apply</option>
                  <option value="analyze">Analyze</option>
                  <option value="evaluate">Evaluate</option>
                  <option value="create">Create</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Question Type
                </label>
                <select
                  value={activeTestCase.input.questionType}
                  onChange={(e) =>
                    updateActiveInput("questionType", e.target.value)
                  }
                  className="w-full h-9 px-2.5 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                >
                  <option value="multiple_choice">MCQ</option>
                  <option value="short_answer">Short Answer</option>
                  <option value="long_answer">Long Answer</option>
                  <option value="descriptive">Descriptive</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Questions
                </label>
                <input
                  type="number"
                  value={activeTestCase.input.numQuestions}
                  onChange={(e) =>
                    updateActiveInput("numQuestions", Number(e.target.value))
                  }
                  className="w-full h-9 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  Marks <span className="font-normal text-slate-600">(0/-1 edge)</span>
                </label>
                <input
                  type="number"
                  value={activeTestCase.input.marksPerQuestion}
                  onChange={(e) =>
                    updateActiveInput("marksPerQuestion", Number(e.target.value))
                  }
                  className="w-full h-9 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                Additional Instructions <span className="font-normal text-slate-600">(optional)</span>
              </label>
              <input
                type="text"
                value={activeTestCase.input.additionalInstructions || ""}
                onChange={(e) =>
                  updateActiveInput("additionalInstructions", e.target.value)
                }
                className="w-full h-9 px-3 py-1.5 text-xs sm:text-sm rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-500"
                placeholder="Optional constraints or conflicting instructions for stress testing..."
              />
            </div>
          </div>

          {/* Runner Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <label className="inline-flex items-center gap-2.5 text-xs font-medium text-slate-800 cursor-pointer">
              <input
                type="checkbox"
                checked={includeAutomatedReviewForV1V2}
                onChange={(e) =>
                  setIncludeAutomatedReviewForV1V2(e.target.checked)
                }
                className="w-4 h-4 rounded border-slate-300 text-blue-600"
              />
              <span>
                Also fetch Stage 2 Automated Reviewer Feedback for V1 &amp; V2{" "}
                <span className="text-slate-600">(V3 always runs all 3 stages)</span>
              </span>
            </label>

            <div className="flex flex-wrap items-center gap-2">
              {(["V1", "V2", "V3"] as PromptVersion[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  disabled={isAnyRunning}
                  onClick={() => runSingleVersion(v)}
                  className="px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-800 disabled:opacity-50 transition-colors"
                >
                  Run {v} Only
                </button>
              ))}

              <button
                type="button"
                disabled={
                  isAnyRunning ||
                  (!versionsToRun.V1 && !versionsToRun.V2 && !versionsToRun.V3)
                }
                onClick={handleRunSelectedVersions}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white shadow-xs transition-colors"
              >
                {isAnyRunning ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Running Experiment...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Selected Versions Side-by-Side</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </CardContent>
      </Card>

      {savedNotice && (
        <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{savedNotice}</span>
        </div>
      )}

      {/* Side-by-Side Output Comparison & Human Evaluation Rubric */}
      {(hasAnyResult || isAnyRunning) && (
        <div className="space-y-3">
          <h2 className="text-sm font-bold text-slate-900">
            Side-by-Side Output Comparison & Human Evaluation
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
            {(["V1", "V2", "V3"] as PromptVersion[]).map((version) => {
              const { loading, result } = runStates[version];
              const evalDraft = draftEvaluations[version];
              const firstQ = result?.finalQuestions[0];
              const rubricSum = firstQ
                ? firstQ.markingScheme.reduce((acc, s) => acc + s.marks, 0)
                : 0;

              return (
                <div
                  key={version}
                  className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col"
                >
                  {/* Column Header */}
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-900 text-white">
                        {version}
                      </span>
                      <span className="text-xs font-semibold text-slate-700">
                        {version === "V1"
                          ? "Baseline"
                          : version === "V2"
                          ? "Structured"
                          : "Multi-Stage"}
                      </span>
                    </div>
                    {result && (
                      <span className="text-[11px] font-mono text-slate-500">
                        {result.durationMs} ms
                      </span>
                    )}
                  </div>

                  {/* Column Body */}
                  <div className="p-4 space-y-4 text-xs flex-1">
                    {loading && (
                      <div className="py-10 text-center text-slate-500 space-y-2">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-600 mx-auto" />
                        <p>
                          Executing {version}
                          {version === "V3"
                            ? " (Generate -> Review -> Refine)..."
                            : "..."}
                        </p>
                      </div>
                    )}

                    {!loading && !result && (
                      <div className="py-10 text-center text-slate-600">
                        Not executed for this test case yet.
                      </div>
                    )}

                    {!loading && result && (
                      <>
                        {/* Stages Executed */}
                        <div className="flex flex-wrap gap-1">
                          {result.stagesExecuted.map((st, idx) => (
                            <span
                              key={idx}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200"
                            >
                              {st}
                            </span>
                          ))}
                        </div>

                        {/* Validation / API Error */}
                        {result.status !== "success" && (
                          <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-950 space-y-1">
                            <div className="font-bold flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
                              <span>
                                {result.status === "validation_error"
                                  ? "Input Validation Rejected"
                                  : "API Error"}
                              </span>
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              {result.errorMessage}
                            </p>
                          </div>
                        )}

                        {/* Generated Question Output */}
                        {firstQ && (
                          <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                              <div className="flex items-center justify-between text-[11px] text-slate-500">
                                <span>
                                  {firstQ.questionType.replace("_", " ").toUpperCase()} •{" "}
                                  {firstQ.bloomLevel.toUpperCase()}
                                </span>
                                <span className="font-semibold text-slate-700">
                                  {firstQ.marks} Marks (Scheme: {rubricSum})
                                </span>
                              </div>
                              <p className="text-slate-900 whitespace-pre-wrap leading-relaxed font-medium">
                                {firstQ.questionText}
                              </p>

                              {firstQ.options && firstQ.options.length > 0 && (
                                <ul className="space-y-1 pt-1">
                                  {firstQ.options.map((o) => (
                                    <li
                                      key={o.id}
                                      className={`px-2 py-1 rounded text-[11px] ${
                                        o.isCorrect
                                          ? "bg-emerald-50 text-emerald-900 border border-emerald-200 font-semibold"
                                          : "bg-white text-slate-700 border border-slate-200"
                                      }`}
                                    >
                                      [{o.id}] {o.text}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </div>

                            <div>
                              <div className="font-semibold text-slate-800 mb-0.5">
                                Expected Answer / Key:
                              </div>
                              <p className="text-[11px] text-slate-700 whitespace-pre-wrap bg-slate-50 p-2 rounded border border-slate-200">
                                {firstQ.expectedAnswer || firstQ.answerKey}
                              </p>
                            </div>

                            <div>
                              <div className="font-semibold text-slate-800 mb-0.5">
                                Marking Scheme:
                              </div>
                              <ul className="space-y-1 text-[11px] text-slate-700">
                                {firstQ.markingScheme.map((ms, idx) => (
                                  <li
                                    key={idx}
                                    className="bg-slate-50 px-2 py-1 rounded border border-slate-200"
                                  >
                                    <strong>
                                      {ms.step} ({ms.marks}m):
                                    </strong>{" "}
                                    {ms.criteria}
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {result.refinementResults &&
                              result.refinementResults.some((r) => !r.skipped) && (
                                <div className="p-2.5 rounded-lg bg-indigo-50 border border-indigo-200 text-[11px] text-indigo-950">
                                  <span className="font-bold block mb-0.5">
                                    V3 Stage 3 Refinement Applied:
                                  </span>
                                  {result.refinementResults
                                    .filter((r) => !r.skipped)
                                    .map((r) => r.changesSummary)
                                    .join(" ")}
                                </div>
                              )}
                          </div>
                        )}

                        {/* Clearly Separated Automated Reviewer Feedback */}
                        {result.automatedReview && (
                          <div className="p-3 rounded-lg bg-slate-100 border border-slate-300 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1">
                                <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                                Automated Reviewer (AI Assist Only)
                              </span>
                              <VerdictBadge
                                verdict={result.automatedReview.overallStatus}
                              />
                            </div>
                            <p className="text-[11px] text-slate-700">
                              AI Audit Score: {result.automatedReview.overallScore}/100
                              — <em>does not prove correctness.</em>
                            </p>
                            {result.automatedReview.questionVerdicts[0]?.issues
                              .length > 0 && (
                              <ul className="list-disc list-inside text-[11px] text-amber-900">
                                {result.automatedReview.questionVerdicts[0].issues.map(
                                  (iss, idx) => (
                                    <li key={idx}>{iss.issue}</li>
                                  )
                                )}
                              </ul>
                            )}
                          </div>
                        )}

                        {/* Authoritative Human Evaluation Rubric */}
                        <div className="pt-3 border-t border-slate-200 space-y-2.5">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-blue-900">
                            Human Evaluation Rubric (Authoritative)
                          </div>

                          <div className="space-y-1.5">
                            {HUMAN_EVALUATION_CRITERIA.map((c) => {
                              const currentVal = evalDraft.criteria[c.key];
                              return (
                                <div
                                  key={c.key}
                                  className="flex items-center justify-between gap-2 text-[11px]"
                                  title={c.description}
                                >
                                  <span className="text-slate-700 font-medium">
                                    {c.label}
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCriterionChange(
                                          version,
                                          c.key,
                                          "PASS"
                                        )
                                      }
                                      className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                                        currentVal === "PASS"
                                          ? "bg-emerald-600 text-white border-emerald-600"
                                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                      }`}
                                    >
                                      PASS
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleCriterionChange(
                                          version,
                                          c.key,
                                          "FAIL"
                                        )
                                      }
                                      className={`px-2 py-0.5 rounded border text-[10px] font-bold ${
                                        currentVal === "FAIL"
                                          ? "bg-rose-600 text-white border-rose-600"
                                          : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                                      }`}
                                    >
                                      FAIL
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-[11px] font-bold text-slate-800">
                              Overall Verdict:
                            </span>
                            <div className="flex items-center gap-1.5">
                              {(["PASS", "FAIL"] as const).map((verdict) => (
                                <button
                                  key={verdict}
                                  type="button"
                                  onClick={() =>
                                    setDraftEvaluations((prev) => ({
                                      ...prev,
                                      [version]: {
                                        ...prev[version],
                                        overallVerdict: verdict,
                                      },
                                    }))
                                  }
                                  className={`px-2.5 py-1 rounded text-[11px] font-bold border ${
                                    evalDraft.overallVerdict === verdict
                                      ? verdict === "PASS"
                                        ? "bg-emerald-600 text-white border-emerald-600"
                                        : "bg-rose-600 text-white border-rose-600"
                                      : "bg-white text-slate-600 border-slate-200"
                                  }`}
                                >
                                  {verdict}
                                </button>
                              ))}
                            </div>
                          </div>

                          <textarea
                            rows={2}
                            value={evalDraft.comments}
                            onChange={(e) =>
                              setDraftEvaluations((prev) => ({
                                ...prev,
                                [version]: {
                                  ...prev[version],
                                  comments: e.target.value,
                                },
                              }))
                            }
                            placeholder="Evaluator comments (e.g., observations on clarity, distractor plausibility, or rubric accuracy)..."
                            className="w-full px-2.5 py-1.5 text-[11px] rounded border border-slate-300"
                          />

                          <button
                            type="button"
                            onClick={() => handleSaveRun(version)}
                            className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-md bg-slate-900 hover:bg-slate-800 text-white transition-colors"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Save {version} Result to Local History</span>
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Saved Experiment Records (Actual Recorded Results Only) */}
      <Card>
        <CardHeader
          title={
            <div className="flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-blue-600" />
              <span>
                Recorded Experiment Results ({savedRecords.length})
              </span>
            </div>
          }
          subtitle="Stored locally in browser localStorage. Displays actual recorded test runs only — no synthetic or simulated metrics."
          action={
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={savedRecords.length === 0}
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                <span>Export CSV</span>
              </button>
              <button
                type="button"
                disabled={savedRecords.length === 0}
                onClick={handleExportJSON}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>Export JSON</span>
              </button>
              {savedRecords.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearRecords}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md text-rose-600 hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>
          }
        />
        <CardContent>
          {savedRecords.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-500">
              No experiment records saved yet. Run a test case above, complete the human evaluation rubric, and click &ldquo;Save Result to Local History&rdquo;.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-[11px] uppercase tracking-wider text-slate-500">
                    <th className="py-2 pr-3">Version</th>
                    <th className="py-2 pr-3">Test Case</th>
                    <th className="py-2 pr-3">Execution</th>
                    <th className="py-2 pr-3">AI Review (Assist)</th>
                    <th className="py-2 pr-3">Human Verdict</th>
                    <th className="py-2 pr-3">Evaluator Comments</th>
                    <th className="py-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {savedRecords.map((rec) => (
                    <tr key={rec.runId} className="hover:bg-slate-50/70">
                      <td className="py-2.5 pr-3 font-bold text-slate-900">
                        {rec.promptVersion}
                      </td>
                      <td className="py-2.5 pr-3">
                        <div className="font-medium text-slate-900">
                          {rec.testCaseName}
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {rec.inputSnapshot.subjectName} •{" "}
                          {rec.inputSnapshot.bloomLevel} •{" "}
                          {rec.durationMs}ms
                        </div>
                      </td>
                      <td className="py-2.5 pr-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${
                            rec.status === "success"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-amber-50 text-amber-800 border-amber-200"
                          }`}
                        >
                          {rec.status}
                        </span>
                      </td>
                      <td className="py-2.5 pr-3 text-[11px] text-slate-600">
                        {rec.automatedReview
                          ? `${rec.automatedReview.overallStatus} (${rec.automatedReview.overallScore}/100)`
                          : "Not run"}
                      </td>
                      <td className="py-2.5 pr-3">
                        {rec.humanEvaluation ? (
                          <VerdictBadge
                            verdict={rec.humanEvaluation.overallVerdict}
                          />
                        ) : (
                          <span className="text-slate-600">Unrated</span>
                        )}
                      </td>
                      <td className="py-2.5 pr-3 text-[11px] text-slate-700 max-w-xs truncate">
                        {rec.humanEvaluation?.comments || "—"}
                      </td>
                      <td className="py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(rec.runId)}
                          className="p-1 text-slate-600 hover:text-rose-600"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
