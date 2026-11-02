"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/db/dexie";
import { type StaffProfileDef, type PayslipDef } from "@/lib/data/sample-hr-accounting";
import { formatCurrency } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { postPayrollJournal } from "@/lib/accounting/auto-poster";
import {
  CreditCard,
  CheckCircle2,
  Share2,
  Printer,
  Sparkles,
  ArrowRight,
  TrendingUp,
  FileCheck,
  DollarSign,
} from "lucide-react";

export default function PayrollPage() {
  const [staffProfiles, setStaffProfiles] = useState<StaffProfileDef[]>([]);
  const [selectedMonth, setSelectedMonth] = useState("November 2026");
  const [isPosted, setIsPosted] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const { playSound } = useUiStore();

  useEffect(() => {
    db.staffProfiles.toArray().then(setStaffProfiles);
  }, []);

  // Calculate payslips dynamically
  const payslips: PayslipDef[] = staffProfiles.map((staff) => {
    const base = staff.base_salary;
    const overtime = staff.role === "BARISTA" || staff.role === "KITCHEN" ? 3500 : 0;
    const tipShare = 2400; // Shared customer tips
    const bonus = staff.role === "MANAGER" ? 5000 : 0;
    const advanceDeduction = staff.role === "WAITER" ? 2000 : 0;
    const net = base + overtime + tipShare + bonus - advanceDeduction;

    return {
      id: `ps-${staff.id}`,
      payroll_run_id: `pr-2026-11`,
      user_id: staff.user_id,
      staff_name: staff.name,
      role: staff.role,
      base_pay: base,
      overtime_pay: overtime,
      bonus,
      tip_share: tipShare,
      advances_deducted: advanceDeduction,
      net_salary: net,
      period_month: selectedMonth,
    };
  });

  const totalPayrollCost = payslips.reduce((sum, p) => sum + p.net_salary, 0);

  const handlePostToAccounting = async () => {
    playSound("bell");
    await postPayrollJournal({
      totalSalary: totalPayrollCost,
      periodMonth: selectedMonth,
    });
    setIsPosted(true);
    setToastMsg(`Posted ${formatCurrency(totalPayrollCost)} to General Ledger (Account 6010 Staff Salaries)!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleWhatsAppPayslip = (slip: PayslipDef) => {
    const text = encodeURIComponent(
      `*Rewind Café — Monthly Payslip*\nStaff: ${slip.staff_name} (${slip.role})\nPeriod: ${slip.period_month}\n\n` +
        `• Base Salary: ${formatCurrency(slip.base_pay)}\n` +
        `• Overtime: ${formatCurrency(slip.overtime_pay)}\n` +
        `• Shared Tips: ${formatCurrency(slip.tip_share)}\n` +
        (slip.bonus > 0 ? `• Performance Bonus: ${formatCurrency(slip.bonus)}\n` : "") +
        (slip.advances_deducted > 0 ? `• Advance Repayment: -${formatCurrency(slip.advances_deducted)}\n` : "") +
        `\n*Net Transferred: ${formatCurrency(slip.net_salary)}*\nThank you for making Rewind exceptional!`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cream-200 dark:border-espresso-700">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sage text-white flex items-center justify-center text-sm shadow-card">
              💳
            </span>
            <span>Monthly Payroll & Payslip Processing</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
            Attendance hours, overtime, tip-share pools, automated double-entry ledger posting
          </p>
        </div>

        {/* Post to Ledger Action */}
        <div className="flex items-center gap-2">
          {isPosted ? (
            <span className="px-4 py-2 rounded-2xl bg-sage-light text-sage-dark border border-sage/40 text-xs font-bold flex items-center gap-1.5 shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-sage" />
              <span>Posted to Accounting Ledger</span>
            </span>
          ) : (
            <button
              onClick={handlePostToAccounting}
              className="px-5 py-2.5 rounded-2xl bg-gradient-to-r from-vintage-orange to-amber-600 text-white font-serif font-bold text-xs shadow-floating flex items-center gap-2 hover:brightness-105 active:scale-98 transition-all"
            >
              <FileCheck className="w-4 h-4" />
              <span>Post Payroll to General Ledger</span>
            </button>
          )}
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-xl bg-sage-light text-sage-dark border border-sage/40 text-xs font-bold flex items-center gap-2 animate-drop-in">
          <CheckCircle2 className="w-4 h-4 text-sage" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card">
          <span className="text-xs font-bold text-espresso-700/60">Total Monthly Disbursement</span>
          <h3 className="font-serif font-black text-3xl text-espresso-900 dark:text-cream-100 mt-1">
            {formatCurrency(totalPayrollCost)}
          </h3>
          <span className="text-[11px] text-espresso-700/60 mt-1 block">
            {payslips.length} active team members
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card">
          <span className="text-xs font-bold text-espresso-700/60">Shared Tip Pool Payout</span>
          <h3 className="font-serif font-black text-3xl text-sage mt-1">
            {formatCurrency(payslips.length * 2400)}
          </h3>
          <span className="text-[11px] text-espresso-700/60 mt-1 block">
            ₨ 2,400 distributed per staff member
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card">
          <span className="text-xs font-bold text-espresso-700/60">Overtime & Bonuses</span>
          <h3 className="font-serif font-black text-3xl text-vintage-orange mt-1">
            {formatCurrency(
              payslips.reduce((sum, p) => sum + p.overtime_pay + p.bonus, 0)
            )}
          </h3>
          <span className="text-[11px] text-espresso-700/60 mt-1 block">
            Calculated from clock-in attendance
          </span>
        </div>
      </div>

      {/* Payslips Table */}
      <div className="bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200 dark:border-espresso-700 overflow-hidden shadow-card">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100 dark:bg-espresso-900 border-b font-bold">
              <tr>
                <th className="p-3.5">Staff Member</th>
                <th className="p-3.5">Role</th>
                <th className="p-3.5">Base Pay</th>
                <th className="p-3.5">Overtime</th>
                <th className="p-3.5">Tips Pool</th>
                <th className="p-3.5">Deductions</th>
                <th className="p-3.5">Net Salary</th>
                <th className="p-3.5">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {payslips.map((slip) => (
                <tr key={slip.id} className="hover:bg-cream-50/50">
                  <td className="p-3.5 font-bold text-espresso-900 dark:text-cream-100">
                    {slip.staff_name}
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded-full bg-cream-100 font-semibold text-[10px]">
                      {slip.role}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono">{formatCurrency(slip.base_pay)}</td>
                  <td className="p-3.5 font-mono">
                    {slip.overtime_pay > 0 ? `+${formatCurrency(slip.overtime_pay)}` : "—"}
                  </td>
                  <td className="p-3.5 font-mono text-sage font-bold">
                    +{formatCurrency(slip.tip_share)}
                  </td>
                  <td className="p-3.5 font-mono text-brick">
                    {slip.advances_deducted > 0 ? `-${formatCurrency(slip.advances_deducted)}` : "—"}
                  </td>
                  <td className="p-3.5 font-mono font-black text-sm text-vintage-orange">
                    {formatCurrency(slip.net_salary)}
                  </td>
                  <td className="p-3.5 flex items-center gap-1.5">
                    <button
                      onClick={() => handleWhatsAppPayslip(slip)}
                      className="p-1.5 rounded-xl bg-sage-light text-sage-dark hover:bg-sage/20 border border-sage/40 transition-colors"
                      title="Share Payslip on WhatsApp"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => window.print()}
                      className="p-1.5 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-espresso-800 transition-colors"
                      title="Print Payslip"
                    >
                      <Printer className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
