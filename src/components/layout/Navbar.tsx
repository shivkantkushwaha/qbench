"use client";

import React, { useState } from "react";
import {
  LayoutDashboard,
  FilePlus2,
  FileText,
  ShieldCheck,
  FlaskConical,
  Menu,
  X,
  Sparkles,
} from "lucide-react";
import { ActiveTab } from "@/types";

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  resultsCount: number;
}

export function Navbar({ activeTab, setActiveTab, resultsCount }: NavbarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: ActiveTab; label: string; icon: React.ElementType; badge?: string | number }[] = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "generator", label: "Generator", icon: FilePlus2 },
    {
      id: "results",
      label: "Results",
      icon: FileText,
      badge: resultsCount > 0 ? resultsCount : undefined,
    },
    { id: "quality-review", label: "Quality Review", icon: ShieldCheck },
    { id: "prompt-lab", label: "Prompt Lab", icon: FlaskConical },
  ];

  const handleTabClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Tag */}
          <div className="flex items-center gap-8">
            <button
              type="button"
              onClick={() => handleTabClick("dashboard")}
              className="flex items-center gap-2.5 text-left focus:outline-none"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-sm tracking-tight border border-slate-800">
                Q
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-bold text-slate-900 tracking-tight text-base">
                    QBench
                  </span>
                  <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200">
                    Academic
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 leading-none">
                  Exam Question Generator & Quality Review
                </p>
              </div>
            </button>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center space-x-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleTabClick(item.id)}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                      isActive
                        ? "bg-blue-50 text-blue-800 border border-blue-200 font-semibold"
                        : "text-slate-700 hover:text-slate-900 hover:bg-slate-100 border border-transparent font-medium"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${
                        isActive ? "text-blue-600" : "text-slate-500"
                      }`}
                    />
                    <span>{item.label}</span>
                    {item.badge !== undefined && (
                      <span
                        className={`ml-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          isActive
                            ? "bg-blue-600 text-white"
                            : "bg-slate-200 text-slate-800"
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Header Actions */}
          <div className="hidden sm:flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleTabClick("generator")}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-md text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Questions</span>
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? "bg-blue-50 text-blue-900 border border-blue-200 font-semibold"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon
                    className={`w-4 h-4 ${
                      isActive ? "text-blue-600" : "text-slate-500"
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => handleTabClick("generator")}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Generate Questions</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
