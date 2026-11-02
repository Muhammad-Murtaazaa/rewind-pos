import { create } from "zustand";
import { db, type LocalCashSession, type LocalCashMovement } from "../lib/db/dexie";
import { generateUUID } from "../lib/utils";
import { syncEngine } from "../lib/sync/outbox";

interface CashDrawerState {
  currentSession: LocalCashSession | null;
  movements: LocalCashMovement[];
  isLoading: boolean;

  fetchActiveSession: () => Promise<void>;
  openSession: (params: { userId: string; userName: string; openingFloat: number; notes?: string }) => Promise<LocalCashSession>;
  recordCashMovement: (params: { type: "PAY_IN" | "PAY_OUT"; amount: number; reason: string; recordedBy: string }) => Promise<void>;
  closeSession: (params: {
    closingFloat: number;
    denominations: Record<string, number>;
    notes?: string;
  }) => Promise<{ session: LocalCashSession; variance: number }>;
}

export const useCashDrawerStore = create<CashDrawerState>((set, get) => ({
  currentSession: null,
  movements: [],
  isLoading: false,

  fetchActiveSession: async () => {
    set({ isLoading: true });
    try {
      const active = await db.cashSessions.where("status").equals("OPEN").first();
      if (active) {
        const moves = await db.cashMovements.where("session_id").equals(active.id).toArray();
        set({ currentSession: active, movements: moves });
      } else {
        set({ currentSession: null, movements: [] });
      }
    } finally {
      set({ isLoading: false });
    }
  },

  openSession: async ({ userId, userName, openingFloat, notes }) => {
    const newSession: LocalCashSession = {
      id: generateUUID(),
      user_id: userId,
      user_name: userName,
      opening_float: openingFloat,
      status: "OPEN",
      opened_at: new Date().toISOString(),
      notes,
    };

    await db.cashSessions.add(newSession);
    await syncEngine.enqueue("CASH_MOVEMENT", {
      type: "DRAWER_OPENED",
      session: newSession,
    });

    set({ currentSession: newSession, movements: [] });
    return newSession;
  },

  recordCashMovement: async ({ type, amount, reason, recordedBy }) => {
    const { currentSession, movements } = get();
    if (!currentSession) throw new Error("No open cash session found");

    const move: LocalCashMovement = {
      id: generateUUID(),
      session_id: currentSession.id,
      movement_type: type,
      amount,
      reason,
      created_at: new Date().toISOString(),
      recorded_by: recordedBy,
    };

    await db.cashMovements.add(move);
    await syncEngine.enqueue("CASH_MOVEMENT", move);

    set({ movements: [...movements, move] });
  },

  closeSession: async ({ closingFloat, denominations, notes }) => {
    const { currentSession, movements } = get();
    if (!currentSession) throw new Error("No active drawer session to close");

    // Calculate all cash sales recorded since session opened
    const orders = await db.orders
      .where("status")
      .equals("COMPLETED")
      .toArray();

    const sessionOrders = orders.filter(
      (o) =>
        new Date(o.created_at) >= new Date(currentSession.opened_at) &&
        o.payment_method === "CASH"
    );

    const cashSalesTotal = sessionOrders.reduce((sum, o) => sum + o.total_amount, 0);

    const payIns = movements
      .filter((m) => m.movement_type === "PAY_IN")
      .reduce((sum, m) => sum + m.amount, 0);

    const payOuts = movements
      .filter((m) => m.movement_type === "PAY_OUT")
      .reduce((sum, m) => sum + m.amount, 0);

    const expectedCash = currentSession.opening_float + cashSalesTotal + payIns - payOuts;
    const variance = closingFloat - expectedCash;

    const updatedSession: LocalCashSession = {
      ...currentSession,
      closing_float: closingFloat,
      expected_cash: expectedCash,
      variance,
      status: "CLOSED",
      closed_at: new Date().toISOString(),
      notes,
      denominations,
    };

    await db.cashSessions.put(updatedSession);
    await syncEngine.enqueue("CASH_MOVEMENT", {
      type: "DRAWER_CLOSED",
      session: updatedSession,
    });

    set({ currentSession: null, movements: [] });
    return { session: updatedSession, variance };
  },
}));
