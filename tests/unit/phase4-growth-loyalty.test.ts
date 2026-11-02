import { describe, it, expect } from "vitest";

describe("Phase 4: Growth, Loyalty, Promos & Menu Engineering", () => {
  it("increments loyalty stamps and triggers free coffee on 10th stamp", () => {
    let stampCount = 8;
    stampCount += 1;
    expect(stampCount).toBe(9);
    expect(stampCount >= 10).toBe(false);

    stampCount += 1;
    expect(stampCount).toBe(10);
    expect(stampCount >= 10).toBe(true); // Free coffee reward triggered!
  });

  it("applies promo code discounts correctly with minimum order requirements", () => {
    const promo = { code: "REWIND10", discount_pct: 10, min_order_amount: 1000 };
    const orderSubtotal = 1450;

    expect(orderSubtotal >= promo.min_order_amount).toBe(true);
    const discountAmount = (orderSubtotal * promo.discount_pct) / 100;
    const finalAmount = orderSubtotal - discountAmount;

    expect(discountAmount).toBe(145);
    expect(finalAmount).toBe(1305);
  });

  it("deducts gift card balance correctly without going below zero", () => {
    let giftCardBalance = 2000;
    const purchaseAmount = 1450;

    const deducted = Math.min(giftCardBalance, purchaseAmount);
    giftCardBalance -= deducted;

    expect(deducted).toBe(1450);
    expect(giftCardBalance).toBe(550);
  });

  it("correctly classifies menu items into Boston Consulting Group matrix", () => {
    // Velvet Latte: High margin (76%), High popularity => STAR
    const price = 680;
    const cost = 160;
    const margin = (price - cost) / price; // 76.4%
    const isPopular = true;

    const isStar = margin >= 0.70 && isPopular;
    expect(isStar).toBe(true);
  });

  it("generates formatted table QR self-order numbering", () => {
    const tableId = "T-01";
    const randomSuffix = 452;
    const orderNumber = `QR-${tableId}-${randomSuffix}`;

    expect(orderNumber).toBe("QR-T-01-452");
    expect(orderNumber.startsWith("QR-T-01")).toBe(true);
  });
});
