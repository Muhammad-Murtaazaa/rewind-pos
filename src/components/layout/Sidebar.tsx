"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { useTranslation } from "@/lib/i18n/translations";
import { PinModal } from "../common/PinModal";
import {
  Coffee,
  LayoutGrid,
  ChefHat,
  Receipt,
  TrendingUp,
  SlidersHorizontal,
  ShoppingBag,
  DollarSign,
  BarChart3,
  Users,
  BookOpen,
  Heart,
  Sparkles,
  QrCode,
  CreditCard,
  Compass,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  Lock,
  X,
  Download,
} from "lucide-react";

export function Sidebar() {
  const pathname = usePathname();
  const { currentUser, isLocked } = useAuthStore();
  const {
    language,
    isRtl,
    setLanguage,
    theme,
    toggleTheme,
    soundEnabled,
    toggleSound,
    sidebarCollapsed,
    toggleSidebar,
    mobileMenuOpen,
    setMobileMenuOpen,
    playSound,
  } = useUiStore();
  const { t } = useTranslation(language);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    playSound("click");
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      alert(
        "To Install in Google Chrome:\n1. Look at the right side of your Chrome URL address bar.\n2. Click the 'Install App' icon (computer with down arrow).\n3. Click 'Install' to add Rewind POS to your desktop."
      );
    }
  };

  const navSections = [
    {
      groupTitle: language === "ur" ? "کاؤنٹر اور سروس" : "Counter & Service",
      items: [
        { href: "/pos", label: t("pos"), icon: Coffee, badge: "FOH" },
        { href: "/tables", label: t("tables"), icon: LayoutGrid },
        { href: "/cash-drawer", label: t("cashDrawer"), icon: Receipt },
        { href: "/qr/T-01", label: language === "ur" ? "ٹیبل کیو آر" : "Table QR Order", icon: QrCode },
      ],
    },
    {
      groupTitle: language === "ur" ? "باورچی خانہ" : "Kitchen Stations",
      items: [
        { href: "/kds/bar", label: t("kdsBar"), icon: Sparkles, badge: "Bar" },
        { href: "/kds/kitchen", label: t("kdsKitchen"), icon: ChefHat, badge: "Chef" },
      ],
    },
    {
      groupTitle: language === "ur" ? "بیک آفس" : "Back Office",
      items: [
        { href: "/inventory", label: t("inventory"), icon: SlidersHorizontal },
        { href: "/purchasing", label: t("purchasing"), icon: ShoppingBag },
        { href: "/expenses", label: language === "ur" ? "اخراجات" : "Expenses", icon: DollarSign },
      ],
    },
    {
      groupTitle: language === "ur" ? "عملہ اور کھاتہ" : "People & Money",
      items: [
        { href: "/hr", label: language === "ur" ? "عملہ اور حاضری" : "Staff & HR", icon: Users },
        { href: "/payroll", label: language === "ur" ? "تنخواہیں" : "Payroll", icon: CreditCard },
        { href: "/accounting", label: language === "ur" ? "کھاتہ داری" : "Accounting", icon: BookOpen },
      ],
    },
    {
      groupTitle: language === "ur" ? "ترقی اور انٹیلیجنس" : "Growth & Intelligence",
      items: [
        { href: "/customers", label: language === "ur" ? "صارفین و لائلٹی" : "Customers & Loyalty", icon: Heart, badge: "Stamps" },
        { href: "/menu-engineering", label: language === "ur" ? "مینو میٹرکس" : "Menu Matrix", icon: Sparkles },
        { href: "/reports", label: language === "ur" ? "رپورٹس و آڈٹ" : "Reports & Audit", icon: BarChart3 },
        { href: "/dashboard", label: t("dashboard"), icon: TrendingUp },
      ],
    },
  ];

  const handleLinkClick = () => {
    playSound("click");
    if (mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Backdrop overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-espresso-950/60 backdrop-blur-sm lg:hidden animate-fade-in"
        />
      )}

      {/* Main Sidebar Shell */}
      <aside
        className={`fixed top-0 bottom-0 z-50 flex flex-col bg-cream-50 dark:bg-espresso-900 transition-all duration-300 ease-in-out shadow-floating lg:shadow-none ${
          isRtl
            ? "border-l border-cream-200 dark:border-espresso-700/80"
            : "border-r border-cream-200 dark:border-espresso-700/80"
        } ${
          isRtl
            ? mobileMenuOpen
              ? "right-0 w-72"
              : "-right-72 lg:right-0"
            : mobileMenuOpen
              ? "left-0 w-72"
              : "-left-72 lg:left-0"
        } ${
          sidebarCollapsed ? "lg:w-20" : "lg:w-64"
        }`}
      >
        {/* 1. Brand Logo Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-cream-200 dark:border-espresso-700/80 flex-shrink-0">
          <Link
            href="/pos"
            onClick={handleLinkClick}
            className="flex items-center gap-2.5 overflow-hidden group"
          >
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-vintage-orange to-amber-600 flex items-center justify-center text-white shadow-card flex-shrink-0 group-hover:scale-105 transition-transform">
              <Coffee className="w-5 h-5 stroke-[2.5]" />
            </div>

            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex flex-col truncate animate-fade-in">
                <span className="font-serif font-black text-lg tracking-tight text-espresso-900 dark:text-cream-100 flex items-center gap-1.5">
                  Rewind
                  <span className="text-[10px] text-vintage-orange px-1.5 py-0.2 rounded-full bg-vintage-orange/10 font-sans font-bold">
                    POS
                  </span>
                </span>
                <span className="text-[10px] text-espresso-700/60 dark:text-cream-300/60 font-semibold truncate -mt-0.5">
                  Café & Management
                </span>
              </div>
            )}
          </Link>

          {/* Desktop Toggle Button */}
          <button
            onClick={toggleSidebar}
            className="hidden lg:flex p-1.5 rounded-xl text-espresso-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-espresso-800 transition-colors"
            title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
          >
            {sidebarCollapsed ? (
              isRtl ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />
            ) : (
              isRtl ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />
            )}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1.5 rounded-xl text-espresso-700 dark:text-cream-200 hover:bg-cream-200 dark:hover:bg-espresso-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Scrollable Navigation List */}
        <div className="flex-1 overflow-y-auto py-3 px-3 space-y-4">
          {navSections.map((section, sIdx) => (
            <div key={sIdx} className="space-y-1">
              {/* Group Heading */}
              {(!sidebarCollapsed || mobileMenuOpen) && (
                <div className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-espresso-700/50 dark:text-cream-300/50">
                  {section.groupTitle}
                </div>
              )}

              {/* Items */}
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    pathname === item.href ||
                    (item.href !== "/" && pathname?.startsWith(item.href + "/"));

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleLinkClick}
                      className={`group relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-bold transition-all duration-150 ${
                        isActive
                          ? "bg-vintage-orange text-white shadow-md shadow-vintage-orange/20"
                          : "text-espresso-800 dark:text-cream-200 hover:bg-cream-200/60 dark:hover:bg-espresso-800/80 hover:text-espresso-950 dark:hover:text-white"
                      } ${sidebarCollapsed && !mobileMenuOpen ? "justify-center px-0" : ""}`}
                      title={sidebarCollapsed ? item.label : undefined}
                    >
                      <Icon
                        className={`w-4 h-4 flex-shrink-0 transition-transform group-hover:scale-110 ${
                          isActive ? "text-white" : "text-vintage-orange"
                        }`}
                      />

                      {(!sidebarCollapsed || mobileMenuOpen) && (
                        <span className="truncate flex-1">{item.label}</span>
                      )}

                      {(!sidebarCollapsed || mobileMenuOpen) && item.badge && !isActive && (
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-cream-200 dark:bg-espresso-800 text-espresso-700 dark:text-cream-300">
                          {item.badge}
                        </span>
                      )}

                      {/* Floating tooltip on collapsed desktop view */}
                      {sidebarCollapsed && !mobileMenuOpen && (
                        <div
                          className={`absolute ${
                            isRtl ? "right-full mr-3" : "left-full ml-3"
                          } px-2.5 py-1.5 rounded-xl bg-espresso-900 text-white text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-floating z-50`}
                        >
                          {item.label}
                        </div>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* 3. Bottom Controls & Staff User Profile */}
        <div className="p-3 border-t border-cream-200 dark:border-espresso-700/80 space-y-2 flex-shrink-0 bg-cream-100/50 dark:bg-espresso-950/40">
          {/* Quick Utility Icon Row */}
          <div className="flex items-center justify-between gap-1">
            {/* Language Switch */}
            <button
              onClick={() => {
                playSound("click");
                setLanguage(language === "en" ? "ur" : "en");
              }}
              className="p-1.5 rounded-xl border border-cream-300 dark:border-espresso-700 bg-white dark:bg-espresso-800 hover:border-vintage-orange text-xs font-black text-espresso-800 dark:text-cream-100 transition-colors flex items-center justify-center min-w-[32px] h-8"
              title="Switch English / اردو"
            >
              {language === "en" ? "اردو" : "EN"}
            </button>

            {/* Day / Night Theme Switch */}
            <button
              onClick={() => {
                playSound("click");
                toggleTheme();
              }}
              className="p-1.5 rounded-xl border border-cream-300 dark:border-espresso-700 bg-white dark:bg-espresso-800 hover:border-vintage-orange text-espresso-700 dark:text-cream-200 transition-colors flex items-center justify-center w-8 h-8"
              title="Toggle Theme"
            >
              {theme === "light" ? (
                <Moon className="w-3.5 h-3.5" />
              ) : (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              )}
            </button>

            {/* Sound Toggle */}
            <button
              onClick={() => {
                playSound("click");
                toggleSound();
              }}
              className="p-1.5 rounded-xl border border-cream-300 dark:border-espresso-700 bg-white dark:bg-espresso-800 hover:border-vintage-orange text-espresso-700 dark:text-cream-200 transition-colors flex items-center justify-center w-8 h-8"
              title={soundEnabled ? "Mute sounds" : "Enable sounds"}
            >
              {soundEnabled ? (
                <Volume2 className="w-3.5 h-3.5 text-sage" />
              ) : (
                <VolumeX className="w-3.5 h-3.5 text-espresso-700/40" />
              )}
            </button>

            {/* Setup Wizard */}
            <Link
              href="/setup"
              onClick={handleLinkClick}
              className="p-1.5 rounded-xl border border-cream-300 dark:border-espresso-700 bg-white dark:bg-espresso-800 hover:border-vintage-orange text-vintage-orange transition-colors flex items-center justify-center w-8 h-8"
              title="Café Setup Wizard"
            >
              <Compass className="w-3.5 h-3.5" />
            </Link>

            {/* Install Desktop App */}
            <button
              onClick={handleInstallClick}
              className="p-1.5 rounded-xl border border-cream-300 dark:border-espresso-700 bg-white dark:bg-espresso-800 hover:border-vintage-orange text-espresso-700 dark:text-cream-200 transition-colors flex items-center justify-center w-8 h-8 group"
              title="Install Rewind POS as Desktop / Tablet App"
            >
              <Download className="w-3.5 h-3.5 text-vintage-orange group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Current Staff Switcher Card */}
          <button
            onClick={() => setIsPinModalOpen(true)}
            className={`w-full p-2 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 hover:border-vintage-orange shadow-card transition-all flex items-center gap-2.5 ${
              sidebarCollapsed && !mobileMenuOpen ? "justify-center p-2" : ""
            }`}
            title="Switch Staff / PIN Lock"
          >
            <span className="text-xl flex-shrink-0">
              {currentUser?.avatar || "🧑‍💻"}
            </span>

            {(!sidebarCollapsed || mobileMenuOpen) && (
              <div className="flex-1 text-left truncate">
                <span className="font-bold text-xs text-espresso-900 dark:text-cream-100 block truncate leading-tight">
                  {currentUser?.name || "Ali Raza"}
                </span>
                <span className="text-[10px] font-semibold text-vintage-orange uppercase tracking-wide">
                  {currentUser?.role || "CASHIER"}
                </span>
              </div>
            )}

            {(!sidebarCollapsed || mobileMenuOpen) && (
              <Lock className="w-3.5 h-3.5 text-espresso-700/40 dark:text-cream-300/40 flex-shrink-0" />
            )}
          </button>
        </div>
      </aside>

      {/* Staff PIN Switcher Modal */}
      <PinModal
        isOpen={isPinModalOpen || isLocked}
        onClose={() => setIsPinModalOpen(false)}
        title="Switch Staff / Authorize"
        subtitle="Enter 4-digit staff PIN to switch role"
      />
    </>
  );
}
