"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-cream-50 dark:bg-espresso-950">
      <div className="w-16 h-16 rounded-3xl bg-brick/10 text-brick flex items-center justify-center mb-4 shadow-card">
        <AlertTriangle className="w-8 h-8" />
      </div>

      <span className="text-xs font-mono font-bold uppercase tracking-wider text-brick mb-1">
        500 — Terminal Error
      </span>

      <h1 className="font-serif font-black text-3xl text-espresso-900 dark:text-cream-100 mb-2">
        Something Went Wrong
      </h1>

      <p className="text-sm text-espresso-700/70 dark:text-cream-300/70 max-w-md mb-6 leading-relaxed">
        {error.message || "An unexpected error occurred while processing this request."}
      </p>

      <button
        onClick={() => reset()}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-vintage-orange text-white font-bold text-sm shadow-floating hover:bg-vintage-orange/90 transition-all"
      >
        <RotateCcw className="w-4 h-4" />
        <span>Try Again</span>
      </button>
    </div>
  );
}
