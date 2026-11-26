import React from "react";
import { BookOpen, ShieldCheck, Layers, Terminal } from "lucide-react";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-white py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-slate-600">
          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Psychometric Rigor</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Every question is calibrated against Bloom&apos;s Revised Taxonomy with distractor misconceptions.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Layers className="w-4 h-4 text-blue-600" />
              <span>Step-by-Step Rubrics</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Granular partial credit schemes eliminate subjective variance across multiple evaluators.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <BookOpen className="w-4 h-4 text-indigo-600" />
              <span>Syllabus Alignment</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Constraints guarantee test questions map strictly to official curriculum learning outcomes.
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center gap-1.5 font-semibold text-slate-900">
              <Terminal className="w-4 h-4 text-slate-700" />
              <span>Empirical Architecture</span>
            </div>
            <p className="text-slate-500 leading-relaxed">
              Transparent prompt engineering progression (V1 to V3) without fabricated metrics.
            </p>
          </div>
        </div>

        <div className="mt-8 pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-500">
          <span>QBench — Exam Question Generator with Quality Check</span>
          <span className="mt-2 sm:mt-0 font-medium">Academic Assessment Engineering System</span>
        </div>
      </div>
    </footer>
  );
}
