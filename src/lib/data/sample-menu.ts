export interface ModifierOption {
  id: string;
  name_en: string;
  name_ur: string;
  price_add: number;
  is_default?: boolean;
}

export interface ModifierGroupDef {
  id: string;
  name_en: string;
  name_ur: string;
  is_required: boolean;
  min_select: number;
  max_select: number;
  options: ModifierOption[];
}

export interface ItemVariantDef {
  id: string;
  name: string; // "Regular", "Large", etc.
  price: number;
}

export interface MenuItemDef {
  id: string;
  category_id: string;
  name_en: string;
  name_ur: string;
  description: string;
  base_price: number;
  cost_price: number;
  tax_rate: number;
  photo_url: string;
  station_type: "BAR" | "KITCHEN";
  is_favourite: boolean;
  is_available: boolean;
  dietary_tags: string[];
  variants?: ItemVariantDef[];
  modifier_group_ids?: string[];
}

export interface CategoryDef {
  id: string;
  name_en: string;
  name_ur: string;
  slug: string;
  color_code: string;
  sort_order: number;
}

export const SAMPLE_CATEGORIES: CategoryDef[] = [
  { id: "cat-hot-coffee", name_en: "Hot Coffee", name_ur: "گرم کافی", slug: "hot-coffee", color_code: "#E07A3F", sort_order: 1 },
  { id: "cat-cold-drinks", name_en: "Cold Drinks & Iced", name_ur: "ٹھنڈے مشروبات", slug: "cold-drinks", color_code: "#7C9A7E", sort_order: 2 },
  { id: "cat-tea", name_en: "Artisanal Chai & Tea", name_ur: "چائے اور قہوہ", slug: "chai-tea", color_code: "#D9A441", sort_order: 3 },
  { id: "cat-bakery", name_en: "Bakery & Pastry", name_ur: "بیکری اور پیسٹری", slug: "bakery", color_code: "#B88628", sort_order: 4 },
  { id: "cat-sandwiches", name_en: "Sandwiches & Mains", name_ur: "سینڈوچ اور کھانے", slug: "sandwiches", color_code: "#C2453B", sort_order: 5 },
  { id: "cat-desserts", name_en: "Desserts", name_ur: "میٹھے پکوان", slug: "desserts", color_code: "#8F5E52", sort_order: 6 },
];

export const SAMPLE_MODIFIER_GROUPS: ModifierGroupDef[] = [
  {
    id: "mod-milk",
    name_en: "Milk Choice",
    name_ur: "دودھ کا انتخاب",
    is_required: false,
    min_select: 0,
    max_select: 1,
    options: [
      { id: "m-whole", name_en: "Whole Dairy Milk", name_ur: "مکمل ملائی دودھ", price_add: 0, is_default: true },
      { id: "m-oat", name_en: "Oat Milk (Barista Blend)", name_ur: "اوٹ ملک", price_add: 180 },
      { id: "m-almond", name_en: "Almond Milk", name_ur: "بادام کا دودھ", price_add: 200 },
      { id: "m-skim", name_en: "Skimmed Milk", name_ur: "سکمڈ دودھ", price_add: 0 },
    ],
  },
  {
    id: "mod-sugar",
    name_en: "Sweetness Level",
    name_ur: "میٹھے کی مقدار",
    is_required: false,
    min_select: 0,
    max_select: 1,
    options: [
      { id: "s-none", name_en: "No Sugar", name_ur: "بغیر چینی", price_add: 0 },
      { id: "s-half", name_en: "Half Sweet (1 cube)", name_ur: "آدھی چینی", price_add: 0 },
      { id: "s-normal", name_en: "Regular Sweet (2 cubes)", name_ur: "معمول کی چینی", price_add: 0, is_default: true },
      { id: "s-jaggery", name_en: "Organic Brown Sugar / Shakkar", name_ur: "شکر / گڑ", price_add: 40 },
    ],
  },
  {
    id: "mod-shot",
    name_en: "Espresso Shots",
    name_ur: "اضافی ایسپریسو شاٹ",
    is_required: false,
    min_select: 0,
    max_select: 2,
    options: [
      { id: "shot-extra", name_en: "Extra Double Shot", name_ur: "اضافی ڈبل شاٹ", price_add: 150 },
      { id: "shot-decaf", name_en: "Decaf Roast", name_ur: "ڈیکیف", price_add: 80 },
    ],
  },
  {
    id: "mod-syrups",
    name_en: "Flavour Syrups",
    name_ur: "شربت اور ذائقے",
    is_required: false,
    min_select: 0,
    max_select: 3,
    options: [
      { id: "syr-vanilla", name_en: "Madagascar Vanilla", name_ur: "ونیلا شربت", price_add: 120 },
      { id: "syr-caramel", name_en: "Salted Caramel", name_ur: "کیریمل شربت", price_add: 120 },
      { id: "syr-hazelnut", name_en: "Roasted Hazelnut", name_ur: "ہیزلناٹ شربت", price_add: 120 },
      { id: "syr-cinnamon", name_en: "Spiced Cinnamon", name_ur: "دار چینی شربت", price_add: 100 },
    ],
  },
];

export const SAMPLE_MENU_ITEMS: MenuItemDef[] = [
  {
    id: "item-espresso",
    category_id: "cat-hot-coffee",
    name_en: "Double Espresso",
    name_ur: "ڈبل ایسپریسو",
    description: "Rich, syrupy double shot pulled from our signature Rewind medium-dark roast blend.",
    base_price: 450,
    cost_price: 90,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80",
    station_type: "BAR",
    is_favourite: true,
    is_available: true,
    dietary_tags: ["Vegetarian", "Gluten-Free"],
    variants: [
      { id: "var-single", name: "Solo (Single)", price: 380 },
      { id: "var-double", name: "Doppio (Double)", price: 450 },
    ],
    modifier_group_ids: ["mod-sugar", "mod-shot"],
  },
  {
    id: "item-latte",
    category_id: "cat-hot-coffee",
    name_en: "Rewind Velvet Latte",
    name_ur: "ری وائنڈ ویلوٹ لاٹے",
    description: "Silky micro-foam poured over a double espresso with gentle cocoa notes.",
    base_price: 680,
    cost_price: 160,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80",
    station_type: "BAR",
    is_favourite: true,
    is_available: true,
    dietary_tags: ["Vegetarian"],
    variants: [
      { id: "var-latte-reg", name: "Regular (8 oz)", price: 680 },
      { id: "var-latte-lrg", name: "Large (12 oz)", price: 780 },
    ],
    modifier_group_ids: ["mod-milk", "mod-sugar", "mod-shot", "mod-syrups"],
  },
  {
    id: "item-cappuccino",
    category_id: "cat-hot-coffee",
    name_en: "Classic Cappuccino",
    name_ur: "کلاسک کیپوچینو",
    description: "Equal thirds of bold espresso, steamed milk, and airy micro-foam dusted with cinnamon.",
    base_price: 650,
    cost_price: 150,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80",
    station_type: "BAR",
    is_favourite: true,
    is_available: true,
    dietary_tags: ["Vegetarian"],
    variants: [
      { id: "var-cap-reg", name: "Regular (8 oz)", price: 650 },
      { id: "var-cap-lrg", name: "Large (12 oz)", price: 750 },
    ],
    modifier_group_ids: ["mod-milk", "mod-sugar", "mod-shot"],
  },
  {
    id: "item-iced-caramel-latte",
    category_id: "cat-cold-drinks",
    name_en: "Iced Salted Caramel Latte",
    name_ur: "آئسڈ سالٹڈ کیریمل لاٹے",
    description: "Chilled espresso, milk, and house-made salted butter caramel drizzled over clear ice cubes.",
    base_price: 780,
    cost_price: 190,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1517701604599-bb29b565090c?auto=format&fit=crop&w=600&q=80",
    station_type: "BAR",
    is_favourite: true,
    is_available: true,
    dietary_tags: ["Vegetarian"],
    variants: [
      { id: "var-ice-reg", name: "Regular (12 oz)", price: 780 },
      { id: "var-ice-lrg", name: "Grande (16 oz)", price: 890 },
    ],
    modifier_group_ids: ["mod-milk", "mod-sugar", "mod-syrups"],
  },
  {
    id: "item-cold-brew",
    category_id: "cat-cold-drinks",
    name_en: "18-Hour Slow Cold Brew",
    name_ur: "سلو کولڈ برُو",
    description: "Steeped for 18 hours in cold filtered spring water. Naturally sweet, low acidity.",
    base_price: 620,
    cost_price: 120,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80",
    station_type: "BAR",
    is_favourite: false,
    is_available: true,
    dietary_tags: ["Vegetarian", "Gluten-Free"],
    modifier_group_ids: ["mod-syrups"],
  },
  {
    id: "item-karak-chai",
    category_id: "cat-tea",
    name_en: "Dhabba Karak Chai",
    name_ur: "ڈھابہ کڑک چائے",
    description: "Slow-brewed loose Kenyan black tea leaves simmered with condensed cardamom milk.",
    base_price: 320,
    cost_price: 70,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80",
    station_type: "BAR",
    is_favourite: true,
    is_available: true,
    dietary_tags: ["Vegetarian"],
    modifier_group_ids: ["mod-sugar"],
  },
  {
    id: "item-kashmiri-chai",
    category_id: "cat-tea",
    name_en: "Pink Kashmiri Noon Chai",
    name_ur: "کشمیری نون چائے",
    description: "Traditional pink tea infused with crushed pistachios, almonds, and sea-salt froth.",
    base_price: 420,
    cost_price: 110,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1564890369478-c89ca6d9cde9?auto=format&fit=crop&w=600&q=80",
    station_type: "BAR",
    is_favourite: false,
    is_available: true,
    dietary_tags: ["Vegetarian", "Contains Nuts"],
  },
  {
    id: "item-croissant",
    category_id: "cat-bakery",
    name_en: "French Butter Croissant",
    name_ur: "فرینچ بٹر کروسانٹ",
    description: "27-layer flaky French butter pastry baked fresh daily every morning at 7 AM.",
    base_price: 480,
    cost_price: 140,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80",
    station_type: "KITCHEN",
    is_favourite: true,
    is_available: true,
    dietary_tags: ["Vegetarian"],
  },
  {
    id: "item-club-sandwich",
    category_id: "cat-sandwiches",
    name_en: "Rewind Triple-Decker Club",
    name_ur: "ری وائنڈ کلب سینڈوچ",
    description: "Smoked grilled chicken breast, beef bacon rashers, cheddar cheese, fried egg and potato crisps.",
    base_price: 950,
    cost_price: 340,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80",
    station_type: "KITCHEN",
    is_favourite: true,
    is_available: true,
    dietary_tags: [],
  },
  {
    id: "item-avocado-toast",
    category_id: "cat-sandwiches",
    name_en: "Sourdough Avocado & Poached Egg",
    name_ur: "ایووکاڈو ٹوسٹ اور انڈا",
    description: "Crushed Hass avocado on toasted artisan sourdough, poached egg, chili flakes and extra virgin olive oil.",
    base_price: 880,
    cost_price: 280,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?auto=format&fit=crop&w=600&q=80",
    station_type: "KITCHEN",
    is_favourite: false,
    is_available: true,
    dietary_tags: ["Vegetarian"],
  },
  {
    id: "item-brownie",
    category_id: "cat-desserts",
    name_en: "Warm Belgian Fudgy Brownie",
    name_ur: "بیلجین فج براؤنی",
    description: "Decadent 70% dark chocolate brownie served warm with a scoop of Madagascar vanilla gelato.",
    base_price: 590,
    cost_price: 180,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=600&q=80",
    station_type: "KITCHEN",
    is_favourite: true,
    is_available: true,
    dietary_tags: ["Vegetarian"],
  },
  {
    id: "item-cheesecake",
    category_id: "cat-desserts",
    name_en: "Classic New York Cheesecake",
    name_ur: "نیویارک چیز کیک",
    description: "Creamy baked cheesecake with a crunchy graham cracker crust and wild berry compote.",
    base_price: 720,
    cost_price: 220,
    tax_rate: 16,
    photo_url: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=600&q=80",
    station_type: "KITCHEN",
    is_favourite: false,
    is_available: true,
    dietary_tags: ["Vegetarian"],
  },
];

export const SAMPLE_TABLES = [
  { id: "tbl-1", table_number: "T-01", area: "Indoor", capacity: 2, pos_x: 60, pos_y: 80, shape: "ROUND", is_occupied: false },
  { id: "tbl-2", table_number: "T-02", area: "Indoor", capacity: 4, pos_x: 200, pos_y: 80, shape: "SQUARE", is_occupied: false },
  { id: "tbl-3", table_number: "T-03", area: "Indoor", capacity: 4, pos_x: 340, pos_y: 80, shape: "SQUARE", is_occupied: true, occupied_minutes: 24, order_total: 1860 },
  { id: "tbl-4", table_number: "T-04", area: "Indoor", capacity: 6, pos_x: 480, pos_y: 80, shape: "RECTANGLE", is_occupied: false },
  { id: "tbl-5", table_number: "T-05", area: "Courtyard", capacity: 2, pos_x: 60, pos_y: 220, shape: "ROUND", is_occupied: false },
  { id: "tbl-6", table_number: "T-06", area: "Courtyard", capacity: 4, pos_x: 200, pos_y: 220, shape: "SQUARE", is_occupied: true, occupied_minutes: 11, order_total: 970 },
  { id: "tbl-7", table_number: "T-07", area: "Veranda", capacity: 4, pos_x: 340, pos_y: 220, shape: "SQUARE", is_occupied: false },
  { id: "tbl-8", table_number: "T-08", area: "Veranda", capacity: 6, pos_x: 480, pos_y: 220, shape: "RECTANGLE", is_occupied: false },
];

export const SAMPLE_STAFF = [
  { id: "user-1", name: "Hamza Malik (Owner)", role: "OWNER", pin: "1111", email: "owner@rewindcafe.pk", avatar: "👨‍💼" },
  { id: "user-2", name: "Sana Tariq (Manager)", role: "MANAGER", pin: "2222", email: "manager@rewindcafe.pk", avatar: "👩‍💼" },
  { id: "user-3", name: "Ali Raza (Cashier)", role: "CASHIER", pin: "3333", email: "ali@rewindcafe.pk", avatar: "🧑‍💻" },
  { id: "user-4", name: "Zainab Bibi (Barista)", role: "BARISTA", pin: "4444", email: "barista@rewindcafe.pk", avatar: "☕" },
  { id: "user-5", name: "Bilal Khan (Kitchen Chef)", role: "KITCHEN", pin: "5555", email: "chef@rewindcafe.pk", avatar: "👨‍🍳" },
  { id: "user-6", name: "Usman Ghani (Floor Waiter)", role: "WAITER", pin: "6666", email: "waiter@rewindcafe.pk", avatar: "🤵" },
];
