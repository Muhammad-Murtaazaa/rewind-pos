"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { useTranslation } from "@/lib/i18n/translations";
import { SyncPill } from "../common/SyncPill";
import { PinModal } from "../common/PinModal";
import {
  Coffee,
  LayoutGrid,
  ChefHat,
  Receipt,
  TrendingUp,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  Sparkles,
  Lock,
  Compass,
  SlidersHorizontal,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Users,
  BookOpen,
  Heart,
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { currentUser, isLocked, lockTerminal } = useAuthStore();
  const { language, setLanguage, theme, toggleTheme, soundEnabled, toggleSound } = useUiStore();
  const { t } = useTranslation(language);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);

  const navLinks = [
    { href: "/pos", label: t("pos"), icon: Coffee },
    { href: "/tables", label: t("tables"), icon: LayoutGrid },
    { href: "/kds/bar", label: t("kdsBar"), icon: Sparkles },
    { href: "/kds/kitchen", label: t("kdsKitchen"), icon: ChefHat },
    { href: "/cash-drawer", label: t("cashDrawer"), icon: Receipt },
    { href: "/customers", label: "Loyalty", icon: Heart },
    { href: "/menu-engineering", label: "Menu Matrix", icon: Sparkles },
    { href: "/inventory", label: t("inventory"), icon: SlidersHorizontal },
    { href: "/purchasing", label: t("purchasing"), icon: ShoppingBag },
    { href: "/expenses", label: "Expenses", icon: DollarSign },
    { href: "/hr", label: "Staff & HR", icon: Users },
    { href: "/accounting", label: "Accounting", icon: BookOpen },
    { href: "/reports", label: "Reports", icon: BarChart3 },
    { href: "/dashboard", label: t("dashboard"), icon: TrendingUp },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-cream-50/95 dark:bg-espresso-900/95 backdrop-blur-md border-b border-cream-200 dark:border-espresso-700/80 px-4 py-2.5 transition-colors shadow-soft">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-3">
            <Link href="/pos" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-vintage-orange to-amber-600 flex items-center justify-center text-white shadow-card group-hover:scale-105 transition-transform">
                <Coffee className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-black text-xl tracking-tight text-espresso-800 dark:text-cream-100 flex items-center gap-1.5">
                  Rewind <span className="text-vintage-orange text-xs px-1.5 py-0.5 rounded-full bg-vintage-orange/10 font-sans font-semibold">CAFÉ</span>
                </span>
                <span className="text-[11px] text-espresso-700/60 dark:text-cream-300/60 font-medium">
                  {t("tagline")}
                </span>
              </div>
            </Link>

            {/* Offline Sync Status Pill */}
            <div className="hidden sm:block ml-2">
              <SyncPill />
            </div>
          </div>

          {/* Navigation Pill Menu */}
          <nav className="hidden lg:flex items-center gap-1 bg-cream-100 dark:bg-espresso-800 p-1 rounded-2xl border border-cream-200 dark:border-espresso-700">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    isActive
                      ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                      : "text-espresso-700 dark:text-cream-200 hover:text-espresso-950 dark:hover:text-white hover:bg-cream-200/50 dark:hover:bg-espresso-700/50"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Utility Controls & Staff Profile */}
          <div className="flex items-center gap-2">
            {/* Setup Wizard shortcut */}
            <Link
              href="/setup"
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium bg-cream-200/60 dark:bg-espresso-800 hover:bg-cream-200 border border-cream-300/60 dark:border-espresso-700 text-espresso-700 dark:text-cream-200 transition-colors"
              title="First-run Setup Wizard"
            >
              <Compass className="w-3.5 h-3.5 text-vintage-orange" />
              <span>Wizard</span>
            </Link>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-xl text-espresso-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-espresso-800 transition-colors"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-sage" /> : <VolumeX className="w-4 h-4 text-espresso-700/40" />}
            </button>

            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === "en" ? "ur" : "en")}
              className="px-2.5 py-1 rounded-xl text-xs font-bold border border-cream-300 dark:border-espresso-700 bg-white dark:bg-espresso-800 hover:border-vintage-orange transition-colors text-espresso-800 dark:text-cream-100"
              title="Switch English / اردو"
            >
              {language === "en" ? "اردو" : "EN"}
            </button>

            {/* Dark/Light Theme */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-espresso-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-espresso-800 transition-colors"
              title="Toggle Day/Evening Theme"
            >
              {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4 text-amber-400" />}
            </button>

            {/* Current Staff Switcher Button */}
            <button
              onClick={() => setIsPinModalOpen(true)}
              className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 hover:border-vintage-orange transition-all shadow-card"
            >
              <span className="text-base">{currentUser?.avatar || "🧑‍💼"}</span>
              <div className="flex flex-col text-left">
                <span className="text-xs font-bold text-espresso-800 dark:text-cream-100 truncate max-w-[90px]">
                  {currentUser?.name ? currentUser.name.split(" ")[0] : "Staff"}
                </span>
                <span className="text-[10px] text-vintage-orange font-medium -mt-0.5">
                  {currentUser?.role || "GUEST"}
                </span>
              </div>
              <Lock className="w-3 h-3 text-espresso-700/40 dark:text-cream-300/40 ml-1" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="lg:hidden flex items-center justify-between gap-1 overflow-x-auto pt-2 border-t border-cream-200 dark:border-espresso-700 mt-2">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[10px] font-semibold whitespace-nowrap ${
                  isActive
                    ? "bg-vintage-orange text-white"
                    : "text-espresso-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-espresso-800"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Staff PIN Switcher / Unlock Modal */}
      <PinModal
        isOpen={isPinModalOpen || isLocked}
        onClose={() => setIsPinModalOpen(false)}
        title="Switch Cashier / Manager"
        subtitle="Enter 4-digit staff PIN to authenticate"
      />
    </>
  );
}
