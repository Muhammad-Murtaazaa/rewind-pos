"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db/dexie";
import { SAMPLE_CATEGORIES, SAMPLE_MENU_ITEMS, SAMPLE_MODIFIER_GROUPS, SAMPLE_STAFF, SAMPLE_TABLES } from "@/lib/data/sample-menu";
import { useUiStore } from "@/stores/uiStore";
import { formatCurrency } from "@/lib/utils";
import {
  Coffee,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Store,
  DollarSign,
  Percent,
  Users,
  Compass,
} from "lucide-react";

export default function SetupWizardPage() {
  const router = useRouter();
  const { playSound } = useUiStore();

  const [step, setStep] = useState<number>(1);
  const [cafeName, setCafeName] = useState<string>("Rewind Café");
  const [address, setAddress] = useState<string>("F-7 Markaz, Islamabad");
  const [taxRate, setTaxRate] = useState<number>(16);
  const [currency, setCurrency] = useState<string>("PKR");
  const [language, setLanguage] = useState<string>("en");
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [isImportDone, setIsImportDone] = useState<boolean>(false);

  const handleImportSampleData = async () => {
    setIsImporting(true);
    playSound("click");

    try {
      // Clear and re-seed
      await db.items.clear();
      await db.categories.clear();
      await db.modifierGroups.clear();
      await db.diningTables.clear();
      await db.staff.clear();

      await db.categories.bulkAdd(SAMPLE_CATEGORIES);
      await db.modifierGroups.bulkAdd(SAMPLE_MODIFIER_GROUPS);
      await db.items.bulkAdd(SAMPLE_MENU_ITEMS);
      await db.diningTables.bulkAdd(SAMPLE_TABLES as any);
      await db.staff.bulkAdd(SAMPLE_STAFF);

      setIsImportDone(true);
      playSound("bell");
    } finally {
      setIsImporting(false);
    }
  };

  const handleFinishWizard = () => {
    playSound("bell");
    router.push("/pos");
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-2xl mx-auto w-full">
      <div className="w-full bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200 dark:border-espresso-700 shadow-floating p-6 md:p-8 space-y-6">
        {/* Wizard Header */}
        <div className="flex items-center gap-3 pb-4 border-b border-cream-200 dark:border-espresso-700">
          <div className="w-12 h-12 rounded-2xl bg-vintage-orange-light text-vintage-orange flex items-center justify-center shadow-card">
            <Compass className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-serif font-black text-xl md:text-2xl text-espresso-900 dark:text-cream-100">
              Rewind Café Onboarding Wizard
            </h2>
            <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
              Configure your café identity, currency, taxes, and initialize the menu
            </p>
          </div>
        </div>

        {/* Step Indicator */}
        <div className="flex items-center justify-between px-2">
          {[
            { num: 1, label: "Café Profile" },
            { num: 2, label: "Taxes & Currency" },
            { num: 3, label: "Menu & Staff" },
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div
                className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center transition-all ${
                  step === s.num
                    ? "bg-vintage-orange text-white shadow-md scale-110"
                    : step > s.num
                    ? "bg-sage text-white"
                    : "bg-cream-200 dark:bg-espresso-700 text-espresso-700"
                }`}
              >
                {step > s.num ? "✓" : s.num}
              </div>
              <span className="text-xs font-bold hidden sm:inline">{s.label}</span>
            </div>
          ))}
        </div>

        {/* Step 1: Café Profile */}
        {step === 1 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-bold block mb-1">Café Name</label>
              <input
                type="text"
                value={cafeName}
                onChange={(e) => setCafeName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-700 font-bold text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Address / Location</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-700 text-xs"
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Preferred Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-700 text-xs font-semibold"
              >
                <option value="en">English (Default)</option>
                <option value="ur">اردو (Urdu RTL)</option>
              </select>
            </div>
          </div>
        )}

        {/* Step 2: Taxes & Currency */}
        {step === 2 && (
          <div className="space-y-4 animate-fade-in">
            <div>
              <label className="text-xs font-bold block mb-1">POS Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-700 font-bold text-sm"
              >
                <option value="PKR">PKR (Pakistani Rupee - ₨)</option>
                <option value="USD">USD ($)</option>
                <option value="AED">AED (د.إ)</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">
                Sales Tax Rate (PRA / Sindh / Islamabad ICT)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-700 font-bold text-sm pr-8"
                />
                <span className="absolute right-4 top-2.5 text-xs font-bold text-espresso-700/50">
                  %
                </span>
              </div>
              <p className="text-[11px] text-espresso-700/60 mt-1">
                Standard café restaurant service tax is 16%.
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Menu & Staff Seeding */}
        {step === 3 && (
          <div className="space-y-4 animate-fade-in text-center">
            <div className="p-5 rounded-2xl bg-cream-50 dark:bg-espresso-900/60 border border-cream-200 dark:border-espresso-700 space-y-3">
              <Coffee className="w-10 h-10 text-vintage-orange mx-auto" />
              <h4 className="font-serif font-bold text-base">
                Rewind Signature Café Sample Catalog
              </h4>
              <p className="text-xs text-espresso-700/70 dark:text-cream-300/70 max-w-md mx-auto">
                Instantly load 12 artisan coffees, bakery croissants, club sandwiches, and Karachi karak chai with high-resolution food photography, variants, and modifiers.
              </p>

              <button
                onClick={handleImportSampleData}
                disabled={isImporting}
                className="px-6 py-2.5 rounded-2xl bg-vintage-orange hover:bg-vintage-orange-hover text-white text-xs font-bold shadow-md transition-all flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
              >
                {isImporting ? (
                  <span>Importing Menu…</span>
                ) : isImportDone ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    <span>Sample Menu Loaded Successfully!</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>1-Click Load Rewind Menu</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Navigation Step Buttons */}
        <div className="pt-4 border-t border-cream-200 dark:border-espresso-700 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={() => setStep(step - 1)}
              className="px-4 py-2 rounded-xl text-xs font-bold text-espresso-700 hover:bg-cream-100 transition-colors"
            >
              ← Back
            </button>
          ) : (
            <div />
          )}

          {step < 3 ? (
            <button
              onClick={() => {
                playSound("click");
                setStep(step + 1);
              }}
              className="px-6 py-2.5 rounded-2xl bg-vintage-orange text-white text-xs font-bold flex items-center gap-1.5 shadow-md hover:bg-vintage-orange-hover"
            >
              <span>Next Step</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishWizard}
              className="px-8 py-3 rounded-2xl bg-gradient-to-r from-vintage-orange to-amber-600 text-white font-serif font-bold text-sm flex items-center gap-2 shadow-floating hover:brightness-105 active:scale-98"
            >
              <span>Launch Rewind POS</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
