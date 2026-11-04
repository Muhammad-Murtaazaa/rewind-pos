"use client";

import React, { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { Lock, Unlock, X, ShieldAlert, UserCheck, Users } from "lucide-react";

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredRole?: "MANAGER" | "OWNER";
  onSuccess?: () => void;
  title?: string;
  subtitle?: string;
}

export function PinModal({
  isOpen,
  onClose,
  requiredRole,
  onSuccess,
  title = "Staff PIN Unlock",
  subtitle = "Enter 4-digit staff PIN to switch or authorize",
}: PinModalProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const { loginWithPin, staffList, loadStaff } = useAuthStore();

  useEffect(() => {
    if (isOpen) {
      loadStaff();
      setPin("");
      setError(false);
    }
  }, [isOpen, loadStaff]);

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError(false);

      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin("");
    setError(false);
  };

  const verifyPin = async (enteredPin: string) => {
    const matchedStaff = staffList.find((s) => s.pin === enteredPin);

    if (requiredRole && matchedStaff && matchedStaff.role !== "OWNER" && matchedStaff.role !== "MANAGER") {
      setError(true);
      setTimeout(() => setPin(""), 600);
      return;
    }

    const success = await loginWithPin(enteredPin);
    if (!success) {
      setError(true);
      setTimeout(() => setPin(""), 600);
      return;
    }

    setPin("");
    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-cream-50 dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-café p-6 shadow-floating text-espresso-800 dark:text-cream-100">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-vintage-orange-light dark:bg-espresso-700 flex items-center justify-center text-vintage-orange">
              {requiredRole ? <ShieldAlert className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="font-serif font-bold text-lg leading-tight">{title}</h3>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">{subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-cream-200 dark:hover:bg-espresso-700 text-espresso-700 dark:text-cream-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PIN Dots indicator */}
        <div className="flex justify-center items-center gap-4 my-6">
          {[0, 1, 2, 3].map((index) => {
            const isFilled = index < pin.length;
            return (
              <div
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-200 ${
                  error
                    ? "bg-brick scale-110 animate-bounce"
                    : isFilled
                    ? "bg-vintage-orange scale-110"
                    : "bg-cream-200 dark:bg-espresso-700 border border-cream-300 dark:border-espresso-600"
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs text-center text-brick font-medium mb-3">
            Invalid PIN or insufficient role permissions
          </p>
        )}

        {/* Numeric keypad (minimum 48px tap targets) */}
        <div className="grid grid-cols-3 gap-3">
          {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
            <button
              key={num}
              onClick={() => handleDigit(num)}
              className="h-14 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-xl font-bold font-serif hover:bg-cream-100 dark:hover:bg-espresso-700 active:scale-95 transition-transform flex items-center justify-center shadow-card"
            >
              {num}
            </button>
          ))}
          <button
            onClick={handleClear}
            className="h-14 rounded-2xl bg-cream-200/50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-700 text-sm font-semibold hover:bg-cream-200 transition-colors flex items-center justify-center"
          >
            Clear
          </button>
          <button
            onClick={() => handleDigit("0")}
            className="h-14 rounded-2xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-xl font-bold font-serif hover:bg-cream-100 dark:hover:bg-espresso-700 active:scale-95 transition-transform flex items-center justify-center shadow-card"
          >
            0
          </button>
          <button
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-cream-200/50 dark:bg-espresso-900 border border-cream-300 dark:border-espresso-700 text-sm font-semibold hover:bg-cream-200 transition-colors flex items-center justify-center"
          >
            ⌫
          </button>
        </div>

        {/* Dynamic Registered Staff Account Switcher */}
        {staffList.length > 0 && (
          <div className="mt-5 pt-4 border-t border-cream-200 dark:border-espresso-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold text-espresso-700/70 dark:text-cream-300/70 flex items-center gap-1">
                <Users className="w-3 h-3 text-vintage-orange" />
                <span>Switch Staff Member:</span>
              </span>
              <span className="text-[10px] text-espresso-700/50">
                {staffList.length} accounts
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto pr-1">
              {staffList.map((staff) => (
                <button
                  key={staff.id}
                  onClick={() => verifyPin(staff.pin)}
                  className="text-left px-2.5 py-2 rounded-xl bg-white dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-[11px] hover:border-vintage-orange transition-all flex items-center gap-2 group shadow-sm"
                >
                  <span className="text-base flex-shrink-0">{staff.avatar || "👤"}</span>
                  <div className="min-w-0 flex-1">
                    <span className="font-bold text-espresso-900 dark:text-cream-100 truncate block text-[11px] leading-tight">
                      {staff.name.split(" ")[0]}
                    </span>
                    <span className="text-[9px] font-semibold text-vintage-orange uppercase block -mt-0.5">
                      {staff.role}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
