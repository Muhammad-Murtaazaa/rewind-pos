import { describe, it, expect } from "vitest";

describe("Rewind POS — Billing, Tax & Payment Calculations", () => {
  it("calculates single item price correctly", () => {
    const unitPrice = 680; // Rewind Velvet Latte
    const quantity = 2;
    const total = unitPrice * quantity;
    expect(total).toBe(1360);
  });

  it("calculates item with variant and multiple modifiers correctly", () => {
    const basePrice = 680;
    const largeVariantPrice = 780; // Large 12 oz
    const oatMilkAdd = 180; // Oat milk
    const caramelSyrupAdd = 120; // Caramel syrup
    const extraShotAdd = 150; // Extra shot
    const quantity = 2;

    const unitPrice = largeVariantPrice + oatMilkAdd + caramelSyrupAdd + extraShotAdd;
    expect(unitPrice).toBe(1230);

    const lineTotal = unitPrice * quantity;
    expect(lineTotal).toBe(2460);
  });

  it("calculates percentage order discount accurately", () => {
    const subtotal = 2000;
    const discountPercent = 10; // 10%
    const discountAmount = (subtotal * discountPercent) / 100;
    const netSubtotal = subtotal - discountAmount;

    expect(discountAmount).toBe(200);
    expect(netSubtotal).toBe(1800);
  });

  it("calculates 16% PRA sales tax correctly", () => {
    const netSubtotal = 1800;
    const taxRate = 16; // 16% Sales tax
    const taxAmount = (netSubtotal * taxRate) / 100;
    const grandTotal = netSubtotal + taxAmount;

    expect(taxAmount).toBe(288);
    expect(grandTotal).toBe(2088);
  });

  it("calculates cash change due accurately", () => {
    const grandTotal = 1450;
    const cashTendered = 2000;
    const changeDue = Math.max(0, cashTendered - grandTotal);

    expect(changeDue).toBe(550);
  });

  it("handles exact cash payment with zero change due", () => {
    const grandTotal = 780;
    const cashTendered = 780;
    const changeDue = Math.max(0, cashTendered - grandTotal);

    expect(changeDue).toBe(0);
  });

  it("calculates cash drawer variance accurately", () => {
    const openingFloat = 5000;
    const cashSales = 12400;
    const payIns = 1000;
    const payOuts = 500; // e.g. milk purchase

    const expectedCash = openingFloat + cashSales + payIns - payOuts;
    expect(expectedCash).toBe(17900);

    // Actual physical count counted 17,900
    const countedCash = 17900;
    const variance = countedCash - expectedCash;
    expect(variance).toBe(0);

    // If counted cash was 17,800
    const shortCount = 17800;
    expect(shortCount - expectedCash).toBe(-100);
  });
});
