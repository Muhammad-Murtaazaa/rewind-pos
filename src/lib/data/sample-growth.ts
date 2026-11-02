export interface CustomerDef {
  id: string;
  phone: string;
  name: string;
  email?: string;
  birthday?: string;
  loyalty_points: number;
  stamp_count: number; // 0 to 10 for "10th coffee free"
  credit_balance: number; // store credit / tab
  credit_limit: number;
  visits_count: number;
  total_spent: number;
  favourite_item: string;
  tier: "BRONZE" | "SILVER" | "GOLD" | "VIP";
}

export interface GiftCardDef {
  id: string;
  code: string;
  balance: number;
  original_value: number;
  is_active: boolean;
  expires_at: string;
  recipient_name?: string;
}

export interface PromoCodeDef {
  id: string;
  code: string;
  discount_pct?: number;
  discount_val?: number;
  min_order_amount: number;
  is_active: boolean;
  usage_count: number;
}

export interface CustomerFeedbackDef {
  id: string;
  order_id: string;
  customer_name: string;
  rating: number; // 1-5
  comment: string;
  created_at: string;
}

export interface CampaignDef {
  id: string;
  segment: string;
  title: string;
  message: string;
  channel: "WHATSAPP" | "SMS";
  audience_count: number;
  sent_at?: string;
}

export const SAMPLE_CUSTOMERS: CustomerDef[] = [
  {
    id: "cust-1",
    phone: "0300-8551234",
    name: "Ahmed Hassan",
    email: "ahmed.h@gmail.com",
    birthday: "1994-08-14",
    loyalty_points: 480,
    stamp_count: 8, // 2 more for free coffee!
    credit_balance: 0,
    credit_limit: 5000,
    visits_count: 24,
    total_spent: 28400,
    favourite_item: "Rewind Velvet Latte",
    tier: "GOLD",
  },
  {
    id: "cust-2",
    phone: "0321-4433221",
    name: "Dr. Fatima Noor",
    email: "fatima.noor@clinic.pk",
    birthday: "1988-11-20",
    loyalty_points: 920,
    stamp_count: 10, // Eligible for Free Coffee!
    credit_balance: 1850, // Active corporate tab
    credit_limit: 15000,
    visits_count: 42,
    total_spent: 54200,
    favourite_item: "Iced Salted Caramel Latte",
    tier: "VIP",
  },
  {
    id: "cust-3",
    phone: "0333-9988776",
    name: "Shahmeer Khan",
    email: "shahmeer@startup.io",
    birthday: "1998-04-05",
    loyalty_points: 120,
    stamp_count: 3,
    credit_balance: 0,
    credit_limit: 5000,
    visits_count: 6,
    total_spent: 7200,
    favourite_item: "French Butter Croissant",
    tier: "SILVER",
  },
  {
    id: "cust-4",
    phone: "0312-5566778",
    name: "Amina Tariq",
    email: "amina.t@design.com",
    birthday: "1996-12-02",
    loyalty_points: 210,
    stamp_count: 5,
    credit_balance: 0,
    credit_limit: 5000,
    visits_count: 9,
    total_spent: 11400,
    favourite_item: "Pink Kashmiri Noon Chai",
    tier: "SILVER",
  },
];

export const SAMPLE_GIFT_CARDS: GiftCardDef[] = [
  { id: "gc-1", code: "REWIND-COFFEE-2000", balance: 2000, original_value: 2000, is_active: true, expires_at: "2027-12-31", recipient_name: "Ayesha Bibi" },
  { id: "gc-2", code: "REWIND-VIP-5000", balance: 3450, original_value: 5000, is_active: true, expires_at: "2027-06-30", recipient_name: "Dr. Fatima" },
];

export const SAMPLE_PROMO_CODES: PromoCodeDef[] = [
  { id: "pro-1", code: "REWIND10", discount_pct: 10, min_order_amount: 1000, is_active: true, usage_count: 84 },
  { id: "pro-2", code: "KARAKCHAI", discount_val: 100, min_order_amount: 500, is_active: true, usage_count: 142 },
  { id: "pro-3", code: "WELCOME20", discount_pct: 20, min_order_amount: 1500, is_active: true, usage_count: 35 },
];

export const SAMPLE_FEEDBACK: CustomerFeedbackDef[] = [
  { id: "fb-1", order_id: "T1-0104", customer_name: "Ahmed Hassan", rating: 5, comment: "Best Velvet Latte in Islamabad! Super smooth microfoam.", created_at: "2026-11-02T14:30:00Z" },
  { id: "fb-2", order_id: "T1-0108", customer_name: "Dr. Fatima Noor", rating: 5, comment: "Iced caramel latte was perfection. Fast counter service.", created_at: "2026-11-02T16:15:00Z" },
  { id: "fb-3", order_id: "T1-0112", customer_name: "Shahmeer Khan", rating: 4, comment: "Croissant was flaky and hot, but table was slightly crowded.", created_at: "2026-11-02T18:00:00Z" },
];
