"use client";

import React, { useState, useEffect } from "react";
import {
  autoDetectPrinter,
  getCurrentPrinterState,
  getPrinterSettings,
  savePrinterSettings,
  pairUSBPrinter,
  pairSerialPrinter,
  resetToSystemPrinter,
  printTestReceipt,
  type PrinterState,
  type PrinterSettings,
  subscribePrinterState,
} from "@/lib/printing/thermal-printer";
import { useUiStore } from "@/stores/uiStore";
import {
  Printer,
  Usb,
  Cpu,
  Scissors,
  DollarSign,
  CheckCircle2,
  RefreshCw,
  X,
  Sparkles,
  HelpCircle,
  FileText,
  AlertCircle,
} from "lucide-react";

interface PrinterSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrinterSettingsModal({ isOpen, onClose }: PrinterSettingsModalProps) {
  const { playSound } = useUiStore();
  const [printerState, setPrinterState] = useState<PrinterState>(getCurrentPrinterState());
  const [settings, setSettings] = useState<PrinterSettings>(getPrinterSettings());
  const [isTesting, setIsTesting] = useState(false);
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    autoDetectPrinter().then(setPrinterState);
    const unsubscribe = subscribePrinterState(setPrinterState);
    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const handleWidthChange = (paperWidth: 80 | 58) => {
    playSound("click");
    savePrinterSettings({ paperWidth });
    setSettings((prev) => ({ ...prev, paperWidth }));
  };

  const handleCutChange = () => {
    playSound("click");
    const cutPaper = !settings.cutPaper;
    savePrinterSettings({ cutPaper });
    setSettings((prev) => ({ ...prev, cutPaper }));
  };

  const handleDrawerChange = () => {
    playSound("click");
    const openDrawer = !settings.openDrawer;
    savePrinterSettings({ openDrawer });
    setSettings((prev) => ({ ...prev, openDrawer }));
  };

  const handleDirectChange = () => {
    playSound("click");
    const preferHardwareDirect = !settings.preferHardwareDirect;
    savePrinterSettings({ preferHardwareDirect });
    setSettings((prev) => ({ ...prev, preferHardwareDirect }));
  };

  const handlePairUSB = async () => {
    playSound("click");
    const success = await pairUSBPrinter();
    if (success) {
      playSound("chime");
    }
  };

  const handlePairSerial = async () => {
    playSound("click");
    const success = await pairSerialPrinter();
    if (success) {
      playSound("chime");
    }
  };

  const handleResetSystem = () => {
    playSound("click");
    resetToSystemPrinter();
  };

  const handleTestPrint = async () => {
    playSound("bell");
    setIsTesting(true);
    setTestSuccess(null);
    try {
      const ok = await printTestReceipt();
      setTestSuccess(ok);
      if (ok) playSound("chime");
    } catch {
      setTestSuccess(false);
    } finally {
      setIsTesting(false);
      setTimeout(() => setTestSuccess(null), 4000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-espresso-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="w-full max-w-lg bg-cream-50 dark:bg-surface-dark border border-cream-200 dark:border-espresso-700 rounded-3xl shadow-floating text-espresso-900 dark:text-cream-100 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-cream-200 dark:border-espresso-700 bg-white dark:bg-espresso-900/60">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-vintage-orange/15 text-vintage-orange flex items-center justify-center">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-espresso-900 dark:text-cream-100 leading-tight">
                Universal Thermal Printer
              </h3>
              <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                Auto-detection & ESC/POS hardware settings
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

        {/* Modal Body */}
        <div className="p-5 space-y-5 overflow-y-auto max-h-[75vh]">
          {/* Active Detected Printer Card */}
          <div className="p-4 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700 space-y-2 shadow-card">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-espresso-700/60 dark:text-cream-300/60">
                Detected Printer Status
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 text-[11px] font-bold border border-emerald-300/60 dark:border-emerald-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Ready</span>
              </span>
            </div>

            <div className="flex items-center gap-3 pt-1">
              {printerState.type === "webusb" && <Usb className="w-6 h-6 text-vintage-orange" />}
              {printerState.type === "webserial" && <Cpu className="w-6 h-6 text-vintage-orange" />}
              {printerState.type === "system" && <Printer className="w-6 h-6 text-vintage-orange" />}

              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-espresso-900 dark:text-cream-100 truncate">
                  {printerState.name}
                </h4>
                <p className="text-xs text-espresso-700/60 dark:text-cream-300/60">
                  {printerState.type === "webusb" && "Direct WebUSB ESC/POS mode active"}
                  {printerState.type === "webserial" && "Direct Serial / Virtual COM mode active"}
                  {printerState.type === "system" && "Universal System mode (Works with ANY printer driver)"}
                </p>
              </div>

              {printerState.type !== "system" && (
                <button
                  onClick={handleResetSystem}
                  className="px-2.5 py-1 text-[11px] font-bold text-espresso-700/80 hover:text-brick border border-cream-300 dark:border-espresso-700 rounded-xl transition-colors"
                >
                  Unpair
                </button>
              )}
            </div>
          </div>

          {/* Paper Roll Width Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-espresso-800 dark:text-cream-200">
              Receipt Paper Width
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleWidthChange(80)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  settings.paperWidth === 80
                    ? "bg-vintage-orange/10 border-vintage-orange text-vintage-orange shadow-card scale-101"
                    : "bg-white dark:bg-espresso-800 border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">80mm Standard</span>
                  {settings.paperWidth === 80 && <CheckCircle2 className="w-4 h-4 text-vintage-orange" />}
                </div>
                <p className="text-[11px] text-espresso-700/60 dark:text-cream-300/60">
                  48 columns · Standard café & restaurant ticket format
                </p>
              </button>

              <button
                type="button"
                onClick={() => handleWidthChange(58)}
                className={`p-3.5 rounded-2xl border text-left transition-all ${
                  settings.paperWidth === 58
                    ? "bg-vintage-orange/10 border-vintage-orange text-vintage-orange shadow-card scale-101"
                    : "bg-white dark:bg-espresso-800 border-cream-200 dark:border-espresso-700 text-espresso-800 dark:text-cream-200"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm">58mm Compact</span>
                  {settings.paperWidth === 58 && <CheckCircle2 className="w-4 h-4 text-vintage-orange" />}
                </div>
                <p className="text-[11px] text-espresso-700/60 dark:text-cream-300/60">
                  32 columns · Mini portable / handheld thermal rolls
                </p>
              </button>
            </div>
          </div>

          {/* Hardware Feature Toggles */}
          <div className="p-4 rounded-2xl bg-white dark:bg-espresso-850 border border-cream-200 dark:border-espresso-700 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <Scissors className="w-4 h-4 text-vintage-orange" />
                <div>
                  <span className="text-xs font-bold block">Auto-Cut Paper</span>
                  <span className="text-[10px] text-espresso-700/60 dark:text-cream-300/60">
                    Send ESC/POS partial cut command after receipt completes
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.cutPaper}
                onChange={handleCutChange}
                className="w-4 h-4 rounded text-vintage-orange focus:ring-vintage-orange cursor-pointer"
              />
            </label>

            <div className="border-t border-cream-200 dark:border-espresso-700" />

            <label className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-2.5">
                <DollarSign className="w-4 h-4 text-vintage-orange" />
                <div>
                  <span className="text-xs font-bold block">Kick Cash Drawer</span>
                  <span className="text-[10px] text-espresso-700/60 dark:text-cream-300/60">
                    Send pulse to RJ11/RJ12 drawer connector on cash transactions
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={settings.openDrawer}
                onChange={handleDrawerChange}
                className="w-4 h-4 rounded text-vintage-orange focus:ring-vintage-orange cursor-pointer"
              />
            </label>
          </div>

          {/* Direct Hardware Pairing Buttons */}
          <div className="space-y-2">
            <span className="text-xs font-bold text-espresso-800 dark:text-cream-200">
              Direct Hardware Pairing (Optional)
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handlePairUSB}
                className="h-10 px-3 rounded-xl bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 border border-cream-300 dark:border-espresso-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Usb className="w-4 h-4 text-vintage-orange" />
                <span>Pair USB Thermal</span>
              </button>

              <button
                type="button"
                onClick={handlePairSerial}
                className="h-10 px-3 rounded-xl bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 border border-cream-300 dark:border-espresso-700 text-xs font-bold flex items-center justify-center gap-2 transition-colors"
              >
                <Cpu className="w-4 h-4 text-vintage-orange" />
                <span>Pair Serial / COM</span>
              </button>
            </div>
            <p className="text-[11px] text-espresso-700/50 dark:text-cream-300/50 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-vintage-orange flex-shrink-0" />
              <span>
                Even without pairing, the Universal Driver works with any printer installed on Windows or Mac!
              </span>
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-cream-200 dark:border-espresso-700 bg-white dark:bg-espresso-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestPrint}
            disabled={isTesting}
            className="h-11 px-5 rounded-2xl bg-cream-100 dark:bg-espresso-800 hover:bg-cream-200 border border-cream-300 dark:border-espresso-700 text-espresso-900 dark:text-cream-100 text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
          >
            <Printer className="w-4 h-4 text-vintage-orange" />
            <span>{isTesting ? "Sending to Printer…" : "Print Test Receipt"}</span>
            {testSuccess === true && <span className="text-sage font-black">✓ Sent!</span>}
            {testSuccess === false && <span className="text-brick font-black">✕ Check printer</span>}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="h-11 px-6 rounded-2xl bg-vintage-orange hover:bg-vintage-orange/90 text-white font-serif font-bold text-sm shadow-md transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
