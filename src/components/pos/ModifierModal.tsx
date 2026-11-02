"use client";

import React, { useState } from "react";
import { type MenuItemDef, SAMPLE_MODIFIER_GROUPS } from "@/lib/data/sample-menu";
import { useCartStore } from "@/stores/cartStore";
import { useUiStore } from "@/stores/uiStore";
import { formatCurrency } from "@/lib/utils";
import { X, Check, Plus, Minus } from "lucide-react";

interface ModifierModalProps {
  item: MenuItemDef | null;
  onClose: () => void;
}

export function ModifierModal({ item, onClose }: ModifierModalProps) {
  const { addItem } = useCartStore();
  const { language, playSound } = useUiStore();

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string>(
    item?.variants && item.variants.length > 0 ? item.variants[0].name : ""
  );
  const [selectedModifiers, setSelectedModifiers] = useState<
    { modifier_id: string; modifier_name: string; price_add: number }[]
  >([]);
  const [notes, setNotes] = useState("");

  if (!item) return null;

  // Find associated modifier groups
  const activeModifierGroups = SAMPLE_MODIFIER_GROUPS.filter((g) =>
    item.modifier_group_ids?.includes(g.id)
  );

  // Calculate current unit price based on variant
  const currentBasePrice =
    item.variants && selectedVariant
      ? item.variants.find((v) => v.name === selectedVariant)?.price || item.base_price
      : item.base_price;

  const modifiersTotal = selectedModifiers.reduce((sum, m) => sum + m.price_add, 0);
  const unitPrice = currentBasePrice + modifiersTotal;
  const totalPrice = unitPrice * quantity;

  const handleToggleModifier = (group: typeof SAMPLE_MODIFIER_GROUPS[0], option: typeof group.options[0]) => {
    playSound("click");
    const exists = selectedModifiers.some((m) => m.modifier_id === option.id);

    if (exists) {
      // Remove
      setSelectedModifiers(selectedModifiers.filter((m) => m.modifier_id !== option.id));
    } else {
      // If single-select group, remove any other option from the same group
      const otherGroupOptionIds = group.options.map((o) => o.id);
      const filtered = selectedModifiers.filter((m) => !otherGroupOptionIds.includes(m.modifier_id));

      setSelectedModifiers([
        ...filtered,
        {
          modifier_id: option.id,
          modifier_name: language === "ur" ? option.name_ur : option.name_en,
          price_add: option.price_add,
        },
      ]);
    }
  };

  const handleAddToCart = () => {
    playSound("click");
    addItem({
      item_id: item.id,
      item_name: language === "ur" && item.name_ur ? item.name_ur : item.name_en,
      variant_name: selectedVariant || undefined,
      unit_price: currentBasePrice,
      quantity,
      discount_amount: 0,
      notes: notes.trim() || undefined,
      station_type: item.station_type,
      photo_url: item.photo_url,
      selected_modifiers: selectedModifiers,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-cream-50 dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-café p-6 shadow-floating text-espresso-800 dark:text-cream-100 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-cream-200 dark:border-espresso-700">
          <div className="flex items-center gap-3">
            <img
              src={item.photo_url}
              alt={item.name_en}
              className="w-14 h-14 rounded-2xl object-cover shadow-card"
            />
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight">
                {language === "ur" && item.name_ur ? item.name_ur : item.name_en}
              </h3>
              <p className="text-xs text-espresso-700/70 dark:text-cream-300/70 line-clamp-1 mt-0.5">
                {item.description}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream-200 dark:hover:bg-espresso-700 text-espresso-700 dark:text-cream-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Modifiers List */}
        <div className="flex-1 overflow-y-auto py-4 space-y-5 pr-1">
          {/* Variants (Size / Style) */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-espresso-700/70 dark:text-cream-300/70 mb-2">
                Size / Variant
              </h5>
              <div className="grid grid-cols-2 gap-2">
                {item.variants.map((variant) => {
                  const isSelected = selectedVariant === variant.name;
                  return (
                    <button
                      key={variant.id}
                      onClick={() => {
                        playSound("click");
                        setSelectedVariant(variant.name);
                      }}
                      className={`flex items-center justify-between p-3 rounded-2xl border text-sm font-semibold transition-all ${
                        isSelected
                          ? "bg-vintage-orange text-white border-vintage-orange shadow-md"
                          : "bg-white dark:bg-espresso-800 border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200 hover:border-vintage-orange/50"
                      }`}
                    >
                      <span>{variant.name}</span>
                      <span>{formatCurrency(variant.price)}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Modifier Groups */}
          {activeModifierGroups.map((group) => (
            <div key={group.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-espresso-700/70 dark:text-cream-300/70">
                  {language === "ur" ? group.name_ur : group.name_en}
                </h5>
                <span className="text-[11px] text-espresso-700/50 dark:text-cream-300/50">
                  {group.max_select === 1 ? "Pick 1" : `Up to ${group.max_select}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                {group.options.map((option) => {
                  const isSelected = selectedModifiers.some((m) => m.modifier_id === option.id);
                  return (
                    <button
                      key={option.id}
                      onClick={() => handleToggleModifier(group, option)}
                      className={`flex items-center justify-between p-2.5 rounded-2xl border text-xs font-medium transition-all ${
                        isSelected
                          ? "bg-sage text-white border-sage shadow-sm font-bold"
                          : "bg-white dark:bg-espresso-800 border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200 hover:border-sage/60"
                      }`}
                    >
                      <span className="truncate">
                        {language === "ur" ? option.name_ur : option.name_en}
                      </span>
                      <span>
                        {option.price_add > 0 ? `+${formatCurrency(option.price_add)}` : "Free"}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Special Instruction Notes */}
          <div>
            <h5 className="font-serif font-bold text-xs uppercase tracking-wider text-espresso-700/70 dark:text-cream-300/70 mb-1.5">
              Kitchen Instructions
            </h5>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Less ice, extra hot, oat milk froth…"
              className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-700 text-xs text-espresso-800 dark:text-cream-100 focus:outline-none focus:border-vintage-orange"
            />
          </div>
        </div>

        {/* Modal Footer with Quantity and Add Button */}
        <div className="pt-4 border-t border-cream-200 dark:border-espresso-700 flex items-center justify-between gap-3">
          {/* Quantity Stepper (>= 48px tap targets) */}
          <div className="flex items-center gap-2 bg-cream-200/60 dark:bg-espresso-800 p-1 rounded-2xl border border-cream-300 dark:border-espresso-700">
            <button
              onClick={() => {
                playSound("click");
                setQuantity(Math.max(1, quantity - 1));
              }}
              className="w-10 h-10 rounded-xl bg-white dark:bg-espresso-700 flex items-center justify-center text-espresso-800 dark:text-cream-100 hover:bg-cream-100 transition-colors shadow-sm"
            >
              <Minus className="w-4 h-4 stroke-[2.5]" />
            </button>
            <span className="w-8 text-center font-bold text-base font-serif">{quantity}</span>
            <button
              onClick={() => {
                playSound("click");
                setQuantity(quantity + 1);
              }}
              className="w-10 h-10 rounded-xl bg-white dark:bg-espresso-700 flex items-center justify-center text-espresso-800 dark:text-cream-100 hover:bg-cream-100 transition-colors shadow-sm"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>

          {/* Add to Order button */}
          <button
            onClick={handleAddToCart}
            className="flex-1 h-12 rounded-2xl bg-gradient-to-r from-vintage-orange to-amber-600 text-white font-bold text-sm shadow-floating hover:brightness-105 active:scale-95 transition-all flex items-center justify-between px-5"
          >
            <span>Add to Order</span>
            <span>{formatCurrency(totalPrice)}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
