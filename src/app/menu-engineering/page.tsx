"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/db/dexie";
import { type MenuItemDef } from "@/lib/data/sample-menu";
import { formatCurrency } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import {
  Sparkles,
  Star,
  Zap,
  HelpCircle,
  AlertOctagon,
  ArrowRight,
  TrendingUp,
  Share2,
} from "lucide-react";

export default function MenuEngineeringPage() {
  const [items, setItems] = useState<MenuItemDef[]>([]);
  const { playSound } = useUiStore();

  useEffect(() => {
    db.items.toArray().then(setItems);
  }, []);

  // Classify items into 4 quadrants
  // Profit Margin = (Price - Cost) / Price
  // Popularity = Best seller / favourite
  const stars: any[] = [];
  const plowhorses: any[] = [];
  const puzzles: any[] = [];
  const dogs: any[] = [];

  items.forEach((item) => {
    const margin = (item.base_price - item.cost_price) / item.base_price;
    const isPopular = item.is_favourite || item.base_price >= 650;
    const isHighMargin = margin >= 0.70;

    const classified = {
      ...item,
      marginPercent: Math.round(margin * 100),
      grossProfit: item.base_price - item.cost_price,
    };

    if (isHighMargin && isPopular) stars.push(classified);
    else if (!isHighMargin && isPopular) plowhorses.push(classified);
    else if (isHighMargin && !isPopular) puzzles.push(classified);
    else dogs.push(classified);
  });

  const handleShareSummaryWhatsApp = () => {
    playSound("bell");
    const text = encodeURIComponent(
      `*Rewind Café — Menu Engineering Intelligence Report*\n\n` +
        `🌟 *Stars (High Profit & High Demand)*:\n` +
        stars.map((s) => `• ${s.name_en} (${s.marginPercent}% margin, +₨ ${s.grossProfit}/cup)`).join("\n") +
        `\n\n🐎 *Plowhorses (High Demand, Lower Margin)*:\n` +
        plowhorses.map((p) => `• ${p.name_en} (Suggest +₨ 30 price increase)`).join("\n") +
        `\n\n🧩 *Puzzles (High Margin, Needs Promo)*:\n` +
        puzzles.map((pz) => `• ${pz.name_en} (${pz.marginPercent}% margin, train cashiers to upsell)`).join("\n")
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cream-200 dark:border-espresso-700">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-vintage-orange text-white flex items-center justify-center text-sm shadow-card">
              🌟
            </span>
            <span>Menu Engineering & Profitability Matrix</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
            BCG 4-quadrant analysis: Stars, Plowhorses, Puzzles, and Dogs with pricing advice
          </p>
        </div>

        <button
          onClick={handleShareSummaryWhatsApp}
          className="px-4 py-2 rounded-2xl bg-sage-light hover:bg-sage/20 text-sage-dark border border-sage/40 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
        >
          <Share2 className="w-4 h-4 text-sage" />
          <span>Send Daily Intelligence to Owner (WhatsApp)</span>
        </button>
      </div>

      {/* 2x2 Matrix Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. STARS (Top-Right) */}
        <div className="p-6 rounded-3xl bg-amber-50/80 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
              <Star className="w-5 h-5 fill-amber-500 text-amber-500" />
              <h3 className="font-serif font-black text-lg">STARS (High Margin, High Sales)</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900">
              Flagship Items
            </span>
          </div>
          <p className="text-xs text-amber-900/70 dark:text-amber-200/70 leading-relaxed">
            Protect these items at all costs. Maintain strict barista recipe consistency and feature them on POS quick tiles.
          </p>

          <div className="divide-y divide-amber-200 dark:divide-amber-800 text-xs">
            {stars.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between items-center">
                <span className="font-bold text-espresso-900 dark:text-cream-100">
                  {item.name_en}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sage-dark">{item.marginPercent}% margin</span>
                  <span className="font-mono font-bold text-vintage-orange">
                    +{formatCurrency(item.grossProfit)} / cup
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. PLOWHORSES (Bottom-Right) */}
        <div className="p-6 rounded-3xl bg-blue-50/80 dark:bg-blue-950/40 border-2 border-blue-300 dark:border-blue-700 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-blue-900 dark:text-blue-200">
              <Zap className="w-5 h-5 text-blue-600" />
              <h3 className="font-serif font-black text-lg">PLOWHORSES (High Sales, Lower Margin)</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-200 text-blue-900">
              High Volume
            </span>
          </div>
          <p className="text-xs text-blue-900/70 dark:text-blue-200/70 leading-relaxed">
            Customers love these, but ingredients or packaging squeeze margin. Consider small ₨ 20–30 price increase or bulk ingredient sourcing.
          </p>

          <div className="divide-y divide-blue-200 dark:divide-blue-800 text-xs">
            {plowhorses.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between items-center">
                <span className="font-bold text-espresso-900 dark:text-cream-100">
                  {item.name_en}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-amber-700">{item.marginPercent}% margin</span>
                  <span className="font-mono font-bold">
                    +{formatCurrency(item.grossProfit)} / cup
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. PUZZLES (Top-Left) */}
        <div className="p-6 rounded-3xl bg-purple-50/80 dark:bg-purple-950/40 border-2 border-purple-300 dark:border-purple-700 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-purple-900 dark:text-purple-200">
              <HelpCircle className="w-5 h-5 text-purple-600" />
              <h3 className="font-serif font-black text-lg">PUZZLES (High Margin, Low Sales)</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-purple-200 text-purple-900">
              High Potential
            </span>
          </div>
          <p className="text-xs text-purple-900/70 dark:text-purple-200/70 leading-relaxed">
            Very profitable per cup, but guests don't know about them. Reposition on menu or train cashiers to suggest them during morning rush.
          </p>

          <div className="divide-y divide-purple-200 dark:divide-purple-800 text-xs">
            {puzzles.map((item) => (
              <div key={item.id} className="py-2.5 flex justify-between items-center">
                <span className="font-bold text-espresso-900 dark:text-cream-100">
                  {item.name_en}
                </span>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-sage-dark">{item.marginPercent}% margin</span>
                  <span className="font-mono font-bold text-vintage-orange">
                    +{formatCurrency(item.grossProfit)} / cup
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. DOGS (Bottom-Left) */}
        <div className="p-6 rounded-3xl bg-brick-light/80 dark:bg-brick/20 border-2 border-brick/40 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-brick">
              <AlertOctagon className="w-5 h-5" />
              <h3 className="font-serif font-black text-lg">DOGS (Low Margin, Low Sales)</h3>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-brick text-white">
              Underperforming
            </span>
          </div>
          <p className="text-xs text-brick-dark dark:text-brick-light leading-relaxed">
            Consumes raw ingredients with slow turnover. Recommend discontinuing or substituting with a higher margin alternative.
          </p>

          <div className="divide-y divide-brick/20 text-xs">
            {dogs.length === 0 ? (
              <div className="py-4 text-center font-bold text-sage">
                No underperforming dogs found in Rewind menu!
              </div>
            ) : (
              dogs.map((item) => (
                <div key={item.id} className="py-2.5 flex justify-between items-center">
                  <span className="font-bold">{item.name_en}</span>
                  <span className="font-bold text-brick">{item.marginPercent}% margin</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
