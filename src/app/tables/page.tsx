"use client";

import React, { useEffect, useState } from "react";
import { db, type LocalTable } from "@/lib/db/dexie";
import { formatCurrency } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { useTranslation } from "@/lib/i18n/translations";
import {
  Users,
  Clock,
  Sparkles,
  Move,
  ArrowRightLeft,
  UserCheck,
  CheckCircle2,
  Plus,
  RefreshCw,
} from "lucide-react";

export default function TablesPage() {
  const [tables, setTables] = useState<LocalTable[]>([]);
  const [activeArea, setActiveArea] = useState<string>("Indoor");
  const [selectedTable, setSelectedTable] = useState<LocalTable | null>(null);
  const [transferTargetId, setTransferTargetId] = useState<string>("");
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  const [showSuccessToast, setShowSuccessToast] = useState<string | null>(null);

  const { language, playSound } = useUiStore();
  const { t } = useTranslation(language);

  const loadTables = async () => {
    const list = await db.diningTables.toArray();
    setTables(list);
  };

  useEffect(() => {
    loadTables();
  }, []);

  const areas = Array.from(new Set(tables.map((t) => t.area)));
  const visibleTables = tables.filter((t) => t.area === activeArea);

  const handleTransferTable = async () => {
    if (!selectedTable || !transferTargetId) return;
    playSound("click");

    const targetTable = tables.find((t) => t.id === transferTargetId);
    if (!targetTable) return;

    // Move bill and occupied status to target
    await db.diningTables.update(targetTable.id, {
      is_occupied: true,
      order_total: selectedTable.order_total,
      occupied_minutes: selectedTable.occupied_minutes,
      current_order_id: selectedTable.current_order_id,
    });

    // Vacate origin
    await db.diningTables.update(selectedTable.id, {
      is_occupied: false,
      order_total: undefined,
      occupied_minutes: undefined,
      current_order_id: undefined,
    });

    await loadTables();
    setIsTransferring(false);
    setSelectedTable(null);
    setShowSuccessToast(`Transferred ${selectedTable.table_number} → ${targetTable.table_number}`);
    setTimeout(() => setShowSuccessToast(null), 3000);
  };

  const handleMarkVacated = async (table: LocalTable) => {
    playSound("click");
    await db.diningTables.update(table.id, {
      is_occupied: false,
      order_total: undefined,
      occupied_minutes: undefined,
      current_order_id: undefined,
    });
    await loadTables();
    setSelectedTable(null);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full space-y-4">
      {/* Header & Area Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-vintage-orange-light text-vintage-orange flex items-center justify-center text-sm">
              🏛️
            </span>
            <span>Rewind Floor Plan</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60 mt-0.5">
            Real-time table occupancy, guest counts, and transfers
          </p>
        </div>

        {/* Floor Areas Pills */}
        <div className="flex items-center gap-2 bg-cream-100 dark:bg-espresso-800 p-1 rounded-2xl border border-cream-200 dark:border-espresso-700">
          {areas.map((area) => (
            <button
              key={area}
              onClick={() => {
                playSound("click");
                setActiveArea(area);
                setSelectedTable(null);
              }}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeArea === area
                  ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                  : "text-espresso-700 dark:text-cream-200 hover:text-espresso-950"
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {showSuccessToast && (
        <div className="p-3 rounded-xl bg-sage-light text-sage-dark border border-sage/40 text-xs font-bold flex items-center gap-2 animate-drop-in">
          <CheckCircle2 className="w-4 h-4 text-sage" />
          <span>{showSuccessToast}</span>
        </div>
      )}

      {/* Main Floor Canvas */}
      <div className="flex-1 min-h-[500px] bg-cream-50 dark:bg-espresso-900/60 rounded-café border-2 border-dashed border-cream-300 dark:border-espresso-700 p-6 relative overflow-hidden shadow-inner">
        {/* Floor Canvas Grid Background */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
          {visibleTables.map((table) => {
            const isSelected = selectedTable?.id === table.id;
            return (
              <div
                key={table.id}
                onClick={() => {
                  playSound("click");
                  setSelectedTable(table);
                }}
                className={`p-5 rounded-3xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between min-h-[170px] shadow-card hover:shadow-floating active:scale-98 ${
                  isSelected
                    ? "border-vintage-orange ring-4 ring-vintage-orange/20 scale-102"
                    : table.is_occupied
                    ? "bg-amber-50/90 dark:bg-amber-950/40 border-mustard/60"
                    : "bg-white dark:bg-espresso-800 border-cream-200 dark:border-espresso-700 hover:border-vintage-orange/50"
                }`}
              >
                {/* Table Header */}
                <div className="flex items-center justify-between">
                  <span className="font-serif font-black text-xl text-espresso-900 dark:text-cream-100">
                    {table.table_number}
                  </span>
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cream-100 dark:bg-espresso-700 text-xs font-bold text-espresso-700 dark:text-cream-300">
                    <Users className="w-3.5 h-3.5" />
                    <span>{table.capacity}p</span>
                  </div>
                </div>

                {/* Status Indicator */}
                <div className="my-2">
                  {table.is_occupied ? (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs font-bold text-amber-800 dark:text-amber-300">
                        <Clock className="w-3.5 h-3.5" />
                        <span>Occupied · {table.occupied_minutes || 15}m</span>
                      </div>
                      <div className="text-sm font-extrabold text-vintage-orange">
                        {formatCurrency(table.order_total || 1450)}
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 text-xs font-bold text-sage">
                      <span className="w-2 h-2 rounded-full bg-sage" />
                      <span>Available</span>
                    </div>
                  )}
                </div>

                {/* Waiter badge */}
                <div className="text-[11px] text-espresso-700/60 dark:text-cream-300/60 font-medium">
                  Waiter: {table.waiter_name || "Usman (Floor)"}
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Table Drawer Action Bar */}
        {selectedTable && (
          <div className="absolute bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 p-4 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-floating animate-drop-in flex flex-col gap-3">
            <div className="flex items-center justify-between border-b border-cream-200 dark:border-espresso-700 pb-2">
              <div>
                <h4 className="font-serif font-bold text-base">
                  Selected: {selectedTable.table_number} ({selectedTable.area})
                </h4>
                <p className="text-xs text-espresso-700/60">
                  Capacity: {selectedTable.capacity} guests
                </p>
              </div>
              <button
                onClick={() => setSelectedTable(null)}
                className="text-xs text-espresso-700 hover:text-espresso-900 font-bold"
              >
                ✕
              </button>
            </div>

            {selectedTable.is_occupied ? (
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-espresso-700">Open Ticket:</span>
                  <span className="font-bold text-vintage-orange">
                    {formatCurrency(selectedTable.order_total || 1450)}
                  </span>
                </div>

                {/* Transfer Table Selector */}
                {isTransferring ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold block">Transfer to Table:</label>
                    <select
                      value={transferTargetId}
                      onChange={(e) => setTransferTargetId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 text-xs font-bold"
                    >
                      <option value="">Select Target Table</option>
                      {tables
                        .filter((t) => t.id !== selectedTable.id && !t.is_occupied)
                        .map((t) => (
                          <option key={t.id} value={t.id}>
                            {t.table_number} ({t.area} · {t.capacity}p)
                          </option>
                        ))}
                    </select>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsTransferring(false)}
                        className="flex-1 py-1.5 rounded-xl bg-cream-200 text-xs font-semibold"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleTransferTable}
                        disabled={!transferTargetId}
                        className="flex-1 py-1.5 rounded-xl bg-vintage-orange text-white text-xs font-bold disabled:opacity-50"
                      >
                        Confirm Transfer
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setIsTransferring(true)}
                      className="py-2.5 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-vintage-orange" />
                      <span>Transfer Table</span>
                    </button>
                    <button
                      onClick={() => handleMarkVacated(selectedTable)}
                      className="py-2.5 rounded-xl bg-sage-light hover:bg-sage/20 border border-sage/40 text-sage-dark text-xs font-bold flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-sage" />
                      <span>Mark Vacated</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-xs text-espresso-700/70">
                Table is currently vacant and clean. Open POS register to seat guests.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
