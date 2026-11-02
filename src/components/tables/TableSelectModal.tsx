"use client";

import React, { useEffect, useState } from "react";
import { db, type LocalTable } from "@/lib/db/dexie";
import { useCartStore } from "@/stores/cartStore";
import { useUiStore } from "@/stores/uiStore";
import { formatCurrency } from "@/lib/utils";
import { X, Users, Check, LayoutGrid } from "lucide-react";

interface TableSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TableSelectModal({ isOpen, onClose }: TableSelectModalProps) {
  const [tables, setTables] = useState<LocalTable[]>([]);
  const [selectedArea, setSelectedArea] = useState<string>("ALL");
  const { selected_table, setSelectedTable } = useCartStore();
  const { playSound } = useUiStore();

  useEffect(() => {
    if (isOpen) {
      db.diningTables.toArray().then(setTables);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const areas = ["ALL", ...Array.from(new Set(tables.map((t) => t.area)))];
  const filteredTables =
    selectedArea === "ALL" ? tables : tables.filter((t) => t.area === selectedArea);

  const handleSelectTable = (table: LocalTable) => {
    playSound("click");
    setSelectedTable({ id: table.id, table_number: table.table_number });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/65 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-cream-50 dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-café p-6 shadow-floating text-espresso-800 dark:text-cream-100 flex flex-col max-h-[85vh]">
        <div className="flex items-center justify-between pb-3 border-b border-cream-200 dark:border-espresso-700">
          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-vintage-orange" />
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight">Floor Plan & Tables</h3>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                Assign ticket to a guest table
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream-200 dark:hover:bg-espresso-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Area filter tabs */}
        <div className="flex items-center gap-1.5 py-3 overflow-x-auto">
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => setSelectedArea(area)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedArea === area
                  ? "bg-vintage-orange text-white shadow-sm"
                  : "bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-espresso-700 hover:border-vintage-orange/50"
              }`}
            >
              {area === "ALL" ? "All Areas" : area}
            </button>
          ))}
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 overflow-y-auto py-2 pr-1">
          {filteredTables.map((table) => {
            const isAssigned = selected_table?.id === table.id;
            return (
              <button
                key={table.id}
                onClick={() => handleSelectTable(table)}
                className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between min-h-[105px] transition-all relative ${
                  isAssigned
                    ? "bg-vintage-orange text-white border-vintage-orange shadow-md scale-102"
                    : table.is_occupied
                    ? "bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-200"
                    : "bg-white dark:bg-espresso-800 border-cream-200 dark:border-espresso-700 hover:border-vintage-orange/60 shadow-card"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif font-black text-base">
                    {table.table_number}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] opacity-80">
                    <Users className="w-3.5 h-3.5" />
                    <span>{table.capacity}</span>
                  </div>
                </div>

                <div className="text-[11px] font-medium">
                  {table.is_occupied ? (
                    <div className="flex flex-col">
                      <span className="font-bold text-mustard-dark dark:text-mustard">
                        Occupied ({table.occupied_minutes || 15}m)
                      </span>
                      {table.order_total && (
                        <span>{formatCurrency(table.order_total)}</span>
                      )}
                    </div>
                  ) : (
                    <span className="text-sage font-bold">Available</span>
                  )}
                </div>

                {isAssigned && (
                  <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-white text-vintage-orange flex items-center justify-center">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
