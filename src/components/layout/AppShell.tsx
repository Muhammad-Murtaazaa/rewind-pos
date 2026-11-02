"use client";

import React, { useEffect, useState } from "react";
import { Sidebar } from "./Sidebar";
import { AppHeader } from "./AppHeader";
import { useUiStore } from "@/stores/uiStore";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed, isRtl, theme } = useUiStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`min-h-screen bg-cream-50 dark:bg-espresso-950 text-espresso-900 dark:text-cream-100 flex flex-col transition-colors selection:bg-vintage-orange selection:text-white ${
        theme === "dark" ? "dark" : ""
      }`}
    >
      {/* 1. Responsive Collapsible Sidebar */}
      <Sidebar />

      {/* 2. Main Content Container shifted dynamically for Sidebar */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isRtl
            ? sidebarCollapsed
              ? "lg:mr-20"
              : "lg:mr-64"
            : sidebarCollapsed
              ? "lg:ml-20"
              : "lg:ml-64"
        }`}
      >
        <AppHeader />
        <main className="flex-1 flex flex-col min-h-0 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
