"use client";

import React, { useEffect, useState } from "react";
import { db, type LocalOrder } from "@/lib/db/dexie";
import { type StockItemDef, type PurchaseOrderDef } from "@/lib/data/sample-inventory";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import {
  BarChart3,
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  Tag,
  DollarSign,
  Coffee,
  ShoppingBag,
} from "lucide-react";

export default function ReportsPage() {
  const [reportType, setReportType] = useState<"SALES_ITEM" | "DISCOUNTS" | "INVENTORY" | "PURCHASES">("SALES_ITEM");
  const [orders, setOrders] = useState<LocalOrder[]>([]);
  const [stockItems, setStockItems] = useState<StockItemDef[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDef[]>([]);
  const [dateRange, setDateRange] = useState<"TODAY" | "7DAYS" | "MONTH">("TODAY");

  const { playSound } = useUiStore();

  useEffect(() => {
    db.orders.toArray().then(setOrders);
    db.stockItems.toArray().then(setStockItems);
    db.purchaseOrders.toArray().then(setPurchaseOrders);
  }, []);

  // Aggregate items sold
  const itemSalesMap: Record<string, { name: string; count: number; revenue: number; station: string }> = {};
  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (!itemSalesMap[item.item_name]) {
        itemSalesMap[item.item_name] = {
          name: item.item_name,
          count: 0,
          revenue: 0,
          station: item.station_type,
        };
      }
      itemSalesMap[item.item_name].count += item.quantity;
      itemSalesMap[item.item_name].revenue += item.total_price;
    });
  });

  const itemSalesList = Object.values(itemSalesMap).sort((a, b) => b.revenue - a.revenue);

  // Discounted orders audit
  const discountedOrders = orders.filter((o) => o.discount_amount > 0);

  const handleExportCSV = () => {
    playSound("click");
    let csvContent = "data:text/csv;charset=utf-8,";

    if (reportType === "SALES_ITEM") {
      csvContent += "Item Name,Station,Quantity Sold,Revenue (PKR)\n";
      itemSalesList.forEach((row) => {
        csvContent += `"${row.name}","${row.station}",${row.count},${row.revenue}\n`;
      });
    } else if (reportType === "DISCOUNTS") {
      csvContent += "Order Number,Cashier,Discount Amount,Reason,Total Paid\n";
      discountedOrders.forEach((row) => {
        csvContent += `"${row.order_number}","${row.cashier_name}",${row.discount_amount},"${row.discount_reason || 'N/A'}",${row.total_amount}\n`;
      });
    } else {
      csvContent += "Stock Item,Category,Current Qty,Unit,Cost Value (PKR)\n";
      stockItems.forEach((row) => {
        csvContent += `"${row.name}","${row.category}",${row.current_qty},"${row.unit}",${row.current_qty * row.avg_unit_cost}\n`;
      });
    }

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `rewind_report_${reportType.toLowerCase()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cream-200 dark:border-espresso-700">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-vintage-orange text-white flex items-center justify-center text-sm shadow-card">
              📊
            </span>
            <span>Reports & Audit Center</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
            Granular sales analysis, discounts & voids audit, inventory usage, and CSV exports
          </p>
        </div>

        {/* Export & Print Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-2xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-vintage-orange" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-2xl bg-cream-100 hover:bg-cream-200 border border-cream-300 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Report Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-espresso-800 p-3 rounded-3xl border border-cream-200 dark:border-espresso-700 shadow-card">
        {/* Report Types Tabs */}
        <div className="flex items-center gap-1.5 text-xs font-bold">
          {[
            { id: "SALES_ITEM", label: "Sales by Item", icon: Coffee },
            { id: "DISCOUNTS", label: "Discounts & Voids Audit", icon: Tag },
            { id: "INVENTORY", label: "Inventory Valuation", icon: BarChart3 },
            { id: "PURCHASES", label: "Purchases Log", icon: ShoppingBag },
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = reportType === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  playSound("click");
                  setReportType(tab.id as any);
                }}
                className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? "bg-vintage-orange text-white shadow-sm"
                    : "text-espresso-700 dark:text-cream-200 hover:bg-cream-100"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Date Presets */}
        <div className="flex items-center gap-1 bg-cream-100 p-1 rounded-xl text-xs font-semibold">
          {(["TODAY", "7DAYS", "MONTH"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-2.5 py-1 rounded-lg transition-all ${
                dateRange === r ? "bg-white font-bold text-vintage-orange shadow-sm" : "text-espresso-700"
              }`}
            >
              {r === "TODAY" ? "Today" : r === "7DAYS" ? "Last 7 Days" : "This Month"}
            </button>
          ))}
        </div>
      </div>

      {/* REPORT CONTENT AREA */}
      <div className="bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200 dark:border-espresso-700 overflow-hidden shadow-card">
        {/* 1. SALES BY ITEM */}
        {reportType === "SALES_ITEM" && (
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100 dark:bg-espresso-900 border-b font-bold">
              <tr>
                <th className="p-3.5">Menu Item</th>
                <th className="p-3.5">Station</th>
                <th className="p-3.5">Quantity Sold</th>
                <th className="p-3.5">Total Revenue</th>
                <th className="p-3.5">Avg Price</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {itemSalesList.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-espresso-700/60">
                    No sales recorded for this period yet.
                  </td>
                </tr>
              ) : (
                itemSalesList.map((item, idx) => (
                  <tr key={idx} className="hover:bg-cream-50/50">
                    <td className="p-3.5 font-bold text-espresso-900 dark:text-cream-100">
                      {item.name}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded-full bg-cream-100 font-semibold text-[10px]">
                        {item.station}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-sm">{item.count}</td>
                    <td className="p-3.5 font-mono font-black text-sm text-vintage-orange">
                      {formatCurrency(item.revenue)}
                    </td>
                    <td className="p-3.5 text-espresso-700/70">
                      {formatCurrency(item.count > 0 ? item.revenue / item.count : 0)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 2. DISCOUNTS & VOIDS AUDIT */}
        {reportType === "DISCOUNTS" && (
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100 dark:bg-espresso-900 border-b font-bold">
              <tr>
                <th className="p-3.5">Order Number</th>
                <th className="p-3.5">Authorized Cashier</th>
                <th className="p-3.5">Discount Given</th>
                <th className="p-3.5">Reason Logged</th>
                <th className="p-3.5">Final Paid Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {discountedOrders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-espresso-700/60">
                    No order discounts given in this period. Full compliance!
                  </td>
                </tr>
              ) : (
                discountedOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-cream-50/50">
                    <td className="p-3.5 font-serif font-bold">#{ord.order_number}</td>
                    <td className="p-3.5">{ord.cashier_name}</td>
                    <td className="p-3.5 font-mono font-bold text-brick">
                      -{formatCurrency(ord.discount_amount)}
                    </td>
                    <td className="p-3.5 font-medium text-espresso-800">
                      {ord.discount_reason || "Staff Courtesy"}
                    </td>
                    <td className="p-3.5 font-mono font-bold">{formatCurrency(ord.total_amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}

        {/* 3. INVENTORY VALUATION */}
        {reportType === "INVENTORY" && (
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100 dark:bg-espresso-900 border-b font-bold">
              <tr>
                <th className="p-3.5">Stock Item</th>
                <th className="p-3.5">Category</th>
                <th className="p-3.5">Current Qty</th>
                <th className="p-3.5">Unit Cost</th>
                <th className="p-3.5">Total Inventory Asset Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {stockItems.map((stk) => (
                <tr key={stk.id} className="hover:bg-cream-50/50">
                  <td className="p-3.5 font-bold">{stk.name}</td>
                  <td className="p-3.5">{stk.category}</td>
                  <td className="p-3.5 font-mono">
                    {stk.current_qty} {stk.unit}
                  </td>
                  <td className="p-3.5">{formatCurrency(stk.avg_unit_cost)}</td>
                  <td className="p-3.5 font-mono font-black text-sage-dark">
                    {formatCurrency(stk.current_qty * stk.avg_unit_cost)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* 4. PURCHASES LOG */}
        {reportType === "PURCHASES" && (
          <table className="w-full text-left text-xs">
            <thead className="bg-cream-100 dark:bg-espresso-900 border-b font-bold">
              <tr>
                <th className="p-3.5">PO Number</th>
                <th className="p-3.5">Vendor</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Total Amount</th>
                <th className="p-3.5">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cream-100">
              {purchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-cream-50/50">
                  <td className="p-3.5 font-bold">{po.po_number}</td>
                  <td className="p-3.5">{po.vendor_name}</td>
                  <td className="p-3.5">
                    <span
                      className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                        po.status === "COMPLETED"
                          ? "bg-sage-light text-sage-dark"
                          : "bg-amber-100 text-amber-900"
                      }`}
                    >
                      {po.status}
                    </span>
                  </td>
                  <td className="p-3.5 font-mono font-bold text-vintage-orange">
                    {formatCurrency(po.total_amount)}
                  </td>
                  <td className="p-3.5 text-espresso-700/70">{formatDate(po.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
