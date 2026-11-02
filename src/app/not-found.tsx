import Link from "next/link";
import { Coffee, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center bg-cream-50 dark:bg-espresso-950">
      <div className="w-16 h-16 rounded-3xl bg-vintage-orange/10 dark:bg-vintage-orange/20 text-vintage-orange flex items-center justify-center mb-4 shadow-card">
        <Coffee className="w-8 h-8" />
      </div>

      <span className="text-xs font-mono font-bold uppercase tracking-wider text-vintage-orange mb-1">
        404 — Page Not Found
      </span>

      <h1 className="font-serif font-black text-3xl text-espresso-900 dark:text-cream-100 mb-2">
        Spilled Coffee on This Page
      </h1>

      <p className="text-sm text-espresso-700/70 dark:text-cream-300/70 max-w-md mb-6 leading-relaxed">
        The route or station you are looking for doesn't exist or has been relocated to another counter.
      </p>

      <Link
        href="/pos"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-vintage-orange text-white font-bold text-sm shadow-floating hover:bg-vintage-orange/90 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to POS Register</span>
      </Link>
    </div>
  );
}
