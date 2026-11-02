"use client";

import React from "react";
import Image from "next/image";
import { type MenuItemDef } from "@/lib/data/sample-menu";
import { formatCurrency } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { Plus, Check } from "lucide-react";

interface ItemTileProps {
  item: MenuItemDef;
  onSelect: (item: MenuItemDef) => void;
  badgeCount?: number;
}

export function ItemTile({ item, onSelect, badgeCount = 0 }: ItemTileProps) {
  const { language, playSound } = useUiStore();
  const title = language === "ur" && item.name_ur ? item.name_ur : item.name_en;

  const handleClick = () => {
    playSound("click");
    onSelect(item);
  };

  return (
    <button
      onClick={handleClick}
      disabled={!item.is_available}
      className={`group relative flex flex-col justify-between w-full min-h-[140px] md:min-h-[160px] p-2.5 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 hover:border-vintage-orange dark:hover:border-vintage-orange transition-all duration-200 shadow-card hover:shadow-floating active:scale-95 text-left overflow-hidden ${
        !item.is_available ? "opacity-50 grayscale cursor-not-allowed" : ""
      }`}
    >
      {/* Photo with gradient overlay */}
      <div className="relative w-full h-24 md:h-28 rounded-xl overflow-hidden bg-cream-100 dark:bg-espresso-900 mb-2">
        <img
          src={item.photo_url}
          alt={item.name_en}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
        />

        {/* Quantity in cart badge */}
        {badgeCount > 0 && (
          <div className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-vintage-orange text-white text-xs font-bold shadow-md flex items-center gap-1 animate-drop-in">
            <Check className="w-3 h-3 stroke-[3]" />
            <span>{badgeCount}</span>
          </div>
        )}

        {/* Sold out badge */}
        {!item.is_available && (
          <div className="absolute inset-0 bg-espresso-950/70 backdrop-blur-[1px] flex items-center justify-center">
            <span className="px-2 py-1 rounded-md bg-brick text-white text-xs font-bold tracking-wide uppercase">
              Sold Out
            </span>
          </div>
        )}
      </div>

      {/* Item Details */}
      <div className="flex flex-col flex-1 justify-between gap-1 w-full">
        <h4 className="font-serif font-bold text-sm text-espresso-900 dark:text-cream-100 line-clamp-1 group-hover:text-vintage-orange transition-colors">
          {title}
        </h4>

        <div className="flex items-center justify-between mt-auto">
          <span className="font-sans font-extrabold text-sm text-espresso-800 dark:text-cream-200">
            {formatCurrency(item.base_price)}
          </span>

          <div className="w-7 h-7 rounded-full bg-cream-100 dark:bg-espresso-700 group-hover:bg-vintage-orange group-hover:text-white flex items-center justify-center text-espresso-700 dark:text-cream-200 transition-colors shadow-sm">
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>
      </div>
    </button>
  );
}
