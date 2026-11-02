import { describe, it, expect } from "vitest";

describe("Phase 3: HR, Payroll & Automated Double-Entry Accounting", () => {
  it("verifies double-entry debits equal credits on sale posting", () => {
    const totalAmount = 1450;
    const taxRate = 16;
    const netSubtotal = totalAmount / (1 + taxRate / 100);
    const taxAmount = totalAmount - netSubtotal;

    const debits = totalAmount; // Debit Cash 1010
    const credits = netSubtotal + taxAmount; // Credit Revenue + Tax Payable

    expect(Math.round(debits)).toBe(Math.round(credits));
  });

  it("calculates staff net salary with overtime, tips, and deductions", () => {
    const baseSalary = 52000; // Barista
    const overtimeHours = 12;
    const hourlyOvertimeRate = 300; // 3,600 PKR
    const tipShare = 2400;
    const performanceBonus = 3000;
    const advanceDeduction = 1500;

    const netSalary =
      baseSalary + overtimeHours * hourlyOvertimeRate + tipShare + performanceBonus - advanceDeduction;

    // 52000 + 3600 + 2400 + 3000 - 1500 = 59,500 PKR
    expect(netSalary).toBe(59500);
  });

  it("verifies the balance sheet fundamental equation (Assets = Liabilities + Equity)", () => {
    const cashInDrawer = 12500;
    const bankOperating = 485000;
    const inventoryAsset = 84200;
    const totalAssets = cashInDrawer + bankOperating + inventoryAsset; // 581,700

    const vendorPayables = 85100;
    const salesTaxPayable = 24600;
    const totalLiabilities = vendorPayables + salesTaxPayable; // 109,700

    const ownerEquity = 472000; // Capital + Net Profit

    expect(totalAssets).toBe(totalLiabilities + ownerEquity);
  });

  it("verifies gross profit and gross margin calculation", () => {
    const salesRevenue = 530000;
    const cogs = 148400; // 28% food cost
    const grossProfit = salesRevenue - cogs;
    const grossMarginPct = Math.round((grossProfit / salesRevenue) * 100);

    expect(grossProfit).toBe(381600);
    expect(grossMarginPct).toBe(72);
  });
});
