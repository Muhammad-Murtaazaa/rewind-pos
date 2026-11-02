"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { db, type LocalOrder } from "@/lib/db/dexie";
import { type MenuItemDef, type CategoryDef } from "@/lib/data/sample-menu";
import { useCartStore } from "@/stores/cartStore";
import { useUiStore } from "@/stores/uiStore";
import { useTranslation } from "@/lib/i18n/translations";
import { ItemTile } from "@/components/pos/ItemTile";
import { CartPanel } from "@/components/pos/CartPanel";
import { ModifierModal } from "@/components/pos/ModifierModal";
import { PaymentModal } from "@/components/payment/PaymentModal";
import { ReceiptModal } from "@/components/printing/ReceiptModal";
import { TableSelectModal } from "@/components/tables/TableSelectModal";
import {
  Search,
  Sparkles,
  Coffee,
  ShoppingBag,
  SlidersHorizontal,
  Clock,
  History,
} from "lucide-react";

export default function PosPage() {
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [items, setItems] = useState<MenuItemDef[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Modals state
  const [customizingItem, setCustomizingItem] = useState<MenuItemDef | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState<boolean>(false);
  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<LocalOrder | null>(null);
  const [isCartOpenMobile, setIsCartOpenMobile] = useState<boolean>(false);

  const searchInputRef = useRef<HTMLInputElement>(null);

  const { items: cartItems, addItem } = useCartStore();
  const { language, playSound } = useUiStore();
  const { t } = useTranslation(language);

  // Load menu and categories from Dexie IndexedDB
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        await db.seedDefaultsIfEmpty();
        const loadedCats = await db.categories.orderBy("sort_order").toArray();
        const loadedItems = await db.items.toArray();
        setCategories(loadedCats);
        setItems(loadedItems);
      } catch (err) {
        console.error("Failed to load POS data:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  // Global keyboard shortcuts (Ctrl+K to search, Esc to close)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === "Escape") {
        setCustomizingItem(null);
        setIsPaymentOpen(false);
        setIsTableModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter items by category & search query
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesCategory =
        selectedCategory === "ALL"
          ? true
          : selectedCategory === "FAVOURITES"
          ? item.is_favourite
          : item.category_id === selectedCategory;

      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name_en.toLowerCase().includes(q) ||
        (item.name_ur && item.name_ur.includes(q)) ||
        item.description?.toLowerCase().includes(q);

      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const handleItemClick = (item: MenuItemDef) => {
    // If item has variants or modifier groups, open customization modal
    const hasVariants = item.variants && item.variants.length > 0;
    const hasModifiers = item.modifier_group_ids && item.modifier_group_ids.length > 0;

    if (hasVariants || hasModifiers) {
      setCustomizingItem(item);
    } else {
      // 1-tap direct add to cart (< 3 taps principle!)
      addItem({
        item_id: item.id,
        item_name: language === "ur" && item.name_ur ? item.name_ur : item.name_en,
        unit_price: item.base_price,
        quantity: 1,
        discount_amount: 0,
        station_type: item.station_type,
        photo_url: item.photo_url,
        selected_modifiers: [],
      });
    }
  };

  const totalCartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="flex-1 flex flex-col lg:flex-row h-[calc(100vh-4rem)] overflow-hidden">
      {/* LEFT COLUMN: Menu, Categories, Item Tiles */}
      <div className="flex-1 flex flex-col overflow-hidden bg-cream-100/60 dark:bg-espresso-950/40">
        {/* Top Controls: Search & Category Navigation */}
        <div className="p-3 md:p-4 bg-cream-50 dark:bg-espresso-900 border-b border-cream-200 dark:border-espresso-700 space-y-3">
          <div className="flex items-center gap-3">
            {/* Search Input (>= 48px tap height) */}
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-espresso-700/50 dark:text-cream-300/50" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("searchPlaceholder")}
                className="w-full h-11 pl-10 pr-4 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-xs md:text-sm text-espresso-800 dark:text-cream-100 placeholder:text-espresso-700/40 dark:placeholder:text-cream-300/40 focus:outline-none focus:border-vintage-orange shadow-card transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-3 text-xs font-bold text-espresso-700/50 hover:text-espresso-900"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Mobile View Cart Button */}
            <button
              onClick={() => setIsCartOpenMobile(true)}
              className="lg:hidden h-11 px-4 rounded-2xl bg-vintage-orange text-white font-bold text-xs flex items-center gap-2 shadow-floating relative"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Cart</span>
              {totalCartCount > 0 && (
                <span className="w-5 h-5 rounded-full bg-white text-vintage-orange text-[11px] font-black flex items-center justify-center">
                  {totalCartCount}
                </span>
              )}
            </button>
          </div>

          {/* Horizontal Category Pill Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {/* All items tab */}
            <button
              onClick={() => {
                playSound("click");
                setSelectedCategory("ALL");
              }}
              className={`h-10 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-card ${
                selectedCategory === "ALL"
                  ? "bg-vintage-orange text-white shadow-floating scale-102"
                  : "bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200 hover:border-vintage-orange/50"
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>{t("allCategories")}</span>
            </button>

            {/* Favourites tab */}
            <button
              onClick={() => {
                playSound("click");
                setSelectedCategory("FAVOURITES");
              }}
              className={`h-10 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 shadow-card ${
                selectedCategory === "FAVOURITES"
                  ? "bg-mustard text-white shadow-floating scale-102"
                  : "bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200 hover:border-mustard/60"
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-mustard group-hover:text-white" />
              <span>{t("favourites")}</span>
            </button>

            {/* Dynamic categories */}
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const catTitle = language === "ur" && cat.name_ur ? cat.name_ur : cat.name_en;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    playSound("click");
                    setSelectedCategory(cat.id);
                  }}
                  className={`h-10 px-4 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-card ${
                    isSelected
                      ? "bg-vintage-orange text-white shadow-floating scale-102"
                      : "bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200 hover:border-vintage-orange/50"
                  }`}
                >
                  {catTitle}
                </button>
              );
            })}
          </div>
        </div>

        {/* Menu Items Tile Grid */}
        <div className="flex-1 overflow-y-auto p-3 md:p-4">
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-pulse">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="h-36 rounded-2xl bg-cream-200/60 dark:bg-espresso-800/60 border border-cream-300 dark:border-espresso-700"
                />
              ))}
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Coffee className="w-12 h-12 text-espresso-700/30 dark:text-cream-300/30 mb-2" />
              <h4 className="font-serif font-bold text-base text-espresso-800 dark:text-cream-100">
                No menu items found
              </h4>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60 max-w-xs mt-1">
                Try searching for another word or select another category above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredItems.map((item) => {
                const badgeCount = cartItems
                  .filter((ci) => ci.item_id === item.id)
                  .reduce((sum, ci) => sum + ci.quantity, 0);

                return (
                  <ItemTile
                    key={item.id}
                    item={item}
                    onSelect={handleItemClick}
                    badgeCount={badgeCount}
                  />
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Cart Panel (Desktop sticky, Mobile drawer) */}
      <div
        className={`w-full lg:w-[380px] xl:w-[420px] flex-shrink-0 z-30 lg:relative fixed inset-0 lg:inset-auto bg-cream-50 dark:bg-surface-dark transition-transform ${
          isCartOpenMobile ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="lg:hidden flex items-center justify-between p-3 border-b border-cream-200 dark:border-espresso-700">
          <span className="font-serif font-bold text-base">Your Cart</span>
          <button
            onClick={() => setIsCartOpenMobile(false)}
            className="text-xs font-bold text-vintage-orange"
          >
            Close ✕
          </button>
        </div>

        <CartPanel
          onOpenPayment={() => {
            setIsCartOpenMobile(false);
            setIsPaymentOpen(true);
          }}
          onOpenTableModal={() => setIsTableModalOpen(true)}
        />
      </div>

      {/* Item Modifiers & Customization Modal */}
      <ModifierModal
        item={customizingItem}
        onClose={() => setCustomizingItem(null)}
      />

      {/* Payment Checkout Modal */}
      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => setIsPaymentOpen(false)}
        onOrderCompleted={(order) => {
          setCompletedOrder(order);
        }}
      />

      {/* Floor Plan & Table Selection Modal */}
      <TableSelectModal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
      />

      {/* Printed ESC/POS & WhatsApp Receipt Modal */}
      <ReceiptModal
        order={completedOrder}
        onClose={() => setCompletedOrder(null)}
      />
    </div>
  );
}
