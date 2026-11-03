"use client";

import React, { useRef, useEffect, useState } from "react";
import { type LocalOrder } from "@/lib/db/dexie";
import { formatCurrency, formatTime, formatDate } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/translations";
import { useUiStore } from "@/stores/uiStore";
import {
  Printer,
  Share2,
  Check,
  X,
  Coffee,
  Sparkles,
  MessageCircle,
  Mail,
  Copy,
  CheckCircle2,
} from "lucide-react";

interface ReceiptModalProps {
  order: LocalOrder | null;
  onClose: () => void;
}

export function ReceiptModal({ order, onClose }: ReceiptModalProps) {
  const { language, playSound } = useUiStore();
  const { t } = useTranslation(language);
  const receiptRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  if (!order) return null;

  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);

  const handlePrint = async () => {
    playSound("click");
    try {
      const { autoPrintReceipt } = await import("@/lib/printing/thermal-printer");
      await autoPrintReceipt(order);
    } catch {
      window.print();
    }
  };

  const handleWhatsAppShare = () => {
    playSound("click");
    const lines = [
      `*☕ REWIND CAFÉ — Receipt*`,
      ``,
      `Order: *#${order.order_number}*`,
      `Date: ${formatDate(order.created_at)} ${formatTime(order.created_at)}`,
      `Type: ${order.order_type.replace("_", " ")}`,
      order.table_number ? `Table: ${order.table_number}` : "",
      `Cashier: ${(order.cashier_name || "Staff").split(" ")[0]}`,
      ``,
      `─── Items ───`,
      ...order.items.map(
        (i) =>
          `${i.quantity}x ${i.item_name}${i.variant_name ? ` (${i.variant_name})` : ""} — ${formatCurrency(i.total_price)}`
      ),
      ``,
      `─── Totals ───`,
      `Subtotal: ${formatCurrency(order.subtotal)}`,
      order.discount_amount > 0
        ? `Discount: -${formatCurrency(order.discount_amount)}`
        : "",
      `Tax (16%): ${formatCurrency(order.tax_amount)}`,
      `*TOTAL: ${formatCurrency(order.total_amount)}*`,
      ``,
      order.payment_method ? `Paid via: ${order.payment_method.replace("_", " ")}` : "",
      order.amount_tendered && order.amount_tendered > 0
        ? `Tendered: ${formatCurrency(order.amount_tendered)} | Change: ${formatCurrency(order.change_returned || 0)}`
        : "",
      ``,
      `Thank you for stopping by! 🧡`,
      `_"Good coffee takes time, but great memories last forever."_`,
    ]
      .filter(Boolean)
      .join("\n");

    const text = encodeURIComponent(lines);
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  const handleCopyReceipt = () => {
    const text = [
      `REWIND CAFÉ — Receipt`,
      `Order: #${order.order_number}`,
      `Date: ${formatDate(order.created_at)} ${formatTime(order.created_at)}`,
      ...order.items.map(
        (i) => `${i.quantity}x ${i.item_name} — ${formatCurrency(i.total_price)}`
      ),
      `Total: ${formatCurrency(order.total_amount)}`,
    ].join("\n");

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-white dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-3xl shadow-floating text-espresso-900 dark:text-cream-100 flex flex-col max-h-[95vh] overflow-hidden">
        {/* Success Header */}
        <div className="p-5 bg-gradient-to-br from-sage/20 to-emerald-100/30 dark:from-emerald-950/40 dark:to-emerald-900/20 border-b border-cream-200 dark:border-espresso-700 text-center relative">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-1.5 rounded-xl hover:bg-white/50 dark:hover:bg-espresso-700 text-espresso-700 dark:text-cream-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="w-14 h-14 mx-auto mb-2 rounded-full bg-sage/20 dark:bg-emerald-900/50 flex items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-sage dark:text-emerald-400" />
          </div>
          <h3 className="font-serif font-black text-lg text-espresso-900 dark:text-cream-100">
            Sale Complete!
          </h3>
          <p className="text-xs text-espresso-700/70 dark:text-cream-300/70 mt-0.5">
            Order <span className="font-mono font-bold text-vintage-orange">#{order.order_number}</span> · {totalItems} item{totalItems === 1 ? "" : "s"}
          </p>
        </div>

        {/* Thermal 80mm ESC/POS Receipt Simulation */}
        <div className="flex-1 overflow-y-auto">
          <div
            ref={receiptRef}
            className="mx-4 my-3 p-4 bg-[#FDFCF9] dark:bg-espresso-900 text-espresso-900 dark:text-cream-100 font-mono text-[11px] rounded-2xl border border-dashed border-cream-300 dark:border-espresso-700 space-y-2 shadow-inner"
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
                DHA Phase 5, Karachi
              </p>
              <p className="text-[10px] text-espresso-700/60 dark:text-cream-300/60">
                STRN: 3277876123 · NTN: 8912440-1
              </p>
            </div>

            <div className="border-t-2 border-espresso-900/20 dark:border-cream-100/20 my-2" />

            {/* Metadata */}
            <div className="flex justify-between text-[10px]">
              <span className="font-bold">Order: #{order.order_number}</span>
              <span className="font-bold">{order.order_type.replace("_", " ")}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Date: {formatDate(order.created_at)}</span>
              <span>{formatTime(order.created_at)}</span>
            </div>
            <div className="flex justify-between text-[10px]">
              <span>Cashier: {(order.cashier_name || "Staff").split(" ")[0]}</span>
              {order.table_number && <span>Table: {order.table_number}</span>}
            </div>
            {order.customer_name && (
              <div className="text-[10px]">
                Customer: {order.customer_name} {order.customer_phone ? `(${order.customer_phone})` : ""}
              </div>
            )}

            <div className="border-t border-dashed border-espresso-900/30 dark:border-cream-100/30 my-2" />

            {/* Line Items */}
            <div className="space-y-1.5">
              {order.items.map((line, idx) => (
                <div key={idx} className="flex flex-col">
                  <div className="flex justify-between">
                    <span className="font-bold">
                      {line.quantity}x {line.item_name}
                    </span>
                    <span className="font-bold">{formatCurrency(line.total_price)}</span>
                  </div>
                  {line.variant_name && (
                    <span className="text-[10px] text-espresso-700/70 dark:text-cream-300/70 pl-3">
                      Size: {line.variant_name}
                    </span>
                  )}
                  {line.selected_modifiers &&
                    line.selected_modifiers.map((m, mIdx) => (
                      <span
                        key={mIdx}
                        className="text-[10px] text-espresso-700/70 dark:text-cream-300/70 pl-3"
                      >
                        + {m.modifier_name}
                        {m.price_add > 0 ? ` (+${formatCurrency(m.price_add)})` : ""}
                      </span>
                    ))}
                  {line.notes && (
                    <span className="text-[10px] text-espresso-700/70 dark:text-cream-300/70 pl-3 italic">
                      Note: {line.notes}
                    </span>
                  )}
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
                <div className="flex justify-between text-brick font-semibold">
                  <span>Discount{order.discount_reason ? ` (${order.discount_reason})` : ""}:</span>
                  <span>-{formatCurrency(order.discount_amount)}</span>
                </div>
              )}
              {order.service_charge && order.service_charge > 0 && (
                <div className="flex justify-between">
                  <span>Service Charge:</span>
                  <span>{formatCurrency(order.service_charge)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Sales Tax (PRA 16%):</span>
                <span>{formatCurrency(order.tax_amount)}</span>
              </div>

              <div className="border-t-2 border-espresso-900/30 dark:border-cream-100/30 my-1" />

              <div className="flex justify-between font-bold text-sm pt-0.5">
                <span>TOTAL PAID:</span>
                <span className="text-vintage-orange">{formatCurrency(order.total_amount)}</span>
              </div>

              <div className="flex justify-between text-[10px] text-espresso-700/80">
                <span>Method:</span>
                <span className="font-semibold">{order.payment_method?.replace("_", " ") || "CASH"}</span>
              </div>
              {order.amount_tendered && order.amount_tendered > 0 && (
                <>
                  <div className="flex justify-between text-[10px]">
                    <span>Tendered:</span>
                    <span>{formatCurrency(order.amount_tendered)}</span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold text-sage-dark dark:text-emerald-300">
                    <span>Change:</span>
                    <span>{formatCurrency(order.change_returned || 0)}</span>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-dashed border-espresso-900/30 dark:border-cream-100/30 my-2" />

            {/* Footer */}
            <div className="text-center space-y-0.5 pt-1">
              <p className="text-[10px] font-bold">FBR / PRA POS Invoice</p>
              <p className="text-[9px] text-espresso-700/70 font-semibold">
                Thank you for stopping by!
              </p>
              <p className="text-[9px] text-espresso-700/70 italic">
                "Good coffee takes time, but great memories last forever."
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-cream-200 dark:border-espresso-700 bg-cream-50/50 dark:bg-espresso-950/40 space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handlePrint}
              className="h-11 rounded-2xl bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 border border-cream-300 dark:border-espresso-700 text-espresso-800 dark:text-cream-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-vintage-orange" />
              <span>Print</span>
            </button>

            <button
              onClick={handleWhatsAppShare}
              className="h-11 rounded-2xl bg-emerald-50 dark:bg-emerald-950/80 hover:bg-emerald-100 border border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>

            <button
              onClick={handleCopyReceipt}
              className="h-11 rounded-2xl bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 border border-cream-300 dark:border-espresso-700 text-espresso-800 dark:text-cream-100 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-sage" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-espresso-700/60" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>

          <button
            onClick={() => {
              playSound("click");
              onClose();
            }}
            className="w-full h-12 rounded-2xl bg-vintage-orange hover:bg-vintage-orange/90 text-white font-serif font-bold text-sm transition-all shadow-md flex items-center justify-center gap-2"
          >
            <Coffee className="w-4 h-4" />
            <span>{t("newSale")}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
