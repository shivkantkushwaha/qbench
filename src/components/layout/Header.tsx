"use client";

import React, { useEffect, useState } from "react";
import { Sparkles, CheckCircle2, AlertCircle, Cpu } from "lucide-react";
import { HealthStatus } from "@/types";

export function Header() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkHealth() {
      try {
        const res = await fetch("/api/health");
        const json = await res.json();
        if (json.success) {
          setHealth(json.data);
        }
      } catch (err) {
        console.error("Health check error:", err);
      } finally {
        setLoading(false);
      }
    }
    checkHealth();
  }, []);

  return (
    <header className="border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-sky-400 flex items-center justify-center text-white shadow-md shadow-indigo-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                QBench
              </span>
              <span className="px-2 py-0.5 text-[10px] uppercase font-semibold tracking-wider bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 rounded-md border border-indigo-200 dark:border-indigo-800">
                Foundation v1.0
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Exam Question Generator with Quality Check
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active Model Indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700">
            <Cpu className="w-3.5 h-3.5 text-indigo-500" />
            <span>Model:</span>
            <code className="text-indigo-600 dark:text-indigo-400 font-mono text-[11px]">
              {health?.model ?? "gemini-2.5-flash"}
            </code>
          </div>

          {/* Gemini API Key Status */}
          <div className="flex items-center">
            {loading ? (
              <span className="text-xs text-slate-400 animate-pulse">Checking status...</span>
            ) : health?.geminiConfigured ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                Gemini Ready
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                <AlertCircle className="w-3.5 h-3.5 text-amber-500" />
                API Key Needed in .env.local
              </span>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
