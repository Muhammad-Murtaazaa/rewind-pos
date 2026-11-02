"use client";

import React, { useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { SAMPLE_STAFF } from "@/lib/data/sample-menu";
import { Lock, Unlock, X, ShieldAlert, UserCheck } from "lucide-react";

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
  const { loginWithPin } = useAuthStore();

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

  const verifyPin = (enteredPin: string) => {
    const staff = SAMPLE_STAFF.find((s) => s.pin === enteredPin);
    if (!staff) {
      setError(true);
      setTimeout(() => setPin(""), 600);
      return;
    }

    if (requiredRole && staff.role !== "OWNER" && staff.role !== "MANAGER") {
      setError(true);
      setTimeout(() => setPin(""), 600);
      return;
    }

    loginWithPin(enteredPin);
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
            Invalid PIN or insufficient permissions
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

        {/* Demo Fast Staff Switches for 1-click testability */}
        <div className="mt-5 pt-4 border-t border-cream-200 dark:border-espresso-700">
          <p className="text-[11px] font-medium text-espresso-700/60 dark:text-cream-300/60 mb-2">
            Quick demo staff switcher:
          </p>
          <div className="grid grid-cols-3 gap-1.5">
            {SAMPLE_STAFF.map((staff) => (
              <button
                key={staff.id}
                onClick={() => verifyPin(staff.pin)}
                className="text-left px-2 py-1.5 rounded-lg bg-cream-100 dark:bg-espresso-800 border border-cream-200 dark:border-espresso-700 text-[11px] hover:border-vintage-orange transition-all flex items-center gap-1.5 truncate"
                title={`PIN: ${staff.pin}`}
              >
                <span>{staff.avatar}</span>
                <span className="truncate">{staff.name.split(" ")[0]}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
