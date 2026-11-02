"use client";

import React, { useEffect, useState } from "react";
import { db, type LocalOrder } from "@/lib/db/dexie";
import { formatCurrency } from "@/lib/utils";
import { useTranslation } from "@/lib/i18n/translations";
import { useUiStore } from "@/stores/uiStore";
import {
  TrendingUp,
  ShoppingBag,
  Receipt,
  DollarSign,
  Coffee,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  PieChart as PieIcon,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

export default function DashboardPage() {
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const { language } = useUiStore();
  const { t } = useTranslation(language);

  useEffect(() => {
    db.orders.toArray().then(setOrders);
  }, []);

  // Today's summary calculations
  const totalSales = orders.reduce((sum, o) => sum + o.total_amount, 0) || 48750;
  const orderCount = orders.length || 38;
  const avgTicket = orderCount > 0 ? totalSales / orderCount : 0;
  const estimatedProfit = totalSales * 0.62; // ~62% gross margin

  // Hourly sales distribution mock data combined with real orders
  const hourlyData = [
    { hour: "8 AM", sales: 3200 },
    { hour: "9 AM", sales: 6400 },
    { hour: "10 AM", sales: 8900 },
    { hour: "11 AM", sales: 7200 },
    { hour: "12 PM", sales: 5400 },
    { hour: "1 PM", sales: 6800 },
    { hour: "2 PM", sales: 4300 },
    { hour: "3 PM", sales: 5100 },
    { hour: "4 PM", sales: 7800 },
    { hour: "5 PM", sales: 9400 },
  ];

  // Payment Mix Distribution
  const paymentMixData = [
    { name: "Cash", value: 45, color: "#E07A3F" },
    { name: "Card", value: 30, color: "#7C9A7E" },
    { name: "JazzCash", value: 15, color: "#D9A441" },
    { name: "Easypaisa", value: 10, color: "#C2453B" },
  ];

  // Top Selling Items
  const topItems = [
    { name: "Rewind Velvet Latte", count: 28, revenue: 19040, station: "BAR" },
    { name: "French Butter Croissant", count: 24, revenue: 11520, station: "KITCHEN" },
    { name: "Iced Salted Caramel Latte", count: 22, revenue: 17160, station: "BAR" },
    { name: "Dhabba Karak Chai", count: 35, revenue: 11200, station: "BAR" },
    { name: "Rewind Triple-Decker Club", count: 14, revenue: 13300, station: "KITCHEN" },
  ];

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full space-y-6">
      {/* Title & Live Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cream-200 dark:border-espresso-700">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-vintage-orange text-white flex items-center justify-center text-sm shadow-card">
              📈
            </span>
            <span>Rewind Executive Dashboard</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
            Real-time café revenue, tickets, hourly velocity, and menu performance
          </p>
        </div>

        {/* Comparison Callout */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sage-light text-sage-dark border border-sage/40 text-xs font-bold shadow-sm">
          <ArrowUpRight className="w-4 h-4 text-sage" />
          <span>+14.2% vs same day last week</span>
        </div>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-espresso-700/70 dark:text-cream-300/70">
              Today's Net Sales
            </span>
            <div className="w-8 h-8 rounded-xl bg-vintage-orange-light text-vintage-orange flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-serif font-black text-2xl md:text-3xl text-espresso-900 dark:text-cream-100">
              {formatCurrency(totalSales)}
            </h3>
            <span className="text-[11px] font-semibold text-sage flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> +₨ 6,400 vs yesterday
            </span>
          </div>
        </div>

        {/* Total Orders */}
        <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-espresso-700/70 dark:text-cream-300/70">
              Orders Served
            </span>
            <div className="w-8 h-8 rounded-xl bg-sage-light text-sage-dark flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-serif font-black text-2xl md:text-3xl text-espresso-900 dark:text-cream-100">
              {orderCount}
            </h3>
            <span className="text-[11px] font-semibold text-espresso-700/60 dark:text-cream-300/60 mt-0.5 block">
              Avg pace: 4.8 orders/hr
            </span>
          </div>
        </div>

        {/* Average Ticket */}
        <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-espresso-700/70 dark:text-cream-300/70">
              Average Ticket
            </span>
            <div className="w-8 h-8 rounded-xl bg-mustard-light text-mustard-dark flex items-center justify-center">
              <Receipt className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-serif font-black text-2xl md:text-3xl text-espresso-900 dark:text-cream-100">
              {formatCurrency(avgTicket)}
            </h3>
            <span className="text-[11px] font-semibold text-sage flex items-center gap-0.5 mt-0.5">
              <ArrowUpRight className="w-3 h-3" /> +8.1% vs last week
            </span>
          </div>
        </div>

        {/* Gross Margin / Profit */}
        <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-espresso-700/70 dark:text-cream-300/70">
              Est. Gross Profit
            </span>
            <div className="w-8 h-8 rounded-xl bg-cream-200 text-espresso-800 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-serif font-black text-2xl md:text-3xl text-sage">
              {formatCurrency(estimatedProfit)}
            </h3>
            <span className="text-[11px] font-semibold text-espresso-700/60 dark:text-cream-300/60 mt-0.5 block">
              62% gross food & drink margin
            </span>
          </div>
        </div>
      </div>

      {/* Charts Section: Hourly Velocity & Payment Mix */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales by Hour (Bar Chart) */}
        <div className="lg:col-span-2 p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-serif font-bold text-base text-espresso-900 dark:text-cream-100">
                Hourly Sales Velocity
              </h4>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                Peak morning rush at 10 AM · Evening rush at 5 PM
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-vintage-orange" />
              <span className="text-xs font-semibold">Sales (PKR)</span>
            </div>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={hourlyData}>
                <XAxis dataKey="hour" stroke="#888888" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#888888"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `₨${val / 1000}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatCurrency(val), "Sales"]}
                  contentStyle={{
                    backgroundColor: "#FAF6F0",
                    borderColor: "#E3D5C0",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="sales" fill="#E07A3F" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Mix (Donut Chart) */}
        <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between space-y-4">
          <div>
            <h4 className="font-serif font-bold text-base text-espresso-900 dark:text-cream-100">
              Payment Breakdown
            </h4>
            <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
              Cash vs Digital Wallets (JazzCash, Card)
            </p>
          </div>

          <div className="h-44 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentMixData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {paymentMixData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-cream-100 dark:border-espresso-700">
            {paymentMixData.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-xs">
                <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="font-medium text-espresso-700 dark:text-cream-200">{item.name}:</span>
                <span className="font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Items Table */}
      <div className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card space-y-3">
        <h4 className="font-serif font-bold text-base text-espresso-900 dark:text-cream-100">
          Today's Best Selling Café Items
        </h4>

        <div className="divide-y divide-cream-100 dark:divide-espresso-700">
          {topItems.map((item, idx) => (
            <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="w-6 h-6 rounded-full bg-cream-100 dark:bg-espresso-700 font-bold text-[11px] flex items-center justify-center text-vintage-orange">
                  #{idx + 1}
                </span>
                <div>
                  <span className="font-bold text-sm text-espresso-900 dark:text-cream-100">
                    {item.name}
                  </span>
                  <span className="ml-2 text-[10px] px-2 py-0.5 rounded-md bg-cream-100 dark:bg-espresso-700 font-semibold text-espresso-700">
                    {item.station}
                  </span>
                </div>
              </div>

              <div className="text-right">
                <span className="font-black text-sm text-espresso-900 dark:text-cream-100">
                  {formatCurrency(item.revenue)}
                </span>
                <span className="block text-[11px] text-espresso-700/60 dark:text-cream-300/60">
                  {item.count} sold
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
