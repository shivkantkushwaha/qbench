"use client";

import React from "react";
import { History, Trash2, ArrowUpRight, Clock } from "lucide-react";
import { SavedQuestionRecord, GeneratedQuestion } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { DifficultyBadge, BloomBadge } from "@/components/common/Badge";

interface HistoryPanelProps {
  history: SavedQuestionRecord[];
  onSelectQuestion: (question: GeneratedQuestion) => void;
  onDeleteQuestion: (id: string) => void;
  onClearHistory: () => void;
}

export function HistoryPanel({
  history,
  onSelectQuestion,
  onDeleteQuestion,
  onClearHistory,
}: HistoryPanelProps) {
  return (
    <Card className="shadow-sm">
      <CardHeader
        title={
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-indigo-500" />
            <span>Browser Experiment History</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {history.length}
            </span>
          </div>
        }
        subtitle="Saved locally in browser storage (zero external database)"
        action={
          history.length > 0 && (
            <button
              type="button"
              onClick={onClearHistory}
              className="text-xs text-rose-600 hover:text-rose-700 flex items-center gap-1 font-medium transition-colors"
              title="Clear all saved history"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear</span>
            </button>
          )
        }
      />
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-slate-500 dark:text-slate-400">
            <Clock className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
            <p className="text-xs font-medium">No saved questions yet</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Generate a question and click &ldquo;Save Question&rdquo; to store it locally.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-1">
            {history.map((record) => {
              const q = record.question;
              const dateStr = new Date(record.savedAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              });

              return (
                <div
                  key={record.id}
                  className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 hover:border-indigo-300 dark:hover:border-indigo-700 transition-all flex items-start justify-between gap-3 group"
                >
                  <div
                    onClick={() => onSelectQuestion(q)}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex flex-wrap items-center gap-1.5 mb-1">
                      <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {q.title || q.topic}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                      <DifficultyBadge level={q.difficulty || "medium"} />
                      <BloomBadge level={q.bloomLevel} />
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300">
                        Score: {q.qualityCheck?.overallScore || 9}/10
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2">
                      {q.questionText}
                    </p>

                    <div className="mt-2 text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Saved at {dateStr}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1 items-end">
                    <button
                      type="button"
                      onClick={() => onSelectQuestion(q)}
                      className="p-1 rounded text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Load Question"
                    >
                      <ArrowUpRight className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteQuestion(record.id)}
                      className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete from history"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
