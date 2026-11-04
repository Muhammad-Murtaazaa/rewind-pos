"use client";

import React, { useState, useEffect } from "react";
import { type MenuItemDef, type CategoryDef, type ModifierGroupDef, type ItemVariantDef } from "@/lib/data/sample-menu";
import { db } from "@/lib/db/dexie";
import { generateUUID, formatCurrency } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import {
  X,
  Coffee,
  Plus,
  Trash2,
  Sparkles,
  DollarSign,
  Tag,
  CheckCircle2,
  ChefHat,
  Percent,
  Sliders,
  Image as ImageIcon,
} from "lucide-react";

export const PRESET_PHOTOS = [
  { label: "Espresso", url: "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=600&q=80" },
  { label: "Latte / Flat White", url: "https://images.unsplash.com/photo-1534778101976-62847782c213?auto=format&fit=crop&w=600&q=80" },
  { label: "Cappuccino", url: "https://images.unsplash.com/photo-1572442388796-11668a67e53d?auto=format&fit=crop&w=600&q=80" },
  { label: "Iced / Cold Brew", url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?auto=format&fit=crop&w=600&q=80" },
  { label: "Artisan Chai / Tea", url: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=600&q=80" },
  { label: "Croissant / Pastry", url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=600&q=80" },
  { label: "Sandwich / Panini", url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&w=600&q=80" },
  { label: "Dessert / Cake", url: "https://images.unsplash.com/photo-1587314168485-3236d6710814?auto=format&fit=crop&w=600&q=80" },
];

const DIETARY_OPTIONS = ["Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", "Nut-Free", "Halal"];

interface MenuItemModalProps {
  isOpen: boolean;
  item: MenuItemDef | null; // null = Create, MenuItemDef = Edit
  categories: CategoryDef[];
  modifierGroups: ModifierGroupDef[];
  onClose: () => void;
  onSaved: (item: MenuItemDef) => void;
}

export function MenuItemModal({
  isOpen,
  item,
  categories,
  modifierGroups,
  onClose,
  onSaved,
}: MenuItemModalProps) {
  const { playSound } = useUiStore();

  const [nameEn, setNameEn] = useState("");
  const [nameUr, setNameUr] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [stationType, setStationType] = useState<"BAR" | "KITCHEN">("BAR");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState<number>(500);
  const [costPrice, setCostPrice] = useState<number>(120);
  const [taxRate, setTaxRate] = useState<number>(16);
  const [photoUrl, setPhotoUrl] = useState("");
  const [isFavourite, setIsFavourite] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [dietaryTags, setDietaryTags] = useState<string[]>([]);
  const [variants, setVariants] = useState<ItemVariantDef[]>([]);
  const [modifierGroupIds, setModifierGroupIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "pricing" | "variants" | "modifiers">("details");
  const [errors, setErrors] = useState<{ nameEn?: string; basePrice?: string }>({});

  useEffect(() => {
    if (item) {
      setNameEn(item.name_en || "");
      setNameUr(item.name_ur || "");
      setCategoryId(item.category_id || (categories[0]?.id ?? "cat-hot-coffee"));
      setStationType(item.station_type || "BAR");
      setDescription(item.description || "");
      setBasePrice(item.base_price || 0);
      setCostPrice(item.cost_price || 0);
      setTaxRate(item.tax_rate ?? 16);
      setPhotoUrl(item.photo_url || "");
      setIsFavourite(!!item.is_favourite);
      setIsAvailable(item.is_available !== false);
      setDietaryTags(item.dietary_tags || []);
      setVariants(item.variants ? JSON.parse(JSON.stringify(item.variants)) : []);
      setModifierGroupIds(item.modifier_group_ids ? [...item.modifier_group_ids] : []);
    } else {
      setNameEn("");
      setNameUr("");
      setCategoryId(categories[0]?.id || "cat-hot-coffee");
      setStationType("BAR");
      setDescription("");
      setBasePrice(550);
      setCostPrice(120);
      setTaxRate(16);
      setPhotoUrl(PRESET_PHOTOS[0].url);
      setIsFavourite(false);
      setIsAvailable(true);
      setDietaryTags(["Vegetarian"]);
      setVariants([]);
      setModifierGroupIds(["mod-milk", "mod-sugar"]);
    }
    setActiveTab("details");
    setErrors({});
  }, [item, categories, isOpen]);

  if (!isOpen) return null;

  const grossProfit = Math.max(0, basePrice - costPrice);
  const marginPercent = basePrice > 0 ? Math.round((grossProfit / basePrice) * 100) : 0;

  const handleToggleDietary = (tag: string) => {
    setDietaryTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleToggleModifierGroup = (modId: string) => {
    setModifierGroupIds((prev) =>
      prev.includes(modId) ? prev.filter((id) => id !== modId) : [...prev, modId]
    );
  };

  const handleAddVariant = () => {
    playSound("click");
    setVariants((prev) => [
      ...prev,
      { id: `var-${Date.now()}`, name: "Regular Size", price: basePrice },
    ]);
  };

  const handleUpdateVariant = (index: number, field: "name" | "price", val: any) => {
    setVariants((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: val };
      return copy;
    });
  };

  const handleRemoveVariant = (index: number) => {
    playSound("click");
    setVariants((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const newErrors: { nameEn?: string; basePrice?: string } = {};
    if (!nameEn.trim()) newErrors.nameEn = "Item English name is required";
    if (basePrice <= 0) newErrors.basePrice = "Selling price must be greater than 0";

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      playSound("click");
      return;
    }

    const savedItem: MenuItemDef = {
      id: item?.id || `item-${Date.now()}`,
      category_id: categoryId,
      name_en: nameEn.trim(),
      name_ur: nameUr.trim(),
      description: description.trim(),
      base_price: Number(basePrice),
      cost_price: Number(costPrice),
      tax_rate: Number(taxRate),
      photo_url: photoUrl.trim() || PRESET_PHOTOS[0].url,
      station_type: stationType,
      is_favourite: isFavourite,
      is_available: isAvailable,
      dietary_tags: dietaryTags,
      variants: variants.length > 0 ? variants : undefined,
      modifier_group_ids: modifierGroupIds.length > 0 ? modifierGroupIds : undefined,
    };

    try {
      await db.items.put(savedItem);

      // Record outbox sync event
      await db.outbox.add({
        id: generateUUID(),
        event_type: item ? "MENU_ITEM_UPDATED" : "MENU_ITEM_CREATED",
        payload: savedItem,
        retry_count: 0,
        status: "PENDING",
        created_at: new Date().toISOString(),
      });

      playSound("chime");
      onSaved(savedItem);
      onClose();
    } catch (err: any) {
      alert("Failed to save menu item: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-2xl bg-cream-50 dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-3xl shadow-floating text-espresso-900 dark:text-cream-100 flex flex-col overflow-hidden max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-cream-200 dark:border-espresso-700 bg-white dark:bg-espresso-900/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-vintage-orange/15 text-vintage-orange flex items-center justify-center font-bold">
              {stationType === "BAR" ? <Coffee className="w-5 h-5" /> : <ChefHat className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-espresso-900 dark:text-cream-100 leading-tight">
                {item ? "Edit Menu Item" : "Create New Menu Item"}
              </h3>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                {item ? `Editing #${item.id}` : "Add coffee, beverage, bakery, or kitchen item"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-cream-200 dark:hover:bg-espresso-700 text-espresso-700 dark:text-cream-300 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 px-5 pt-3 border-b border-cream-200 dark:border-espresso-700 bg-cream-100/50 dark:bg-espresso-950/30">
          {[
            { id: "details", label: "Details & Category", icon: Tag },
            { id: "pricing", label: "Pricing & Cost", icon: DollarSign },
            { id: "variants", label: `Sizes & Variants (${variants.length})`, icon: Sliders },
            { id: "modifiers", label: `Modifiers (${modifierGroupIds.length})`, icon: Sparkles },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSound("click");
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 ${
                  isActive
                    ? "bg-white dark:bg-espresso-850 text-vintage-orange border-vintage-orange shadow-sm"
                    : "text-espresso-700/70 dark:text-cream-300/70 border-transparent hover:text-espresso-900"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* TAB 1: DETAILS */}
          {activeTab === "details" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* English Name */}
                <div>
                  <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                    English Name <span className="text-brick">*</span>
                  </label>
                  <input
                    type="text"
                    value={nameEn}
                    onChange={(e) => setNameEn(e.target.value)}
                    placeholder="e.g. Vanilla Iced Latte"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-600 font-bold text-sm"
                  />
                  {errors.nameEn && <span className="text-[11px] text-brick font-semibold">{errors.nameEn}</span>}
                </div>

                {/* Urdu Name */}
                <div>
                  <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                    Urdu Name (اردو نام)
                  </label>
                  <input
                    type="text"
                    value={nameUr}
                    onChange={(e) => setNameUr(e.target.value)}
                    dir="rtl"
                    placeholder="مثال: ونیلا آئسڈ لاٹے"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-600 font-urdu text-sm"
                  />
                </div>
              </div>

              {/* Category & Station Selection */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                    Menu Category
                  </label>
                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-600 text-sm font-semibold"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name_en} {c.name_ur ? `(${c.name_ur})` : ""}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                    Fulfillment Station (KDS Routing)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setStationType("BAR")}
                      className={`h-10 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        stationType === "BAR"
                          ? "bg-vintage-orange text-white border-vintage-orange shadow-sm"
                          : "bg-white dark:bg-espresso-800 border-cream-300 dark:border-espresso-700 text-espresso-800 dark:text-cream-200"
                      }`}
                    >
                      <Coffee className="w-3.5 h-3.5" />
                      <span>Barista Bar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setStationType("KITCHEN")}
                      className={`h-10 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                        stationType === "KITCHEN"
                          ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                          : "bg-white dark:bg-espresso-800 border-cream-300 dark:border-espresso-700 text-espresso-800 dark:text-cream-200"
                      }`}
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Kitchen Station</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                  Menu Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={2}
                  placeholder="Appetizing description for receipt, register, and QR table ordering…"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-600 text-xs"
                />
              </div>

              {/* Photo URL & Quick Presets */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block">
                  Item Photo URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-600 text-xs"
                  />
                  {photoUrl && (
                    <img
                      src={photoUrl}
                      alt="Preview"
                      className="w-10 h-10 rounded-xl object-cover border border-cream-300 dark:border-espresso-700 flex-shrink-0"
                    />
                  )}
                </div>

                <div className="pt-1">
                  <span className="text-[11px] font-semibold text-espresso-700/60 dark:text-cream-300/60 block mb-1.5">
                    Or select a photo preset:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {PRESET_PHOTOS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhotoUrl(p.url)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition-all ${
                          photoUrl === p.url
                            ? "bg-vintage-orange text-white border-vintage-orange"
                            : "bg-white dark:bg-espresso-800 border-cream-300 dark:border-espresso-700 text-espresso-700 dark:text-cream-200 hover:border-vintage-orange"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Dietary Tags */}
              <div>
                <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1.5">
                  Dietary Flags
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {DIETARY_OPTIONS.map((tag) => {
                    const isSelected = dietaryTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleDietary(tag)}
                        className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                          isSelected
                            ? "bg-sage text-white border-sage shadow-sm"
                            : "bg-white dark:bg-espresso-800 border-cream-300 dark:border-espresso-700 text-espresso-700 dark:text-cream-200 hover:border-sage"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Status Toggles: Favourite & In-Stock */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-cream-200 dark:border-espresso-700">
                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFavourite}
                    onChange={(e) => setIsFavourite(e.target.checked)}
                    className="w-4 h-4 text-mustard rounded focus:ring-mustard cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold block">⭐ Add to Favourites</span>
                    <span className="text-[10px] text-espresso-700/60 dark:text-cream-300/60">
                      Show in fast-access tab on POS
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-2.5 p-3 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isAvailable}
                    onChange={(e) => setIsAvailable(e.target.checked)}
                    className="w-4 h-4 text-vintage-orange rounded focus:ring-vintage-orange cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold block">In-Stock / Available</span>
                    <span className="text-[10px] text-espresso-700/60 dark:text-cream-300/60">
                      Allow cashier & QR ordering
                    </span>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 2: PRICING & COST */}
          {activeTab === "pricing" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Base Selling Price */}
                <div className="p-4 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700">
                  <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                    Selling Price (PKR) <span className="text-brick">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-bold text-espresso-700/50">₨</span>
                    <input
                      type="number"
                      value={basePrice}
                      onChange={(e) => setBasePrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-600 font-bold text-lg"
                    />
                  </div>
                  {errors.basePrice && (
                    <span className="text-[11px] text-brick font-semibold">{errors.basePrice}</span>
                  )}
                  <span className="text-[10px] text-espresso-700/50 block mt-1">Standard counter retail price</span>
                </div>

                {/* Cost Price */}
                <div className="p-4 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700">
                  <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                    Cost Price / BOM (PKR)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-sm font-bold text-espresso-700/50">₨</span>
                    <input
                      type="number"
                      value={costPrice}
                      onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                      className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-600 font-bold text-lg"
                    />
                  </div>
                  <span className="text-[10px] text-espresso-700/50 block mt-1">Ingredient / raw recipe cost</span>
                </div>

                {/* Profit Margin Callout */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-sage-light to-emerald-100/50 dark:from-emerald-950/60 dark:to-emerald-900/40 border border-sage/40 flex flex-col justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-sage-dark dark:text-emerald-300 uppercase tracking-wider block">
                      Gross Profit Margin
                    </span>
                    <span className="font-sans font-black text-2xl text-sage-dark dark:text-emerald-200">
                      {marginPercent}%
                    </span>
                  </div>
                  <span className="text-xs font-bold text-espresso-800 dark:text-cream-100 mt-2">
                    Profit: {formatCurrency(grossProfit)} / item
                  </span>
                </div>
              </div>

              {/* Tax Rate */}
              <div className="p-4 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold block">Sales Tax Rate (%)</span>
                  <span className="text-[11px] text-espresso-700/60 dark:text-cream-300/60">
                    Applicable PRA / SRB sales tax on beverage and food
                  </span>
                </div>
                <div className="w-28 relative">
                  <input
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    className="w-full pr-7 pl-3 py-1.5 rounded-xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-600 font-bold text-sm text-right"
                  />
                  <span className="absolute right-3 top-2 text-xs font-bold text-espresso-700/60">%</span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: VARIANTS & SIZES */}
          {activeTab === "variants" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm">Sizes & Serving Variants</h4>
                  <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                    If this item is sold in different sizes (e.g. Regular, Large, 12 oz, 16 oz)
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddVariant}
                  className="px-3.5 py-1.5 rounded-xl bg-vintage-orange text-white text-xs font-bold flex items-center gap-1.5 shadow-sm hover:brightness-105"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Size</span>
                </button>
              </div>

              {variants.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-espresso-850 rounded-2xl border border-dashed border-cream-300 dark:border-espresso-700">
                  <Sliders className="w-8 h-8 text-espresso-700/30 mx-auto mb-2" />
                  <p className="text-xs font-bold text-espresso-800 dark:text-cream-100">
                    No size variants configured
                  </p>
                  <p className="text-[11px] text-espresso-700/60 dark:text-cream-300/60 mt-0.5">
                    The item will sell at the default Base Price of {formatCurrency(basePrice)}. Click "Add Size" to configure Small, Medium, Large, etc.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {variants.map((v, i) => (
                    <div
                      key={v.id || i}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700"
                    >
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-espresso-700/60 block mb-0.5">Size / Variant Name</label>
                        <input
                          type="text"
                          value={v.name}
                          onChange={(e) => handleUpdateVariant(i, "name", e.target.value)}
                          placeholder="e.g. Large (12 oz)"
                          className="w-full px-3 py-1.5 rounded-xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-600 text-xs font-bold"
                        />
                      </div>

                      <div className="w-36">
                        <label className="text-[10px] font-bold text-espresso-700/60 block mb-0.5">Price (PKR)</label>
                        <div className="relative">
                          <span className="absolute left-2.5 top-1.5 text-xs font-bold text-espresso-700/50">₨</span>
                          <input
                            type="number"
                            value={v.price}
                            onChange={(e) => handleUpdateVariant(i, "price", parseFloat(e.target.value) || 0)}
                            className="w-full pl-6 pr-2 py-1.5 rounded-xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-600 text-xs font-bold"
                          />
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveVariant(i)}
                        className="p-2 text-brick hover:bg-brick/10 rounded-xl transition-colors mt-3"
                        title="Delete variant"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: MODIFIERS */}
          {activeTab === "modifiers" && (
            <div className="space-y-3">
              <div>
                <h4 className="font-bold text-sm">Assign Modifier Groups</h4>
                <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                  Select which customizer options customers can pick (e.g. Milk choice, Syrups, Extra shot)
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {modifierGroups.map((group) => {
                  const isChecked = modifierGroupIds.includes(group.id);
                  return (
                    <label
                      key={group.id}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border transition-all cursor-pointer ${
                        isChecked
                          ? "bg-vintage-orange/10 border-vintage-orange shadow-sm"
                          : "bg-white dark:bg-espresso-850 border-cream-200 dark:border-espresso-700 hover:border-vintage-orange/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleModifierGroup(group.id)}
                        className="w-4 h-4 mt-0.5 text-vintage-orange rounded focus:ring-vintage-orange cursor-pointer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-espresso-900 dark:text-cream-100">
                            {group.name_en}
                          </span>
                          <span className="text-[10px] text-espresso-700/60 dark:text-cream-300/60 font-mono">
                            {group.options.length} options
                          </span>
                        </div>
                        {group.name_ur && (
                          <span className="text-[11px] font-urdu text-espresso-700/70 block leading-tight">
                            {group.name_ur}
                          </span>
                        )}
                        <p className="text-[10px] text-espresso-700/50 dark:text-cream-300/50 mt-1 truncate">
                          {group.options.map((o) => o.name_en).join(", ")}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-cream-200 dark:border-espresso-700 bg-white dark:bg-espresso-900/70 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-cream-300 dark:border-espresso-700 text-xs font-bold text-espresso-700 hover:bg-cream-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="h-11 px-7 rounded-2xl bg-vintage-orange hover:bg-vintage-orange/90 text-white font-serif font-bold text-sm shadow-md flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{item ? "Save Changes" : "Create Item"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
