import React from "react";
import { BloomTaxonomyLevel, QuestionType, DifficultyLevel } from "@/types";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "neutral" | "primary" | "success" | "warning" | "danger" | "outline";
  className?: string;
}

export function Badge({ children, variant = "neutral", className = "" }: BadgeProps) {
  const styles = {
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
    primary: "bg-blue-50 text-blue-700 border-blue-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-800 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    outline: "bg-white text-slate-700 border-slate-300",
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-medium border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
}

export function DifficultyBadge({ level }: { level?: DifficultyLevel | string }) {
  const map: Record<string, { label: string; variant: BadgeProps["variant"] }> = {
    easy: { label: "Easy", variant: "success" },
    medium: { label: "Medium", variant: "warning" },
    hard: { label: "Hard", variant: "danger" },
  };
  const item = (level && map[level]) || { label: level || "Medium", variant: "neutral" };
  return <Badge variant={item.variant}>{item.label}</Badge>;
}

export function BloomBadge({ level }: { level: BloomTaxonomyLevel }) {
  const map: Record<BloomTaxonomyLevel, { label: string; style: string }> = {
    remember: {
      label: "L1: Remember",
      style: "bg-slate-100 text-slate-700 border-slate-200",
    },
    understand: {
      label: "L2: Understand",
      style: "bg-sky-50 text-sky-800 border-sky-200",
    },
    apply: {
      label: "L3: Apply",
      style: "bg-emerald-50 text-emerald-800 border-emerald-200",
    },
    analyze: {
      label: "L4: Analyze",
      style: "bg-blue-50 text-blue-800 border-blue-200",
    },
    evaluate: {
      label: "L5: Evaluate",
      style: "bg-indigo-50 text-indigo-800 border-indigo-200",
    },
    create: {
      label: "L6: Create",
      style: "bg-purple-50 text-purple-800 border-purple-200",
    },
  };

  const item = map[level] || { label: level, style: "bg-slate-100 text-slate-700 border-slate-200" };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${item.style}`}
    >
      {item.label}
    </span>
  );
}

export function QuestionTypeBadge({ type }: { type: QuestionType }) {
  const map: Record<QuestionType, string> = {
    multiple_choice: "MCQ",
    short_answer: "Short Answer",
    long_answer: "Long Answer",
    descriptive: "Descriptive",
    problem_solving: "Problem Solving",
    conceptual: "Conceptual",
  };

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200">
      {map[type] || type}
    </span>
  );
}

export function MarksBadge({ marks }: { marks: number }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-50 text-slate-700 border border-slate-300">
      {marks} {marks === 1 ? "Mark" : "Marks"}
    </span>
  );
}

export function VerdictBadge({
  verdict,
}: {
  verdict:
    | "PASS"
    | "NEEDS_IMPROVEMENT"
    | "FAIL"
    | "Pass"
    | "Minor Suggestion"
    | "Revision Recommended"
    | "Ready for Examination"
    | "Minor Revisions Suggested"
    | "Requires Revision"
    | string;
}) {
  const normalized = verdict.toUpperCase().replace(/\s+/g, "_");
  const isPass =
    normalized === "PASS" || normalized === "READY_FOR_EXAMINATION";
  const isNeedsImprovement =
    normalized === "NEEDS_IMPROVEMENT" ||
    normalized === "MINOR_SUGGESTION" ||
    normalized === "MINOR_REVISIONS_SUGGESTED";

  const color = isPass
    ? "bg-emerald-50 text-emerald-800 border-emerald-200"
    : isNeedsImprovement
    ? "bg-amber-50 text-amber-800 border-amber-200"
    : "bg-rose-50 text-rose-800 border-rose-200";

  const displayLabel =
    normalized === "NEEDS_IMPROVEMENT" ? "NEEDS IMPROVEMENT" : verdict;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${color}`}
    >
      {isPass ? "✓ " : isNeedsImprovement ? "⚠ " : "✕ "}
      {displayLabel}
    </span>
  );
}
