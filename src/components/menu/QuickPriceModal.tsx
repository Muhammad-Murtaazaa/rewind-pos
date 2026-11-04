"use client";

import React, { useState, useEffect } from "react";
import { type MenuItemDef } from "@/lib/data/sample-menu";
import { db } from "@/lib/db/dexie";
import { generateUUID, formatCurrency } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { X, DollarSign, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";

interface QuickPriceModalProps {
  item: MenuItemDef | null;
  onClose: () => void;
  onSaved: (item: MenuItemDef) => void;
}

export function QuickPriceModal({ item, onClose, onSaved }: QuickPriceModalProps) {
  const { playSound } = useUiStore();
  const [newPrice, setNewPrice] = useState<number>(0);
  const [newCost, setNewCost] = useState<number>(0);

  useEffect(() => {
    if (item) {
      setNewPrice(item.base_price || 0);
      setNewCost(item.cost_price || 0);
    }
  }, [item]);

  if (!item) return null;

  const currentPrice = item.base_price || 0;
  const currentCost = item.cost_price || 0;
  const profit = Math.max(0, newPrice - newCost);
  const margin = newPrice > 0 ? Math.round((profit / newPrice) * 100) : 0;

  const handleApplyPercentage = (pct: number) => {
    playSound("click");
    const adjusted = Math.round(currentPrice * (1 + pct / 100) / 10) * 10;
    setNewPrice(adjusted);
  };

  const handleSave = async () => {
    if (newPrice <= 0) {
      alert("Price must be greater than 0");
      return;
    }

    try {
      const updated: MenuItemDef = {
        ...item,
        base_price: Number(newPrice),
        cost_price: Number(newCost),
      };

      await db.items.put(updated);

      await db.outbox.add({
        id: generateUUID(),
        event_type: "MENU_ITEM_UPDATED",
        payload: updated,
        retry_count: 0,
        status: "PENDING",
        created_at: new Date().toISOString(),
      });

      playSound("chime");
      onSaved(updated);
      onClose();
    } catch (err: any) {
      alert("Error saving price: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-cream-50 dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-3xl shadow-floating text-espresso-900 dark:text-cream-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-cream-200 dark:border-espresso-700 bg-white dark:bg-espresso-900/60">
          <div>
            <h3 className="font-serif font-black text-base text-espresso-900 dark:text-cream-100">
              Quick Price Update
            </h3>
            <p className="text-xs text-espresso-700/60 dark:text-cream-300/60 truncate max-w-[240px]">
              {item.name_en}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-xl hover:bg-cream-200 dark:hover:bg-espresso-700 text-espresso-700 dark:text-cream-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Current vs New Price */}
          <div className="p-3 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700 flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-espresso-700/60 uppercase tracking-wider block">
                Current Price
              </span>
              <span className="font-bold text-sm text-espresso-800 line-through opacity-70">
                {formatCurrency(currentPrice)}
              </span>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-vintage-orange uppercase tracking-wider block">
                New Price
              </span>
              <span className="font-sans font-black text-lg text-vintage-orange">
                {formatCurrency(newPrice)}
              </span>
            </div>
          </div>

          {/* Quick Adjust Buttons */}
          <div>
            <span className="text-[11px] font-bold text-espresso-700/70 block mb-1.5">
              Quick Markup Shortcuts:
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {[-10, -5, 5, 10].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => handleApplyPercentage(pct)}
                  className="py-1.5 rounded-xl border border-cream-300 dark:border-espresso-700 bg-white dark:bg-espresso-800 text-xs font-bold hover:border-vintage-orange transition-all"
                >
                  {pct > 0 ? `+${pct}%` : `${pct}%`}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Base Price Input */}
          <div>
            <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
              New Selling Price (PKR)
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-2.5 font-bold text-sm text-espresso-700/50">₨</span>
              <input
                type="number"
                value={newPrice}
                onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                className="w-full pl-8 pr-4 py-2 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-600 font-bold text-base"
                autoFocus
              />
            </div>
          </div>

          {/* Cost Price & Margin */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-[10px] font-bold text-espresso-700/70 block mb-1">
                Cost Price (PKR)
              </label>
              <input
                type="number"
                value={newCost}
                onChange={(e) => setNewCost(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-600 text-xs font-bold"
              />
            </div>
            <div className="p-2 rounded-xl bg-sage-light dark:bg-emerald-950/70 border border-sage/40 flex flex-col justify-center">
              <span className="text-[9px] font-bold text-sage-dark dark:text-emerald-300 uppercase">Margin</span>
              <span className="font-bold text-sm text-sage-dark dark:text-emerald-200">{margin}%</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-cream-200 dark:border-espresso-700 bg-white dark:bg-espresso-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-2 text-xs font-bold text-espresso-700 hover:bg-cream-200 rounded-xl transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="h-10 px-5 rounded-xl bg-vintage-orange hover:bg-vintage-orange/90 text-white font-serif font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Update Price</span>
          </button>
        </div>
      </div>
    </div>
  );
}
