import React from "react";
import { Info } from "lucide-react";

interface DemoBannerProps {
  message?: string;
  className?: string;
}

export function DemoBanner({
  message = "You are currently previewing sample assessment data. Realistic demo content is displayed to showcase the UI before live AI generation is connected.",
  className = "",
}: DemoBannerProps) {
  return (
    <div
      className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 text-xs ${className}`}
    >
      <Info className="w-4 h-4 shrink-0 text-amber-700" />
      <div className="flex-1">
        <span className="font-semibold text-amber-800 uppercase tracking-wider text-[10px] mr-1.5 px-1.5 py-0.5 rounded bg-amber-200/70">
          Demo Preview
        </span>
        <span className="text-amber-800/90">{message}</span>
      </div>
    </div>
  );
}
