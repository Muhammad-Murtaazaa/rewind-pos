export interface StaffProfileDef {
  id: string;
  user_id: string;
  name: string;
  role: "OWNER" | "MANAGER" | "CASHIER" | "WAITER" | "BARISTA" | "KITCHEN" | "ACCOUNTANT";
  cnic: string;
  phone: string;
  email: string;
  avatar: string;
  salary_type: "MONTHLY" | "HOURLY";
  base_salary: number; // in PKR
  hourly_rate?: number;
  joining_date: string;
  is_active: boolean;
}

export interface AttendanceRecordDef {
  id: string;
  user_id: string;
  staff_name: string;
  clock_in: string;
  clock_out?: string;
  break_minutes: number;
  overtime_minutes: number;
  selfie_url?: string;
  status: "ON_DUTY" | "ON_BREAK" | "COMPLETED";
}

export interface ShiftScheduleDef {
  id: string;
  user_id: string;
  staff_name: string;
  day_of_week: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun";
  shift_name: "Morning (07:00 - 15:30)" | "Evening (15:00 - 23:30)" | "All Day";
  start_time: string;
  end_time: string;
}

export interface LeaveRequestDef {
  id: string;
  user_id: string;
  staff_name: string;
  leave_type: "CASUAL" | "SICK" | "ANNUAL";
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface PayslipDef {
  id: string;
  payroll_run_id: string;
  user_id: string;
  staff_name: string;
  role: string;
  base_pay: number;
  overtime_pay: number;
  bonus: number;
  tip_share: number;
  advances_deducted: number;
  net_salary: number;
  period_month: string;
}

export interface AccountDef {
  code: string;
  name: string;
  type: "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE" | "COGS";
  balance: number;
}

export interface JournalLineDef {
  account_code: string;
  account_name: string;
  debit: number;
  credit: number;
}

export interface JournalEntryDef {
  id: string;
  entry_date: string;
  reference_no: string;
  description: string;
  lines: JournalLineDef[];
}

export const SAMPLE_STAFF_PROFILES: StaffProfileDef[] = [
  {
    id: "sp-1",
    user_id: "user-1",
    name: "Hamza Malik",
    role: "OWNER",
    cnic: "61101-1234567-1",
    phone: "0300-5551122",
    email: "owner@rewindcafe.pk",
    avatar: "👨‍💼",
    salary_type: "MONTHLY",
    base_salary: 150000,
    joining_date: "2024-01-01",
    is_active: true,
  },
  {
    id: "sp-2",
    user_id: "user-2",
    name: "Sana Tariq",
    role: "MANAGER",
    cnic: "61101-7654321-2",
    phone: "0333-8884411",
    email: "manager@rewindcafe.pk",
    avatar: "👩‍💼",
    salary_type: "MONTHLY",
    base_salary: 85000,
    joining_date: "2024-03-15",
    is_active: true,
  },
  {
    id: "sp-3",
    user_id: "user-3",
    name: "Ali Raza",
    role: "CASHIER",
    cnic: "37405-9988771-3",
    phone: "0312-4411223",
    email: "ali@rewindcafe.pk",
    avatar: "🧑‍💻",
    salary_type: "MONTHLY",
    base_salary: 45000,
    joining_date: "2024-06-01",
    is_active: true,
  },
  {
    id: "sp-4",
    user_id: "user-4",
    name: "Zainab Bibi",
    role: "BARISTA",
    cnic: "61101-3322110-4",
    phone: "0345-1239874",
    email: "barista@rewindcafe.pk",
    avatar: "☕",
    salary_type: "MONTHLY",
    base_salary: 52000,
    joining_date: "2024-04-10",
    is_active: true,
  },
  {
    id: "sp-5",
    user_id: "user-5",
    name: "Bilal Khan",
    role: "KITCHEN",
    cnic: "17301-4455667-5",
    phone: "0302-9988112",
    email: "chef@rewindcafe.pk",
    avatar: "👨‍🍳",
    salary_type: "MONTHLY",
    base_salary: 55000,
    joining_date: "2024-05-01",
    is_active: true,
  },
  {
    id: "sp-6",
    user_id: "user-6",
    name: "Usman Ghani",
    role: "WAITER",
    cnic: "37405-6677889-6",
    phone: "0315-7766554",
    email: "waiter@rewindcafe.pk",
    avatar: "🤵",
    salary_type: "HOURLY",
    base_salary: 38000,
    hourly_rate: 220,
    joining_date: "2024-07-15",
    is_active: true,
  },
];

export const SAMPLE_ATTENDANCE: AttendanceRecordDef[] = [
  {
    id: "att-1",
    user_id: "user-3",
    staff_name: "Ali Raza (Cashier)",
    clock_in: new Date(Date.now() - 3600000 * 6).toISOString(),
    break_minutes: 30,
    overtime_minutes: 0,
    status: "ON_DUTY",
  },
  {
    id: "att-2",
    user_id: "user-4",
    staff_name: "Zainab Bibi (Barista)",
    clock_in: new Date(Date.now() - 3600000 * 5).toISOString(),
    break_minutes: 15,
    overtime_minutes: 45,
    status: "ON_DUTY",
  },
  {
    id: "att-3",
    user_id: "user-5",
    staff_name: "Bilal Khan (Chef)",
    clock_in: new Date(Date.now() - 3600000 * 6.5).toISOString(),
    break_minutes: 20,
    overtime_minutes: 0,
    status: "ON_DUTY",
  },
];

export const SAMPLE_SHIFTS: ShiftScheduleDef[] = [
  { id: "sh-1", user_id: "user-4", staff_name: "Zainab Bibi", day_of_week: "Mon", shift_name: "Morning (07:00 - 15:30)", start_time: "07:00", end_time: "15:30" },
  { id: "sh-2", user_id: "user-3", staff_name: "Ali Raza", day_of_week: "Mon", shift_name: "Morning (07:00 - 15:30)", start_time: "07:00", end_time: "15:30" },
  { id: "sh-3", user_id: "user-5", staff_name: "Bilal Khan", day_of_week: "Mon", shift_name: "Morning (07:00 - 15:30)", start_time: "07:00", end_time: "15:30" },
  { id: "sh-4", user_id: "user-6", staff_name: "Usman Ghani", day_of_week: "Mon", shift_name: "Evening (15:00 - 23:30)", start_time: "15:00", end_time: "23:30" },
  { id: "sh-5", user_id: "user-4", staff_name: "Zainab Bibi", day_of_week: "Tue", shift_name: "Morning (07:00 - 15:30)", start_time: "07:00", end_time: "15:30" },
  { id: "sh-6", user_id: "user-3", staff_name: "Ali Raza", day_of_week: "Tue", shift_name: "Evening (15:00 - 23:30)", start_time: "15:00", end_time: "23:30" },
];

export const DEFAULT_CHART_OF_ACCOUNTS: AccountDef[] = [
  { code: "1010", name: "Cash in Drawer", type: "ASSET", balance: 5000 },
  { code: "1020", name: "Meezan Bank Operating Account", type: "ASSET", balance: 485000 },
  { code: "1030", name: "Petty Cash", type: "ASSET", balance: 15000 },
  { code: "1200", name: "Inventory - Raw Materials", type: "ASSET", balance: 84200 },
  { code: "2010", name: "Accounts Payable - Vendors", type: "LIABILITY", balance: 85100 },
  { code: "2020", name: "Sales Tax Payable (PRA 16%)", type: "LIABILITY", balance: 24600 },
  { code: "3010", name: "Owner Capital & Retained Earnings", type: "EQUITY", balance: 450000 },
  { code: "4010", name: "Coffee & Beverage Sales Revenue", type: "REVENUE", balance: 345000 },
  { code: "4020", name: "Bakery & Food Sales Revenue", type: "REVENUE", balance: 185000 },
  { code: "5010", name: "Cost of Goods Sold (Ingredients)", type: "COGS", balance: 142000 },
  { code: "6010", name: "Staff Salaries & Wages", type: "EXPENSE", balance: 275000 },
  { code: "6020", name: "Café Rent Expense", type: "EXPENSE", balance: 120000 },
  { code: "6030", name: "Utilities (Electricity, Gas, Water)", type: "EXPENSE", balance: 42000 },
  { code: "6040", name: "Equipment Maintenance", type: "EXPENSE", balance: 18500 },
];
