export interface StockItemDef {
  id: string;
  name: string;
  category: "COFFEE" | "DAIRY" | "SYRUPS" | "BAKERY_RAW" | "PACKAGING" | "PROTEIN";
  unit: string; // kg, L, pcs, packs
  current_qty: number;
  min_reorder_qty: number;
  avg_unit_cost: number; // in PKR
  is_prep_item?: boolean;
}

export interface RecipeDef {
  id: string;
  item_id: string;
  item_name: string;
  variant_name?: string;
  lines: {
    stock_item_id: string;
    stock_item_name: string;
    quantity: number; // in stock_item unit
    unit: string;
    unit_cost: number;
  }[];
}

export interface VendorDef {
  id: string;
  name: string;
  contact_person: string;
  phone: string;
  whatsapp: string;
  email: string;
  payment_terms: string;
  rating: number;
  balance_due: number;
  supplied_item_ids: string[];
}

export interface PurchaseOrderDef {
  id: string;
  po_number: string;
  vendor_id: string;
  vendor_name: string;
  status: "DRAFT" | "ISSUED" | "PARTIALLY_RECEIVED" | "COMPLETED" | "CANCELLED";
  total_amount: number;
  lines: {
    stock_item_id: string;
    stock_item_name: string;
    quantity: number;
    unit_price: number;
    line_total: number;
  }[];
  expected_date: string;
  created_at: string;
}

export interface GoodsReceiptDef {
  id: string;
  grn_number: string;
  po_id?: string;
  vendor_name: string;
  received_date: string;
  received_by: string;
  lines: {
    stock_item_id: string;
    stock_item_name: string;
    qty_received: number;
    unit_cost: number;
    batch_number?: string;
    expiry_date?: string;
  }[];
  total_value: number;
}

export interface VendorBillDef {
  id: string;
  bill_number: string;
  vendor_id: string;
  vendor_name: string;
  amount: number;
  paid_amount: number;
  due_date: string;
  is_paid: boolean;
  created_at: string;
}

export interface ExpenseDef {
  id: string;
  category: "RENT" | "UTILITIES" | "MAINTENANCE" | "CLEANING" | "PACKAGING" | "STAFF_PETTY";
  amount: number;
  paid_by: "CASH" | "BANK";
  description: string;
  receipt_url?: string;
  is_recurring: boolean;
  created_at: string;
}

export interface WastageDef {
  id: string;
  stock_item_id: string;
  stock_item_name: string;
  quantity: number;
  unit: string;
  cost_value: number;
  reason: "SPILLED_DROPPED" | "EXPIRED_SPOILED" | "BURNT_PREP_ERROR" | "STAFF_TASTING";
  notes?: string;
  recorded_by: string;
  created_at: string;
}

export const SAMPLE_STOCK_ITEMS: StockItemDef[] = [
  { id: "stk-beans", name: "Rewind Espresso Beans (Ethiopian Yirgacheffe)", category: "COFFEE", unit: "kg", current_qty: 14.5, min_reorder_qty: 10.0, avg_unit_cost: 4200 },
  { id: "stk-milk-whole", name: "Fresh Farm Whole Milk (3.5% Fat)", category: "DAIRY", unit: "L", current_qty: 42.0, min_reorder_qty: 30.0, avg_unit_cost: 240 },
  { id: "stk-milk-oat", name: "Minor Figures Barista Oat Milk", category: "DAIRY", unit: "L", current_qty: 8.0, min_reorder_qty: 12.0, avg_unit_cost: 950 },
  { id: "stk-milk-almond", name: "Blue Diamond Almond Milk (Barista)", category: "DAIRY", unit: "L", current_qty: 5.0, min_reorder_qty: 8.0, avg_unit_cost: 1100 },
  { id: "stk-vanilla-syr", name: "Monin Madagascar Vanilla Syrup", category: "SYRUPS", unit: "L", current_qty: 3.2, min_reorder_qty: 2.0, avg_unit_cost: 2600 },
  { id: "stk-caramel-syr", name: "Monin Salted Caramel Syrup", category: "SYRUPS", unit: "L", current_qty: 2.8, min_reorder_qty: 2.0, avg_unit_cost: 2600 },
  { id: "stk-tea-leaves", name: "Kenyan CTC Black Tea Leaves (Karak)", category: "COFFEE", unit: "kg", current_qty: 8.0, min_reorder_qty: 5.0, avg_unit_cost: 1600 },
  { id: "stk-condensed-milk", name: "Nestle Sweetened Condensed Milk", category: "DAIRY", unit: "kg", current_qty: 12.0, min_reorder_qty: 8.0, avg_unit_cost: 850 },
  { id: "stk-croissant-raw", name: "French Frozen Butter Croissant Dough", category: "BAKERY_RAW", unit: "pcs", current_qty: 48, min_reorder_qty: 30, avg_unit_cost: 140 },
  { id: "stk-chicken-breast", name: "Smoked Chicken Breast (Pre-Cooked)", category: "PROTEIN", unit: "kg", current_qty: 9.5, min_reorder_qty: 6.0, avg_unit_cost: 1250 },
  { id: "stk-cheddar", name: "Vintage White Cheddar Cheese", category: "DAIRY", unit: "kg", current_qty: 4.2, min_reorder_qty: 3.0, avg_unit_cost: 2800 },
  { id: "stk-sourdough", name: "Artisan Sourdough Loaf (Pre-sliced)", category: "BAKERY_RAW", unit: "packs", current_qty: 11, min_reorder_qty: 8, avg_unit_cost: 450 },
  { id: "stk-chocolate-callebaut", name: "Callebaut 70% Dark Chocolate Callets", category: "BAKERY_RAW", unit: "kg", current_qty: 6.0, min_reorder_qty: 4.0, avg_unit_cost: 3800 },
  { id: "stk-cup-8oz", name: "Rewind Embossed 8oz Paper Cups", category: "PACKAGING", unit: "pcs", current_qty: 340, min_reorder_qty: 200, avg_unit_cost: 18 },
  { id: "stk-cup-12oz", name: "Rewind Embossed 12oz Paper Cups", category: "PACKAGING", unit: "pcs", current_qty: 410, min_reorder_qty: 250, avg_unit_cost: 22 },
  { id: "stk-lids", name: "Compostable Sip Lids (8/12oz)", category: "PACKAGING", unit: "pcs", current_qty: 680, min_reorder_qty: 400, avg_unit_cost: 8 },
];

export const SAMPLE_RECIPES: RecipeDef[] = [
  {
    id: "rec-latte-reg",
    item_id: "item-latte",
    item_name: "Rewind Velvet Latte (Regular 8oz)",
    variant_name: "Regular (8 oz)",
    lines: [
      { stock_item_id: "stk-beans", stock_item_name: "Rewind Espresso Beans", quantity: 0.018, unit: "kg", unit_cost: 4200 }, // 18g
      { stock_item_id: "stk-milk-whole", stock_item_name: "Fresh Whole Milk", quantity: 0.20, unit: "L", unit_cost: 240 }, // 200ml
      { stock_item_id: "stk-cup-8oz", stock_item_name: "8oz Paper Cup", quantity: 1, unit: "pcs", unit_cost: 18 },
      { stock_item_id: "stk-lids", stock_item_name: "Compostable Sip Lid", quantity: 1, unit: "pcs", unit_cost: 8 },
    ],
  },
  {
    id: "rec-espresso",
    item_id: "item-espresso",
    item_name: "Double Espresso",
    lines: [
      { stock_item_id: "stk-beans", stock_item_name: "Rewind Espresso Beans", quantity: 0.018, unit: "kg", unit_cost: 4200 },
      { stock_item_id: "stk-cup-8oz", stock_item_name: "8oz Paper Cup", quantity: 1, unit: "pcs", unit_cost: 18 },
    ],
  },
  {
    id: "rec-iced-caramel",
    item_id: "item-iced-caramel-latte",
    item_name: "Iced Salted Caramel Latte (12oz)",
    lines: [
      { stock_item_id: "stk-beans", stock_item_name: "Rewind Espresso Beans", quantity: 0.018, unit: "kg", unit_cost: 4200 },
      { stock_item_id: "stk-milk-whole", stock_item_name: "Fresh Whole Milk", quantity: 0.22, unit: "L", unit_cost: 240 },
      { stock_item_id: "stk-caramel-syr", stock_item_name: "Salted Caramel Syrup", quantity: 0.025, unit: "L", unit_cost: 2600 },
      { stock_item_id: "stk-cup-12oz", stock_item_name: "12oz Paper Cup", quantity: 1, unit: "pcs", unit_cost: 22 },
      { stock_item_id: "stk-lids", stock_item_name: "Compostable Sip Lid", quantity: 1, unit: "pcs", unit_cost: 8 },
    ],
  },
  {
    id: "rec-karak-chai",
    item_id: "item-karak-chai",
    item_name: "Dhabba Karak Chai",
    lines: [
      { stock_item_id: "stk-tea-leaves", stock_item_name: "Kenyan CTC Tea Leaves", quantity: 0.012, unit: "kg", unit_cost: 1600 },
      { stock_item_id: "stk-condensed-milk", stock_item_name: "Condensed Milk", quantity: 0.035, unit: "kg", unit_cost: 850 },
      { stock_item_id: "stk-cup-8oz", stock_item_name: "8oz Paper Cup", quantity: 1, unit: "pcs", unit_cost: 18 },
    ],
  },
  {
    id: "rec-club-sandwich",
    item_id: "item-club-sandwich",
    item_name: "Rewind Triple-Decker Club",
    lines: [
      { stock_item_id: "stk-chicken-breast", stock_item_name: "Smoked Chicken Breast", quantity: 0.16, unit: "kg", unit_cost: 1250 },
      { stock_item_id: "stk-cheddar", stock_item_name: "White Cheddar Cheese", quantity: 0.04, unit: "kg", unit_cost: 2800 },
      { stock_item_id: "stk-sourdough", stock_item_name: "Sourdough Bread Slices", quantity: 0.3, unit: "packs", unit_cost: 450 },
    ],
  },
];

export const SAMPLE_VENDORS: VendorDef[] = [
  {
    id: "ven-roasters",
    name: "Artisan Coffee Roasters Pvt Ltd",
    contact_person: "Khurram Shahzad",
    phone: "0301-8554210",
    whatsapp: "923018554210",
    email: "orders@artisancoffee.pk",
    payment_terms: "Net 15 Days",
    rating: 5,
    balance_due: 42000,
    supplied_item_ids: ["stk-beans", "stk-vanilla-syr", "stk-caramel-syr"],
  },
  {
    id: "ven-dairy",
    name: "Pure Alpine Dairy Farms",
    contact_person: "Rashid Mehmood",
    phone: "0321-5541920",
    whatsapp: "923215541920",
    email: "sales@alpinedairy.pk",
    payment_terms: "Weekly COD",
    rating: 5,
    balance_due: 14600,
    supplied_item_ids: ["stk-milk-whole", "stk-condensed-milk", "stk-cheddar"],
  },
  {
    id: "ven-packaging",
    name: "EcoPack Sustainable Packaging Co",
    contact_person: "Ayesha Malik",
    phone: "0333-5128900",
    whatsapp: "923335128900",
    email: "ayesha@ecopack.com.pk",
    payment_terms: "Net 30 Days",
    rating: 4,
    balance_due: 28500,
    supplied_item_ids: ["stk-cup-8oz", "stk-cup-12oz", "stk-lids"],
  },
];

export const SAMPLE_PURCHASE_ORDERS: PurchaseOrderDef[] = [
  {
    id: "po-101",
    po_number: "PO-2026-089",
    vendor_id: "ven-roasters",
    vendor_name: "Artisan Coffee Roasters Pvt Ltd",
    status: "COMPLETED",
    total_amount: 42000,
    lines: [
      { stock_item_id: "stk-beans", stock_item_name: "Rewind Espresso Beans (kg)", quantity: 10, unit_price: 4200, line_total: 42000 },
    ],
    expected_date: "2026-11-04",
    created_at: "2026-11-01T10:30:00Z",
  },
  {
    id: "po-102",
    po_number: "PO-2026-090",
    vendor_id: "ven-dairy",
    vendor_name: "Pure Alpine Dairy Farms",
    status: "ISSUED",
    total_amount: 19200,
    lines: [
      { stock_item_id: "stk-milk-whole", stock_item_name: "Fresh Whole Milk (L)", quantity: 80, unit_price: 240, line_total: 19200 },
    ],
    expected_date: "2026-11-03",
    created_at: "2026-11-02T09:00:00Z",
  },
];

export const SAMPLE_EXPENSES: ExpenseDef[] = [
  { id: "exp-1", category: "UTILITIES", amount: 18500, paid_by: "BANK", description: "Electricity IESCO Commercial Bill Oct", is_recurring: true, created_at: "2026-11-01T14:00:00Z" },
  { id: "exp-2", category: "CLEANING", amount: 3200, paid_by: "CASH", description: "Espresso machine backflush powder & cloths", is_recurring: false, created_at: "2026-11-02T11:20:00Z" },
  { id: "exp-3", category: "MAINTENANCE", amount: 4500, paid_by: "CASH", description: "Water filter cartridge replacement", is_recurring: false, created_at: "2026-11-02T16:45:00Z" },
];
