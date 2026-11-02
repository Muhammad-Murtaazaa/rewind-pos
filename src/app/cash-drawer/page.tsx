"use client";

import React, { useEffect, useState } from "react";
import { useCashDrawerStore } from "@/stores/cashDrawerStore";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/translations";
import {
  Coins,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  Lock,
  Unlock,
} from "lucide-react";

export default function CashDrawerPage() {
  const {
    currentSession,
    movements,
    fetchActiveSession,
    openSession,
    recordCashMovement,
    closeSession,
    isLoading,
  } = useCashDrawerStore();

  const { currentUser } = useAuthStore();
  const { language, playSound } = useUiStore();
  const { t } = useTranslation(language);

  // Open Shift Form State
  const [openingFloat, setOpeningFloat] = useState<number>(5000);
  const [openNotes, setOpenNotes] = useState<string>("Morning cash float");

  // Cash In / Out Form State
  const [movementType, setMovementType] = useState<"PAY_IN" | "PAY_OUT">("PAY_OUT");
  const [movementAmount, setMovementAmount] = useState<number>(500);
  const [movementReason, setMovementReason] = useState<string>("Bought fresh milk from store");
  const [showMoveModal, setShowMoveModal] = useState<boolean>(false);

  // Close Shift & Denomination Counter State
  const [showCloseModal, setShowCloseModal] = useState<boolean>(false);
  const [denominations, setDenominations] = useState<Record<string, number>>({
    "5000": 0,
    "1000": 0,
    "500": 0,
    "100": 0,
    "50": 0,
    "20": 0,
    "10": 0,
  });
  const [closedReport, setClosedReport] = useState<any | null>(null);

  useEffect(() => {
    fetchActiveSession();
  }, []);

  const totalCounted = Object.entries(denominations).reduce(
    (sum, [denom, count]) => sum + parseInt(denom) * (count || 0),
    0
  );

  const handleOpenDrawer = async () => {
    playSound("bell");
    await openSession({
      userId: currentUser?.id || "user-3",
      userName: currentUser?.name || "Ali Raza (Cashier)",
      openingFloat,
      notes: openNotes,
    });
  };

  const handleRecordMovement = async () => {
    playSound("click");
    await recordCashMovement({
      type: movementType,
      amount: movementAmount,
      reason: movementReason,
      recordedBy: currentUser?.name || "Ali Raza",
    });
    setShowMoveModal(false);
  };

  const handleCloseShift = async () => {
    playSound("bell");
    const result = await closeSession({
      closingFloat: totalCounted,
      denominations,
      notes: "Shift closed & cash reconciled",
    });
    setClosedReport(result);
    setShowCloseModal(false);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-5xl mx-auto w-full space-y-6">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-cream-200 dark:border-espresso-700">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950 text-vintage-orange flex items-center justify-center text-sm">
              💵
            </span>
            <span>{t("drawerTitle")}</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
            Cash register float tracking, cash-in/out, and X/Z shift reconciliation
          </p>
        </div>

        {currentSession ? (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowMoveModal(true)}
              className="px-4 py-2 rounded-2xl bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 border border-cream-300 dark:border-espresso-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
            >
              <Coins className="w-3.5 h-3.5 text-vintage-orange" />
              <span>Record Cash In / Out</span>
            </button>
            <button
              onClick={() => setShowCloseModal(true)}
              className="px-4 py-2 rounded-2xl bg-brick hover:bg-brick-dark text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-md"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Close Shift & Count</span>
            </button>
          </div>
        ) : (
          <span className="px-3 py-1 rounded-full bg-cream-200 dark:bg-espresso-800 text-xs font-semibold text-espresso-700">
            Drawer is currently closed
          </span>
        )}
      </div>

      {/* Main Drawer Status Card */}
      {currentSession ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Active Session Overview */}
          <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-sage uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-sage animate-ping" />
                Shift Currently Active
              </span>
              <h3 className="font-serif font-black text-3xl text-espresso-900 dark:text-cream-100 mt-2">
                {formatCurrency(currentSession.opening_float)}
              </h3>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60 mt-1">
                Opening Float by {currentSession.user_name}
              </p>
            </div>
            <div className="pt-4 border-t border-cream-100 dark:border-espresso-700 text-[11px] text-espresso-700/70">
              Opened at: {formatDate(currentSession.opened_at)} {formatTime(currentSession.opened_at)}
            </div>
          </div>

          {/* Movements Summary */}
          <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-vintage-orange uppercase tracking-wider">
                Cash Movements
              </span>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <span className="text-xs text-espresso-700/60">Total Pay In</span>
                  <p className="font-extrabold text-base text-sage">
                    {formatCurrency(
                      movements
                        .filter((m) => m.movement_type === "PAY_IN")
                        .reduce((sum, m) => sum + m.amount, 0)
                    )}
                  </p>
                </div>
                <div>
                  <span className="text-xs text-espresso-700/60">Total Pay Out</span>
                  <p className="font-extrabold text-base text-brick">
                    -{formatCurrency(
                      movements
                        .filter((m) => m.movement_type === "PAY_OUT")
                        .reduce((sum, m) => sum + m.amount, 0)
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-cream-100 dark:border-espresso-700 text-[11px] text-espresso-700/70">
              {movements.length} logged drawer actions
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="p-5 rounded-3xl bg-cream-50 dark:bg-espresso-900 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between">
            <div>
              <span className="text-[11px] font-bold text-mustard uppercase tracking-wider">
                Shift Actions
              </span>
              <p className="text-xs text-espresso-700/80 dark:text-cream-200 mt-2 leading-relaxed">
                Take drawer float count at shift end. Denominations will automatically reconcile with POS cash sales.
              </p>
            </div>
            <button
              onClick={() => setShowCloseModal(true)}
              className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-vintage-orange to-amber-600 text-white font-bold text-xs shadow-md hover:brightness-105"
            >
              Perform Z-Report Close
            </button>
          </div>
        </div>
      ) : (
        /* Empty / Closed Drawer State: Open Shift Form */
        <div className="p-8 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-floating max-w-lg mx-auto text-center space-y-4">
          <div className="w-16 h-16 rounded-3xl bg-vintage-orange-light text-vintage-orange flex items-center justify-center mx-auto shadow-card">
            <Unlock className="w-8 h-8" />
          </div>
          <h3 className="font-serif font-black text-xl text-espresso-900 dark:text-cream-100">
            Open Cash Register Shift
          </h3>
          <p className="text-xs text-espresso-700/70 dark:text-cream-300/70">
            Count the initial physical cash in the drawer before starting service.
          </p>

          <div className="space-y-3 text-left">
            <div>
              <label className="text-xs font-bold block mb-1">Opening Cash Float (PKR)</label>
              <input
                type="number"
                value={openingFloat}
                onChange={(e) => setOpeningFloat(parseFloat(e.target.value) || 0)}
                className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-700 font-bold text-base"
              />
            </div>
            <div>
              <label className="text-xs font-bold block mb-1">Opening Shift Note</label>
              <input
                type="text"
                value={openNotes}
                onChange={(e) => setOpenNotes(e.target.value)}
                className="w-full px-4 py-2.5 rounded-2xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-700 text-xs"
              />
            </div>
          </div>

          <button
            onClick={handleOpenDrawer}
            className="w-full py-3.5 rounded-2xl bg-vintage-orange text-white font-serif font-bold text-sm shadow-floating hover:bg-vintage-orange-hover active:scale-98 transition-all"
          >
            Start Register Shift ({formatCurrency(openingFloat)})
          </button>
        </div>
      )}

      {/* Movements History List */}
      {currentSession && movements.length > 0 && (
        <div className="bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200 dark:border-espresso-700 p-5 shadow-card space-y-3">
          <h4 className="font-serif font-bold text-base text-espresso-900 dark:text-cream-100">
            Shift Cash In / Cash Out Log
          </h4>
          <div className="divide-y divide-cream-100 dark:divide-espresso-700">
            {movements.map((move) => (
              <div key={move.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center ${
                      move.movement_type === "PAY_IN"
                        ? "bg-sage-light text-sage-dark"
                        : "bg-brick-light text-brick"
                    }`}
                  >
                    {move.movement_type === "PAY_IN" ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>
                  <div>
                    <span className="font-bold text-espresso-900 dark:text-cream-100">
                      {move.reason}
                    </span>
                    <p className="text-[10px] text-espresso-700/60 dark:text-cream-300/60">
                      By {move.recorded_by} at {formatTime(move.created_at)}
                    </p>
                  </div>
                </div>

                <span
                  className={`font-mono font-bold text-sm ${
                    move.movement_type === "PAY_IN" ? "text-sage" : "text-brick"
                  }`}
                >
                  {move.movement_type === "PAY_IN" ? "+" : "-"}
                  {formatCurrency(move.amount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Record Cash In / Out Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-cream-50 dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-café p-6 shadow-floating text-espresso-800 dark:text-cream-100 space-y-4">
            <h3 className="font-serif font-bold text-lg">Record Cash In / Out</h3>

            <div className="grid grid-cols-2 gap-2 bg-cream-100 dark:bg-espresso-800 p-1 rounded-xl">
              <button
                onClick={() => setMovementType("PAY_OUT")}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  movementType === "PAY_OUT"
                    ? "bg-brick text-white shadow-sm"
                    : "text-espresso-700"
                }`}
              >
                Cash Out (Expense)
              </button>
              <button
                onClick={() => setMovementType("PAY_IN")}
                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                  movementType === "PAY_IN"
                    ? "bg-sage text-white shadow-sm"
                    : "text-espresso-700"
                }`}
              >
                Cash In (Deposit)
              </button>
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Amount (PKR)</label>
              <input
                type="number"
                value={movementAmount}
                onChange={(e) => setMovementAmount(parseFloat(e.target.value) || 0)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Reason (Plain words)</label>
              <input
                type="text"
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                placeholder="e.g. Bought milk 500, ice bags…"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 text-xs"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowMoveModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-cream-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRecordMovement}
                className="flex-1 py-2.5 rounded-xl bg-vintage-orange text-white text-xs font-bold shadow-md"
              >
                Record Entry
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Close Shift Denomination Counting Modal */}
      {showCloseModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/65 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-cream-50 dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-café p-6 shadow-floating text-espresso-800 dark:text-cream-100 space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-lg">Close Register & Count Cash</h3>
            <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
              Enter physical counts for each PKR banknote denomination:
            </p>

            <div className="grid grid-cols-2 gap-3">
              {["5000", "1000", "500", "100", "50", "20", "10"].map((denom) => (
                <div
                  key={denom}
                  className="flex items-center justify-between p-2.5 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700"
                >
                  <span className="font-mono font-bold text-xs text-vintage-orange">
                    ₨ {denom}
                  </span>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={denominations[denom] || ""}
                    onChange={(e) =>
                      setDenominations({
                        ...denominations,
                        [denom]: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-20 px-2 py-1 text-right font-bold bg-cream-50 dark:bg-espresso-900 rounded-lg border border-cream-300 text-xs"
                  />
                </div>
              ))}
            </div>

            <div className="p-4 rounded-2xl bg-cream-100 dark:bg-espresso-800 flex items-center justify-between">
              <span className="font-bold text-xs">Total Counted Cash:</span>
              <span className="font-serif font-black text-xl text-vintage-orange">
                {formatCurrency(totalCounted)}
              </span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowCloseModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-cream-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCloseShift}
                className="flex-1 py-2.5 rounded-xl bg-brick text-white text-xs font-bold shadow-md"
              >
                Reconcile & Close Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Z-Report Summary Callout after closing */}
      {closedReport && (
        <div className="p-6 rounded-3xl bg-white dark:bg-espresso-800 border-2 border-sage shadow-floating space-y-3 animate-drop-in">
          <div className="flex items-center gap-2 text-sage">
            <CheckCircle2 className="w-6 h-6 stroke-[2.5]" />
            <h4 className="font-serif font-bold text-lg text-espresso-900 dark:text-cream-100">
              Shift Reconciled (Z-Report)
            </h4>
          </div>
          <div className="grid grid-cols-3 gap-3 text-xs pt-2">
            <div>
              <span className="text-espresso-700/60 block">Expected Cash:</span>
              <span className="font-bold text-base">
                {formatCurrency(closedReport.session.expected_cash)}
              </span>
            </div>
            <div>
              <span className="text-espresso-700/60 block">Actual Counted:</span>
              <span className="font-bold text-base">
                {formatCurrency(closedReport.session.closing_float)}
              </span>
            </div>
            <div>
              <span className="text-espresso-700/60 block">Variance:</span>
              <span
                className={`font-bold text-base ${
                  closedReport.variance === 0
                    ? "text-sage"
                    : closedReport.variance > 0
                    ? "text-mustard"
                    : "text-brick"
                }`}
              >
                {formatCurrency(closedReport.variance)}
              </span>
            </div>
          </div>
          <button
            onClick={() => window.print()}
            className="mt-3 px-4 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-xs font-bold flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Z-Report</span>
          </button>
        </div>
      )}
    </div>
  );
}
