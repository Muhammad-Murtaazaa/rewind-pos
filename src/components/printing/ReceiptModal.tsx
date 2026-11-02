"use client";

import React, { useRef } from "react";
import { type LocalOrder } from "@/lib/db/dexie";
import { formatCurrency, formatTime, formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/translations";
import { useUiStore } from "@/stores/uiStore";
import { Printer, Share2, Check, X, Coffee, Sparkles } from "lucide-react";

interface ReceiptModalProps {
  order: LocalOrder | null;
  onClose: () => void;
}

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const { language } = useUiStore();
  const { t } = useTranslation(language);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleWhatsAppShare = () => {
    const text = encodeURIComponent(
      `*Rewind Café — Digital Receipt*\nOrder: #${order.order_number}\nDate: ${formatDate(
        order.created_at
      )} ${formatTime(order.created_at)}\nTotal: ${formatCurrency(
        order.total_amount
      )}\nThank you for rewinding with us! ☕`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-café p-6 shadow-floating text-espresso-900 dark:text-cream-100 flex flex-col max-h-[95vh]">
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-cream-200 dark:border-espresso-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-vintage-orange" />
            <h3 className="font-serif font-bold text-base">{t("receiptTitle")}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-cream-100 dark:hover:bg-espresso-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal 80mm ESC/POS Receipt Simulation */}
        <div
          ref={receiptRef}
          className="my-3 p-4 bg-[#FCFBF8] dark:bg-espresso-900 text-espresso-900 dark:text-cream-100 font-mono text-[11px] rounded-xl border border-dashed border-cream-300 dark:border-espresso-700 overflow-y-auto space-y-2.5 shadow-inner"
        >
          {/* Header */}
          <div className="text-center space-y-0.5">
            <h2 className="font-serif font-extrabold text-base tracking-wider text-espresso-900 dark:text-white uppercase">
              Rewind Café
            </h2>
            <p className="text-[10px] text-espresso-700/80 dark:text-cream-300/80">
              Artisan Coffee & Bakery
            </p>
            <p className="text-[10px] text-espresso-700/60 dark:text-cream-300/60">
              Street 4, F-7/3 Markaz, Islamabad
            </p>
            <p className="text-[10px] text-espresso-700/60 dark:text-cream-300/60">
              STRN: 3277876123 · NTN: 8912440-1
            </p>
          </div>

          <div className="border-t border-dashed border-espresso-900/30 dark:border-cream-100/30 my-2" />

          {/* Metadata */}
          <div className="flex justify-between text-[10px]">
            <span>Order: #{order.order_number}</span>
            <span>{order.order_type}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>Date: {formatDate(order.created_at)}</span>
            <span>{formatTime(order.created_at)}</span>
          </div>
          <div className="flex justify-between text-[10px]">
            <span>Cashier: {order.cashier_name.split(" ")[0]}</span>
            {order.table_number && <span>Table: {order.table_number}</span>}
          </div>

          <div className="border-t border-dashed border-espresso-900/30 dark:border-cream-100/30 my-2" />

          {/* Line Items */}
          <div className="space-y-1.5">
            {order.items.map((line, idx) => (
              <div key={idx} className="flex flex-col">
                <div className="flex justify-between">
                  <span className="font-bold">
                    {line.quantity}x {line.item_name}
                  </span>
                  <span>{formatCurrency(line.total_price)}</span>
                </div>
                {line.variant_name && (
                  <span className="text-[10px] text-espresso-700/70 dark:text-cream-300/70 pl-3">
                    - {line.variant_name}
                  </span>
                )}
                {line.selected_modifiers &&
                  line.selected_modifiers.map((m, mIdx) => (
                    <span
                      key={mIdx}
                      className="text-[10px] text-espresso-700/70 dark:text-cream-300/70 pl-3"
                    >
                      + {m.modifier_name} ({formatCurrency(m.price_add)})
                    </span>
                  ))}
              </div>
            ))}
          </div>

          <div className="border-t border-dashed border-espresso-900/30 dark:border-cream-100/30 my-2" />

          {/* Subtotals & Taxes */}
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-brick">
                <span>Discount:</span>
                <span>-{formatCurrency(order.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span>Sales Tax (PRA 16%):</span>
              <span>{formatCurrency(order.tax_amount)}</span>
            </div>
            <div className="flex justify-between font-bold text-sm pt-1 border-t border-dashed border-espresso-900/30">
              <span>Total Paid:</span>
              <span>{formatCurrency(order.total_amount)}</span>
            </div>
            <div className="flex justify-between text-[10px] text-espresso-700/80">
              <span>Method:</span>
              <span>{order.payment_method}</span>
            </div>
            {order.amount_tendered && order.amount_tendered > 0 && (
              <>
                <div className="flex justify-between text-[10px]">
                  <span>Tendered:</span>
                  <span>{formatCurrency(order.amount_tendered)}</span>
                </div>
                <div className="flex justify-between text-[10px]">
                  <span>Change:</span>
                  <span>{formatCurrency(order.change_returned || 0)}</span>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-dashed border-espresso-900/30 dark:border-cream-100/30 my-2" />

          {/* Footer with QR */}
          <div className="text-center space-y-1 pt-1">
            <p className="text-[10px] font-bold">FBR / PRA POS Invoiced</p>
            <p className="text-[9px] text-espresso-700/70">
              Thank you for stopping by!
            </p>
            <p className="text-[9px] text-espresso-700/70 italic">
              "Good coffee takes time, but great memories last forever."
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            onClick={handlePrint}
            className="h-11 rounded-2xl bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 border border-cream-300 dark:border-espresso-700 text-espresso-800 dark:text-cream-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Printer className="w-4 h-4 text-vintage-orange" />
            <span>{t("printThermal")}</span>
          </button>

          <button
            onClick={handleWhatsAppShare}
            className="h-11 rounded-2xl bg-sage-light hover:bg-sage/20 border border-sage/40 text-sage-dark dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Share2 className="w-4 h-4 text-sage" />
            <span>WhatsApp</span>
          </button>
        </div>

        <button
          onClick={onClose}
          className="mt-2 w-full h-11 rounded-2xl bg-vintage-orange hover:bg-vintage-orange-hover text-white text-xs font-bold transition-all shadow-md"
        >
          {t("newSale")}
        </button>
      </div>
    </div>
  );
}
