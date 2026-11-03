"use client";

import React, { useState } from "react";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/translations";
import { type LocalOrder } from "@/lib/db/dexie";
import { autoPrintReceipt } from "@/lib/printing/thermal-printer";
import {
  Banknote,
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  X,
  CheckCircle2,
  Coins,
  ArrowRight,
  Printer,
} from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderCompleted: (order: LocalOrder) => void;
}

export function PaymentModal({ isOpen, onClose, onOrderCompleted }: PaymentModalProps) {
  const { getTotalAmount, completeOrder } = useCartStore();
  const { currentUser } = useAuthStore();
  const { language, playSound } = useUiStore();
  const { t } = useTranslation(language);

  const total = getTotalAmount();

  const [paymentMethod, setPaymentMethod] = useState<
    "CASH" | "CARD" | "JAZZCASH" | "EASYPAISA" | "BANK_TRANSFER"
  >("CASH");
  const [tenderedAmount, setTenderedAmount] = useState<number>(total);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [autoPrint, setAutoPrint] = useState<boolean>(true);

  if (!isOpen) return null;

  const changeDue = Math.max(0, tenderedAmount - total);

  // Quick cash denomination presets in PKR
  const quickCashOptions = [
    { label: t("exactCash"), value: total },
    { label: `₨ ${Math.ceil(total / 100) * 100}`, value: Math.ceil(total / 100) * 100 },
    { label: `₨ ${Math.ceil(total / 500) * 500}`, value: Math.ceil(total / 500) * 500 },
    { label: "₨ 1,000", value: 1000 },
    { label: "₨ 5,000", value: 5000 },
  ].filter((opt, idx, self) => opt.value >= total && self.findIndex((o) => o.value === opt.value) === idx);

  const handleCompleteSale = async () => {
    setIsProcessing(true);
    playSound("bell"); // Satisfying payment register chime

    try {
      const order = await completeOrder({
        cashier_id: currentUser?.id || "user-3",
        cashier_name: currentUser?.name || "Ali Raza (Cashier)",
        payment_method: paymentMethod,
        amount_tendered: paymentMethod === "CASH" ? tenderedAmount : total,
        change_returned: paymentMethod === "CASH" ? changeDue : 0,
      });

      // Auto-print receipt to thermal printer or browser
      if (autoPrint) {
        try {
          const printResult = await autoPrintReceipt(order);
          console.log(`Auto-print result: ${printResult} for order ${order.order_number}`);
        } catch (printErr) {
          console.warn("Auto-print failed, receipt available in modal:", printErr);
        }
      }

      setIsProcessing(false);
      onOrderCompleted(order);
      onClose();
    } catch (err: any) {
      setIsProcessing(false);
      alert(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/65 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl bg-cream-50 dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-café p-6 shadow-floating text-espresso-800 dark:text-cream-100 flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-cream-200 dark:border-espresso-700">
          <div>
            <h3 className="font-serif font-bold text-xl leading-tight">
              {t("paymentTitle")}
            </h3>
            <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
              Total Amount Payable:{" "}
              <span className="font-extrabold text-vintage-orange font-sans text-sm">
                {formatCurrency(total)}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream-200 dark:hover:bg-espresso-700 text-espresso-700 dark:text-cream-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Payment Methods Selection Grid */}
        <div className="grid grid-cols-5 gap-2 my-4">
          {[
            { id: "CASH", label: t("cash"), icon: Banknote },
            { id: "CARD", label: t("card"), icon: CreditCard },
            { id: "JAZZCASH", label: t("jazzcash"), icon: Smartphone },
            { id: "EASYPAISA", label: t("easypaisa"), icon: QrCode },
            { id: "BANK_TRANSFER", label: t("bank"), icon: Building2 },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = paymentMethod === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  playSound("click");
                  setPaymentMethod(item.id as any);
                  if (item.id !== "CASH") setTenderedAmount(total);
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border text-xs font-bold gap-1.5 transition-all ${
                  isSelected
                    ? "bg-vintage-orange text-white border-vintage-orange shadow-md scale-102"
                    : "bg-white dark:bg-espresso-800 border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200 hover:border-vintage-orange/50"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Dynamic Payment Body */}
        {paymentMethod === "CASH" ? (
          <div className="space-y-4 bg-white dark:bg-espresso-800 p-4 rounded-2xl border border-cream-200 dark:border-espresso-700">
            {/* Quick cash pills */}
            <div>
              <label className="text-xs font-semibold text-espresso-700/70 dark:text-cream-300/70 block mb-2">
                Quick Cash Buttons:
              </label>
              <div className="flex flex-wrap gap-2">
                {quickCashOptions.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      playSound("click");
                      setTenderedAmount(opt.value);
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      tenderedAmount === opt.value
                        ? "bg-sage text-white border-sage shadow-sm"
                        : "bg-cream-100 dark:bg-espresso-700 border-cream-300 dark:border-espresso-600 hover:border-sage"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Cash Tendered input */}
            <div className="grid grid-cols-2 gap-3 items-center">
              <div>
                <label className="text-xs font-semibold text-espresso-700/70 dark:text-cream-300/70 block mb-1">
                  {t("amountTendered")}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-espresso-700/50">
                    ₨
                  </span>
                  <input
                    type="number"
                    value={tenderedAmount}
                    onChange={(e) => setTenderedAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-600 font-sans font-bold text-lg"
                  />
                </div>
              </div>

              {/* Change Due Callout */}
              <div className="p-3 rounded-xl bg-sage-light dark:bg-emerald-950/70 border border-sage/40 flex flex-col">
                <span className="text-[11px] font-bold text-sage-dark dark:text-emerald-300 uppercase tracking-wide">
                  {t("changeDue")}
                </span>
                <span className="font-sans font-black text-2xl text-sage-dark dark:text-emerald-200">
                  {formatCurrency(changeDue)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-6 bg-white dark:bg-espresso-800 rounded-2xl border border-cream-200 dark:border-espresso-700 flex flex-col items-center justify-center text-center space-y-3">
            {paymentMethod === "CARD" && (
              <>
                <CreditCard className="w-12 h-12 text-vintage-orange" />
                <h4 className="font-serif font-bold text-base">Insert / Tap Card on Terminal</h4>
                <p className="text-xs text-espresso-700/70 dark:text-cream-300/70 max-w-xs">
                  Swipe customer card or authorize payment on your POS card terminal.
                </p>
              </>
            )}
            {(paymentMethod === "JAZZCASH" || paymentMethod === "EASYPAISA") && (
              <>
                <div className="p-3 bg-white rounded-xl shadow-card border border-cream-200">
                  <QrCode className="w-24 h-24 text-espresso-900" />
                </div>
                <h4 className="font-serif font-bold text-base">
                  Scan {paymentMethod === "JAZZCASH" ? "JazzCash" : "Easypaisa"} QR Code
                </h4>
                <p className="text-xs text-espresso-700/70 dark:text-cream-300/70">
                  Till ID: <span className="font-mono font-bold">REWIND-042</span> · Instant verified
                </p>
              </>
            )}
            {paymentMethod === "BANK_TRANSFER" && (
              <>
                <Building2 className="w-12 h-12 text-vintage-orange" />
                <h4 className="font-serif font-bold text-base">Direct Bank / Raast Transfer</h4>
                <p className="text-xs text-espresso-700/70 dark:text-cream-300/70">
                  Raast ID: <span className="font-mono font-bold">0300-REWIND1</span>
                </p>
              </>
            )}
          </div>
        )}

        {/* Auto-Print Toggle */}
        <div className="mt-4 flex items-center justify-between px-1">
          <label className="flex items-center gap-2 cursor-pointer group" title="Automatically print receipt when sale completes">
            <div
              onClick={() => setAutoPrint(!autoPrint)}
              className={`w-10 h-6 rounded-full flex items-center transition-colors duration-200 cursor-pointer ${
                autoPrint ? "bg-vintage-orange" : "bg-cream-300 dark:bg-espresso-700"
              }`}
            >
              <div
                className={`w-4.5 h-4.5 mx-0.5 rounded-full bg-white shadow transition-transform duration-200 ${
                  autoPrint ? "translate-x-4" : "translate-x-0.5"
                }`}
                style={{ width: 18, height: 18 }}
              />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-espresso-700 dark:text-cream-300 group-hover:text-espresso-900">
              <Printer className="w-3.5 h-3.5 text-vintage-orange" />
              <span>Auto-Print Receipt</span>
            </div>
          </label>

          <span className="text-[10px] text-espresso-700/50 dark:text-cream-300/50 font-medium">
            {autoPrint ? "Receipt prints on completion" : "Manual print only"}
          </span>
        </div>

        {/* Complete Payment Button */}
        <div className="pt-4 border-t border-cream-200 dark:border-espresso-700 mt-3 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-cream-300 dark:border-espresso-700 text-xs font-semibold text-espresso-700 hover:bg-cream-200 transition-colors"
          >
            Cancel
          </button>

          <button
            onClick={handleCompleteSale}
            disabled={isProcessing || (paymentMethod === "CASH" && tenderedAmount < total)}
            className="h-12 px-8 rounded-2xl bg-gradient-to-r from-vintage-orange to-amber-600 text-white font-serif font-bold text-base shadow-floating hover:brightness-105 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-40"
          >
            {isProcessing ? (
              <span>Processing…</span>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                <span>{t("completePayment")}</span>
                <span className="font-sans font-normal text-xs opacity-90">
                  ({formatCurrency(total)})
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
