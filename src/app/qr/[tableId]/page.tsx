"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, type LocalOrder, type LocalKDSTicket } from "@/lib/db/dexie";
import { type MenuItemDef, type CategoryDef } from "@/lib/data/sample-menu";
import { formatCurrency, generateUUID } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { syncEngine } from "@/lib/sync/outbox";
import {
  Coffee,
  ShoppingBag,
  CheckCircle2,
  Plus,
  Minus,
  Sparkles,
  Search,
  ArrowRight,
} from "lucide-react";

export default function QrTableOrderPage() {
  const params = useParams();
  const tableId = (params?.tableId as string) || "T-01";

  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [items, setItems] = useState<MenuItemDef[]>([]);
  const [cart, setCart] = useState<{ item: MenuItemDef; quantity: number }[]>([]);
  const [guestName, setGuestName] = useState("");
  const [isOrdered, setIsOrdered] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const { playSound } = useUiStore();

  useEffect(() => {
    async function load() {
      await db.seedDefaultsIfEmpty();
      const cats = await db.categories.orderBy("sort_order").toArray();
      const itms = await db.items.toArray();
      setCategories(cats);
      setItems(itms);
    }
    load();
  }, []);

  const totalAmount = cart.reduce((sum, c) => sum + c.item.base_price * c.quantity, 0);

  const handleAddToCart = (item: MenuItemDef) => {
    playSound("click");
    const existing = cart.find((c) => c.item.id === item.id);
    if (existing) {
      setCart(cart.map((c) => (c.item.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)));
    } else {
      setCart([...cart, { item, quantity: 1 }]);
    }
  };

  const handleUpdateQty = (itemId: string, delta: number) => {
    playSound("click");
    const updated = cart
      .map((c) => (c.item.id === itemId ? { ...c, quantity: c.quantity + delta } : c))
      .filter((c) => c.quantity > 0);
    setCart(updated);
  };

  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;
    playSound("bell");

    const orderId = generateUUID();
    const orderNo = `QR-${tableId}-${Math.floor(100 + Math.random() * 900)}`;
    const nowIso = new Date().toISOString();

    const localOrder: LocalOrder = {
      id: orderId,
      order_number: orderNo,
      order_type: "DINE_IN",
      status: "CONFIRMED",
      table_number: tableId,
      cashier_id: "qr-self",
      cashier_name: `Table ${tableId} (Self-Order)`,
      customer_name: guestName || `Guest at Table ${tableId}`,
      items: cart.map((c) => ({
        id: generateUUID(),
        item_id: c.item.id,
        item_name: c.item.name_en,
        unit_price: c.item.base_price,
        quantity: c.quantity,
        total_price: c.item.base_price * c.quantity,
        discount_amount: 0,
        station_type: c.item.station_type,
        selected_modifiers: [],
      })),
      subtotal: totalAmount,
      discount_amount: 0,
      tax_amount: (totalAmount * 16) / 100,
      service_charge: 0,
      total_amount: totalAmount * 1.16,
      payment_method: "CASH",
      sync_status: "PENDING",
      created_at: nowIso,
      updated_at: nowIso,
    };

    // Save to local IndexedDB
    await db.orders.add(localOrder);

    // Route to KDS
    const barItems = localOrder.items.filter((i) => i.station_type === "BAR");
    const kitchenItems = localOrder.items.filter((i) => i.station_type === "KITCHEN");

    if (barItems.length > 0) {
      await db.kdsTickets.add({
        id: generateUUID(),
        order_id: orderId,
        order_number: orderNo,
        order_type: "DINE_IN",
        table_label: `Table ${tableId}`,
        station_type: "BAR",
        status: "PENDING",
        items: barItems.map((i) => ({
          id: i.id,
          item_name: i.item_name,
          quantity: i.quantity,
          modifiers: [],
          status: "PENDING",
        })),
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    if (kitchenItems.length > 0) {
      await db.kdsTickets.add({
        id: generateUUID(),
        order_id: orderId,
        order_number: orderNo,
        order_type: "DINE_IN",
        table_label: `Table ${tableId}`,
        station_type: "KITCHEN",
        status: "PENDING",
        items: kitchenItems.map((i) => ({
          id: i.id,
          item_name: i.item_name,
          quantity: i.quantity,
          modifiers: [],
          status: "PENDING",
        })),
        created_at: nowIso,
        updated_at: nowIso,
      });
    }

    // Auto deduce stock
    try {
      const { deduceInventoryForOrder } = await import("@/lib/inventory/recipe-deducer");
      await deduceInventoryForOrder(localOrder);
    } catch {}

    await syncEngine.enqueue("ORDER_CREATED", localOrder);

    setOrderNumber(orderNo);
    setIsOrdered(true);
  };

  if (isOrdered) {
    return (
      <div className="min-h-screen bg-cream-50 dark:bg-espresso-900 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-sage-light text-sage flex items-center justify-center shadow-floating animate-drop-in">
          <CheckCircle2 className="w-10 h-10 stroke-[2.5]" />
        </div>
        <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100">
          Order Sent to Barista & Kitchen!
        </h2>
        <p className="text-xs text-espresso-700/70 max-w-xs">
          Your order <strong>#{orderNumber}</strong> for Table <strong>{tableId}</strong> is currently being prepared fresh.
        </p>
        <div className="p-4 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 text-xs font-mono font-bold">
          Total to Pay at Register / Counter: {formatCurrency(totalAmount * 1.16)}
        </div>
        <button
          onClick={() => {
            setIsOrdered(false);
            setCart([]);
          }}
          className="px-6 py-2.5 rounded-2xl bg-vintage-orange text-white text-xs font-bold shadow-md"
        >
          Order Something Else
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream-50 dark:bg-espresso-900 flex flex-col pb-24">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 p-4 bg-white/95 dark:bg-espresso-900/95 backdrop-blur-md border-b border-cream-200 dark:border-espresso-700 flex items-center justify-between shadow-soft">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-vintage-orange text-white flex items-center justify-center font-bold text-sm">
            ☕
          </div>
          <div>
            <h1 className="font-serif font-black text-lg text-espresso-900 dark:text-cream-100 leading-tight">
              Rewind Café
            </h1>
            <span className="text-[11px] font-bold text-vintage-orange">Table {tableId}</span>
          </div>
        </div>

        <input
          type="text"
          placeholder="Your Name (Optional)"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="px-3 py-1.5 rounded-xl bg-cream-50 border border-cream-300 text-xs font-bold max-w-[140px]"
        />
      </header>

      {/* Menu Feed */}
      <div className="p-4 space-y-4 max-w-lg mx-auto w-full">
        <div className="grid grid-cols-1 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-3 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex gap-3 items-center"
            >
              <img
                src={item.photo_url}
                alt={item.name_en}
                className="w-20 h-20 rounded-xl object-cover shadow-sm flex-shrink-0"
              />
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-serif font-bold text-sm text-espresso-900 dark:text-cream-100">
                    {item.name_en}
                  </h4>
                  <p className="text-[11px] text-espresso-700/60 line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>

                <div className="flex items-center justify-between mt-2">
                  <span className="font-mono font-black text-sm text-vintage-orange">
                    {formatCurrency(item.base_price)}
                  </span>
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="px-3 py-1 rounded-xl bg-vintage-orange hover:bg-vintage-orange-hover text-white text-xs font-bold shadow-sm"
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Floating Cart Sticky Footer */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/95 dark:bg-espresso-900/95 backdrop-blur-md border-t border-cream-200 shadow-floating z-40 max-w-lg mx-auto flex items-center justify-between">
          <div>
            <span className="text-[11px] text-espresso-700/60 font-bold block">
              {cart.reduce((s, c) => s + c.quantity, 0)} items selected
            </span>
            <span className="font-serif font-black text-lg text-espresso-900 dark:text-cream-100">
              {formatCurrency(totalAmount)}
            </span>
          </div>

          <button
            onClick={handlePlaceOrder}
            className="px-6 py-3 rounded-2xl bg-gradient-to-r from-vintage-orange to-amber-600 text-white font-serif font-bold text-sm shadow-md flex items-center gap-1.5"
          >
            <span>Place Order</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
