import { create } from "zustand";
import { type LocalOrder, type LocalOrderItem, type LocalKDSTicket, db } from "../lib/db/dexie";
import { generateUUID } from "../lib/utils";
import { syncEngine } from "../lib/sync/outbox";

export interface CartItemModifier {
  modifier_id: string;
  modifier_name: string;
  price_add: number;
}

export interface CartItem {
  cart_line_id: string;
  item_id: string;
  item_name: string;
  variant_name?: string;
  unit_price: number;
  quantity: number;
  discount_amount: number;
  discount_reason?: string;
  notes?: string;
  station_type: "BAR" | "KITCHEN";
  photo_url?: string;
  selected_modifiers: CartItemModifier[];
}

interface CartState {
  order_type: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  selected_table: { id: string; table_number: string } | null;
  customer: { name: string; phone: string } | null;
  items: CartItem[];
  order_discount: { type: "PERCENT" | "FIXED"; value: number; reason?: string };
  tax_rate_percent: number; // e.g. 16% PRA
  service_charge_percent: number; // e.g. 0% or 5%
  order_notes: string;

  // Actions
  setOrderType: (type: "DINE_IN" | "TAKEAWAY" | "DELIVERY") => void;
  setSelectedTable: (table: { id: string; table_number: string } | null) => void;
  setCustomer: (cust: { name: string; phone: string } | null) => void;
  addItem: (item: Omit<CartItem, "cart_line_id">) => void;
  updateQuantity: (cart_line_id: string, delta: number) => void;
  removeItem: (cart_line_id: string) => void;
  setItemDiscount: (cart_line_id: string, discount_amount: number, reason?: string) => void;
  setItemNotes: (cart_line_id: string, notes: string) => void;
  setOrderDiscount: (discount: { type: "PERCENT" | "FIXED"; value: number; reason?: string }) => void;
  setOrderNotes: (notes: string) => void;
  clearCart: () => void;

  // Calculations
  getSubtotal: () => number;
  getItemDiscountsTotal: () => number;
  getOrderDiscountAmount: () => number;
  getTaxAmount: () => number;
  getServiceChargeAmount: () => number;
  getTotalAmount: () => number;

  // Order Lifecycle
  holdCurrentOrder: (cashierName: string) => Promise<string>;
  recallOrder: (order: LocalOrder) => void;
  completeOrder: (params: {
    cashier_id: string;
    cashier_name: string;
    payment_method: string;
    amount_tendered?: number;
    change_returned?: number;
  }) => Promise<LocalOrder>;
}

export const useCartStore = create<CartState>((set, get) => ({
  order_type: "DINE_IN",
  selected_table: null,
  customer: null,
  items: [],
  order_discount: { type: "PERCENT", value: 0 },
  tax_rate_percent: 16, // Default 16% Sales Tax
  service_charge_percent: 0,
  order_notes: "",

  setOrderType: (type) => set({ order_type: type }),
  setSelectedTable: (table) => set({ selected_table: table }),
  setCustomer: (cust) => set({ customer: cust }),

  addItem: (newItem) => {
    const { items } = get();
    // Check if identical item with same variant and exact same modifiers already exists in cart
    const existingIndex = items.findIndex((i) => {
      if (i.item_id !== newItem.item_id) return false;
      if (i.variant_name !== newItem.variant_name) return false;
      if (i.selected_modifiers.length !== newItem.selected_modifiers.length) return false;
      const m1 = i.selected_modifiers.map((m) => m.modifier_id).sort().join(",");
      const m2 = newItem.selected_modifiers.map((m) => m.modifier_id).sort().join(",");
      return m1 === m2;
    });

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += newItem.quantity;
      set({ items: updated });
    } else {
      set({
        items: [...items, { ...newItem, cart_line_id: generateUUID() }],
      });
    }
  },

  updateQuantity: (cart_line_id, delta) => {
    const { items } = get();
    const updated = items
      .map((item) => {
        if (item.cart_line_id === cart_line_id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    set({ items: updated });
  },

  removeItem: (cart_line_id) => {
    set({ items: get().items.filter((i) => i.cart_line_id !== cart_line_id) });
  },

  setItemDiscount: (cart_line_id, discount_amount, reason) => {
    set({
      items: get().items.map((i) =>
        i.cart_line_id === cart_line_id
          ? { ...i, discount_amount, discount_reason: reason }
          : i
      ),
    });
  },

  setItemNotes: (cart_line_id, notes) => {
    set({
      items: get().items.map((i) =>
        i.cart_line_id === cart_line_id ? { ...i, notes } : i
      ),
    });
  },

  setOrderDiscount: (discount) => set({ order_discount: discount }),
  setOrderNotes: (notes) => set({ order_notes: notes }),

  clearCart: () =>
    set({
      items: [],
      selected_table: null,
      customer: null,
      order_discount: { type: "PERCENT", value: 0 },
      order_notes: "",
    }),

  getSubtotal: () => {
    return get().items.reduce((sum, item) => {
      const modTotal = item.selected_modifiers.reduce((mSum, m) => mSum + m.price_add, 0);
      const lineBase = (item.unit_price + modTotal) * item.quantity;
      return sum + lineBase;
    }, 0);
  },

  getItemDiscountsTotal: () => {
    return get().items.reduce((sum, i) => sum + (i.discount_amount || 0), 0);
  },

  getOrderDiscountAmount: () => {
    const sub = get().getSubtotal() - get().getItemDiscountsTotal();
    if (sub <= 0) return 0;
    const { order_discount } = get();
    if (order_discount.type === "PERCENT") {
      return (sub * Math.min(order_discount.value, 100)) / 100;
    }
    return Math.min(order_discount.value, sub);
  },

  getServiceChargeAmount: () => {
    const netSub = get().getSubtotal() - get().getItemDiscountsTotal() - get().getOrderDiscountAmount();
    return Math.max(0, (netSub * get().service_charge_percent) / 100);
  },

  getTaxAmount: () => {
    const taxableAmount =
      get().getSubtotal() -
      get().getItemDiscountsTotal() -
      get().getOrderDiscountAmount() +
      get().getServiceChargeAmount();
    return Math.max(0, (taxableAmount * get().tax_rate_percent) / 100);
  },

  getTotalAmount: () => {
    const sub = get().getSubtotal();
    const itemDisc = get().getItemDiscountsTotal();
    const orderDisc = get().getOrderDiscountAmount();
    const service = get().getServiceChargeAmount();
    const tax = get().getTaxAmount();
    return Math.max(0, sub - itemDisc - orderDisc + service + tax);
  },

  holdCurrentOrder: async (cashierName: string) => {
    const state = get();
    if (state.items.length === 0) throw new Error("Cannot hold empty order");

    const orderId = generateUUID();
    const orderNumber = `T1-${Math.floor(1000 + Math.random() * 9000)}`;

    const heldOrder: LocalOrder = {
      id: orderId,
      order_number: orderNumber,
      order_type: state.order_type,
      status: "PENDING",
      table_id: state.selected_table?.id,
      table_number: state.selected_table?.table_number,
      cashier_id: "user-3",
      cashier_name: cashierName,
      customer_name: state.customer?.name,
      customer_phone: state.customer?.phone,
      items: state.items.map((i) => ({
        id: i.cart_line_id,
        item_id: i.item_id,
        item_name: i.item_name,
        variant_name: i.variant_name,
        unit_price: i.unit_price,
        quantity: i.quantity,
        total_price: (i.unit_price + i.selected_modifiers.reduce((m, mod) => m + mod.price_add, 0)) * i.quantity,
        discount_amount: i.discount_amount,
        notes: i.notes,
        station_type: i.station_type,
        selected_modifiers: i.selected_modifiers,
      })),
      subtotal: state.getSubtotal(),
      discount_amount: state.getItemDiscountsTotal() + state.getOrderDiscountAmount(),
      discount_reason: state.order_discount.reason,
      tax_amount: state.getTaxAmount(),
      service_charge: state.getServiceChargeAmount(),
      total_amount: state.getTotalAmount(),
      notes: state.order_notes,
      sync_status: "PENDING",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      held_at: new Date().toISOString(),
    };

    await db.orders.add(heldOrder);
    state.clearCart();
    return orderNumber;
  },

  recallOrder: (order: LocalOrder) => {
    const cartItems: CartItem[] = order.items.map((item) => ({
      cart_line_id: item.id || generateUUID(),
      item_id: item.item_id,
      item_name: item.item_name,
      variant_name: item.variant_name,
      unit_price: item.unit_price,
      quantity: item.quantity,
      discount_amount: item.discount_amount || 0,
      notes: item.notes,
      station_type: item.station_type,
      selected_modifiers: item.selected_modifiers || [],
    }));

    set({
      order_type: order.order_type,
      selected_table: order.table_id
        ? { id: order.table_id, table_number: order.table_number || "T-01" }
        : null,
      customer: order.customer_phone
        ? { name: order.customer_name || "", phone: order.customer_phone }
        : null,
      items: cartItems,
      order_notes: order.notes || "",
    });

    // Delete or mark old held order so it is not duplicated
    db.orders.delete(order.id);
  },

  completeOrder: async (params) => {
    const state = get();
    if (state.items.length === 0) throw new Error("Cannot checkout empty cart");

    const orderId = generateUUID();
    const orderNumber = `T1-${Math.floor(1000 + Math.random() * 9000)}`;
    const nowIso = new Date().toISOString();

    const localOrder: LocalOrder = {
      id: orderId,
      order_number: orderNumber,
      order_type: state.order_type,
      status: "COMPLETED",
      table_id: state.selected_table?.id,
      table_number: state.selected_table?.table_number,
      cashier_id: params.cashier_id,
      cashier_name: params.cashier_name,
      customer_name: state.customer?.name,
      customer_phone: state.customer?.phone,
      items: state.items.map((i) => ({
        id: i.cart_line_id,
        item_id: i.item_id,
        item_name: i.item_name,
        variant_name: i.variant_name,
        unit_price: i.unit_price,
        quantity: i.quantity,
        total_price: (i.unit_price + i.selected_modifiers.reduce((m, mod) => m + mod.price_add, 0)) * i.quantity,
        discount_amount: i.discount_amount,
        notes: i.notes,
        station_type: i.station_type,
        selected_modifiers: i.selected_modifiers,
      })),
      subtotal: state.getSubtotal(),
      discount_amount: state.getItemDiscountsTotal() + state.getOrderDiscountAmount(),
      discount_reason: state.order_discount.reason,
      tax_amount: state.getTaxAmount(),
      service_charge: state.getServiceChargeAmount(),
      total_amount: state.getTotalAmount(),
      notes: state.order_notes,
      payment_method: params.payment_method,
      amount_tendered: params.amount_tendered,
      change_returned: params.change_returned,
      sync_status: "PENDING",
      created_at: nowIso,
      updated_at: nowIso,
    };

    // 1. Write order to local IndexedDB
    await db.orders.add(localOrder);

    // 2. Generate KDS tickets routed by station (Bar vs Kitchen)
    const barItems = localOrder.items.filter((i) => i.station_type === "BAR");
    const kitchenItems = localOrder.items.filter((i) => i.station_type === "KITCHEN");

    if (barItems.length > 0) {
      const barTicket: LocalKDSTicket = {
        id: generateUUID(),
        order_id: orderId,
        order_number: orderNumber,
        order_type: localOrder.order_type,
        table_label: localOrder.table_number || "Takeaway",
        station_type: "BAR",
        status: "PENDING",
        items: barItems.map((item) => ({
          id: item.id,
          item_name: item.item_name,
          variant_name: item.variant_name,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.selected_modifiers.map((m) => m.modifier_name),
          status: "PENDING",
        })),
        created_at: nowIso,
        updated_at: nowIso,
      };
      await db.kdsTickets.add(barTicket);
    }

    if (kitchenItems.length > 0) {
      const kitchenTicket: LocalKDSTicket = {
        id: generateUUID(),
        order_id: orderId,
        order_number: orderNumber,
        order_type: localOrder.order_type,
        table_label: localOrder.table_number || "Takeaway",
        station_type: "KITCHEN",
        status: "PENDING",
        items: kitchenItems.map((item) => ({
          id: item.id,
          item_name: item.item_name,
          variant_name: item.variant_name,
          quantity: item.quantity,
          notes: item.notes,
          modifiers: item.selected_modifiers.map((m) => m.modifier_name),
          status: "PENDING",
        })),
        created_at: nowIso,
        updated_at: nowIso,
      };
      await db.kdsTickets.add(kitchenTicket);
    }

    // 3. If dine-in, update table status to occupied
    if (state.selected_table?.id) {
      await db.diningTables.update(state.selected_table.id, {
        is_occupied: true,
        order_total: localOrder.total_amount,
        occupied_minutes: 0,
        current_order_id: orderId,
      });
    }

    // 4. Enqueue to offline Outbox queue
    await syncEngine.enqueue("ORDER_CREATED", localOrder);

    // 5. Clear cart
    state.clearCart();

    return localOrder;
  },
}));
