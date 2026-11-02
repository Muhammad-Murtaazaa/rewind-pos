"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/db/dexie";
import { type StockItemDef, type RecipeDef, type WastageDef } from "@/lib/data/sample-inventory";
import { formatCurrency } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import { calculateFoodCostPercentage } from "@/lib/inventory/recipe-deducer";
import {
  Boxes,
  Layers,
  ClipboardList,
  Trash2,
  AlertTriangle,
  Plus,
  CheckCircle2,
  Percent,
  Search,
  Scale,
  X,
  FileSpreadsheet,
} from "lucide-react";

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<"ITEMS" | "RECIPES" | "COUNTS" | "WASTAGE">("ITEMS");
  const [stockItems, setStockItems] = useState<StockItemDef[]>([]);
  const [recipes, setRecipes] = useState<RecipeDef[]>([]);
  const [wastageList, setWastageList] = useState<WastageDef[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showWastageModal, setShowWastageModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Stock Item Form State
  const [newItemName, setNewItemName] = useState("");
  const [newItemCategory, setNewItemCategory] = useState<StockItemDef["category"]>("COFFEE");
  const [newItemUnit, setNewItemUnit] = useState("kg");
  const [newItemQty, setNewItemQty] = useState(10);
  const [newItemMinQty, setNewItemMinQty] = useState(5);
  const [newItemCost, setNewItemCost] = useState(1500);

  // Wastage Form State
  const [wasteItemId, setWasteItemId] = useState("");
  const [wasteQty, setWasteQty] = useState(1);
  const [wasteReason, setWasteReason] = useState<WastageDef["reason"]>("SPILLED_DROPPED");
  const [wasteNotes, setWasteNotes] = useState("");

  // Stock Count State
  const [countInputs, setCountInputs] = useState<Record<string, number>>({});
  const [countVarianceResult, setCountVarianceResult] = useState<any[] | null>(null);

  const { playSound } = useUiStore();
  const { currentUser } = useAuthStore();

  const loadData = async () => {
    const items = await db.stockItems.toArray();
    const recs = await db.recipes.toArray();
    const wastes = await db.wastageRecords.toArray();
    setStockItems(items);
    setRecipes(recs);
    setWastageList(wastes);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredStock = stockItems.filter(
    (item) =>
      !searchQuery ||
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowStockCount = stockItems.filter((i) => i.current_qty <= i.min_reorder_qty).length;

  const handleAddStockItem = async () => {
    if (!newItemName) return;
    playSound("click");

    const item: StockItemDef = {
      id: `stk-${Date.now()}`,
      name: newItemName,
      category: newItemCategory,
      unit: newItemUnit,
      current_qty: newItemQty,
      min_reorder_qty: newItemMinQty,
      avg_unit_cost: newItemCost,
    };

    await db.stockItems.add(item);
    await loadData();
    setShowAddItemModal(false);
    setNewItemName("");
    setToastMsg(`Added stock item: ${item.name}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleLogWastage = async () => {
    const item = stockItems.find((i) => i.id === wasteItemId);
    if (!item) return;
    playSound("click");

    const costVal = wasteQty * item.avg_unit_cost;
    const wasteRecord: WastageDef = {
      id: `waste-${Date.now()}`,
      stock_item_id: item.id,
      stock_item_name: item.name,
      quantity: wasteQty,
      unit: item.unit,
      cost_value: costVal,
      reason: wasteReason,
      notes: wasteNotes,
      recorded_by: currentUser?.name || "Ali Raza",
      created_at: new Date().toISOString(),
    };

    await db.wastageRecords.add(wasteRecord);
    // Deduct from current inventory
    await db.stockItems.update(item.id, {
      current_qty: item.current_qty - wasteQty,
    });

    await loadData();
    setShowWastageModal(false);
    setToastMsg(`Logged wastage: ${wasteQty} ${item.unit} ${item.name}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCompleteStockCount = () => {
    playSound("bell");
    const variances = stockItems.map((item) => {
      const counted = countInputs[item.id] !== undefined ? countInputs[item.id] : item.current_qty;
      const diff = counted - item.current_qty;
      const costVariance = diff * item.avg_unit_cost;
      return {
        ...item,
        counted_qty: counted,
        diff,
        costVariance,
      };
    });
    setCountVarianceResult(variances);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full space-y-5">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cream-200 dark:border-espresso-700">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-vintage-orange text-white flex items-center justify-center text-sm shadow-card">
              📦
            </span>
            <span>Inventory, Recipes & Wastage</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
            Raw materials tracking, recipes bill-of-materials, spot counts, and wastage
          </p>
        </div>

        {/* Tab Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-cream-100 dark:bg-espresso-800 p-1 rounded-2xl border border-cream-200 dark:border-espresso-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab("ITEMS")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "ITEMS"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Stock Items</span>
            {lowStockCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-brick text-white text-[10px]">
                {lowStockCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("RECIPES")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "RECIPES"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Recipes (BOM)</span>
          </button>

          <button
            onClick={() => setActiveTab("COUNTS")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "COUNTS"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Stock Count</span>
          </button>

          <button
            onClick={() => setActiveTab("WASTAGE")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "WASTAGE"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Wastage</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-xl bg-sage-light text-sage-dark border border-sage/40 text-xs font-bold flex items-center gap-2 animate-drop-in">
          <CheckCircle2 className="w-4 h-4 text-sage" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TAB 1: STOCK ITEMS */}
      {activeTab === "ITEMS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-espresso-700/40" />
              <input
                type="text"
                placeholder="Search raw material, dairy, beans…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-xs focus:outline-none focus:border-vintage-orange"
              />
            </div>

            <button
              onClick={() => setShowAddItemModal(true)}
              className="px-4 py-2 rounded-2xl bg-vintage-orange hover:bg-vintage-orange-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Stock Item</span>
            </button>
          </div>

          {/* Items Table */}
          <div className="bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200 dark:border-espresso-700 overflow-hidden shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 dark:bg-espresso-900 border-b border-cream-200 dark:border-espresso-700 font-bold text-espresso-700 dark:text-cream-300">
                  <tr>
                    <th className="p-3.5">Raw Material</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Current Stock</th>
                    <th className="p-3.5">Reorder Level</th>
                    <th className="p-3.5">Unit Cost</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100 dark:divide-espresso-700">
                  {filteredStock.map((item) => {
                    const isLow = item.current_qty <= item.min_reorder_qty;
                    return (
                      <tr key={item.id} className="hover:bg-cream-50/60 dark:hover:bg-espresso-700/50">
                        <td className="p-3.5 font-bold text-espresso-900 dark:text-cream-100">
                          {item.name}
                        </td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-full bg-cream-100 dark:bg-espresso-700 font-semibold text-[10px]">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-sm">
                          {item.current_qty} {item.unit}
                        </td>
                        <td className="p-3.5 text-espresso-700/70">
                          {item.min_reorder_qty} {item.unit}
                        </td>
                        <td className="p-3.5 font-semibold">
                          {formatCurrency(item.avg_unit_cost)} / {item.unit}
                        </td>
                        <td className="p-3.5">
                          {isLow ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-brick-light text-brick font-bold text-[10px] animate-pulse">
                              <AlertTriangle className="w-3 h-3" /> Low Stock
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-sage-light text-sage-dark font-semibold text-[10px]">
                              Healthy
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: RECIPES & BILL OF MATERIALS */}
      {activeTab === "RECIPES" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recipes.map((rec) => {
            const totalIngredientCost = rec.lines.reduce(
              (sum, l) => sum + l.quantity * l.unit_cost,
              0
            );
            // Example base selling price (approx 680 PKR for drinks)
            const sellingPrice = 680;
            const foodCostPct = calculateFoodCostPercentage(totalIngredientCost, sellingPrice);

            return (
              <div
                key={rec.id}
                className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-serif font-bold text-base text-espresso-900 dark:text-cream-100">
                      {rec.item_name}
                    </h4>
                    {rec.variant_name && (
                      <span className="text-xs text-vintage-orange font-semibold">
                        {rec.variant_name}
                      </span>
                    )}
                  </div>

                  {/* Food Cost % Badge */}
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-espresso-700/60 block">
                      Food Cost %
                    </span>
                    <span
                      className={`font-mono font-black text-sm px-2 py-0.5 rounded-lg ${
                        foodCostPct <= 28
                          ? "bg-sage-light text-sage-dark"
                          : foodCostPct <= 35
                          ? "bg-amber-100 text-amber-900"
                          : "bg-brick-light text-brick"
                      }`}
                    >
                      {foodCostPct}%
                    </span>
                  </div>
                </div>

                {/* Recipe Lines */}
                <div className="divide-y divide-cream-100 dark:divide-espresso-700 text-xs">
                  {rec.lines.map((l, idx) => (
                    <div key={idx} className="py-1.5 flex justify-between items-center">
                      <span className="text-espresso-800 dark:text-cream-200 font-medium">
                        {l.stock_item_name}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-espresso-700/80">
                          {l.quantity} {l.unit}
                        </span>
                        <span className="font-semibold text-espresso-900 dark:text-cream-100">
                          {formatCurrency(l.quantity * l.unit_cost)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-cream-200 dark:border-espresso-700 flex justify-between items-center text-xs font-bold">
                  <span>Total Recipe Cost:</span>
                  <span className="text-sm font-mono text-vintage-orange">
                    {formatCurrency(totalIngredientCost)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: STOCK COUNTS & VARIANCE */}
      {activeTab === "COUNTS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg">Spot & Full Inventory Count</h3>
              <p className="text-xs text-espresso-700/60">
                Count physical items on shelf to reconcile system ledger vs actual
              </p>
            </div>
            <button
              onClick={handleCompleteStockCount}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-vintage-orange to-amber-600 text-white font-bold text-xs shadow-md"
            >
              Reconcile & Calculate Variance
            </button>
          </div>

          <div className="bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200 dark:border-espresso-700 overflow-hidden shadow-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 dark:bg-espresso-900 border-b border-cream-200 font-bold">
                <tr>
                  <th className="p-3.5">Raw Material</th>
                  <th className="p-3.5">System Expected</th>
                  <th className="p-3.5">Actual Counted</th>
                  <th className="p-3.5">Unit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100 dark:divide-espresso-700">
                {stockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-cream-50/50">
                    <td className="p-3.5 font-bold text-espresso-900 dark:text-cream-100">
                      {item.name}
                    </td>
                    <td className="p-3.5 font-mono font-semibold">
                      {item.current_qty}
                    </td>
                    <td className="p-3.5">
                      <input
                        type="number"
                        placeholder={String(item.current_qty)}
                        value={countInputs[item.id] !== undefined ? countInputs[item.id] : ""}
                        onChange={(e) =>
                          setCountInputs({
                            ...countInputs,
                            [item.id]: parseFloat(e.target.value) || 0,
                          })
                        }
                        className="w-24 px-2 py-1 rounded-lg border border-cream-300 font-bold text-xs"
                      />
                    </td>
                    <td className="p-3.5 text-espresso-700/70">{item.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Variance Results Callout */}
          {countVarianceResult && (
            <div className="p-5 rounded-3xl bg-cream-50 dark:bg-espresso-900 border-2 border-vintage-orange/50 space-y-3 animate-drop-in">
              <h4 className="font-serif font-bold text-base text-espresso-900 dark:text-cream-100 flex items-center gap-2">
                <Scale className="w-4 h-4 text-vintage-orange" />
                <span>Stock Variance Report</span>
              </h4>
              <div className="divide-y divide-cream-200 dark:divide-espresso-700 text-xs">
                {countVarianceResult.map((v) => (
                  <div key={v.id} className="py-2 flex justify-between items-center">
                    <span className="font-semibold">{v.name}</span>
                    <div className="flex items-center gap-4">
                      <span>
                        Diff:{" "}
                        <strong className={v.diff < 0 ? "text-brick" : v.diff > 0 ? "text-mustard" : "text-sage"}>
                          {v.diff > 0 ? `+${v.diff}` : v.diff} {v.unit}
                        </strong>
                      </span>
                      <span className="font-mono font-bold">
                        {formatCurrency(v.costVariance)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: WASTAGE LOGGER */}
      {activeTab === "WASTAGE" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif font-bold text-lg">Wastage & Spillage Log</h3>
              <p className="text-xs text-espresso-700/60">
                Audit burnt shots, dropped pastries, and expired dairy
              </p>
            </div>
            <button
              onClick={() => setShowWastageModal(true)}
              className="px-4 py-2 rounded-2xl bg-brick hover:bg-brick-dark text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Wastage Event</span>
            </button>
          </div>

          {wastageList.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200">
              <CheckCircle2 className="w-10 h-10 text-sage mx-auto mb-2" />
              <h4 className="font-serif font-bold text-base">No wastage recorded</h4>
              <p className="text-xs text-espresso-700/60">
                Log spills or kitchen mistakes to keep stock counts precise.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200 overflow-hidden shadow-card">
              <table className="w-full text-left text-xs">
                <thead className="bg-cream-100 dark:bg-espresso-900 border-b font-bold">
                  <tr>
                    <th className="p-3.5">Stock Item</th>
                    <th className="p-3.5">Quantity</th>
                    <th className="p-3.5">Cost Value</th>
                    <th className="p-3.5">Reason</th>
                    <th className="p-3.5">Recorded By</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {wastageList.map((w) => (
                    <tr key={w.id} className="hover:bg-cream-50/50">
                      <td className="p-3.5 font-bold">{w.stock_item_name}</td>
                      <td className="p-3.5 font-mono">
                        {w.quantity} {w.unit}
                      </td>
                      <td className="p-3.5 font-bold text-brick">
                        {formatCurrency(w.cost_value)}
                      </td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 rounded-full bg-brick-light text-brick font-semibold text-[10px]">
                          {w.reason.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3.5 text-espresso-700/70">{w.recorded_by}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Add Stock Item Modal */}
      {showAddItemModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-cream-50 dark:bg-surface-dark border border-cream-200 rounded-café p-6 shadow-floating space-y-4">
            <h3 className="font-serif font-bold text-lg">Add Raw Material</h3>

            <div>
              <label className="text-xs font-bold block mb-1">Item Name</label>
              <input
                type="text"
                placeholder="e.g. Colombian Supremo Beans"
                value={newItemName}
                onChange={(e) => setNewItemName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold block mb-1">Category</label>
                <select
                  value={newItemCategory}
                  onChange={(e) => setNewItemCategory(e.target.value as any)}
                  className="w-full px-2 py-2 rounded-xl bg-white border border-cream-300 text-xs"
                >
                  <option value="COFFEE">Coffee</option>
                  <option value="DAIRY">Dairy</option>
                  <option value="SYRUPS">Syrups</option>
                  <option value="BAKERY_RAW">Bakery</option>
                  <option value="PROTEIN">Protein</option>
                  <option value="PACKAGING">Packaging</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold block mb-1">Unit</label>
                <select
                  value={newItemUnit}
                  onChange={(e) => setNewItemUnit(e.target.value)}
                  className="w-full px-2 py-2 rounded-xl bg-white border border-cream-300 text-xs"
                >
                  <option value="kg">kg (Kilogram)</option>
                  <option value="L">L (Liter)</option>
                  <option value="pcs">pcs (Pieces)</option>
                  <option value="packs">packs (Packs)</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="text-[10px] font-bold block mb-1">Current Qty</label>
                <input
                  type="number"
                  value={newItemQty}
                  onChange={(e) => setNewItemQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold block mb-1">Min Alert Qty</label>
                <input
                  type="number"
                  value={newItemMinQty}
                  onChange={(e) => setNewItemMinQty(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold block mb-1">Cost (PKR)</label>
                <input
                  type="number"
                  value={newItemCost}
                  onChange={(e) => setNewItemCost(parseFloat(e.target.value) || 0)}
                  className="w-full px-2 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddItemModal(false)}
                className="flex-1 py-2 rounded-xl bg-cream-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddStockItem}
                className="flex-1 py-2 rounded-xl bg-vintage-orange text-white text-xs font-bold shadow-md"
              >
                Save Item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Wastage Modal */}
      {showWastageModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-cream-50 dark:bg-surface-dark border border-cream-200 rounded-café p-6 shadow-floating space-y-4">
            <h3 className="font-serif font-bold text-lg">Log Wastage / Spoilage</h3>

            <div>
              <label className="text-xs font-bold block mb-1">Select Ingredient</label>
              <select
                value={wasteItemId}
                onChange={(e) => setWasteItemId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold"
              >
                <option value="">Select ingredient</option>
                {stockItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.current_qty} {item.unit} available)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Quantity Wasted</label>
              <input
                type="number"
                value={wasteQty}
                onChange={(e) => setWasteQty(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Reason</label>
              <select
                value={wasteReason}
                onChange={(e) => setWasteReason(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs"
              >
                <option value="SPILLED_DROPPED">Spilled / Dropped</option>
                <option value="EXPIRED_SPOILED">Expired / Spoiled</option>
                <option value="BURNT_PREP_ERROR">Burnt / Preparation Error</option>
                <option value="STAFF_TASTING">Staff Quality Tasting</option>
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowWastageModal(false)}
                className="flex-1 py-2 rounded-xl bg-cream-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleLogWastage}
                disabled={!wasteItemId}
                className="flex-1 py-2 rounded-xl bg-brick text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                Record Wastage
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
