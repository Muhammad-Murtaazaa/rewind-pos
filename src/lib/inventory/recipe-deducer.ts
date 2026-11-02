import { db, type LocalOrder, type LocalStockMovement } from "../db/dexie";
import { generateUUID } from "../utils";

/**
 * Automatically deduces raw ingredients from stock based on sold items and modifier options
 */
export async function deduceInventoryForOrder(order: LocalOrder): Promise<LocalStockMovement[]> {
  const movements: LocalStockMovement[] = [];
  const now = new Date().toISOString();

  for (const line of order.items) {
    // 1. Look for recipe matching item_id and optionally variant_name
    const recipes = await db.recipes.where("item_id").equals(line.item_id).toArray();
    let matchedRecipe = recipes.find((r) => r.variant_name === line.variant_name) || recipes[0];

    if (matchedRecipe && matchedRecipe.lines) {
      for (const recipeLine of matchedRecipe.lines) {
        let stockItemIdToDeduct = recipeLine.stock_item_id;

        // Check if milk modifier overrides default dairy milk
        if (recipeLine.stock_item_id === "stk-milk-whole") {
          const oatMod = line.selected_modifiers.find((m) => m.modifier_name.toLowerCase().includes("oat"));
          const almondMod = line.selected_modifiers.find((m) => m.modifier_name.toLowerCase().includes("almond"));
          if (oatMod) stockItemIdToDeduct = "stk-milk-oat";
          else if (almondMod) stockItemIdToDeduct = "stk-milk-almond";
        }

        const deductQty = recipeLine.quantity * line.quantity;
        const stockItem = await db.stockItems.get(stockItemIdToDeduct);

        if (stockItem) {
          // Stock may go negative offline; flag it, never block a sale
          const newQty = stockItem.current_qty - deductQty;
          await db.stockItems.update(stockItem.id, {
            current_qty: newQty,
          });

          const move: LocalStockMovement = {
            id: generateUUID(),
            stock_item_id: stockItem.id,
            movement_type: "SALE_DEDUCTION",
            quantity: -deductQty,
            cost_value: deductQty * stockItem.avg_unit_cost,
            reference_id: order.id,
            created_at: now,
          };

          await db.stockMovements.add(move);
          movements.push(move);
        }
      }
    }
  }

  return movements;
}

/**
 * Calculates food-cost %: (Ingredient Cost / Selling Price) * 100
 */
export function calculateFoodCostPercentage(cost: number, price: number): number {
  if (price <= 0) return 0;
  return Math.min(100, Math.round((cost / price) * 1000) / 10);
}
