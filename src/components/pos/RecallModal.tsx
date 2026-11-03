"use client";

import React, { useEffect, useState } from "react";
import { db, type LocalOrder } from "@/lib/db/dexie";
import { useCartStore } from "@/stores/cartStore";
import { useUiStore } from "@/stores/uiStore";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  History,
  Clock,
  User,
  ShoppingBag,
  Trash2,
  ArrowRight,
  Coffee,
  CheckCircle2,
} from "lucide-react";

interface RecallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecallModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [heldOrders, setHeldOrders] = useState<LocalOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { recallOrder, items: currentCartItems } = useCartStore();
  const { playSound } = useUiStore();

  const loadHeldOrders = async () => {
    setIsLoading(true);
    try {
      const orders = await db.orders
        .filter((o) => o.status === "PENDING")
        .reverse()
        .toArray();
      setHeldOrders(orders);
    } catch (err) {
      console.error("Failed to load held orders:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadHeldOrders();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRecall = (order: LocalOrder) => {
    if (currentCartItems.length > 0) {
      const confirmOverwrite = window.confirm(
        "Current cart has active items. Recalling this order will replace the cart. Do you want to proceed?"
      );
      if (!confirmOverwrite) return;
    }
    playSound("bell");
    recallOrder(order);
    onClose();
  };

  const handleDelete = async (orderId: string) => {
    if (window.confirm("Are you sure you want to discard this held ticket?")) {
      playSound("click");
      await db.orders.delete(orderId);
      await loadHeldOrders();
    }
  };

  const formatHeldTime = (dateStr?: string) => {
    if (!dateStr) return "Just now";
    try {
      const diffMin = Math.round((Date.now() - new Date(dateStr).getTime()) / 60000);
      if (diffMin <= 1) return "1 min ago";
      if (diffMin < 60) return `${diffMin} mins ago`;
      const diffHours = Math.floor(diffMin / 60);
      return `${diffHours} hr${diffHours > 1 ? "s" : ""} ago`;
    } catch {
      return "Parked";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-xl max-h-[85vh] bg-cream-50 dark:bg-espresso-900 border border-cream-200 dark:border-espresso-700 rounded-3xl shadow-floating flex flex-col overflow-hidden text-espresso-900 dark:text-cream-100">
        {/* Header */}
        <div className="p-4 md:p-5 border-b border-cream-200 dark:border-espresso-700/80 flex items-center justify-between flex-shrink-0 bg-cream-100/50 dark:bg-espresso-950/40">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-vintage-orange/10 dark:bg-vintage-orange/20 text-vintage-orange flex items-center justify-center">
              <History className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-espresso-900 dark:text-cream-100 leading-tight">
                Held & Parked Tickets
              </h3>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                {heldOrders.length} order{heldOrders.length === 1 ? "" : "s"} currently parked on hold
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-2xl hover:bg-cream-200 dark:hover:bg-espresso-800 text-espresso-700 dark:text-cream-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* List of Held Orders */}
        <div className="flex-1 overflow-y-auto p-4 md:p-5 space-y-3">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-center text-espresso-700/50">
              <div className="w-8 h-8 border-3 border-vintage-orange border-t-transparent rounded-full animate-spin mb-3" />
              <p className="text-sm font-semibold">Loading held orders…</p>
            </div>
          ) : heldOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-14 h-14 rounded-3xl bg-cream-200/60 dark:bg-espresso-800 text-espresso-700/40 dark:text-cream-300/40 flex items-center justify-center mb-3">
                <Coffee className="w-7 h-7" />
              </div>
              <p className="font-serif font-bold text-base text-espresso-900 dark:text-cream-100">
                No Tickets on Hold
              </p>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60 max-w-xs mt-1">
                When you click "Hold" on an active order in the cart, it will be parked here for later recall.
              </p>
            </div>
          ) : (
            heldOrders.map((order) => {
              const totalItemsCount = order.items.reduce((s, i) => s + i.quantity, 0);

              return (
                <div
                  key={order.id}
                  className="p-4 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700/80 shadow-card hover:border-vintage-orange/60 transition-all flex flex-col gap-3"
                >
                  {/* Top Ticket Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-vintage-orange px-2 py-0.5 rounded-lg bg-vintage-orange/10 dark:bg-vintage-orange/20">
                        {order.order_number}
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-cream-200 dark:bg-espresso-700 text-espresso-700 dark:text-cream-300">
                        {order.order_type.replace("_", " ")}
                      </span>
                      {order.table_number && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-200">
                          Table {order.table_number}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 text-xs text-espresso-700/60 dark:text-cream-300/60">
                      <Clock className="w-3.5 h-3.5 text-vintage-orange" />
                      <span>{formatHeldTime(order.held_at || order.created_at)}</span>
                    </div>
                  </div>

                  {/* Customer & Cashier Info */}
                  {(order.customer_name || order.customer_phone) && (
                    <div className="flex items-center gap-2 text-xs text-espresso-800 dark:text-cream-200 font-medium">
                      <User className="w-3.5 h-3.5 text-espresso-700/50" />
                      <span>{order.customer_name || "Customer"}</span>
                      {order.customer_phone && (
                        <span className="text-espresso-700/50 font-mono text-[11px]">
                          ({order.customer_phone})
                        </span>
                      )}
                    </div>
                  )}

                  {/* Items preview */}
                  <div className="text-xs text-espresso-700/70 dark:text-cream-300/70 space-y-0.5 bg-cream-50 dark:bg-espresso-900/50 p-2.5 rounded-xl border border-cream-200/50 dark:border-espresso-700/40">
                    <div className="font-semibold text-espresso-800 dark:text-cream-200 mb-1 flex items-center justify-between text-[11px]">
                      <span>{totalItemsCount} item{totalItemsCount === 1 ? "" : "s"}:</span>
                      <span className="font-bold text-vintage-orange">{formatCurrency(order.total_amount)}</span>
                    </div>
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-[11px]">
                        <span className="truncate">
                          {item.quantity}× {item.item_name}
                          {item.variant_name ? ` (${item.variant_name})` : ""}
                        </span>
                        <span className="font-mono">{formatCurrency(item.total_price)}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <div className="text-[10px] italic text-espresso-700/50 pt-0.5">
                        +{order.items.length - 3} more item{order.items.length - 3 === 1 ? "" : "s"}…
                      </div>
                    )}
                  </div>

                  {/* Bottom Action Buttons */}
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => handleDelete(order.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold text-brick hover:bg-brick/10 transition-colors flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Discard</span>
                    </button>

                    <button
                      onClick={() => handleRecall(order)}
                      className="px-4 py-2 rounded-xl bg-vintage-orange hover:bg-vintage-orange/90 text-white font-bold text-xs shadow-md shadow-vintage-orange/20 flex items-center gap-2 transition-all"
                    >
                      <span>Recall Order</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
