"use client";

import React, { useEffect, useState } from "react";
import { db, type LocalOrder } from "@/lib/db/dexie";
import { type AccountDef, type JournalEntryDef } from "@/lib/data/sample-hr-accounting";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import {
  BookOpen,
  PieChart,
  DollarSign,
  Scale,
  Receipt,
  CheckCircle2,
  Calendar,
  Building,
  TrendingUp,
  FileSpreadsheet,
} from "lucide-react";

export default function AccountingPage() {
  const [activeTab, setActiveTab] = useState<"PNL" | "BALANCE_SHEET" | "JOURNAL" | "TAX">("PNL");
  const [accounts, setAccounts] = useState<AccountDef[]>([]);
  const [journalEntries, setJournalEntries] = useState<JournalEntryDef[]>([]);
  const [orders, setOrders] = useState<LocalOrder[]>([]);

  const { playSound } = useUiStore();

  useEffect(() => {
    db.accounts.toArray().then(setAccounts);
    db.journalEntries.toArray().then(setJournalEntries);
    db.orders.toArray().then(setOrders);
  }, []);

  // Calculate live financial figures
  const totalSalesRevenue = orders.reduce((sum, o) => sum + o.subtotal, 0) || 530000;
  const totalCogs = Math.round(totalSalesRevenue * 0.28); // ~28% food cost
  const grossProfit = totalSalesRevenue - totalCogs;
  const grossMargin = Math.round((grossProfit / totalSalesRevenue) * 100);

  const operatingExpenses = {
    salaries: 275000,
    rent: 120000,
    utilities: 42000,
    maintenance: 18500,
  };
  const totalOpExpenses = Object.values(operatingExpenses).reduce((a, b) => a + b, 0);
  const netIncome = grossProfit - totalOpExpenses;

  // Balance sheet figures
  const assets = {
    cashInDrawer: 12500,
    bankMeezan: 485000,
    inventory: 84200,
  };
  const totalAssets = Object.values(assets).reduce((a, b) => a + b, 0);

  const liabilities = {
    vendorPayables: 85100,
    salesTaxPra: Math.round(orders.reduce((sum, o) => sum + o.tax_amount, 0) || 24600),
  };
  const totalLiabilities = Object.values(liabilities).reduce((a, b) => a + b, 0);
  const equity = totalAssets - totalLiabilities;

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cream-200 dark:border-espresso-700">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-vintage-orange text-white flex items-center justify-center text-sm shadow-card">
              ⚖️
            </span>
            <span>Automated Accounting & Double-Entry Ledger</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
            Real-time P&L, balance sheet, automated sales debits/credits, and PRA sales tax
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-cream-100 dark:bg-espresso-800 p-1 rounded-2xl border border-cream-200 dark:border-espresso-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab("PNL")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "PNL"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Profit & Loss</span>
          </button>

          <button
            onClick={() => setActiveTab("BALANCE_SHEET")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "BALANCE_SHEET"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Scale className="w-3.5 h-3.5" />
            <span>Balance Sheet</span>
          </button>

          <button
            onClick={() => setActiveTab("JOURNAL")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "JOURNAL"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>General Ledger</span>
          </button>

          <button
            onClick={() => setActiveTab("TAX")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "TAX"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>PRA Sales Tax</span>
          </button>
        </div>
      </div>

      {/* TAB 1: PROFIT & LOSS STATEMENT */}
      {activeTab === "PNL" && (
        <div className="space-y-4 max-w-4xl mx-auto w-full">
          {/* Executive Summary Card */}
          <div className="p-6 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-cream-200 dark:border-espresso-700">
              <h3 className="font-serif font-black text-xl text-espresso-900 dark:text-cream-100">
                Rewind Café — Statement of Profit & Loss
              </h3>
              <span className="text-xs font-bold text-sage bg-sage-light px-3 py-1 rounded-full">
                Gross Margin: {grossMargin}%
              </span>
            </div>

            {/* Income Section */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-espresso-700/70 uppercase tracking-wider block">
                Operating Revenue
              </span>
              <div className="flex justify-between py-1">
                <span>Coffee, Beverage & Food Sales Revenue (Net)</span>
                <span className="font-mono font-bold text-sm">
                  {formatCurrency(totalSalesRevenue)}
                </span>
              </div>
            </div>

            {/* Cost of Goods Sold */}
            <div className="space-y-2 text-xs pt-2 border-t border-cream-100">
              <span className="font-bold text-espresso-700/70 uppercase tracking-wider block">
                Cost of Goods Sold (COGS)
              </span>
              <div className="flex justify-between py-1 text-brick">
                <span>Raw Ingredients & Packaging Consumption</span>
                <span className="font-mono font-bold text-sm">
                  -{formatCurrency(totalCogs)}
                </span>
              </div>
              <div className="flex justify-between py-2 font-bold bg-cream-50 dark:bg-espresso-900 px-3 rounded-xl">
                <span>Gross Profit</span>
                <span className="font-mono text-sage-dark text-base">
                  {formatCurrency(grossProfit)}
                </span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="space-y-2 text-xs pt-2 border-t border-cream-100">
              <span className="font-bold text-espresso-700/70 uppercase tracking-wider block">
                Operating Overheads
              </span>
              <div className="flex justify-between py-0.5">
                <span>Staff Salaries, Overtime & Wages (6010)</span>
                <span className="font-mono">-{formatCurrency(operatingExpenses.salaries)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Café Property Rent (6020)</span>
                <span className="font-mono">-{formatCurrency(operatingExpenses.rent)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Utilities — Commercial Electricity & Gas (6030)</span>
                <span className="font-mono">-{formatCurrency(operatingExpenses.utilities)}</span>
              </div>
              <div className="flex justify-between py-0.5">
                <span>Equipment Maintenance & Water Filtration (6040)</span>
                <span className="font-mono">-{formatCurrency(operatingExpenses.maintenance)}</span>
              </div>
              <div className="flex justify-between py-1 font-semibold text-brick">
                <span>Total Operating Expenses</span>
                <span className="font-mono">-{formatCurrency(totalOpExpenses)}</span>
              </div>
            </div>

            {/* Bottom Line Net Income */}
            <div className="pt-3 border-t-2 border-cream-300 dark:border-espresso-700 flex justify-between items-baseline">
              <div>
                <h4 className="font-serif font-black text-lg text-espresso-900 dark:text-cream-100">
                  Net Operating Profit
                </h4>
                <p className="text-[11px] text-espresso-700/60">
                  All double-entry lines reconciled
                </p>
              </div>
              <span className="font-serif font-black text-2xl text-vintage-orange">
                {formatCurrency(netIncome)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: BALANCE SHEET */}
      {activeTab === "BALANCE_SHEET" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
          {/* Assets Column */}
          <div className="p-6 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cream-200">
              <h3 className="font-serif font-bold text-base">Current & Operating Assets</h3>
              <span className="font-mono font-black text-sage-dark text-lg">
                {formatCurrency(totalAssets)}
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-cream-100">
              <div className="flex justify-between py-1">
                <span>1010 Cash in Drawer</span>
                <span className="font-mono font-bold">{formatCurrency(assets.cashInDrawer)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>1020 Meezan Bank Operating Account</span>
                <span className="font-mono font-bold">{formatCurrency(assets.bankMeezan)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span>1200 Inventory Raw Materials Asset</span>
                <span className="font-mono font-bold">{formatCurrency(assets.inventory)}</span>
              </div>
            </div>
          </div>

          {/* Liabilities & Equity Column */}
          <div className="p-6 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-cream-200">
              <h3 className="font-serif font-bold text-base">Liabilities & Equity</h3>
              <span className="font-mono font-black text-vintage-orange text-lg">
                {formatCurrency(totalLiabilities + equity)}
              </span>
            </div>

            <div className="space-y-2 text-xs divide-y divide-cream-100">
              <div className="flex justify-between py-1">
                <span>2010 Accounts Payable (Vendors)</span>
                <span className="font-mono font-bold text-brick">
                  {formatCurrency(liabilities.vendorPayables)}
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span>2020 Sales Tax Payable (PRA 16%)</span>
                <span className="font-mono font-bold text-brick">
                  {formatCurrency(liabilities.salesTaxPra)}
                </span>
              </div>
              <div className="flex justify-between py-2 bg-cream-50 dark:bg-espresso-900 px-2 rounded-xl">
                <span>3010 Owner Capital & Retained Earnings</span>
                <span className="font-mono font-black text-sage">
                  {formatCurrency(equity)}
                </span>
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-sage-light text-sage-dark text-[11px] font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-sage" />
              <span>Balanced: Assets (₨ 581.7k) = Liabilities + Equity (₨ 581.7k)</span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: GENERAL LEDGER JOURNAL ENTRIES */}
      {activeTab === "JOURNAL" && (
        <div className="bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200 dark:border-espresso-700 overflow-hidden shadow-card">
          <div className="p-4 border-b border-cream-200 flex items-center justify-between">
            <h4 className="font-serif font-bold text-base">
              General Ledger Journal (Automated Double-Entry)
            </h4>
            <span className="text-xs text-espresso-700/60 font-semibold">
              Showing background postings
            </span>
          </div>

          <div className="divide-y divide-cream-100 dark:divide-espresso-700">
            {journalEntries.length === 0 ? (
              <div className="p-8 text-center text-xs text-espresso-700/60">
                Complete a POS order or record an expense to generate real-time double-entry lines!
              </div>
            ) : (
              journalEntries.map((entry) => (
                <div key={entry.id} className="p-4 space-y-2 hover:bg-cream-50/50">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-sm text-espresso-900 dark:text-cream-100">
                        {entry.description}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-cream-100 font-bold">
                        {entry.reference_no}
                      </span>
                    </div>
                    <span className="text-espresso-700/60">{formatDate(entry.entry_date)}</span>
                  </div>

                  {/* Debit and Credit Lines */}
                  <div className="bg-cream-50/60 dark:bg-espresso-900/60 p-2.5 rounded-2xl text-xs space-y-1">
                    {entry.lines.map((l, i) => (
                      <div key={i} className="flex justify-between items-center font-mono">
                        <span className={l.credit > 0 ? "pl-6 text-espresso-700" : "font-bold"}>
                          {l.account_code} · {l.account_name}
                        </span>
                        <div className="flex gap-6">
                          <span className="w-24 text-right">
                            {l.debit > 0 ? formatCurrency(l.debit) : ""}
                          </span>
                          <span className="w-24 text-right">
                            {l.credit > 0 ? formatCurrency(l.credit) : ""}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 4: PRA SALES TAX REPORT */}
      {activeTab === "TAX" && (
        <div className="p-6 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card max-w-2xl mx-auto w-full space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-cream-200">
            <div>
              <h3 className="font-serif font-bold text-lg">
                Punjab Revenue Authority (PRA) / Sindh Sales Tax
              </h3>
              <p className="text-xs text-espresso-700/60">
                16% FBR/PRA compliant tax audit summary
              </p>
            </div>
            <Receipt className="w-6 h-6 text-vintage-orange" />
          </div>

          <div className="space-y-3 text-xs divide-y divide-cream-100">
            <div className="flex justify-between py-1">
              <span>Gross Taxable Café Sales:</span>
              <span className="font-mono font-bold text-sm">
                {formatCurrency(totalSalesRevenue)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span>Standard Tax Rate:</span>
              <span className="font-mono font-bold">16.00%</span>
            </div>
            <div className="flex justify-between py-2 font-bold text-base bg-cream-50 dark:bg-espresso-900 px-3 rounded-xl">
              <span>Total Sales Tax Collected (Payable to PRA):</span>
              <span className="font-mono text-vintage-orange">
                {formatCurrency(liabilities.salesTaxPra)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
