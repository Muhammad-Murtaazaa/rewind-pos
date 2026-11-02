"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/db/dexie";
import {
  type CustomerDef,
  type GiftCardDef,
  type PromoCodeDef,
  type CustomerFeedbackDef,
} from "@/lib/data/sample-growth";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useUiStore } from "@/stores/uiStore";
import {
  Heart,
  Gift,
  Tag,
  MessageSquare,
  Search,
  Plus,
  CheckCircle2,
  Sparkles,
  Coffee,
  Share2,
  CreditCard,
  UserCheck,
  Send,
} from "lucide-react";

export default function CustomersPage() {
  const [activeTab, setActiveTab] = useState<"DIRECTORY" | "STAMPS" | "GIFTCARDS" | "PROMOS" | "CAMPAIGNS">("DIRECTORY");
  const [customers, setCustomers] = useState<CustomerDef[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCardDef[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCodeDef[]>([]);
  const [feedback, setFeedback] = useState<CustomerFeedbackDef[]>([]);
  const [searchPhone, setSearchPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<CustomerDef | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // New Customer State
  const [showAddCustModal, setShowAddCustModal] = useState(false);
  const [newCustName, setNewCustName] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustCreditLimit, setNewCustCreditLimit] = useState(5000);

  // Broadcast Campaign State
  const [campaignSegment, setCampaignSegment] = useState("Inactive (30+ days)");
  const [campaignMessage, setCampaignMessage] = useState(
    "We miss you at Rewind! Enjoy 20% off your favorite Velvet Latte this weekend. Show this message at counter. ☕"
  );

  const { playSound } = useUiStore();

  const loadData = async () => {
    const custs = await db.customers.toArray();
    const gcs = await db.giftCards.toArray();
    const promos = await db.promoCodes.toArray();
    const fbs = await db.customerFeedback.toArray();
    setCustomers(custs);
    setGiftCards(gcs);
    setPromoCodes(promos);
    setFeedback(fbs);
    if (custs.length > 0 && !selectedCustomer) {
      setSelectedCustomer(custs[0]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredCustomers = customers.filter(
    (c) =>
      !searchPhone ||
      c.phone.includes(searchPhone) ||
      c.name.toLowerCase().includes(searchPhone.toLowerCase())
  );

  const handleAddStamp = async (customer: CustomerDef) => {
    playSound("bell");
    const nextStamp = customer.stamp_count >= 10 ? 1 : customer.stamp_count + 1;
    await db.customers.update(customer.id, {
      stamp_count: nextStamp,
      loyalty_points: customer.loyalty_points + 20,
    });
    await loadData();
    setSelectedCustomer({
      ...customer,
      stamp_count: nextStamp,
      loyalty_points: customer.loyalty_points + 20,
    });
    setToastMsg(
      nextStamp === 10
        ? `🎉 10th STAMP EARNED! ${customer.name} earned a FREE COFFEE!`
        : `Added loyalty stamp (${nextStamp}/10) for ${customer.name}`
    );
    setTimeout(() => setToastMsg(null), 4000);
  };

  const handleAddCustomer = async () => {
    if (!newCustName || !newCustPhone) return;
    playSound("click");

    const newCust: CustomerDef = {
      id: `cust-${Date.now()}`,
      phone: newCustPhone,
      name: newCustName,
      loyalty_points: 50,
      stamp_count: 1,
      credit_balance: 0,
      credit_limit: newCustCreditLimit,
      visits_count: 1,
      total_spent: 0,
      favourite_item: "Rewind Velvet Latte",
      tier: "BRONZE",
    };

    await db.customers.add(newCust);
    await loadData();
    setShowAddCustModal(false);
    setSelectedCustomer(newCust);
    setToastMsg(`Registered new loyalty customer: ${newCust.name}`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleSendCampaign = () => {
    playSound("bell");
    setToastMsg(`Broadcast dispatched to ${filteredCustomers.length} recipients via WhatsApp API!`);
    setTimeout(() => setToastMsg(null), 4000);
  };

  return (
    <div className="flex-1 flex flex-col p-4 md:p-6 max-w-7xl mx-auto w-full space-y-5">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-cream-200 dark:border-espresso-700">
        <div>
          <h2 className="font-serif font-black text-2xl text-espresso-900 dark:text-cream-100 flex items-center gap-2">
            <span className="w-8 h-8 rounded-xl bg-vintage-orange text-white flex items-center justify-center text-sm shadow-card">
              ☕
            </span>
            <span>Customer CRM, Loyalty & Campaigns</span>
          </h2>
          <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
            Phone lookup, "10th coffee free" stamp cards, tabs, gift vouchers, and WhatsApp marketing
          </p>
        </div>

        {/* Tab Pills */}
        <div className="flex items-center gap-1.5 bg-cream-100 dark:bg-espresso-800 p-1 rounded-2xl border border-cream-200 dark:border-espresso-700 text-xs font-bold">
          <button
            onClick={() => setActiveTab("DIRECTORY")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "DIRECTORY"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Customers</span>
          </button>

          <button
            onClick={() => setActiveTab("STAMPS")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "STAMPS"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-mustard" />
            <span>Stamp Cards</span>
          </button>

          <button
            onClick={() => setActiveTab("GIFTCARDS")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "GIFTCARDS"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Gift className="w-3.5 h-3.5" />
            <span>Gift Cards</span>
          </button>

          <button
            onClick={() => setActiveTab("PROMOS")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "PROMOS"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Promo Codes</span>
          </button>

          <button
            onClick={() => setActiveTab("CAMPAIGNS")}
            className={`px-3 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
              activeTab === "CAMPAIGNS"
                ? "bg-white dark:bg-espresso-700 text-vintage-orange shadow-card"
                : "text-espresso-700 dark:text-cream-200"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Broadcasts</span>
          </button>
        </div>
      </div>

      {toastMsg && (
        <div className="p-3 rounded-xl bg-sage-light text-sage-dark border border-sage/40 text-xs font-bold flex items-center gap-2 animate-drop-in">
          <CheckCircle2 className="w-4 h-4 text-sage" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* TAB 1: CUSTOMERS DIRECTORY */}
      {activeTab === "DIRECTORY" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-espresso-700/40" />
              <input
                type="text"
                placeholder="Search customer phone or name…"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-xs focus:outline-none focus:border-vintage-orange"
              />
            </div>

            <button
              onClick={() => setShowAddCustModal(true)}
              className="px-4 py-2 rounded-2xl bg-vintage-orange hover:bg-vintage-orange-hover text-white text-xs font-bold flex items-center gap-1.5 shadow-md"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Customer</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredCustomers.map((c) => (
              <div
                key={c.id}
                onClick={() => setSelectedCustomer(c)}
                className={`p-5 rounded-3xl border text-left cursor-pointer transition-all flex flex-col justify-between shadow-card hover:shadow-floating ${
                  selectedCustomer?.id === c.id
                    ? "bg-white dark:bg-espresso-800 border-vintage-orange ring-2 ring-vintage-orange/20"
                    : "bg-white dark:bg-espresso-800 border-cream-200 dark:border-espresso-700"
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <span className="font-serif font-black text-base text-espresso-900 dark:text-cream-100">
                      {c.name}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        c.tier === "VIP"
                          ? "bg-amber-100 text-amber-900"
                          : c.tier === "GOLD"
                          ? "bg-mustard-light text-mustard-dark"
                          : "bg-cream-100 text-espresso-700"
                      }`}
                    >
                      {c.tier}
                    </span>
                  </div>
                  <p className="font-mono text-xs text-vintage-orange font-bold mt-0.5">
                    {c.phone}
                  </p>
                </div>

                <div className="p-3 rounded-2xl bg-cream-50 dark:bg-espresso-900 my-2 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-espresso-700/60">Loyalty Stamps:</span>
                    <span className="font-bold text-vintage-orange">
                      {c.stamp_count} / 10 ☕
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-espresso-700/60">Visits Count:</span>
                    <span className="font-bold">{c.visits_count}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-espresso-700/60">Total Spent:</span>
                    <span className="font-bold font-mono">{formatCurrency(c.total_spent)}</span>
                  </div>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddStamp(c);
                  }}
                  className="w-full py-2 rounded-xl bg-vintage-orange-light dark:bg-espresso-700 text-vintage-orange text-xs font-bold hover:bg-vintage-orange hover:text-white transition-colors"
                >
                  + Add 1 Stamp
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: RETRO STAMP CARDS ("10th Coffee Free") */}
      {activeTab === "STAMPS" && (
        <div className="max-w-xl mx-auto w-full space-y-4">
          {selectedCustomer ? (
            <div className="p-6 rounded-3xl bg-cream-100 dark:bg-espresso-900 border-2 border-vintage-orange/50 shadow-floating text-center space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-cream-300 dark:border-espresso-700">
                <div>
                  <h3 className="font-serif font-black text-xl text-espresso-900 dark:text-cream-100">
                    Rewind Coffee Passport
                  </h3>
                  <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                    {selectedCustomer.name} · {selectedCustomer.phone}
                  </p>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-vintage-orange text-white">
                  Buy 9, Get 10th Free!
                </span>
              </div>

              {/* 10 Stamp Circle Grid */}
              <div className="grid grid-cols-5 gap-3 py-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((slot) => {
                  const isStamped = slot <= selectedCustomer.stamp_count;
                  const isFreeSlot = slot === 10;

                  return (
                    <div
                      key={slot}
                      className={`h-20 rounded-2xl flex flex-col items-center justify-center border-2 transition-all duration-300 ${
                        isStamped
                          ? "bg-vintage-orange text-white border-vintage-orange shadow-md scale-102"
                          : isFreeSlot
                          ? "bg-amber-100 dark:bg-amber-950/40 border-dashed border-mustard text-mustard-dark animate-pulse"
                          : "bg-white dark:bg-espresso-800 border-dashed border-cream-300 dark:border-espresso-700 text-espresso-700/40"
                      }`}
                    >
                      {isStamped ? (
                        <>
                          <Coffee className="w-6 h-6 stroke-[2.5]" />
                          <span className="text-[10px] font-black mt-1">STAMP #{slot}</span>
                        </>
                      ) : isFreeSlot ? (
                        <>
                          <Sparkles className="w-6 h-6 text-vintage-orange" />
                          <span className="text-[10px] font-black text-vintage-orange uppercase">
                            FREE ☕
                          </span>
                        </>
                      ) : (
                        <span className="font-serif font-bold text-sm">#{slot}</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {selectedCustomer.stamp_count >= 10 ? (
                <div className="p-3 rounded-2xl bg-sage text-white font-serif font-bold text-sm shadow-md animate-bounce">
                  🎉 FREE ARTISAN COFFEE READY TO REDEEM AT REGISTER!
                </div>
              ) : (
                <button
                  onClick={() => handleAddStamp(selectedCustomer)}
                  className="w-full py-3 rounded-2xl bg-vintage-orange text-white font-serif font-bold text-sm shadow-md hover:bg-vintage-orange-hover active:scale-98"
                >
                  Punch Stamp #{selectedCustomer.stamp_count + 1}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center p-8 bg-white dark:bg-espresso-800 rounded-3xl border border-cream-200">
              Select a customer from the directory to inspect their loyalty stamp card.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: GIFT CARDS */}
      {activeTab === "GIFTCARDS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {giftCards.map((gc) => (
              <div
                key={gc.id}
                className="p-6 rounded-3xl bg-gradient-to-br from-vintage-orange to-amber-600 text-white shadow-floating flex flex-col justify-between min-h-[160px]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-serif font-black text-lg tracking-wider block">
                      Rewind Gift Card
                    </span>
                    <span className="text-xs opacity-90">Recipient: {gc.recipient_name}</span>
                  </div>
                  <Gift className="w-6 h-6" />
                </div>

                <div className="my-2">
                  <span className="font-mono text-sm tracking-widest bg-black/20 px-3 py-1 rounded-xl">
                    {gc.code}
                  </span>
                </div>

                <div className="flex justify-between items-baseline pt-2 border-t border-white/20">
                  <span className="text-xs opacity-90">Expires {gc.expires_at}</span>
                  <span className="font-serif font-black text-2xl">{formatCurrency(gc.balance)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: PROMO CODES */}
      {activeTab === "PROMOS" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {promoCodes.map((p) => (
              <div
                key={p.id}
                className="p-5 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 shadow-card flex flex-col justify-between space-y-2"
              >
                <div className="flex justify-between items-start">
                  <span className="font-mono font-black text-lg text-vintage-orange">{p.code}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sage-light text-sage-dark">
                    Active
                  </span>
                </div>

                <div className="text-xs space-y-1">
                  <p className="font-bold text-espresso-900 dark:text-cream-100">
                    {p.discount_pct ? `${p.discount_pct}% OFF` : `${formatCurrency(p.discount_val || 0)} OFF`}
                  </p>
                  <p className="text-espresso-700/60">Min Order: {formatCurrency(p.min_order_amount)}</p>
                  <p className="text-espresso-700/60">Times Redeemed: {p.usage_count}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: BROADCAST CAMPAIGNS */}
      {activeTab === "CAMPAIGNS" && (
        <div className="max-w-xl mx-auto w-full p-6 rounded-3xl bg-white dark:bg-espresso-800 border border-cream-200 shadow-card space-y-4">
          <h3 className="font-serif font-bold text-lg">Send Targeted WhatsApp Broadcast</h3>

          <div>
            <label className="text-xs font-bold block mb-1">Target Customer Segment</label>
            <select
              value={campaignSegment}
              onChange={(e) => setCampaignSegment(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-cream-50 border border-cream-300 text-xs font-bold"
            >
              <option value="Inactive (30+ days)">Inactive Customers (&gt; 30 days without visit)</option>
              <option value="Coffee VIPs">VIP Gold Members (Frequent flyers)</option>
              <option value="Birthday This Month">Customers Celebrating Birthdays This Month</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold block mb-1">Broadcast Message Template</label>
            <textarea
              rows={4}
              value={campaignMessage}
              onChange={(e) => setCampaignMessage(e.target.value)}
              className="w-full px-3 py-2.5 rounded-2xl bg-cream-50 border border-cream-300 text-xs leading-relaxed"
            />
          </div>

          <button
            onClick={handleSendCampaign}
            className="w-full py-3 rounded-2xl bg-sage hover:bg-sage-dark text-white font-serif font-bold text-sm shadow-md flex items-center justify-center gap-2"
          >
            <Send className="w-4 h-4" />
            <span>Broadcast via WhatsApp ({filteredCustomers.length} recipients)</span>
          </button>
        </div>
      )}

      {/* Add Customer Modal */}
      {showAddCustModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-cream-50 dark:bg-surface-dark border border-cream-200 rounded-café p-6 shadow-floating space-y-4">
            <h3 className="font-serif font-bold text-lg">Add Loyalty Customer</h3>

            <div>
              <label className="text-xs font-bold block mb-1">Customer Full Name</label>
              <input
                type="text"
                placeholder="e.g. Maryam Farooq"
                value={newCustName}
                onChange={(e) => setNewCustName(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Phone Number (Mobile)</label>
              <input
                type="text"
                placeholder="0300-1234567"
                value={newCustPhone}
                onChange={(e) => setNewCustPhone(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-mono font-bold"
              />
            </div>

            <div>
              <label className="text-xs font-bold block mb-1">Store Credit Tab Limit (PKR)</label>
              <input
                type="number"
                value={newCustCreditLimit}
                onChange={(e) => setNewCustCreditLimit(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-cream-300 text-xs font-bold"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setShowAddCustModal(false)}
                className="flex-1 py-2 rounded-xl bg-cream-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCustomer}
                className="flex-1 py-2 rounded-xl bg-vintage-orange text-white text-xs font-bold shadow-md"
              >
                Save Customer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
