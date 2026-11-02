import Dexie, { type Table as DexieTable } from "dexie";
import {
  SAMPLE_CATEGORIES,
  SAMPLE_MENU_ITEMS,
  SAMPLE_MODIFIER_GROUPS,
  SAMPLE_STAFF,
  SAMPLE_TABLES,
  type CategoryDef,
  type MenuItemDef,
  type ModifierGroupDef,
} from "../data/sample-menu";
import {
  SAMPLE_STOCK_ITEMS,
  SAMPLE_RECIPES,
  SAMPLE_VENDORS,
  SAMPLE_PURCHASE_ORDERS,
  SAMPLE_EXPENSES,
  type StockItemDef,
  type RecipeDef,
  type VendorDef,
  type PurchaseOrderDef,
  type GoodsReceiptDef,
  type VendorBillDef,
  type ExpenseDef,
  type WastageDef,
} from "../data/sample-inventory";
import {
  SAMPLE_STAFF_PROFILES,
  SAMPLE_ATTENDANCE,
  SAMPLE_SHIFTS,
  DEFAULT_CHART_OF_ACCOUNTS,
  type StaffProfileDef,
  type AttendanceRecordDef,
  type ShiftScheduleDef,
  type LeaveRequestDef,
  type PayslipDef,
  type AccountDef,
  type JournalEntryDef,
} from "../data/sample-hr-accounting";

export interface LocalOrder {
  id: string; // client UUIDv7
  order_number: string;
  order_type: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  status: "PENDING" | "CONFIRMED" | "PREPARING" | "READY" | "SERVED" | "COMPLETED" | "VOIDED";
  table_id?: string;
  table_number?: string;
  cashier_id: string;
  cashier_name: string;
  customer_name?: string;
  customer_phone?: string;
  items: LocalOrderItem[];
  subtotal: number;
  discount_amount: number;
  discount_reason?: string;
  tax_amount: number;
  service_charge: number;
  total_amount: number;
  notes?: string;
  payment_method?: string;
  amount_tendered?: number;
  change_returned?: number;
  sync_status: "PENDING" | "SYNCED" | "FAILED";
  created_at: string;
  updated_at: string;
  held_at?: string;
}

export interface LocalOrderItem {
  id: string;
  item_id: string;
  item_name: string;
  variant_name?: string;
  unit_price: number;
  quantity: number;
  total_price: number;
  discount_amount: number;
  notes?: string;
  station_type: "BAR" | "KITCHEN";
  selected_modifiers: {
    modifier_id: string;
    modifier_name: string;
    price_add: number;
  }[];
}

export interface LocalKDSTicket {
  id: string;
  order_id: string;
  order_number: string;
  order_type: "DINE_IN" | "TAKEAWAY" | "DELIVERY";
  table_label?: string;
  station_type: "BAR" | "KITCHEN";
  status: "PENDING" | "PREPARING" | "READY" | "SERVED";
  items: {
    id: string;
    item_name: string;
    variant_name?: string;
    quantity: number;
    notes?: string;
    modifiers: string[];
    status: "PENDING" | "PREPARING" | "READY";
  }[];
  created_at: string;
  updated_at: string;
}

export interface LocalCashSession {
  id: string;
  user_id: string;
  user_name: string;
  opening_float: number;
  closing_float?: number;
  expected_cash?: number;
  variance?: number;
  status: "OPEN" | "CLOSED";
  notes?: string;
  opened_at: string;
  closed_at?: string;
  denominations?: Record<string, number>;
}

export interface LocalCashMovement {
  id: string;
  session_id: string;
  movement_type: "PAY_IN" | "PAY_OUT";
  amount: number;
  reason: string;
  created_at: string;
  recorded_by: string;
}

export interface LocalTable {
  id: string;
  table_number: string;
  area: string;
  capacity: number;
  pos_x: number;
  pos_y: number;
  shape: string;
  is_occupied: boolean;
  occupied_minutes?: number;
  order_total?: number;
  current_order_id?: string;
  waiter_name?: string;
}

export interface LocalStockMovement {
  id: string;
  stock_item_id: string;
  movement_type: "SALE_DEDUCTION" | "PURCHASE_RECEIPT" | "WASTAGE" | "COUNT_ADJUSTMENT";
  quantity: number;
  cost_value: number;
  reference_id?: string;
  created_at: string;
}

export interface OutboxRecord {
  id: string;
  event_type: "ORDER_CREATED" | "ORDER_PAID" | "ORDER_VOIDED" | "CASH_MOVEMENT" | "KDS_BUMP" | "STOCK_COUNT" | "CLOCK_IN" | "PO_CREATED" | "GRN_RECEIVED" | "EXPENSE_LOGGED" | "PAYROLL_POSTED";
  payload: any;
  retry_count: number;
  created_at: string;
  status: "PENDING" | "SYNCED" | "FAILED";
  error_message?: string;
}

export interface LocalStaff {
  id: string;
  name: string;
  role: string;
  pin: string;
  email?: string;
  avatar?: string;
}

class RewindDatabase extends Dexie {
  items!: DexieTable<MenuItemDef, string>;
  categories!: DexieTable<CategoryDef, string>;
  modifierGroups!: DexieTable<ModifierGroupDef, string>;
  orders!: DexieTable<LocalOrder, string>;
  kdsTickets!: DexieTable<LocalKDSTicket, string>;
  cashSessions!: DexieTable<LocalCashSession, string>;
  cashMovements!: DexieTable<LocalCashMovement, string>;
  diningTables!: DexieTable<LocalTable, string>;
  outbox!: DexieTable<OutboxRecord, string>;
  staff!: DexieTable<LocalStaff, string>;

  // Phase 2: Back Office Tables
  stockItems!: DexieTable<StockItemDef, string>;
  recipes!: DexieTable<RecipeDef, string>;
  stockMovements!: DexieTable<LocalStockMovement, string>;
  vendors!: DexieTable<VendorDef, string>;
  purchaseOrders!: DexieTable<PurchaseOrderDef, string>;
  goodsReceipts!: DexieTable<GoodsReceiptDef, string>;
  vendorBills!: DexieTable<VendorBillDef, string>;
  expenses!: DexieTable<ExpenseDef, string>;
  wastageRecords!: DexieTable<WastageDef, string>;

  // Phase 3: People & Money Tables
  staffProfiles!: DexieTable<StaffProfileDef, string>;
  attendance!: DexieTable<AttendanceRecordDef, string>;
  shiftSchedules!: DexieTable<ShiftScheduleDef, string>;
  leaveRequests!: DexieTable<LeaveRequestDef, string>;
  payslips!: DexieTable<PayslipDef, string>;
  accounts!: DexieTable<AccountDef, string>;
  journalEntries!: DexieTable<JournalEntryDef, string>;

  constructor() {
    super("RewindCafePOS");

    this.version(3).stores({
      items: "id, category_id, name_en, station_type, is_favourite, is_available",
      categories: "id, slug, sort_order",
      modifierGroups: "id",
      orders: "id, order_number, order_type, status, table_id, cashier_id, sync_status, created_at, held_at",
      kdsTickets: "id, order_id, station_type, status, created_at",
      cashSessions: "id, user_id, status, opened_at",
      cashMovements: "id, session_id, movement_type, created_at",
      diningTables: "id, table_number, area, is_occupied",
      outbox: "id, event_type, status, created_at",
      staff: "id, role, pin",

      // Phase 2 stores
      stockItems: "id, name, category, current_qty",
      recipes: "id, item_id",
      stockMovements: "id, stock_item_id, movement_type, created_at",
      vendors: "id, name",
      purchaseOrders: "id, po_number, vendor_id, status, created_at",
      goodsReceipts: "id, grn_number, created_at",
      vendorBills: "id, vendor_id, is_paid",
      expenses: "id, category, paid_by, created_at",
      wastageRecords: "id, stock_item_id, reason, created_at",

      // Phase 3 stores
      staffProfiles: "id, user_id, name, role",
      attendance: "id, user_id, status, clock_in",
      shiftSchedules: "id, user_id, day_of_week",
      leaveRequests: "id, user_id, status",
      payslips: "id, payroll_run_id, user_id",
      accounts: "code, type",
      journalEntries: "id, entry_date, reference_no",
    });
  }

  async seedDefaultsIfEmpty() {
    const itemsCount = await this.items.count();
    if (itemsCount === 0) {
      await this.categories.bulkAdd(SAMPLE_CATEGORIES);
      await this.modifierGroups.bulkAdd(SAMPLE_MODIFIER_GROUPS);
      await this.items.bulkAdd(SAMPLE_MENU_ITEMS);
      await this.diningTables.bulkAdd(SAMPLE_TABLES as LocalTable[]);
      await this.staff.bulkAdd(SAMPLE_STAFF);

      await this.cashSessions.add({
        id: "sess-default-1",
        user_id: "user-3",
        user_name: "Ali Raza (Cashier)",
        opening_float: 5000,
        status: "OPEN",
        opened_at: new Date().toISOString(),
        notes: "Morning shift float",
      });
    }

    const stockCount = await this.stockItems.count();
    if (stockCount === 0) {
      await this.stockItems.bulkAdd(SAMPLE_STOCK_ITEMS);
      await this.recipes.bulkAdd(SAMPLE_RECIPES);
      await this.vendors.bulkAdd(SAMPLE_VENDORS);
      await this.purchaseOrders.bulkAdd(SAMPLE_PURCHASE_ORDERS);
      await this.expenses.bulkAdd(SAMPLE_EXPENSES);
    }

    const hrCount = await this.staffProfiles.count();
    if (hrCount === 0) {
      await this.staffProfiles.bulkAdd(SAMPLE_STAFF_PROFILES);
      await this.attendance.bulkAdd(SAMPLE_ATTENDANCE);
      await this.shiftSchedules.bulkAdd(SAMPLE_SHIFTS);
      await this.accounts.bulkAdd(DEFAULT_CHART_OF_ACCOUNTS);
    }
  }
}

export const db = new RewindDatabase();

if (typeof window !== "undefined") {
  db.seedDefaultsIfEmpty().catch((err) => console.error("Dexie seed error:", err));
}
