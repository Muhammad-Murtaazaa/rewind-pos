import { db, type LocalOrder } from "../db/dexie";
import { type JournalEntryDef, type JournalLineDef } from "../data/sample-hr-accounting";
import { generateUUID } from "../utils";

/**
 * Automatically records double-entry general ledger journal entries in the background
 */
export async function postOrderSaleJournal(order: LocalOrder): Promise<JournalEntryDef> {
  const isCash = order.payment_method === "CASH";
  const assetAccountCode = isCash ? "1010" : "1020";
  const assetAccountName = isCash ? "Cash in Drawer" : "Meezan Bank Operating Account";

  const totalAmount = order.total_amount;
  const taxAmount = order.tax_amount;
  const netSalesRevenue = totalAmount - taxAmount;

  const lines: JournalLineDef[] = [
    // 1. Debit Cash or Bank for total receipt
    {
      account_code: assetAccountCode,
      account_name: assetAccountName,
      debit: totalAmount,
      credit: 0,
    },
    // 2. Credit Sales Revenue for net subtotal
    {
      account_code: "4010",
      account_name: "Coffee & Food Sales Revenue",
      debit: 0,
      credit: netSalesRevenue,
    },
    // 3. Credit Sales Tax Payable (PRA 16%)
    {
      account_code: "2020",
      account_name: "Sales Tax Payable (PRA 16%)",
      debit: 0,
      credit: taxAmount,
    },
  ];

  const entry: JournalEntryDef = {
    id: generateUUID(),
    entry_date: new Date().toISOString(),
    reference_no: `Order #${order.order_number}`,
    description: `POS Sale Receipt (${order.payment_method || "CASH"})`,
    lines,
  };

  await db.journalEntries.add(entry);
  return entry;
}

/**
 * Automatically records double-entry for an operational expense
 */
export async function postExpenseJournal(params: {
  amount: number;
  category: string;
  paidBy: "CASH" | "BANK";
  description: string;
}): Promise<JournalEntryDef> {
  const creditAccountCode = params.paidBy === "CASH" ? "1010" : "1020";
  const creditAccountName = params.paidBy === "CASH" ? "Cash in Drawer" : "Meezan Bank Operating Account";

  const expenseCode = params.category === "RENT" ? "6020" : params.category === "UTILITIES" ? "6030" : "6040";

  const lines: JournalLineDef[] = [
    {
      account_code: expenseCode,
      account_name: `Operating Expense - ${params.category}`,
      debit: params.amount,
      credit: 0,
    },
    {
      account_code: creditAccountCode,
      account_name: creditAccountName,
      debit: 0,
      credit: params.amount,
    },
  ];

  const entry: JournalEntryDef = {
    id: generateUUID(),
    entry_date: new Date().toISOString(),
    reference_no: `EXP-${Date.now().toString().slice(-4)}`,
    description: params.description,
    lines,
  };

  await db.journalEntries.add(entry);
  return entry;
}

/**
 * Automatically records double-entry for payroll disbursement
 */
export async function postPayrollJournal(params: {
  totalSalary: number;
  periodMonth: string;
}): Promise<JournalEntryDef> {
  const lines: JournalLineDef[] = [
    {
      account_code: "6010",
      account_name: "Staff Salaries & Wages",
      debit: params.totalSalary,
      credit: 0,
    },
    {
      account_code: "1020",
      account_name: "Meezan Bank Operating Account",
      debit: 0,
      credit: params.totalSalary,
    },
  ];

  const entry: JournalEntryDef = {
    id: generateUUID(),
    entry_date: new Date().toISOString(),
    reference_no: `PAYROLL-${params.periodMonth}`,
    description: `Monthly Staff Salary Payout (${params.periodMonth})`,
    lines,
  };

  await db.journalEntries.add(entry);
  return entry;
}
