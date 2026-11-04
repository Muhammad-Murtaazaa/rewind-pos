"use client";

import React, { useState, useEffect } from "react";
import { type LocalStaff } from "@/lib/db/dexie";
import { useAuthStore, type CurrentUser } from "@/stores/authStore";
import { useUiStore } from "@/stores/uiStore";
import { formatCurrency } from "@/lib/utils";
import {
  X,
  User,
  Shield,
  KeyRound,
  Mail,
  Phone,
  DollarSign,
  Percent,
  CheckCircle2,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw,
} from "lucide-react";

const AVATAR_OPTIONS = [
  { emoji: "👨‍💼", label: "Owner / Exec" },
  { emoji: "👩‍💼", label: "Manager" },
  { emoji: "🧑‍💻", label: "Cashier" },
  { emoji: "☕", label: "Barista" },
  { emoji: "👨‍🍳", label: "Kitchen Chef" },
  { emoji: "🤵", label: "Floor Waiter" },
  { emoji: "💼", label: "Accountant" },
  { emoji: "🧑‍🍳", label: "Sous Chef" },
];

const ROLES: { id: CurrentUser["role"]; label: string; desc: string }[] = [
  { id: "OWNER", label: "Owner", desc: "Full administrative access & 100% discount authority" },
  { id: "MANAGER", label: "Manager", desc: "Shift supervisor, reports, refunds & drawer close" },
  { id: "CASHIER", label: "Cashier", desc: "Front counter POS register, payments & receipts" },
  { id: "BARISTA", label: "Barista", desc: "Coffee bar KDS display, beverage queue & bumps" },
  { id: "KITCHEN", label: "Kitchen Chef", desc: "Food station KDS display, grill & prep queue" },
  { id: "WAITER", label: "Waiter", desc: "Floor tables, customer orders & table billing" },
  { id: "ACCOUNTANT", label: "Accountant", desc: "Double-entry books, P&L, expenses & payroll" },
];

interface StaffAccountModalProps {
  isOpen: boolean;
  staff: (LocalStaff & { phone?: string; base_salary?: number }) | null; // null = Create, object = Edit
  onClose: () => void;
  onSaved: (staff: LocalStaff) => void;
}

export function StaffAccountModal({
  isOpen,
  staff,
  onClose,
  onSaved,
}: StaffAccountModalProps) {
  const { playSound } = useUiStore();
  const { createStaff, updateStaff } = useAuthStore();

  const [name, setName] = useState("");
  const [role, setRole] = useState<CurrentUser["role"]>("CASHIER");
  const [pin, setPin] = useState("");
  const [showPin, setShowPin] = useState(false);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("🧑‍💻");
  const [salary, setSalary] = useState(55000);
  const [discountLimit, setDiscountLimit] = useState(15);
  const [errors, setErrors] = useState<{ name?: string; pin?: string }>({});

  useEffect(() => {
    if (staff) {
      setName(staff.name || "");
      setRole((staff.role as any) || "CASHIER");
      setPin(staff.pin || "");
      setPhone(staff.phone || "");
      setEmail(staff.email || "");
      setAvatar(staff.avatar || "👤");
      setSalary(staff.base_salary || 55000);
      setDiscountLimit((staff as any).discount_limit ?? (staff.role === "OWNER" || staff.role === "MANAGER" ? 100 : 15));
    } else {
      setName("");
      setRole("CASHIER");
      setPin(Math.floor(1000 + Math.random() * 9000).toString());
      setPhone("0300-");
      setEmail("");
      setAvatar("🧑‍💻");
      setSalary(55000);
      setDiscountLimit(15);
    }
    setShowPin(false);
    setErrors({});
  }, [staff, isOpen]);

  if (!isOpen) return null;

  const handleGeneratePin = () => {
    playSound("click");
    const rand = Math.floor(1000 + Math.random() * 9000).toString();
    setPin(rand);
  };

  const handleSave = async () => {
    const newErrors: { name?: string; pin?: string } = {};
    if (!name.trim()) newErrors.name = "Full name is required";
    if (!pin.trim() || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      newErrors.pin = "PIN must be exactly 4 numeric digits (e.g. 1234)";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      playSound("click");
      return;
    }

    try {
      if (staff) {
        await updateStaff(staff.id, {
          name: name.trim(),
          role,
          pin: pin.trim(),
          email: email.trim(),
          phone: phone.trim(),
          avatar,
          discount_limit: discountLimit,
        });
        playSound("chime");
        onSaved({
          ...staff,
          name: name.trim(),
          role,
          pin: pin.trim(),
          email: email.trim(),
          avatar,
        });
      } else {
        const created = await createStaff({
          name: name.trim(),
          role,
          pin: pin.trim(),
          email: email.trim(),
          phone: phone.trim(),
          avatar,
          discount_limit: discountLimit,
        });
        playSound("chime");
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      alert("Failed to save staff account: " + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-cream-50 dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-3xl shadow-floating text-espresso-900 dark:text-cream-100 flex flex-col overflow-hidden max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cream-200 dark:border-espresso-700 bg-white dark:bg-espresso-900/60">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-1 rounded-2xl bg-cream-100 dark:bg-espresso-800">
              {avatar}
            </span>
            <div>
              <h3 className="font-serif font-black text-lg text-espresso-900 dark:text-cream-100">
                {staff ? "Edit Staff Account & Security" : "Create New Staff Account"}
              </h3>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                Configure login credentials, security PIN, and permissions
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

        {/* Form Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Full Name & Avatar */}
          <div className="grid grid-cols-3 gap-3 items-start">
            <div className="col-span-2">
              <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                Staff Full Name <span className="text-brick">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Usman Ghani"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-600 font-bold text-sm"
              />
              {errors.name && <span className="text-[11px] text-brick font-semibold">{errors.name}</span>}
            </div>

            <div>
              <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                Avatar Emoji
              </label>
              <select
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                className="w-full px-2 py-2.5 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-600 text-base font-bold text-center"
              >
                {AVATAR_OPTIONS.map((a) => (
                  <option key={a.emoji} value={a.emoji}>
                    {a.emoji} {a.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
              Account Role & Access Level <span className="text-brick">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ROLES.map((r) => {
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => {
                      playSound("click");
                      setRole(r.id);
                      if (r.id === "OWNER" || r.id === "MANAGER") {
                        setDiscountLimit(100);
                      } else {
                        setDiscountLimit(15);
                      }
                    }}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      isSelected
                        ? "bg-vintage-orange text-white border-vintage-orange shadow-sm scale-101"
                        : "bg-white dark:bg-espresso-800 border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200 hover:border-vintage-orange/50"
                    }`}
                  >
                    <span className="font-bold text-xs block">{r.label}</span>
                    <span
                      className={`text-[9px] block leading-tight mt-0.5 line-clamp-1 ${
                        isSelected ? "text-white/80" : "text-espresso-700/60 dark:text-cream-300/60"
                      }`}
                    >
                      {r.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4-Digit Security PIN */}
          <div className="p-4 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700 space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-vintage-orange" />
                  <span>4-Digit Terminal Security PIN</span>
                  <span className="text-brick">*</span>
                </label>
                <span className="text-[10px] text-espresso-700/60 dark:text-cream-300/60">
                  Used by staff to unlock terminal, switch shifts, and authorize sales
                </span>
              </div>

              <button
                type="button"
                onClick={handleGeneratePin}
                className="px-2.5 py-1 text-[11px] font-bold text-vintage-orange hover:bg-vintage-orange/10 rounded-xl transition-colors flex items-center gap-1 border border-vintage-orange/30"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Random PIN</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                type={showPin ? "text" : "password"}
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="4-digit PIN"
                className="w-full pl-4 pr-10 py-2.5 rounded-xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-600 font-mono font-black text-xl tracking-widest text-center"
              />
              <button
                type="button"
                onClick={() => setShowPin(!showPin)}
                className="absolute right-3 text-espresso-700/60 hover:text-espresso-900"
                title={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.pin && <span className="text-[11px] text-brick font-semibold block">{errors.pin}</span>}
          </div>

          {/* Contact Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-3.5 h-3.5 text-espresso-700/50" />
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0300-1234567"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-600 text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-3.5 h-3.5 text-espresso-700/50" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="staff@rewindcafe.pk"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-white dark:bg-espresso-800 border border-cream-300 dark:border-espresso-600 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Salary & Permissions */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700">
              <label className="text-[11px] font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                Base Monthly Salary (PKR)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1.5 text-xs font-bold text-espresso-700/50">₨</span>
                <input
                  type="number"
                  value={salary}
                  onChange={(e) => setSalary(parseFloat(e.target.value) || 0)}
                  className="w-full pl-6 pr-2 py-1 rounded-xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-600 font-bold text-sm"
                />
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700">
              <label className="text-[11px] font-bold text-espresso-800 dark:text-cream-200 block mb-1">
                Max Discount Limit (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={discountLimit}
                  onChange={(e) => setDiscountLimit(parseFloat(e.target.value) || 0)}
                  className="w-full pr-6 pl-3 py-1 rounded-xl bg-cream-50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-600 font-bold text-sm"
                />
                <span className="absolute right-2.5 top-1.5 text-xs font-bold text-espresso-700/60">%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-cream-200 dark:border-espresso-700 bg-white dark:bg-espresso-900/60 flex items-center justify-between">
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
            className="h-11 px-6 rounded-2xl bg-vintage-orange hover:bg-vintage-orange/90 text-white font-serif font-bold text-sm shadow-md flex items-center gap-2 transition-all"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>{staff ? "Update Account" : "Create Account"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
