"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/db/dexie";
import { type ExpenseDef } from "@/lib/data/sample-inventory";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import {
  DollarSign,
  Receipt,
  Plus,
  CheckCircle2,
  Calendar,
  Building,
  Zap,
  Wrench,
  Sparkles,
  ShoppingBag,
  Camera,
} from "lucide-react";

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<ExpenseDef[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Form State
  const [category, setCategory] = useState<ExpenseDef["category"]>("UTILITIES");
  const [amount, setAmount] = useState<number>(3500);
  const [paidBy, setPaidBy] = useState<"CASH" | "BANK">("CASH");
  const [description, setDescription] = useState<string>("Water dispenser 5-gallon bottles");
  const [isRecurring, setIsRecurring] = useState<boolean>(false);

  const { playSound } = useUiStore();

  const loadExpenses = async () => {
    const list = await db.expenses.toArray();
    setExpenses(list);
  };

  useEffect(() => {
    loadExpenses();
  }, []);

  const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0);

  const handleAddExpense = async () => {
    if (!description || amount <= 0) return;
    playSound("click");

    const newExp: ExpenseDef = {
      id: `exp-${Date.now()}`,
      category,
      amount,
      paid_by: paidBy,
      description,
      is_recurring: isRecurring,
      created_at: new Date().toISOString(),
    };

    await db.expenses.add(newExp);
    await loadExpenses();
    setShowAddModal(false);
    setDescription("");
    setToastMsg(`Logged expense: ${formatCurrency(amount)} (${category})`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const getCategoryIcon = (cat: ExpenseDef["category"]) => {
    switch (cat) {
      case "RENT":
        return <Building className="w-4 h-4 text-vintage-orange" />;
      case "UTILITIES":
        return <Zap className="w-4 h-4 text-mustard" />;
      case "MAINTENANCE":
        return <Wrench className="w-4 h-4 text-brick" />;
      case "CLEANING":
        return <Sparkles className="w-4 h-4 text-sage" />;
      default:
        return <ShoppingBag className="w-4 h-4 text-espresso-700" />;
    }
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-5xl mx-auto w-full space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cream-200 dark:border-espresso-700">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-brick text-white flex items-center justify-center text-sm shadow-card">
              🧾
            </span>
            <span>Petty Cash & Operating Expenses</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
            Track daily café overheads, recurring utilities, and camera receipts
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-2xl bg-vintage-orange hover:bg-vintage-orange-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-xl bg-sage-light text-sage-dark border border-sage/40 text-xs font-bold flex items-center gap-2 animate-drop-in">
          <CheckCircle2 className="w-4 h-4 text-sage" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Summary KPI Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex items-center justify-between">
        <div>
          <span className="text-xs font-bold text-espresso-700/60 dark:text-cream-300/60">
            Total Logged Expenses (This Month)
          </span>
          <h3 className="font-serif font-black text-3xl text-espresso-900 dark:text-cream-100 mt-1">
            {formatCurrency(totalExpense)}
          </h3>
        </div>
        <div className="flex gap-4 text-xs font-semibold">
          <div>
            <span className="text-espresso-700/60 block">Cash Drawer:</span>
            <span className="font-bold">
              {formatCurrency(
                expenses.filter((e) => e.paid_by === "CASH").reduce((sum, e) => sum + e.amount, 0)
              )}
            </span>
          </div>
          <div>
            <span className="text-espresso-700/60 block">Bank Transfer:</span>
            <span className="font-bold">
              {formatCurrency(
                expenses.filter((e) => e.paid_by === "BANK").reduce((sum, e) => sum + e.amount, 0)
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200 dark:border-espresso-700 overflow-hidden shadow-card">
        <table className="w-full text-left text-xs">
          <thead className="bg-cream-100 dark:bg-espresso-900 border-b font-bold">
            <tr>
              <th className="p-3.5">Category</th>
              <th className="p-3.5">Description</th>
              <th className="p-3.5">Paid Via</th>
              <th className="p-3.5">Amount</th>
              <th className="p-3.5">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cream-100 dark:divide-espresso-700">
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-cream-50/50">
                <td className="p-3.5 flex items-center gap-2 font-bold">
                  {getCategoryIcon(exp.category)}
                  <span>{exp.category}</span>
                  {exp.is_recurring && (
                    <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-cream-200 text-espresso-700 font-bold">
                      Recurring
                    </span>
                  )}
                </td>
                <td className="p-3.5 font-medium">{exp.description}</td>
                <td className="p-3.5">
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      exp.paid_by === "CASH"
                        ? "bg-amber-100 text-amber-900"
                        : "bg-blue-100 text-blue-900"
                    }`}
                  >
                    {exp.paid_by}
                  </span>
                </td>
                <td className="p-3.5 font-mono font-bold text-sm text-brick">
                  {formatCurrency(exp.amount)}
                </td>
                <td className="p-3.5 text-espresso-700/70">{formatDate(exp.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-cream-50 dark:bg-surface-dark border border-cream-200 rounded-café p-6 shadow-floating space-y-4">
            <h3 className="font-serif font-bold text-lg">Record Operational Expense</h3>

            <div>
              <label className="text-xs font-bold block mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold"
              >
                <option value="UTILITIES">Utilities (Electricity, Water, Gas)</option>
                <option value="RENT">Rent & Property</option>
                <option value="MAINTENANCE">Equipment Repairs & Filter</option>
                <option value="CLEANING">Cleaning & Chemical Supplies</option>
                <option value="PACKAGING">Packaging & Bags</option>
                <option value="STAFF_PETTY">Staff Meal / Petty Cash</option>
              </select>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Amount (PKR)</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-sm font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Paid From</label>
              <div className="grid grid-cols-2 gap-2 bg-cream-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPaidBy("CASH")}
                  className={`py-1.5 rounded-lg text-xs font-bold ${
                    paidBy === "CASH" ? "bg-white text-vintage-orange shadow-sm" : "text-espresso-700"
                  }`}
                >
                  Cash in Drawer
                </button>
                <button
                  type="button"
                  onClick={() => setPaidBy("BANK")}
                  className={`py-1.5 rounded-lg text-xs font-bold ${
                    paidBy === "BANK" ? "bg-white text-vintage-orange shadow-sm" : "text-espresso-700"
                  }`}
                >
                  Bank Transfer
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Description</label>
              <input
                type="text"
                placeholder="e.g. Milk run, Filter replacement…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-cream-300 text-xs"
              />
            </div>

            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={isRecurring}
                onChange={(e) => setIsRecurring(e.target.checked)}
                className="rounded border-cream-300"
              />
              <span>Monthly Recurring Expense (e.g. Rent, Internet)</span>
            </label>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2 rounded-xl bg-cream-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddExpense}
                className="flex-1 py-2 rounded-xl bg-vintage-orange text-white text-xs font-bold shadow-md"
              >
                Save Expense
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
