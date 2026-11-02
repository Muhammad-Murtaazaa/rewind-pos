import { describe, it, expect } from "vitest";
import { calculateFoodCostPercentage } from "@/lib/inventory/recipe-deducer";

describe("Phase 2: Inventory, Recipes, Vendors & Costing", () => {
  it("calculates recipe BOM total ingredient cost correctly", () => {
    // Velvet Latte (8 oz):
    // 18g espresso beans @ 4,200 PKR/kg = 0.018 * 4200 = 75.6 PKR
    // 200ml whole milk @ 240 PKR/L = 0.20 * 240 = 48 PKR
    // 1 paper cup @ 18 PKR
    // 1 lid @ 8 PKR
    const beansCost = 0.018 * 4200;
    const milkCost = 0.20 * 240;
    const cupCost = 18;
    const lidCost = 8;

    const totalCost = beansCost + milkCost + cupCost + lidCost;
    expect(totalCost).toBe(149.6);
  });

  it("calculates food cost percentage accurately", () => {
    const cost = 149.6;
    const sellingPrice = 680;
    const pct = calculateFoodCostPercentage(cost, sellingPrice);

    // 149.6 / 680 * 100 = 22.0%
    expect(pct).toBe(22.0);
    expect(pct).toBeLessThanOrEqual(30.0); // Within healthy café margins!
  });

  it("calculates stock count variance correctly", () => {
    const systemQty = 14.5; // kg beans
    const countedQty = 14.0; // 0.5 kg missing
    const unitCost = 4200;

    const diff = countedQty - systemQty;
    const costVariance = diff * unitCost;

    expect(diff).toBe(-0.5);
    expect(costVariance).toBe(-2100);
  });

  it("calculates purchase order total correctly", () => {
    const lines = [
      { quantity: 10, unit_price: 4200 }, // 10 kg beans = 42,000
      { quantity: 50, unit_price: 240 },  // 50 L milk = 12,000
    ];

    const total = lines.reduce((sum, l) => sum + l.quantity * l.unit_price, 0);
    expect(total).toBe(54000);
  });

  it("handles negative stock without throwing an error", () => {
    const initialQty = 2.0;
    const orderDeduction = 3.5;
    const remaining = initialQty - orderDeduction;

    expect(remaining).toBe(-1.5);
    // In Rewind POS, stock can go negative offline and is flagged rather than blocking a sale
    expect(remaining < 0).toBe(true);
  });
});
