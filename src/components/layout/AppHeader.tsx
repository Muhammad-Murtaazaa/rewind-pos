"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { useTranslation } from "@/lib/i18n/translations";
import { SyncPill } from "../common/SyncPill";
import { PinModal } from "../common/PinModal";
import { RecallModal } from "../pos/RecallModal";
import { PrinterSettingsModal } from "../printing/PrinterSettingsModal";
import {
  autoDetectPrinter,
  subscribePrinterState,
  getCurrentPrinterState,
  type PrinterState,
} from "@/lib/printing/thermal-printer";
import { db } from "@/lib/db/dexie";
import {
  Menu,
  Lock,
  Clock,
  MapPin,
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
  CreditCard,
  Compass,
  QrCode,
  ShieldCheck,
  History,
  Printer,
  UtensilsCrossed,
} from "lucide-react";

interface RouteInfo {
  title: string;
  urduTitle: string;
  badge?: string;
  icon: React.ElementType;
}

const ROUTE_MAP: Record<string, RouteInfo> = {
  "/pos": {
    title: "POS Register",
    urduTitle: "کاؤنٹر پی او ایس",
    badge: "Front-of-House",
    icon: Coffee,
  },
  "/menu": {
    title: "Menu Items & Pricing",
    urduTitle: "مینو اور قیمتیں",
    badge: "Catalog",
    icon: UtensilsCrossed,
  },
  "/tables": {
    title: "Table & Floor Plan",
    urduTitle: "میزیں اور فلور پلان",
    badge: "Live Status",
    icon: LayoutGrid,
  },
  "/cash-drawer": {
    title: "Cash Drawer & Sessions",
    urduTitle: "کیش دراز اور سیشنز",
    badge: "X/Z Reports",
    icon: Receipt,
  },
  "/kds/bar": {
    title: "Barista KDS",
    urduTitle: "بریسٹا ڈسپلے",
    badge: "Coffee & Beverage Bar",
    icon: Sparkles,
  },
  "/kds/kitchen": {
    title: "Kitchen Station KDS",
    urduTitle: "کچن اسٹیشن ڈسپلے",
    badge: "Food & Grill Station",
    icon: ChefHat,
  },
  "/inventory": {
    title: "Inventory & BOM Recipes",
    urduTitle: "انوینٹری اور ریسیپی",
    badge: "Live Stock",
    icon: SlidersHorizontal,
  },
  "/purchasing": {
    title: "Purchasing & Vendors",
    urduTitle: "خریداری اور وینڈرز",
    badge: "PO & GRN",
    icon: ShoppingBag,
  },
  "/expenses": {
    title: "Operating Expenses",
    urduTitle: "اخراجات",
    badge: "Cash Flow Out",
    icon: DollarSign,
  },
  "/hr": {
    title: "Staff & Attendance HR",
    urduTitle: "عملہ اور حاضری",
    badge: "Biometric PIN",
    icon: Users,
  },
  "/payroll": {
    title: "Payroll & Compensation",
    urduTitle: "تنخواہیں اور سلپ",
    badge: "Monthly",
    icon: CreditCard,
  },
  "/accounting": {
    title: "Double-Entry Accounting",
    urduTitle: "کھاتہ داری اور فنانس",
    badge: "IFRS / P&L",
    icon: BookOpen,
  },
  "/customers": {
    title: "Customers & Loyalty",
    urduTitle: "صارفین اور لائلٹی",
    badge: "Stamp Cards",
    icon: Heart,
  },
  "/menu-engineering": {
    title: "Menu Matrix & Engineering",
    urduTitle: "مینو انجینئرنگ",
    badge: "Stars & Dogs",
    icon: Sparkles,
  },
  "/reports": {
    title: "Reports & Auditing",
    urduTitle: "رپورٹس اور آڈٹ",
    badge: "Export Ready",
    icon: BarChart3,
  },
  "/dashboard": {
    title: "Executive Dashboard",
    urduTitle: "مینجمنٹ ڈیش بورڈ",
    badge: "Live Analytics",
    icon: TrendingUp,
  },
  "/setup": {
    title: "Café Setup Wizard",
    urduTitle: "کیفے سیٹ اپ وزرڈ",
    badge: "Configuration",
    icon: Compass,
  },
};

export function AppHeader() {
  const pathname = usePathname();
  const { currentUser, isLocked, lockTerminal } = useAuthStore();
  const { language, setMobileMenuOpen, playSound } = useUiStore();
  const { t } = useTranslation(language);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [isRecallOpen, setIsRecallOpen] = useState(false);
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [heldCount, setHeldCount] = useState<number>(0);
  const [printerState, setPrinterState] = useState<PrinterState>(getCurrentPrinterState());

  useEffect(() => {
    autoDetectPrinter().then(setPrinterState);
    const unsub = subscribePrinterState(setPrinterState);
    return () => unsub();
  }, []);

  const refreshHeldCount = async () => {
    try {
      const count = await db.orders.filter((o) => o.status === "PENDING").count();
      setHeldCount(count);
    } catch {
      setHeldCount(0);
    }
  };

  useEffect(() => {
    refreshHeldCount();
    const interval = setInterval(refreshHeldCount, 2500);
    return () => clearInterval(interval);
  }, []);

  // Live Asia/Karachi Clock
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      try {
        const timeStr = new Intl.DateTimeFormat("en-PK", {
          timeZone: "Asia/Karachi",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }).format(now);

        const dateStr = new Intl.DateTimeFormat("en-PK", {
          timeZone: "Asia/Karachi",
          weekday: "short",
          month: "short",
          day: "numeric",
        }).format(now);

        setCurrentTime(timeStr);
        setCurrentDate(dateStr);
      } catch {
        setCurrentTime(now.toLocaleTimeString());
        setCurrentDate(now.toLocaleDateString());
      }
    };

    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Determine active route info
  const matchedRoute =
    ROUTE_MAP[pathname] ||
    (pathname?.startsWith("/qr/")
      ? {
          title: "Table QR Ordering",
          urduTitle: "ٹیبل کیو آر آرڈر",
          badge: "Guest Mode",
          icon: QrCode,
        }
      : {
          title: "Rewind Café POS",
          urduTitle: "ریوائنڈ کیفے پی او ایس",
          badge: "System",
          icon: Coffee,
        });

  const PageIcon = matchedRoute.icon;
  const pageTitle = language === "ur" ? matchedRoute.urduTitle : matchedRoute.title;

  return (
    <>
      <header className="h-16 px-3.5 md:px-5 bg-cream-50/95 dark:bg-espresso-900/95 backdrop-blur-md border-b border-cream-200 dark:border-espresso-700/80 flex items-center justify-between sticky top-0 z-30 shadow-soft">
        {/* Left Section: Mobile Menu Button & Breadcrumbs */}
        <div className="flex items-center gap-2.5 md:gap-4 min-w-0">
          {/* Mobile Hamburger Button */}
          <button
            onClick={() => {
              playSound("click");
              setMobileMenuOpen(true);
            }}
            className="lg:hidden p-2 rounded-xl text-espresso-800 dark:text-cream-100 bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 hover:border-vintage-orange transition-colors flex items-center justify-center shadow-card"
            aria-label="Open Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Current Page Title & Icon */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-vintage-orange/10 dark:bg-vintage-orange/20 text-vintage-orange flex items-center justify-center flex-shrink-0">
              <PageIcon className="w-4 h-4" />
            </div>

            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-serif font-black text-sm md:text-base text-espresso-900 dark:text-cream-100 truncate">
                  {pageTitle}
                </h1>
                {matchedRoute.badge && (
                  <span className="hidden sm:inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-cream-200/80 dark:bg-espresso-800 text-espresso-700 dark:text-cream-300 border border-cream-300/50 dark:border-espresso-700 flex-shrink-0">
                    {matchedRoute.badge}
                  </span>
                )}
              </div>

              {/* Branch & Terminal Indicator */}
              <div className="hidden xs:flex items-center gap-1.5 text-[11px] text-espresso-700/60 dark:text-cream-300/60 -mt-0.5">
                <MapPin className="w-3 h-3 text-vintage-orange flex-shrink-0" />
                <span className="truncate">DHA Phase 5, Karachi · Station T-01</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Section: Live Clock, Sync Pill, Fast Lock & User Badge */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Live Asia/Karachi Digital Clock */}
          {currentTime && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/80 dark:bg-espresso-800/80 border border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-100 shadow-card">
              <Clock className="w-3.5 h-3.5 text-vintage-orange" />
              <div className="flex flex-col text-right leading-tight">
                <span className="text-xs font-mono font-bold tracking-tight">
                  {currentTime}
                </span>
                <span className="text-[9px] text-espresso-700/50 dark:text-cream-300/50 uppercase font-semibold">
                  {currentDate} · PKT
                </span>
              </div>
            </div>
          )}

          {/* Realtime Outbox Sync Status Pill */}
          <SyncPill />

          {/* Thermal Printer Quick Status & Settings Pill */}
          <button
            onClick={() => {
              playSound("click");
              setIsPrinterModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 hover:border-vintage-orange text-espresso-800 dark:text-cream-100 text-xs font-bold transition-all shadow-card group"
            title={`Thermal Printer: ${printerState.name} (${printerState.paperWidth}mm)`}
          >
            <div className="relative">
              <Printer className="w-3.5 h-3.5 text-vintage-orange group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <span className="hidden sm:inline text-[11px] font-mono">{printerState.paperWidth}mm</span>
          </button>

          {/* Parked Tickets Quick Access Button */}
          <button
            onClick={() => {
              playSound("click");
              setIsRecallOpen(true);
            }}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-700 hover:border-vintage-orange text-amber-950 dark:text-amber-200 text-xs font-bold transition-all shadow-card group"
            title="View Parked & Held Tickets"
          >
            <History className="w-3.5 h-3.5 text-vintage-orange group-hover:rotate-180 transition-transform duration-300" />
            <span className="hidden xs:inline">Parked</span>
            {heldCount > 0 ? (
              <span className="px-1.5 py-0.2 rounded-full bg-vintage-orange text-white text-[10px] font-black leading-tight">
                {heldCount}
              </span>
            ) : (
              <span className="text-[10px] opacity-60 font-semibold">(0)</span>
            )}
          </button>

          {/* Quick Lock Terminal Button */}
          <button
            onClick={() => {
              playSound("bell");
              lockTerminal();
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 hover:border-vintage-orange text-espresso-800 dark:text-cream-100 text-xs font-bold transition-all shadow-card group"
            title="Lock terminal immediately"
          >
            <Lock className="w-3.5 h-3.5 text-vintage-orange group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline">Lock</span>
          </button>

          {/* Current Staff Profile Pill */}
          <button
            onClick={() => setIsPinModalOpen(true)}
            className="flex items-center gap-2 pl-2 pr-2.5 py-1 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 hover:border-vintage-orange transition-all shadow-card"
            title="Switch Staff Role"
          >
            <span className="text-lg leading-none">{currentUser?.avatar || "🧑‍💼"}</span>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-bold text-espresso-900 dark:text-cream-100 leading-tight">
                {currentUser?.name ? currentUser.name.split(" ")[0] : "Staff"}
              </span>
              <span className="text-[9px] font-bold text-vintage-orange uppercase tracking-wider -mt-0.5">
                {currentUser?.role || "STAFF"}
              </span>
            </div>
          </button>
        </div>
      </header>

      {/* Staff PIN Switcher / Re-authenticate Modal */}
      <PinModal
        isOpen={isPinModalOpen || isLocked}
        onClose={() => setIsPinModalOpen(false)}
        title="Terminal Security"
        subtitle="Enter 4-digit staff PIN to switch or unlock"
      />

      {/* Held / Parked Tickets Modal */}
      <RecallModal
        isOpen={isRecallOpen}
        onClose={() => {
          setIsRecallOpen(false);
          refreshHeldCount();
        }}
      />

      {/* Universal Thermal Printer Configuration Modal */}
      <PrinterSettingsModal
        isOpen={isPrinterModalOpen}
        onClose={() => setIsPrinterModalOpen(false)}
      />
    </>
  );
}
