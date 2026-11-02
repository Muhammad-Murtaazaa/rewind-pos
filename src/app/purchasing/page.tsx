"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/db/dexie";
import {
  type VendorDef,
  type PurchaseOrderDef,
  type GoodsReceiptDef,
  type StockItemDef,
} from "@/lib/data/sample-inventory";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import { useAuthStore } from "@/stores/authStore";
import {
  Truck,
  FileText,
  PackageCheck,
  CreditCard,
  Plus,
  Share2,
  CheckCircle2,
  Phone,
  MessageCircle,
  AlertCircle,
  X,
  ExternalLink,
} from "lucide-react";

export default function PurchasingPage() {
  const [activeTab, setActiveTab] = useState<"VENDORS" | "POS" | "GRN" | "BILLS">("VENDORS");
  const [vendors, setVendors] = useState<VendorDef[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDef[]>([]);
  const [stockItems, setStockItems] = useState<StockItemDef[]>([]);
  const [showNewPoModal, setShowNewPoModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New PO State
  const [poVendorId, setPoVendorId] = useState("");
  const [poLines, setPoLines] = useState<{ stock_item_id: string; quantity: number; unit_price: number }[]>([]);

  const { playSound } = useUiStore();
  const { currentUser } = useAuthStore();

  const loadData = async () => {
    const vens = await db.vendors.toArray();
    const pos = await db.purchaseOrders.toArray();
    const stks = await db.stockItems.toArray();
    setVendors(vens);
    setPurchaseOrders(pos);
    setStockItems(stks);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalPayables = vendors.reduce((sum, v) => sum + v.balance_due, 0);

  const handleAddPoLine = () => {
    if (stockItems.length > 0) {
      setPoLines([
        ...poLines,
        {
          stock_item_id: stockItems[0].id,
          quantity: 10,
          unit_price: stockItems[0].avg_unit_cost,
        },
      ]);
    }
  };

  const handleCreatePo = async () => {
    const vendor = vendors.find((v) => v.id === poVendorId);
    if (!vendor || poLines.length === 0) return;
    playSound("click");

    const calculatedLines = poLines.map((l) => {
      const item = stockItems.find((s) => s.id === l.stock_item_id);
      return {
        stock_item_id: l.stock_item_id,
        stock_item_name: item?.name || "Item",
        quantity: l.quantity,
        unit_price: l.unit_price,
        line_total: l.quantity * l.unit_price,
      };
    });

    const totalAmt = calculatedLines.reduce((sum, l) => sum + l.line_total, 0);
    const poNum = `PO-2026-${Math.floor(100 + Math.random() * 900)}`;

    const newPo: PurchaseOrderDef = {
      id: `po-${Date.now()}`,
      po_number: poNum,
      vendor_id: vendor.id,
      vendor_name: vendor.name,
      status: "ISSUED",
      total_amount: totalAmt,
      lines: calculatedLines,
      expected_date: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0],
      created_at: new Date().toISOString(),
    };

    await db.purchaseOrders.add(newPo);
    await loadData();
    setShowNewPoModal(false);
    setPoLines([]);
    setToastMsg(`Created Purchase Order: ${poNum} (${formatCurrency(totalAmt)})`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleReceiveGRN = async (po: PurchaseOrderDef) => {
    playSound("bell");

    // Add stock for each line in PO
    for (const line of po.lines) {
      const item = await db.stockItems.get(line.stock_item_id);
      if (item) {
        await db.stockItems.update(item.id, {
          current_qty: item.current_qty + line.quantity,
        });
      }
    }

    // Mark PO as Completed
    await db.purchaseOrders.update(po.id, {
      status: "COMPLETED",
    });

    // Update vendor balance due
    const vendor = vendors.find((v) => v.id === po.vendor_id);
    if (vendor) {
      await db.vendors.update(vendor.id, {
        balance_due: vendor.balance_due + po.total_amount,
      });
    }

    await loadData();
    setToastMsg(`GRN Received for ${po.po_number}. Stock quantities updated automatically!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleWhatsAppPo = (po: PurchaseOrderDef) => {
    const text = encodeURIComponent(
      `*Rewind Café — Official Purchase Order*\nPO Number: ${po.po_number}\nVendor: ${po.vendor_name}\nExpected Date: ${po.expected_date}\n\nItems:\n` +
        po.lines.map((l) => `• ${l.quantity}x ${l.stock_item_name} @ ${formatCurrency(l.unit_price)} = ${formatCurrency(l.line_total)}`).join("\n") +
        `\n\n*Total Amount: ${formatCurrency(po.total_amount)}*\nPlease deliver to Rewind Café F-7 Markaz.`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full space-y-5">
      {/* Page Title & Navigation Tabs */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cream-200 dark:border-espresso-700">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-sage text-white flex items-center justify-center text-sm shadow-card">
              🚚
            </span>
            <span>Vendors, Purchase Orders & Payables</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
            Suppliers directory, WhatsApp PO dispatch, Goods Received Notes (GRN), and ageing payables
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 bg-cream-100 dark:bg-espresso-800 p-1 rounded-2xl border border-cream-200 dark:border-espresso-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab("VENDORS")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "VENDORS"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Vendors</span>
          </button>

          <button
            onClick={() => setActiveTab("POS")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "POS"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Purchase Orders</span>
          </button>

          <button
            onClick={() => setActiveTab("BILLS")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "BILLS"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payables Ageing</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-xl bg-sage-light text-sage-dark border border-sage/40 text-xs font-bold flex items-center gap-2 animate-drop-in">
          <CheckCircle2 className="w-4 h-4 text-sage" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TAB 1: VENDORS DIRECTORY */}
      {activeTab === "VENDORS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {vendors.map((ven) => (
              <div
                key={ven.id}
                className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <h4 className="font-serif font-bold text-base text-espresso-900 dark:text-cream-100">
                      {ven.name}
                    </h4>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-cream-100 font-bold text-vintage-orange">
                      ★ {ven.rating}.0
                    </span>
                  </div>

                  <p className="text-xs text-espresso-700/70 mt-1">
                    Contact: <strong className="text-espresso-900 dark:text-cream-200">{ven.contact_person}</strong>
                  </p>
                  <p className="text-xs text-espresso-700/70">
                    Payment Terms: <strong>{ven.payment_terms}</strong>
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-cream-50 dark:bg-espresso-900 flex justify-between items-center text-xs">
                  <span className="text-espresso-700/70">Outstanding Payable:</span>
                  <span className="font-mono font-black text-sm text-brick">
                    {formatCurrency(ven.balance_due)}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-1 border-t border-cream-100">
                  <a
                    href={`tel:${ven.phone}`}
                    className="flex-1 py-2 rounded-xl bg-cream-100 hover:bg-cream-200 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Call</span>
                  </a>

                  <a
                    href={`https://wa.me/${ven.whatsapp}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 py-2 rounded-xl bg-sage-light hover:bg-sage/20 text-sage-dark text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-sage" />
                    <span>WhatsApp</span>
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PURCHASE ORDERS & GRN */}
      {activeTab === "POS" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-serif font-bold text-lg">Purchase Orders & GRN Receiving</h3>
            <button
              onClick={() => setShowNewPoModal(true)}
              className="px-4 py-2 rounded-2xl bg-vintage-orange hover:bg-vintage-orange-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Purchase Order</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {purchaseOrders.map((po) => (
              <div
                key={po.id}
                className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 shadow-card space-y-3"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-serif font-black text-base text-espresso-900 dark:text-cream-100">
                      {po.po_number}
                    </span>
                    <p className="text-xs text-espresso-700/70 font-semibold">{po.vendor_name}</p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      po.status === "COMPLETED"
                        ? "bg-sage-light text-sage-dark"
                        : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {po.status}
                  </span>
                </div>

                <div className="divide-y divide-cream-100 dark:divide-espresso-700 text-xs">
                  {po.lines.map((l, i) => (
                    <div key={i} className="py-1 flex justify-between">
                      <span>
                        {l.quantity}x {l.stock_item_name}
                      </span>
                      <span className="font-bold">{formatCurrency(l.line_total)}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-cream-200 flex justify-between items-center text-xs">
                  <span className="font-bold">Total PO Amount:</span>
                  <span className="font-mono font-black text-sm text-vintage-orange">
                    {formatCurrency(po.total_amount)}
                  </span>
                </div>

                {/* PO Actions */}
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <button
                    onClick={() => handleWhatsAppPo(po)}
                    className="py-2 rounded-xl bg-sage-light text-sage-dark hover:bg-sage/20 border border-sage/40 text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5 text-sage" />
                    <span>Send WhatsApp</span>
                  </button>

                  {po.status !== "COMPLETED" ? (
                    <button
                      onClick={() => handleReceiveGRN(po)}
                      className="py-2 rounded-xl bg-vintage-orange hover:bg-vintage-orange-hover text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <PackageCheck className="w-3.5 h-3.5" />
                      <span>Receive Delivery (GRN)</span>
                    </button>
                  ) : (
                    <span className="py-2 rounded-xl bg-cream-100 text-espresso-700/60 text-xs font-bold text-center">
                      ✓ Received & Stocked
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: PAYABLES AGEING */}
      {activeTab === "BILLS" && (
        <div className="space-y-4">
          <div className="p-5 rounded-3xl bg-cream-50 dark:bg-espresso-900 border border-cream-200 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-espresso-700/60 block">
                Total Outstanding Vendor Payables
              </span>
              <h3 className="font-serif font-black text-3xl text-brick mt-1">
                {formatCurrency(totalPayables)}
              </h3>
            </div>
            <div className="flex gap-4 text-xs font-semibold">
              <div>
                <span className="text-espresso-700/60 block">Current (0-15d):</span>
                <span className="font-bold">{formatCurrency(42000)}</span>
              </div>
              <div>
                <span className="text-espresso-700/60 block">15-30 days:</span>
                <span className="font-bold">{formatCurrency(14600)}</span>
              </div>
              <div>
                <span className="text-espresso-700/60 block">30+ days overdue:</span>
                <span className="font-bold text-brick">{formatCurrency(28500)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200 overflow-hidden shadow-card">
            <table className="w-full text-left text-xs">
              <thead className="bg-cream-100 dark:bg-espresso-900 border-b font-bold">
                <tr>
                  <th className="p-3.5">Vendor</th>
                  <th className="p-3.5">Payment Terms</th>
                  <th className="p-3.5">Balance Due</th>
                  <th className="p-3.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cream-100">
                {vendors.map((v) => (
                  <tr key={v.id} className="hover:bg-cream-50/50">
                    <td className="p-3.5 font-bold">{v.name}</td>
                    <td className="p-3.5 text-espresso-700/70">{v.payment_terms}</td>
                    <td className="p-3.5 font-mono font-bold text-brick">
                      {formatCurrency(v.balance_due)}
                    </td>
                    <td className="p-3.5">
                      <button
                        onClick={async () => {
                          playSound("bell");
                          await db.vendors.update(v.id, { balance_due: 0 });
                          await loadData();
                          setToastMsg(`Recorded settlement payment to ${v.name}`);
                          setTimeout(() => setToastMsg(null), 3000);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-sage-light text-sage-dark font-bold hover:bg-sage/20 border border-sage/40"
                      >
                        Record Payment
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* New Purchase Order Modal */}
      {showNewPoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg bg-cream-50 dark:bg-surface-dark border border-cream-200 rounded-café p-6 shadow-floating space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="font-serif font-bold text-lg">Create Purchase Order (PO)</h3>

            <div>
              <label className="text-xs font-bold block mb-1">Select Vendor</label>
              <select
                value={poVendorId}
                onChange={(e) => setPoVendorId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold"
              >
                <option value="">Select Vendor</option>
                {vendors.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} ({v.payment_terms})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold">Line Items</label>
                <button
                  onClick={handleAddPoLine}
                  className="text-xs font-bold text-vintage-orange hover:underline flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>

              {poLines.map((line, idx) => (
                <div key={idx} className="flex gap-2 items-center mb-2">
                  <select
                    value={line.stock_item_id}
                    onChange={(e) => {
                      const updated = [...poLines];
                      updated[idx].stock_item_id = e.target.value;
                      const itm = stockItems.find((s) => s.id === e.target.value);
                      if (itm) updated[idx].unit_price = itm.avg_unit_cost;
                      setPoLines(updated);
                    }}
                    className="flex-1 px-2 py-1.5 rounded-xl bg-white border border-cream-300 text-xs font-bold"
                  >
                    {stockItems.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.unit})
                      </option>
                    ))}
                  </select>

                  <input
                    type="number"
                    value={line.quantity}
                    onChange={(e) => {
                      const updated = [...poLines];
                      updated[idx].quantity = parseFloat(e.target.value) || 0;
                      setPoLines(updated);
                    }}
                    className="w-16 px-2 py-1.5 rounded-xl bg-white border border-cream-300 text-xs font-bold text-center"
                    placeholder="Qty"
                  />

                  <button
                    onClick={() => setPoLines(poLines.filter((_, i) => i !== idx))}
                    className="text-brick p-1"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowNewPoModal(false)}
                className="flex-1 py-2 rounded-xl bg-cream-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePo}
                disabled={!poVendorId || poLines.length === 0}
                className="flex-1 py-2 rounded-xl bg-vintage-orange text-white text-xs font-bold shadow-md disabled:opacity-50"
              >
                Generate PO
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
