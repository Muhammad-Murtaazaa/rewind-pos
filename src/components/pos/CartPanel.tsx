"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/lib/db/dexie";
import { RecallModal } from "./RecallModal";
import { useCartStore } from "@/stores/cartStore";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/translations";
import {
  Trash2,
  Plus,
  Minus,
  PauseCircle,
  Tag,
  Percent,
  User,
  Coffee,
  CheckCircle2,
  X,
  Sparkles,
  History,
} from "lucide-react";

interface CartPanelProps {
  onOpenPayment: () => void;
  onOpenTableModal: () => void;
}

export function CartPanel({ onOpenPayment, onOpenTableModal }: CartPanelProps) {
  const {
    order_type,
    setOrderType,
    selected_table,
    customer,
    setCustomer,
    items,
    updateQuantity,
    removeItem,
    clearCart,
    getSubtotal,
    getItemDiscountsTotal,
    getOrderDiscountAmount,
    getTaxAmount,
    getServiceChargeAmount,
    getTotalAmount,
    order_discount,
    setOrderDiscount,
    holdCurrentOrder,
  } = useCartStore();

  const { currentUser } = useAuthStore();
  const { language, playSound } = useUiStore();
  const { t } = useTranslation(language);

  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [discountType, setDiscountType] = useState<"PERCENT" | "FIXED">("PERCENT");
  const [discountVal, setDiscountVal] = useState<number>(10);
  const [discountReason, setDiscountReason] = useState<string>("Staff / Regular Courtesy");
  const [heldSuccessMsg, setHeldSuccessMsg] = useState<string | null>(null);
  const [heldCount, setHeldCount] = useState<number>(0);
  const [isRecallModalOpen, setIsRecallModalOpen] = useState<boolean>(false);

  const refreshHeldCount = async () => {
    try {
      const count = await db.orders.filter((o) => o.status === "PENDING").count();
      setHeldCount(count);
    } catch {
      setHeldCount(0);
    }
  };

  useEffect(() => {
    refreshHeldCount();
    const interval = setInterval(refreshHeldCount, 3000);
    return () => clearInterval(interval);
  }, []);

  const subtotal = getSubtotal();
  const itemDiscounts = getItemDiscountsTotal();
  const orderDiscount = getOrderDiscountAmount();
  const serviceCharge = getServiceChargeAmount();
  const tax = getTaxAmount();
  const total = getTotalAmount();

  const handleApplyDiscount = () => {
    // Check role discount limit
    const maxLimit = currentUser?.discount_limit ?? 15;
    if (discountType === "PERCENT" && discountVal > maxLimit) {
      alert(`Your role limit allows up to ${maxLimit}% discount. Overriding requires Manager PIN.`);
      return;
    }

    setOrderDiscount({
      type: discountType,
      value: discountVal,
      reason: discountReason,
    });
    setShowDiscountModal(false);
  };

  const handleHoldTicket = async () => {
    try {
      const orderNo = await holdCurrentOrder(currentUser?.name || "Cashier");
      playSound("chime");
      setHeldSuccessMsg(`Ticket ${orderNo} parked on hold`);
      await refreshHeldCount();
      setTimeout(() => setHeldSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-cream-50 dark:bg-surface-dark border-l border-cream-200 dark:border-espresso-700/80 shadow-soft">
      {/* 1. Header & Order Type Tabs */}
      <div className="p-3 border-b border-cream-200 dark:border-espresso-700 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-serif font-black text-base text-espresso-800 dark:text-cream-100 flex items-center gap-1.5">
            <Coffee className="w-4 h-4 text-vintage-orange" />
            {t("orderSummary")}
          </span>
          <div className="flex items-center gap-2">
            {/* Recall / Parked button */}
            <button
              onClick={() => {
                playSound("click");
                setIsRecallModalOpen(true);
              }}
              className="px-2.5 py-1 rounded-xl text-xs font-bold bg-cream-200/90 dark:bg-espresso-700 hover:bg-vintage-orange hover:text-white text-espresso-800 dark:text-cream-200 transition-colors flex items-center gap-1.5 shadow-sm group"
              title="View and recall parked orders"
            >
              <History className="w-3.5 h-3.5 text-vintage-orange group-hover:text-white" />
              <span>Recall</span>
              {heldCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-vintage-orange text-white text-[10px] font-black leading-none">
                  {heldCount}
                </span>
              )}
            </button>

            {items.length > 0 && (
              <button
                onClick={() => {
                  playSound("click");
                  clearCart();
                }}
                className="text-xs text-brick hover:underline font-semibold"
              >
                {t("clear")}
              </button>
            )}
          </div>
        </div>

        {/* Order Type Pills: Dine-in, Takeaway, Delivery */}
        <div className="grid grid-cols-3 gap-1 bg-cream-100 dark:bg-espresso-800 p-1 rounded-2xl border border-cream-200 dark:border-espresso-700">
          {(["DINE_IN", "TAKEAWAY", "DELIVERY"] as const).map((type) => {
            const isSelected = order_type === type;
            const labels = {
              DINE_IN: t("dineIn"),
              TAKEAWAY: t("takeaway"),
              DELIVERY: t("delivery"),
            };
            return (
              <button
                key={type}
                onClick={() => {
                  playSound("click");
                  setOrderType(type);
                }}
                className={`py-1.5 rounded-xl text-xs font-bold transition-all truncate px-1 ${
                  isSelected
                    ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                    : "text-espresso-700/70 dark:text-cream-200/70 hover:text-espresso-900"
                }`}
              >
                {labels[type]}
              </button>
            );
          })}
        </div>

        {/* Table Selector (If Dine-In) */}
        {order_type === "DINE_IN" && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-xs">
            <span className="text-espresso-700/70 dark:text-cream-300/70 font-medium">Table Assignment:</span>
            <button
              onClick={onOpenTableModal}
              className="font-bold text-vintage-orange hover:underline flex items-center gap-1"
            >
              <span>{selected_table ? selected_table.table_number : "Select Table →"}</span>
            </button>
          </div>
        )}

        {/* Customer Phone Search */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-xs">
          <User className="w-3.5 h-3.5 text-espresso-700/40 dark:text-cream-300/40" />
          <input
            type="text"
            placeholder="Customer Phone (0300-1234567)"
            value={customer?.phone || ""}
            onChange={(e) =>
              setCustomer({
                phone: e.target.value,
                name: customer?.name || "Walk-in Guest",
              })
            }
            className="w-full bg-transparent border-none text-xs text-espresso-800 dark:text-cream-100 focus:outline-none"
          />
        </div>
      </div>

      {/* Held Notification Toast */}
      {heldSuccessMsg && (
        <div className="mx-3 mt-2 p-2 rounded-xl bg-sage-light text-sage-dark border border-sage/30 text-xs font-bold flex items-center gap-2 animate-drop-in">
          <CheckCircle2 className="w-4 h-4 text-sage" />
          <span>{heldSuccessMsg}</span>
        </div>
      )}

      {/* 2. Scrollable Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-center text-espresso-700/60 dark:text-cream-300/60">
            <div className="w-16 h-16 rounded-3xl bg-cream-100 dark:bg-espresso-800 flex items-center justify-center text-vintage-orange mb-3 shadow-card">
              <Coffee className="w-8 h-8 opacity-75" />
            </div>
            <h4 className="font-serif font-bold text-base text-espresso-800 dark:text-cream-100 mb-1">
              {t("emptyCartTitle")}
            </h4>
            <p className="text-xs max-w-[200px] leading-relaxed">
              {t("emptyCartSubtitle")}
            </p>
          </div>
        ) : (
          items.map((item) => {
            const modTotal = item.selected_modifiers.reduce((sum, m) => sum + m.price_add, 0);
            const linePrice = (item.unit_price + modTotal) * item.quantity;

            return (
              <div
                key={item.cart_line_id}
                className="p-3 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col gap-2 animate-drop-in"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex flex-col">
                    <span className="font-serif font-bold text-sm text-espresso-900 dark:text-cream-100">
                      {item.item_name}
                      {item.variant_name && (
                        <span className="text-xs font-sans text-vintage-orange font-semibold ml-1.5">
                          ({item.variant_name})
                        </span>
                      )}
                    </span>

                    {/* Modifiers summary */}
                    {item.selected_modifiers.length > 0 && (
                      <p className="text-[11px] text-espresso-700/70 dark:text-cream-300/70 line-clamp-1 mt-0.5">
                        {item.selected_modifiers.map((m) => m.modifier_name).join(", ")}
                      </p>
                    )}

                    {/* Special instruction notes */}
                    {item.notes && (
                      <p className="text-[10px] text-amber-700 dark:text-amber-300 italic mt-0.5">
                        Note: {item.notes}
                      </p>
                    )}
                  </div>

                  <span className="font-extrabold text-sm text-espresso-800 dark:text-cream-100 whitespace-nowrap">
                    {formatCurrency(linePrice)}
                  </span>
                </div>

                {/* Quantity adjustments & delete */}
                <div className="flex items-center justify-between pt-1 border-t border-cream-100 dark:border-espresso-700/60">
                  <button
                    onClick={() => {
                      playSound("click");
                      removeItem(item.cart_line_id);
                    }}
                    className="p-1 rounded-lg text-brick hover:bg-brick-light transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <div className="flex items-center gap-2 bg-cream-100 dark:bg-espresso-700/60 px-2 py-0.5 rounded-xl border border-cream-200 dark:border-espresso-600">
                    <button
                      onClick={() => {
                        playSound("click");
                        updateQuantity(item.cart_line_id, -1);
                      }}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-espresso-800 flex items-center justify-center text-espresso-800 dark:text-cream-100 shadow-sm"
                    >
                      <Minus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                    <span className="w-5 text-center font-bold text-xs">{item.quantity}</span>
                    <button
                      onClick={() => {
                        playSound("click");
                        updateQuantity(item.cart_line_id, 1);
                      }}
                      className="w-6 h-6 rounded-lg bg-white dark:bg-espresso-800 flex items-center justify-center text-espresso-800 dark:text-cream-100 shadow-sm"
                    >
                      <Plus className="w-3 h-3 stroke-[2.5]" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 3. Totals, Calculations & Fast Action Buttons */}
      <div className="p-3 border-t border-cream-200 dark:border-espresso-700 bg-white dark:bg-espresso-800/60 space-y-2">
        <div className="space-y-1 text-xs">
          <div className="flex justify-between text-espresso-700/70 dark:text-cream-300/70">
            <span>{t("subtotal")}</span>
            <span className="font-semibold text-espresso-800 dark:text-cream-200">
              {formatCurrency(subtotal)}
            </span>
          </div>

          {/* Discounts */}
          {(itemDiscounts > 0 || orderDiscount > 0) && (
            <div className="flex justify-between text-brick font-semibold">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3" />
                {t("discount")} ({order_discount.reason || "Applied"})
              </span>
              <span>-{formatCurrency(itemDiscounts + orderDiscount)}</span>
            </div>
          )}

          {/* Sales Tax */}
          <div className="flex justify-between text-espresso-700/70 dark:text-cream-300/70">
            <span>{t("tax")}</span>
            <span className="font-semibold text-espresso-800 dark:text-cream-200">
              {formatCurrency(tax)}
            </span>
          </div>

          {/* Grand Total */}
          <div className="flex justify-between items-baseline pt-1.5 border-t border-cream-200 dark:border-espresso-700">
            <span className="font-serif font-black text-sm text-espresso-900 dark:text-cream-100">
              {t("total")}
            </span>
            <span className="font-serif font-black text-xl text-vintage-orange">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        {/* Action Buttons: Hold Ticket, Discount, Pay Now */}
        <div className="grid grid-cols-4 gap-2 pt-1">
          {/* Discount Trigger */}
          <button
            onClick={() => setShowDiscountModal(true)}
            disabled={items.length === 0}
            className="col-span-1 h-12 rounded-2xl bg-cream-100 dark:bg-espresso-700 hover:bg-cream-200 border border-cream-300 dark:border-espresso-600 text-espresso-800 dark:text-cream-100 text-xs font-bold flex flex-col items-center justify-center transition-all disabled:opacity-40"
            title="Add Order Discount"
          >
            <Percent className="w-4 h-4 text-mustard" />
            <span className="text-[10px] mt-0.5">Discount</span>
          </button>

          {/* Hold Ticket Button */}
          <button
            onClick={handleHoldTicket}
            disabled={items.length === 0}
            className="col-span-1 h-12 rounded-2xl bg-cream-100 dark:bg-espresso-700 hover:bg-cream-200 border border-cream-300 dark:border-espresso-600 text-espresso-800 dark:text-cream-100 text-xs font-bold flex flex-col items-center justify-center transition-all disabled:opacity-40"
            title="Park current ticket on hold"
          >
            <PauseCircle className="w-4 h-4 text-vintage-orange" />
            <span className="text-[10px] mt-0.5">Hold</span>
          </button>

          {/* Charge / Pay Now (Main Action Button) */}
          <button
            onClick={() => {
              playSound("click");
              onOpenPayment();
            }}
            disabled={items.length === 0}
            className="col-span-2 h-12 rounded-2xl bg-gradient-to-r from-vintage-orange to-amber-600 hover:brightness-105 active:scale-95 text-white font-serif font-black text-base shadow-floating flex items-center justify-center gap-1.5 transition-all disabled:opacity-40"
          >
            <span>{t("payNow")}</span>
            <span className="text-xs font-sans font-normal opacity-90">
              ({formatCurrency(total)})
            </span>
          </button>
        </div>
      </div>

      {/* Discount Configuration Modal */}
      {showDiscountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-cream-50 dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-café p-6 shadow-floating text-espresso-800 dark:text-cream-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif font-bold text-base">Apply Order Discount</h3>
              <button
                onClick={() => setShowDiscountModal(false)}
                className="p-1 rounded-full hover:bg-cream-200 dark:hover:bg-espresso-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* Type toggle: % vs PKR */}
              <div className="grid grid-cols-2 gap-2 bg-cream-100 dark:bg-espresso-800 p-1 rounded-xl">
                <button
                  onClick={() => setDiscountType("PERCENT")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    discountType === "PERCENT"
                      ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-sm"
                      : "text-espresso-700"
                  }`}
                >
                  Percentage (%)
                </button>
                <button
                  onClick={() => setDiscountType("FIXED")}
                  className={`py-1.5 rounded-lg text-xs font-bold transition-all ${
                    discountType === "FIXED"
                      ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-sm"
                      : "text-espresso-700"
                  }`}
                >
                  Fixed (PKR)
                </button>
              </div>

              {/* Quick % buttons */}
              {discountType === "PERCENT" && (
                <div className="grid grid-cols-4 gap-2">
                  {[5, 10, 15, 20].map((pct) => (
                    <button
                      key={pct}
                      onClick={() => setDiscountVal(pct)}
                      className={`py-2 rounded-xl border text-xs font-bold ${
                        discountVal === pct
                          ? "bg-vintage-orange text-white border-vintage-orange"
                          : "bg-white dark:bg-espresso-800 border-cream-300 dark:border-espresso-700"
                      }`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              )}

              {/* Custom input */}
              <div>
                <label className="text-xs font-semibold block mb-1">
                  {discountType === "PERCENT" ? "Discount Percentage (%)" : "Discount Amount (PKR)"}
                </label>
                <input
                  type="number"
                  value={discountVal}
                  onChange={(e) => setDiscountVal(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-700 text-sm font-bold"
                />
              </div>

              {/* Required reason */}
              <div>
                <label className="text-xs font-semibold block mb-1">Reason for Discount</label>
                <select
                  value={discountReason}
                  onChange={(e) => setDiscountReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-700 text-xs"
                >
                  <option value="Staff / Regular Courtesy">Staff / Regular Courtesy</option>
                  <option value="Management Discretion">Management Discretion</option>
                  <option value="Happy Hour Promo">Happy Hour Promo</option>
                  <option value="Customer Goodwill / Complaint">Customer Goodwill / Complaint</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    setOrderDiscount({ type: "PERCENT", value: 0 });
                    setShowDiscountModal(false);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-cream-200 text-xs font-bold"
                >
                  Remove
                </button>
                <button
                  onClick={handleApplyDiscount}
                  className="flex-1 py-2.5 rounded-xl bg-vintage-orange text-white text-xs font-bold shadow-md"
                >
                  Apply Discount
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Held / Parked Tickets Modal */}
      <RecallModal
        isOpen={isRecallModalOpen}
        onClose={() => {
          setIsRecallModalOpen(false);
          refreshHeldCount();
        }}
      />
    </div>
  );
}
