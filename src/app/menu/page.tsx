"use client";

import React, { useState, useEffect, useMemo } from "react";
import { db } from "@/lib/db/dexie";
import { type MenuItemDef, type CategoryDef, type ModifierGroupDef, SAMPLE_MENU_ITEMS, SAMPLE_CATEGORIES } from "@/lib/data/sample-menu";
import { formatCurrency, generateUUID } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { MenuItemModal } from "@/components/menu/MenuItemModal";
import { QuickPriceModal } from "@/components/menu/QuickPriceModal";
import {
  Search,
  Plus,
  Coffee,
  ChefHat,
  Sparkles,
  SlidersHorizontal,
  DollarSign,
  Edit2,
  Trash2,
  Star,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  TrendingUp,
  Tag,
  RefreshCw,
  UtensilsCrossed,
  Sliders,
  Layers,
} from "lucide-react";

export default function MenuManagementPage() {
  const { playSound } = useUiStore();

  const [items, setItems] = useState<MenuItemDef[]>([]);
  const [categories, setCategories] = useState<CategoryDef[]>([]);
  const [modifierGroups, setModifierGroups] = useState<ModifierGroupDef[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters & View State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [stationFilter, setStationFilter] = useState<"ALL" | "BAR" | "KITCHEN">("ALL");
  const [availabilityFilter, setAvailabilityFilter] = useState<"ALL" | "AVAILABLE" | "UNAVAILABLE">("ALL");
  const [sortBy, setSortBy] = useState<"name" | "price-asc" | "price-desc" | "margin">("name");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Modals
  const [editingItem, setEditingItem] = useState<MenuItemDef | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [quickPriceItem, setQuickPriceItem] = useState<MenuItemDef | null>(null);
  const [itemToDelete, setItemToDelete] = useState<MenuItemDef | null>(null);

  // Load from Dexie IndexedDB
  const loadMenuData = async () => {
    setIsLoading(true);
    try {
      await db.seedDefaultsIfEmpty();
      const loadedItems = await db.items.toArray();
      const loadedCats = await db.categories.orderBy("sort_order").toArray();
      const loadedMods = await db.modifierGroups.toArray();
      setItems(loadedItems);
      setCategories(loadedCats);
      setModifierGroups(loadedMods);
    } catch (err) {
      console.error("Failed to load menu data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMenuData();
  }, []);

  // Filter & Sort Logic
  const filteredItems = useMemo(() => {
    return items
      .filter((item) => {
        // Search
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch =
          !q ||
          item.name_en.toLowerCase().includes(q) ||
          (item.name_ur && item.name_ur.includes(q)) ||
          item.description?.toLowerCase().includes(q);

        // Category
        const matchesCategory =
          selectedCategory === "ALL"
            ? true
            : selectedCategory === "FAVOURITES"
            ? item.is_favourite
            : item.category_id === selectedCategory;

        // Station
        const matchesStation = stationFilter === "ALL" || item.station_type === stationFilter;

        // Availability
        const matchesAvail =
          availabilityFilter === "ALL"
            ? true
            : availabilityFilter === "AVAILABLE"
            ? item.is_available !== false
            : item.is_available === false;

        return matchesSearch && matchesCategory && matchesStation && matchesAvail;
      })
      .sort((a, b) => {
        if (sortBy === "name") {
          return a.name_en.localeCompare(b.name_en);
        }
        if (sortBy === "price-asc") {
          return a.base_price - b.base_price;
        }
        if (sortBy === "price-desc") {
          return b.base_price - a.base_price;
        }
        if (sortBy === "margin") {
          const marginA = a.base_price > 0 ? (a.base_price - (a.cost_price || 0)) / a.base_price : 0;
          const marginB = b.base_price > 0 ? (b.base_price - (b.cost_price || 0)) / b.base_price : 0;
          return marginB - marginA;
        }
        return 0;
      });
  }, [items, searchQuery, selectedCategory, stationFilter, availabilityFilter, sortBy]);

  // Statistics
  const totalItemsCount = items.length;
  const availableCount = items.filter((i) => i.is_available !== false).length;
  const barCount = items.filter((i) => i.station_type === "BAR").length;
  const kitchenCount = items.filter((i) => i.station_type === "KITCHEN").length;
  const avgPrice =
    totalItemsCount > 0
      ? Math.round(items.reduce((sum, i) => sum + i.base_price, 0) / totalItemsCount)
      : 0;

  // Toggle availability live in Dexie
  const handleToggleAvailability = async (item: MenuItemDef) => {
    playSound("click");
    const updated: MenuItemDef = {
      ...item,
      is_available: !item.is_available,
    };
    try {
      await db.items.put(updated);
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err: any) {
      alert("Error updating availability: " + err.message);
    }
  };

  // Toggle favourite live in Dexie
  const handleToggleFavourite = async (item: MenuItemDef) => {
    playSound("click");
    const updated: MenuItemDef = {
      ...item,
      is_favourite: !item.is_favourite,
    };
    try {
      await db.items.put(updated);
      setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err: any) {
      alert("Error updating favourite: " + err.message);
    }
  };

  // Delete item handler
  const handleDeleteItem = async (item: MenuItemDef) => {
    playSound("click");
    try {
      await db.items.delete(item.id);
      await db.outbox.add({
        id: generateUUID(),
        event_type: "MENU_ITEM_DELETED",
        payload: { id: item.id },
        status: "PENDING",
        created_at: new Date().toISOString(),
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setItemToDelete(null);
    } catch (err: any) {
      alert("Error deleting item: " + err.message);
    }
  };

  const getCategoryName = (catId: string) => {
    const c = categories.find((cat) => cat.id === catId);
    return c ? c.name_en : "Uncategorized";
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-4rem)] overflow-hidden bg-cream-100/60 dark:bg-espresso-950/40">
      {/* Top Banner & Stats */}
      <div className="p-4 md:p-6 bg-white dark:bg-espresso-900 border-b border-cream-200 dark:border-espresso-700 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-2xl bg-vintage-orange/15 text-vintage-orange">
                <UtensilsCrossed className="w-5 h-5" />
              </span>
              <h1 className="font-serif font-black text-xl md:text-2xl text-espresso-900 dark:text-cream-100">
                Menu Items & Pricing
              </h1>
            </div>
            <p className="text-xs text-espresso-700/60 dark:text-cream-300/60 mt-0.5">
              Manage café beverages, bakery, dishes, recipe costs, and counter selling prices
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                playSound("click");
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="h-11 px-5 rounded-2xl bg-gradient-to-r from-vintage-orange to-amber-600 hover:brightness-105 active:scale-95 text-white font-serif font-bold text-xs md:text-sm shadow-floating flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Add Menu Item</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 rounded-2xl bg-cream-50 dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700">
            <span className="text-[10px] font-bold text-espresso-700/60 dark:text-cream-300/60 uppercase tracking-wider block">
              Total Menu Items
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="font-sans font-black text-xl text-espresso-900 dark:text-cream-100">
                {totalItemsCount}
              </span>
              <span className="text-[11px] font-semibold text-sage-dark dark:text-emerald-300">
                ({availableCount} active)
              </span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-cream-50 dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700">
            <span className="text-[10px] font-bold text-espresso-700/60 dark:text-cream-300/60 uppercase tracking-wider block">
              Average Selling Price
            </span>
            <span className="font-sans font-black text-xl text-vintage-orange mt-0.5 block">
              {formatCurrency(avgPrice)}
            </span>
          </div>

          <div className="p-3 rounded-2xl bg-cream-50 dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700">
            <span className="text-[10px] font-bold text-espresso-700/60 dark:text-cream-300/60 uppercase tracking-wider block">
              Station Breakdown
            </span>
            <div className="flex items-center gap-2 mt-0.5 text-xs font-bold text-espresso-800 dark:text-cream-200">
              <span className="flex items-center gap-1">☕ {barCount} Bar</span>
              <span>·</span>
              <span className="flex items-center gap-1">🍳 {kitchenCount} Kitchen</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-cream-50 dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700">
            <span className="text-[10px] font-bold text-espresso-700/60 dark:text-cream-300/60 uppercase tracking-wider block">
              POS Favourites ⭐
            </span>
            <span className="font-sans font-black text-xl text-mustard mt-0.5 block">
              {items.filter((i) => i.is_favourite).length} Pinned
            </span>
          </div>
        </div>
      </div>

      {/* Toolbar: Search, Filters, Categories & Sorting */}
      <div className="p-3 md:p-4 bg-cream-50 dark:bg-espresso-850 border-b border-cream-200 dark:border-espresso-700 space-y-3 flex-shrink-0">
        <div className="flex flex-col md:flex-row md:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 w-4 h-4 text-espresso-700/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by item name in English or Urdu… (Ctrl+K)"
              className="w-full h-10 pl-10 pr-8 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-xs md:text-sm text-espresso-900 dark:text-cream-100 placeholder:text-espresso-700/40 shadow-card focus:outline-none focus:border-vintage-orange"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-2.5 text-xs font-bold text-espresso-700/50 hover:text-espresso-900"
              >
                ✕
              </button>
            )}
          </div>

          {/* Station Selector */}
          <div className="flex items-center gap-1 bg-white dark:bg-espresso-800 p-1 rounded-2xl border border-cream-200 dark:border-espresso-700 shadow-sm">
            {(["ALL", "BAR", "KITCHEN"] as const).map((st) => (
              <button
                key={st}
                onClick={() => {
                  playSound("click");
                  setStationFilter(st);
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  stationFilter === st
                    ? "bg-vintage-orange text-white shadow-sm"
                    : "text-espresso-700/70 hover:text-espresso-900 dark:text-cream-300"
                }`}
              >
                {st === "ALL" ? "All Stations" : st === "BAR" ? "☕ Bar" : "🍳 Kitchen"}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="h-10 px-3 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-xs font-bold text-espresso-800 dark:text-cream-100 shadow-card"
            >
              <option value="name">Sort: Name (A-Z)</option>
              <option value="price-asc">Sort: Price (Low → High)</option>
              <option value="price-desc">Sort: Price (High → Low)</option>
              <option value="margin">Sort: Profit Margin %</option>
            </select>

            {/* Grid / Table Toggle */}
            <div className="flex items-center bg-white dark:bg-espresso-800 p-1 rounded-2xl border border-cream-200 dark:border-espresso-700 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === "grid" ? "bg-vintage-orange text-white" : "text-espresso-700"
                }`}
                title="Grid View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("table")}
                className={`p-1.5 rounded-xl transition-colors ${
                  viewMode === "table" ? "bg-vintage-orange text-white" : "text-espresso-700"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Category Pill Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => {
              playSound("click");
              setSelectedCategory("ALL");
            }}
            className={`h-9 px-3.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
              selectedCategory === "ALL"
                ? "bg-vintage-orange text-white shadow-md scale-102"
                : "bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200 hover:border-vintage-orange/50"
            }`}
          >
            All Categories ({items.length})
          </button>

          <button
            onClick={() => {
              playSound("click");
              setSelectedCategory("FAVOURITES");
            }}
            className={`h-9 px-3.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1 shadow-sm ${
              selectedCategory === "FAVOURITES"
                ? "bg-mustard text-white shadow-md scale-102"
                : "bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200 hover:border-mustard"
            }`}
          >
            <Star className="w-3.5 h-3.5 fill-current" />
            <span>Favourites</span>
          </button>

          {categories.map((cat) => {
            const count = items.filter((i) => i.category_id === cat.id).length;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  playSound("click");
                  setSelectedCategory(cat.id);
                }}
                className={`h-9 px-3.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all shadow-sm ${
                  isSelected
                    ? "bg-vintage-orange text-white shadow-md scale-102"
                    : "bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200 hover:border-vintage-orange/50"
                }`}
              >
                {cat.name_en} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content: Item List / Grid */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-64 rounded-3xl bg-cream-200/60 dark:bg-espresso-800/60 border border-cream-300 dark:border-espresso-700"
              />
            ))}
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-80 text-center bg-white dark:bg-espresso-900 rounded-3xl border border-cream-200 dark:border-espresso-700 p-6">
            <UtensilsCrossed className="w-12 h-12 text-espresso-700/30 mb-3" />
            <h3 className="font-serif font-bold text-lg text-espresso-900 dark:text-cream-100">
              No menu items match your search
            </h3>
            <p className="text-xs text-espresso-700/60 dark:text-cream-300/60 max-w-sm mt-1">
              Try adjusting your search terms or category filter, or click below to create a new menu item.
            </p>
            <button
              onClick={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
              className="mt-4 px-5 py-2.5 rounded-2xl bg-vintage-orange text-white text-xs font-bold shadow-md hover:brightness-105"
            >
              + Create First Item
            </button>
          </div>
        ) : viewMode === "grid" ? (
          /* GRID VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredItems.map((item) => {
              const profit = Math.max(0, item.base_price - (item.cost_price || 0));
              const margin = item.base_price > 0 ? Math.round((profit / item.base_price) * 100) : 0;
              const hasVariants = item.variants && item.variants.length > 0;

              return (
                <div
                  key={item.id}
                  className={`flex flex-col justify-between bg-white dark:bg-espresso-850 rounded-3xl border transition-all shadow-card overflow-hidden group ${
                    !item.is_available
                      ? "opacity-60 border-cream-300 dark:border-espresso-700"
                      : "border-cream-200 dark:border-espresso-700/80 hover:shadow-floating hover:border-vintage-orange/40"
                  }`}
                >
                  {/* Item Image & Overlay Badges */}
                  <div className="relative h-40 w-full overflow-hidden bg-cream-200 dark:bg-espresso-800">
                    <img
                      src={item.photo_url || PRESET_PHOTOS[0].url}
                      alt={item.name_en}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={(e) => {
                        (e.target as any).src = PRESET_PHOTOS[0].url;
                      }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-espresso-950/70 via-transparent to-black/30 pointer-events-none" />

                    {/* Top Right: Favourite Toggle & Station Tag */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggleFavourite(item)}
                        className={`p-1.5 rounded-xl backdrop-blur-md transition-colors ${
                          item.is_favourite
                            ? "bg-mustard text-white shadow-sm"
                            : "bg-black/40 text-white/80 hover:text-white"
                        }`}
                        title={item.is_favourite ? "Remove from favourites" : "Pin to favourites"}
                      >
                        <Star className={`w-3.5 h-3.5 ${item.is_favourite ? "fill-current" : ""}`} />
                      </button>

                      <span className="px-2 py-0.5 rounded-xl bg-black/60 backdrop-blur-md text-white text-[10px] font-bold">
                        {item.station_type === "BAR" ? "☕ Bar" : "🍳 Kitchen"}
                      </span>
                    </div>

                    {/* Top Left: Category Tag */}
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2.5 py-0.5 rounded-xl bg-vintage-orange text-white text-[10px] font-bold shadow-sm">
                        {getCategoryName(item.category_id)}
                      </span>
                    </div>

                    {/* Bottom overlay: Price Pill */}
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between text-white">
                      <button
                        onClick={() => setQuickPriceItem(item)}
                        className="px-2.5 py-1 rounded-xl bg-espresso-900/90 backdrop-blur-md hover:bg-vintage-orange transition-colors flex items-center gap-1.5 group/price"
                        title="Click to quick-edit price"
                      >
                        <span className="font-sans font-black text-sm">
                          {formatCurrency(item.base_price)}
                        </span>
                        <Edit2 className="w-3 h-3 opacity-60 group-hover/price:opacity-100" />
                      </button>

                      <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold backdrop-blur-md ${
                          margin >= 70
                            ? "bg-emerald-500/80 text-white"
                            : margin >= 50
                            ? "bg-amber-500/80 text-white"
                            : "bg-brick/80 text-white"
                        }`}
                      >
                        {margin}% margin
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="font-serif font-black text-sm text-espresso-900 dark:text-cream-100 leading-tight">
                          {item.name_en}
                        </h4>
                      </div>

                      {item.name_ur && (
                        <p className="font-urdu text-xs text-espresso-700/70 dark:text-cream-300/70 mt-0.5">
                          {item.name_ur}
                        </p>
                      )}

                      {item.description && (
                        <p className="text-[11px] text-espresso-700/60 dark:text-cream-300/60 line-clamp-2 mt-1">
                          {item.description}
                        </p>
                      )}

                      {/* Sizes / Variants Preview */}
                      {hasVariants && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {item.variants!.map((v) => (
                            <span
                              key={v.id}
                              className="px-2 py-0.5 rounded-lg bg-cream-100 dark:bg-espresso-800 text-espresso-800 dark:text-cream-200 text-[10px] font-semibold border border-cream-200 dark:border-espresso-700"
                            >
                              {v.name}: {formatCurrency(v.price).replace("₨ ", "Rs ")}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Card Footer: Live In-Stock Switch & Action Buttons */}
                    <div className="pt-2 border-t border-cream-200 dark:border-espresso-700 flex items-center justify-between">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.is_available !== false}
                          onChange={() => handleToggleAvailability(item)}
                          className="w-3.5 h-3.5 text-vintage-orange rounded focus:ring-vintage-orange cursor-pointer"
                        />
                        <span className="text-[11px] font-bold text-espresso-700 dark:text-cream-300">
                          {item.is_available !== false ? "In-Stock" : "Out of Stock"}
                        </span>
                      </label>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            playSound("click");
                            setEditingItem(item);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 rounded-xl bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 dark:hover:bg-espresso-700 text-espresso-800 dark:text-cream-200 transition-colors"
                          title="Edit full item details"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setItemToDelete(item)}
                          className="p-1.5 rounded-xl bg-cream-100 dark:bg-espresso-800 hover:bg-brick/15 text-espresso-700 hover:text-brick transition-colors"
                          title="Delete menu item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="bg-white dark:bg-espresso-850 rounded-3xl border border-cream-200 dark:border-espresso-700 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-espresso-800 dark:text-cream-100">
                <thead className="bg-cream-100/70 dark:bg-espresso-900 border-b border-cream-200 dark:border-espresso-700 text-[10px] uppercase font-bold text-espresso-700/60 dark:text-cream-300/60">
                  <tr>
                    <th className="p-3.5 pl-4">Item Details</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Station</th>
                    <th className="p-3.5">Selling Price</th>
                    <th className="p-3.5">Cost / Recipe</th>
                    <th className="p-3.5">Margin %</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 pr-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-200 dark:divide-espresso-700">
                  {filteredItems.map((item) => {
                    const profit = Math.max(0, item.base_price - (item.cost_price || 0));
                    const margin = item.base_price > 0 ? Math.round((profit / item.base_price) * 100) : 0;

                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-cream-50/50 dark:hover:bg-espresso-800/40 transition-colors ${
                          !item.is_available ? "opacity-60 bg-cream-50/20" : ""
                        }`}
                      >
                        {/* Item Details */}
                        <td className="p-3.5 pl-4">
                          <div className="flex items-center gap-3">
                            <img
                              src={item.photo_url || PRESET_PHOTOS[0].url}
                              alt={item.name_en}
                              className="w-10 h-10 rounded-xl object-cover border border-cream-300 dark:border-espresso-700 flex-shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-1.5">
                                <span className="font-bold text-sm text-espresso-900 dark:text-cream-100">
                                  {item.name_en}
                                </span>
                                {item.is_favourite && (
                                  <Star className="w-3 h-3 text-mustard fill-current flex-shrink-0" />
                                )}
                              </div>
                              {item.name_ur && (
                                <span className="font-urdu text-xs text-espresso-700/70 block">
                                  {item.name_ur}
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Category */}
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 rounded-lg bg-cream-100 dark:bg-espresso-800 text-[11px] font-bold">
                            {getCategoryName(item.category_id)}
                          </span>
                        </td>

                        {/* Station */}
                        <td className="p-3.5">
                          <span className="text-xs font-semibold">
                            {item.station_type === "BAR" ? "☕ Bar" : "🍳 Kitchen"}
                          </span>
                        </td>

                        {/* Selling Price */}
                        <td className="p-3.5">
                          <button
                            onClick={() => setQuickPriceItem(item)}
                            className="font-sans font-black text-sm text-vintage-orange hover:underline flex items-center gap-1"
                          >
                            <span>{formatCurrency(item.base_price)}</span>
                            <Edit2 className="w-2.5 h-2.5 opacity-50" />
                          </button>
                        </td>

                        {/* Cost Price */}
                        <td className="p-3.5 font-semibold text-espresso-700/70">
                          {formatCurrency(item.cost_price || 0)}
                        </td>

                        {/* Margin */}
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold ${
                              margin >= 70
                                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300"
                                : margin >= 50
                                ? "bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300"
                                : "bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300"
                            }`}
                          >
                            {margin}%
                          </span>
                        </td>

                        {/* Status */}
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleAvailability(item)}
                            className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-all ${
                              item.is_available !== false
                                ? "bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-700"
                                : "bg-red-50 text-red-800 border-red-300 dark:bg-red-950/60 dark:text-red-300 dark:border-red-700"
                            }`}
                          >
                            {item.is_available !== false ? "In-Stock" : "Out of Stock"}
                          </button>
                        </td>

                        {/* Actions */}
                        <td className="p-3.5 pr-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => {
                                playSound("click");
                                setEditingItem(item);
                                setIsModalOpen(true);
                              }}
                              className="p-1.5 rounded-xl hover:bg-cream-200 dark:hover:bg-espresso-700 text-espresso-800 dark:text-cream-200"
                              title="Edit item"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setItemToDelete(item)}
                              className="p-1.5 rounded-xl hover:bg-brick/15 text-brick"
                              title="Delete item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Create Item Modal */}
      <MenuItemModal
        isOpen={isModalOpen}
        item={editingItem}
        categories={categories}
        modifierGroups={modifierGroups}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSaved={(saved) => {
          setItems((prev) => {
            const exists = prev.some((i) => i.id === saved.id);
            return exists ? prev.map((i) => (i.id === saved.id ? saved : i)) : [saved, ...prev];
          });
        }}
      />

      {/* Quick Price Adjuster Modal */}
      <QuickPriceModal
        item={quickPriceItem}
        onClose={() => setQuickPriceItem(null)}
        onSaved={(updated) => {
          setItems((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
        }}
      />

      {/* Delete Item Confirmation Prompt */}
      {itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/70 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-3xl p-5 shadow-floating text-espresso-900 dark:text-cream-100">
            <div className="w-12 h-12 rounded-2xl bg-brick/15 text-brick flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-serif font-black text-lg text-center mb-1">
              Delete Menu Item?
            </h3>
            <p className="text-xs text-espresso-700/70 dark:text-cream-300/70 text-center mb-4">
              Are you sure you want to remove <span className="font-bold text-espresso-900 dark:text-white">"{itemToDelete.name_en}"</span>? This will remove it from the POS counter register.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setItemToDelete(null)}
                className="py-2.5 rounded-xl border border-cream-300 dark:border-espresso-700 text-xs font-bold text-espresso-700 hover:bg-cream-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteItem(itemToDelete)}
                className="py-2.5 rounded-xl bg-brick text-white text-xs font-bold shadow-md hover:bg-brick/90 transition-colors"
              >
                Delete Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
