/**
 * ESC/POS & Universal Thermal Printer Engine for Rewind Café POS
 * -------------------------------------------------------------
 * Fully Universal Printing:
 * 1. Auto-Detects WebUSB and WebSerial thermal printers (Epson, Star, Xprinter, Rongta, Sunmi, etc.)
 * 2. Re-connects paired USB/Serial hardware automatically on page load & USB plug events.
 * 3. Falls back universally to an invisible iframe print system that works with ANY printer
 *    installed on Windows, macOS, Android, or Linux — NEVER blocked by browser popup blockers!
 * 4. Supports 80mm (standard) and 58mm (compact) receipt paper rolls.
 * 5. Automatic cash drawer kick pulse and paper cutting.
 */

import { type LocalOrder } from "@/lib/db/dexie";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

// ─── ESC/POS Constants ───────────────────────────────────────────────
const ESC = 0x1b;
const GS = 0x1d;

const CMD = {
  INIT: [ESC, 0x40], // Initialize printer
  ALIGN_CENTER: [ESC, 0x61, 0x01],
  ALIGN_LEFT: [ESC, 0x61, 0x00],
  ALIGN_RIGHT: [ESC, 0x61, 0x02],
  BOLD_ON: [ESC, 0x45, 0x01],
  BOLD_OFF: [ESC, 0x45, 0x00],
  DOUBLE_WIDTH: [GS, 0x21, 0x10],
  DOUBLE_HEIGHT: [GS, 0x21, 0x01],
  DOUBLE_SIZE: [GS, 0x21, 0x11],
  NORMAL_SIZE: [GS, 0x21, 0x00],
  CUT_PAPER: [GS, 0x56, 0x00], // Full cut
  CUT_PARTIAL: [GS, 0x56, 0x01], // Partial cut
  FEED_LINES: (n: number) => [ESC, 0x64, n],
  OPEN_DRAWER: [ESC, 0x70, 0x00, 0x19, 0xfa], // Kick drawer pin 2
};

// ─── Printer Configuration & State ───────────────────────────────────

export interface PrinterSettings {
  paperWidth: 80 | 58;
  cutPaper: boolean;
  openDrawer: boolean;
  preferHardwareDirect: boolean;
}

const DEFAULT_SETTINGS: PrinterSettings = {
  paperWidth: 80,
  cutPaper: true,
  openDrawer: true,
  preferHardwareDirect: true,
};

export function getPrinterSettings(): PrinterSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem("rewind_printer_settings");
    if (saved) return { ...DEFAULT_SETTINGS, ...JSON.parse(saved) };
  } catch {
    // fallback
  }
  return DEFAULT_SETTINGS;
}

export function savePrinterSettings(settings: Partial<PrinterSettings>) {
  if (typeof window === "undefined") return;
  const current = getPrinterSettings();
  const updated = { ...current, ...settings };
  localStorage.setItem("rewind_printer_settings", JSON.stringify(updated));
  notifyListeners();
}

export interface PrinterState {
  type: "webusb" | "webserial" | "system";
  name: string;
  status: "ready" | "connecting" | "offline";
  paperWidth: 80 | 58;
}

let activeDevice: any = null;
let activePort: any = null;
let printerType: "webusb" | "webserial" | "system" = "system";
let printerName: string = "Universal System Printer";

type StateListener = (state: PrinterState) => void;
const listeners = new Set<StateListener>();

export function subscribePrinterState(listener: StateListener): () => void {
  listeners.add(listener);
  listener(getCurrentPrinterState());
  return () => listeners.delete(listener);
}

function notifyListeners() {
  const state = getCurrentPrinterState();
  listeners.forEach((l) => l(state));
}

export function getCurrentPrinterState(): PrinterState {
  const settings = getPrinterSettings();
  return {
    type: printerType,
    name: printerName,
    status: "ready",
    paperWidth: settings.paperWidth,
  };
}

// ─── Auto-Detection & Connection ─────────────────────────────────────

let hasInitialized = false;

/**
 * Auto-detects paired USB or Serial printers on startup, or sets up universal system fallback.
 * Can be safely called multiple times; sets up USB hotplug listeners.
 */
export async function autoDetectPrinter(): Promise<PrinterState> {
  if (typeof window === "undefined") return getCurrentPrinterState();

  const settings = getPrinterSettings();

  // 1. Try to auto-reconnect known WebUSB printer
  if (settings.preferHardwareDirect && "usb" in navigator) {
    try {
      const devices = await (navigator as any).usb.getDevices();
      if (devices && devices.length > 0) {
        const printer = devices[0];
        await printer.open();
        if (printer.configuration === null) {
          await printer.selectConfiguration(1);
        }
        await printer.claimInterface(0);
        activeDevice = printer;
        printerType = "webusb";
        printerName = printer.productName || "USB Thermal Printer";
        console.log("🔌 Auto-detected & connected WebUSB printer:", printerName);
        notifyListeners();
        return getCurrentPrinterState();
      }
    } catch (err) {
      console.log("WebUSB auto-detect attempt:", err);
    }
  }

  // 2. Try to auto-reconnect known WebSerial port
  if (settings.preferHardwareDirect && "serial" in navigator) {
    try {
      const ports = await (navigator as any).serial.getPorts();
      if (ports && ports.length > 0) {
        const port = ports[0];
        await port.open({ baudRate: 9600 });
        activePort = port;
        printerType = "webserial";
        printerName = "Serial / Virtual COM Printer";
        console.log("🔌 Auto-detected & connected WebSerial port");
        notifyListeners();
        return getCurrentPrinterState();
      }
    } catch (err) {
      console.log("WebSerial auto-detect attempt:", err);
    }
  }

  // 3. Fallback to Universal System Printer (Works with ANY printer installed on OS)
  printerType = "system";
  printerName = "Universal System Printer (Default Driver)";
  notifyListeners();

  // Listen for USB plug/unplug events
  if (!hasInitialized && "usb" in navigator) {
    hasInitialized = true;
    try {
      (navigator as any).usb.addEventListener("connect", (event: any) => {
        console.log("USB device connected:", event.device?.productName);
        autoDetectPrinter();
      });
      (navigator as any).usb.addEventListener("disconnect", (event: any) => {
        console.log("USB device disconnected:", event.device?.productName);
        if (activeDevice === event.device) {
          activeDevice = null;
          printerType = "system";
          printerName = "Universal System Printer (Default Driver)";
          notifyListeners();
        }
      });
    } catch {
      // ignore
    }
  }

  return getCurrentPrinterState();
}

/** Explicitly pair a new USB Thermal Printer */
export async function pairUSBPrinter(): Promise<boolean> {
  try {
    if (!("usb" in navigator)) {
      alert("WebUSB is not supported in this browser. Please use Chrome or Edge.");
      return false;
    }
    const device = await (navigator as any).usb.requestDevice({
      filters: [{ classCode: 7 }],
    });
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    await device.claimInterface(0);
    activeDevice = device;
    printerType = "webusb";
    printerName = device.productName || "USB Thermal Printer";
    notifyListeners();
    return true;
  } catch (err: any) {
    console.warn("User cancelled or failed to pair USB printer:", err);
    return false;
  }
}

/** Explicitly pair a new Serial / COM thermal printer */
export async function pairSerialPrinter(): Promise<boolean> {
  try {
    if (!("serial" in navigator)) {
      alert("WebSerial is not supported in this browser. Please use Chrome or Edge.");
      return false;
    }
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    activePort = port;
    printerType = "webserial";
    printerName = "Serial / Virtual COM Printer";
    notifyListeners();
    return true;
  } catch (err: any) {
    console.warn("User cancelled or failed to pair serial printer:", err);
    return false;
  }
}

/** Disconnect hardware printer and revert to Universal System Printer */
export function resetToSystemPrinter() {
  if (activeDevice) {
    try {
      activeDevice.close();
    } catch {}
    activeDevice = null;
  }
  if (activePort) {
    try {
      activePort.close();
    } catch {}
    activePort = null;
  }
  printerType = "system";
  printerName = "Universal System Printer (Default Driver)";
  notifyListeners();
}

// ─── ESC/POS Binary Buffer Generator ─────────────────────────────────

function textEncoder(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function padLine(left: string, right: string, width: number): string {
  const gap = width - left.length - right.length;
  if (gap <= 0) return left.slice(0, Math.max(0, width - right.length - 1)) + " " + right;
  return left + " ".repeat(gap) + right;
}

export function buildReceiptBuffer(order: LocalOrder, settings: PrinterSettings): Uint8Array {
  const width = settings.paperWidth === 58 ? 32 : 48;
  const parts: (Uint8Array | number[])[] = [];

  function cmd(...bytes: number[][]) {
    bytes.forEach((b) => parts.push(new Uint8Array(b)));
  }
  function text(s: string) {
    parts.push(textEncoder(s));
  }
  function line(s: string = "") {
    text(s + "\n");
  }

  cmd(CMD.INIT);

  // Header
  cmd(CMD.ALIGN_CENTER, CMD.DOUBLE_SIZE, CMD.BOLD_ON);
  line("REWIND CAFE");
  cmd(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
  line("Artisan Coffee & Bakery");
  line("DHA Phase 5, Karachi");
  line("Tel: 0300-REWIND1");
  line("STRN: 3277876123 | NTN: 8912440-1");
  cmd(CMD.ALIGN_LEFT);
  line("=".repeat(width));

  // Order Details
  cmd(CMD.BOLD_ON);
  line(padLine(`Order: #${order.order_number}`, order.order_type.replace("_", " "), width));
  cmd(CMD.BOLD_OFF);
  line(padLine(`Date: ${formatDate(order.created_at)}`, formatTime(order.created_at), width));
  line(padLine(`Cashier: ${(order.cashier_name || "Staff").split(" ")[0]}`, order.table_number ? `Table: ${order.table_number}` : "Counter", width));
  if (order.customer_name || order.customer_phone) {
    line(`Customer: ${order.customer_name || ""} ${order.customer_phone ? `(${order.customer_phone})` : ""}`);
  }
  line("-".repeat(width));

  // Items Header
  cmd(CMD.BOLD_ON);
  line(padLine("Item", "Amount", width));
  cmd(CMD.BOLD_OFF);
  line("-".repeat(width));

  // Items List
  for (const item of order.items) {
    const itemLine = `${item.quantity}x ${item.item_name}`;
    const priceLine = formatCurrency(item.total_price).replace("₨ ", "");
    line(padLine(itemLine, priceLine, width));

    if (item.variant_name) {
      line(`   Size: ${item.variant_name}`);
    }
    if (item.selected_modifiers && item.selected_modifiers.length > 0) {
      for (const mod of item.selected_modifiers) {
        if (mod.price_add > 0) {
          line(padLine(`   + ${mod.modifier_name}`, `+${formatCurrency(mod.price_add).replace("₨ ", "")}`, width));
        } else {
          line(`   + ${mod.modifier_name}`);
        }
      }
    }
    if (item.notes) {
      line(`   Note: ${item.notes}`);
    }
  }

  line("-".repeat(width));

  // Totals
  line(padLine("Subtotal:", formatCurrency(order.subtotal).replace("₨ ", ""), width));
  if (order.discount_amount > 0) {
    line(padLine(`Discount${order.discount_reason ? ` (${order.discount_reason})` : ""}:`, `-${formatCurrency(order.discount_amount).replace("₨ ", "")}`, width));
  }
  if (order.service_charge && order.service_charge > 0) {
    line(padLine("Service Charge:", formatCurrency(order.service_charge).replace("₨ ", ""), width));
  }
  line(padLine("Sales Tax (16% PRA):", formatCurrency(order.tax_amount).replace("₨ ", ""), width));

  line("=".repeat(width));
  cmd(CMD.DOUBLE_WIDTH, CMD.BOLD_ON);
  line(padLine("TOTAL:", `Rs ${formatCurrency(order.total_amount).replace("₨ ", "")}`, Math.floor(width / 2)));
  cmd(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
  line("=".repeat(width));

  // Payment
  if (order.payment_method) {
    line(padLine("Payment:", order.payment_method.replace("_", " "), width));
  }
  if (order.amount_tendered && order.amount_tendered > 0) {
    line(padLine("Tendered:", formatCurrency(order.amount_tendered).replace("₨ ", ""), width));
    line(padLine("Change:", formatCurrency(order.change_returned || 0).replace("₨ ", ""), width));
  }

  line("-".repeat(width));

  // Footer
  cmd(CMD.ALIGN_CENTER);
  line("");
  cmd(CMD.BOLD_ON);
  line("Thank you for stopping by!");
  cmd(CMD.BOLD_OFF);
  line('"Good coffee takes time,');
  line('but great memories last forever."');
  line("");
  line("FBR / PRA POS Invoice");
  line(`Printed: ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}`);
  line("");
  line("--- Rewind Cafe ---");

  // Feed lines
  cmd(CMD.FEED_LINES(4));

  // Cut
  if (settings.cutPaper) {
    cmd(CMD.CUT_PARTIAL);
  }

  // Open drawer
  if (settings.openDrawer && order.payment_method === "CASH") {
    cmd(CMD.OPEN_DRAWER);
  }

  // Combine into single Uint8Array
  const totalLen = parts.reduce((sum, p) => sum + p.length, 0);
  const result = new Uint8Array(totalLen);
  let offset = 0;
  for (const part of parts) {
    const arr = part instanceof Uint8Array ? part : new Uint8Array(part);
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

// ─── Hardware Buffer Sender ──────────────────────────────────────────

async function sendRawBuffer(data: Uint8Array): Promise<boolean> {
  try {
    if (printerType === "webusb" && activeDevice) {
      const endpoint = activeDevice.configuration?.interfaces[0]?.alternate?.endpoints.find(
        (e: any) => e.direction === "out"
      );
      if (endpoint) {
        await activeDevice.transferOut(endpoint.endpointNumber, data);
        return true;
      }
    }
    if (printerType === "webserial" && activePort) {
      const writer = activePort.writable?.getWriter();
      if (writer) {
        await writer.write(data);
        writer.releaseLock();
        return true;
      }
    }
  } catch (err) {
    console.error("Direct printer send error:", err);
  }
  return false;
}

// ─── Universal Invisible Iframe Print (Zero Popup Blockers!) ─────────

/**
 * Universal print driver: injects into an invisible iframe so Chrome NEVER blocks popups.
 * Fully compatible with ANY receipt printer installed in Windows (Epson, Xprinter, Star, etc.).
 */
export function triggerUniversalPrint(order: LocalOrder, settings: PrinterSettings): boolean {
  if (typeof window === "undefined") return false;

  const widthMm = settings.paperWidth === 58 ? 58 : 80;
  const printableWidthMm = settings.paperWidth === 58 ? 54 : 76;

  const itemsHtml = order.items
    .map((item) => {
      let html = `<tr><td class="bold">${item.quantity}x ${item.item_name}${item.variant_name ? ` (${item.variant_name})` : ""}</td><td class="r bold">${formatCurrency(item.total_price)}</td></tr>`;
      if (item.selected_modifiers) {
        for (const mod of item.selected_modifiers) {
          html += `<tr class="mod"><td>&nbsp;&nbsp;+ ${mod.modifier_name}</td><td class="r">${mod.price_add > 0 ? `+${formatCurrency(mod.price_add)}` : ""}</td></tr>`;
        }
      }
      if (item.notes) {
        html += `<tr class="mod"><td colspan="2">&nbsp;&nbsp;Note: ${item.notes}</td></tr>`;
      }
      return html;
    })
    .join("");

  const paymentInfo =
    order.amount_tendered && order.amount_tendered > 0
      ? `<tr><td>Tendered:</td><td class="r">${formatCurrency(order.amount_tendered)}</td></tr>
         <tr><td class="bold">Change Due:</td><td class="r bold">${formatCurrency(order.change_returned || 0)}</td></tr>`
      : "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt #${order.order_number}</title>
<style>
  @page {
    size: ${widthMm}mm auto;
    margin: 0;
  }
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  body {
    font-family: 'Courier New', 'Lucida Console', monospace;
    font-size: ${widthMm === 58 ? "10px" : "11px"};
    line-height: 1.25;
    width: ${printableWidthMm}mm;
    margin: 0 auto;
    padding: 2mm 1mm 6mm 1mm;
    color: #000;
    background: #fff;
  }
  .center { text-align: center; }
  .r { text-align: right; }
  .bold { font-weight: bold; }
  .title { font-size: ${widthMm === 58 ? "14px" : "16px"}; font-weight: 900; letter-spacing: 1.5px; }
  .sm { font-size: 9px; color: #333; }
  .dash { border-top: 1px dashed #000; margin: 3px 0; }
  .dbl { border-top: 2px solid #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1.5px 0; vertical-align: top; }
  .mod td { font-size: 9px; color: #444; }
  .total-row td {
    font-size: ${widthMm === 58 ? "13px" : "15px"};
    font-weight: 900;
    padding: 4px 0;
  }
  .footer { margin-top: 8px; font-size: 9px; text-align: center; color: #333; }
  .thanks { font-size: 11px; font-weight: bold; color: #000; margin-bottom: 2px; }
</style>
</head>
<body>
  <div class="center">
    <div class="title">REWIND CAFÉ</div>
    <div class="sm">Artisan Coffee & Bakery</div>
    <div class="sm">DHA Phase 5, Karachi</div>
    <div class="sm">Tel: 0300-REWIND1</div>
    <div class="sm">STRN: 3277876123 · NTN: 8912440-1</div>
  </div>

  <div class="dbl"></div>

  <table>
    <tr class="bold"><td>Order: #${order.order_number}</td><td class="r">${order.order_type.replace("_", " ")}</td></tr>
    <tr><td>Date: ${formatDate(order.created_at)}</td><td class="r">${formatTime(order.created_at)}</td></tr>
    <tr><td>Cashier: ${(order.cashier_name || "Staff").split(" ")[0]}</td><td class="r">${order.table_number ? `Table: ${order.table_number}` : "Counter"}</td></tr>
    ${order.customer_name ? `<tr><td colspan="2">Customer: ${order.customer_name} ${order.customer_phone ? `(${order.customer_phone})` : ""}</td></tr>` : ""}
  </table>

  <div class="dash"></div>
  <table>
    <tr class="bold"><td>Item</td><td class="r">Amount</td></tr>
  </table>
  <div class="dash"></div>

  <table>${itemsHtml}</table>

  <div class="dash"></div>

  <table>
    <tr><td>Subtotal:</td><td class="r">${formatCurrency(order.subtotal)}</td></tr>
    ${order.discount_amount > 0 ? `<tr><td>Discount${order.discount_reason ? ` (${order.discount_reason})` : ""}:</td><td class="r">-${formatCurrency(order.discount_amount)}</td></tr>` : ""}
    ${order.service_charge && order.service_charge > 0 ? `<tr><td>Service Charge:</td><td class="r">${formatCurrency(order.service_charge)}</td></tr>` : ""}
    <tr><td>Sales Tax (16% PRA):</td><td class="r">${formatCurrency(order.tax_amount)}</td></tr>
  </table>

  <div class="dbl"></div>
  <table><tr class="total-row"><td>TOTAL:</td><td class="r">${formatCurrency(order.total_amount)}</td></tr></table>
  <div class="dbl"></div>

  <table>
    ${order.payment_method ? `<tr><td>Payment:</td><td class="r">${order.payment_method.replace("_", " ")}</td></tr>` : ""}
    ${paymentInfo}
  </table>

  <div class="dash"></div>

  <div class="footer">
    <div class="thanks">Thank you for stopping by! ☕</div>
    <div>"Good coffee takes time, but great memories last forever."</div>
    <br>
    <div>FBR / PRA POS Invoice</div>
    <div>Printed: ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}</div>
    <br>
    <div>--- Rewind Café ---</div>
  </div>
</body>
</html>`;

  try {
    let iframe = document.getElementById("rewind-print-frame") as HTMLIFrameElement;
    if (!iframe) {
      iframe = document.createElement("iframe");
      iframe.id = "rewind-print-frame";
      iframe.style.position = "fixed";
      iframe.style.right = "-9999px";
      iframe.style.bottom = "-9999px";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);
    }

    const doc = iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        } catch (e) {
          console.warn("Iframe print invoke failed:", e);
        }
      }, 250);
      return true;
    }
  } catch (err) {
    console.error("Universal print error:", err);
  }

  return false;
}

// ─── Public Auto-Print API ───────────────────────────────────────────

/**
 * Universal auto-print function for completed orders.
 * 1. Checks if a hardware ESC/POS printer is active and sends binary buffer.
 * 2. If not, cleanly triggers universal invisible iframe print (never blocked by popup blocker).
 */
export async function autoPrintReceipt(order: LocalOrder): Promise<"escpos" | "browser" | "failed"> {
  const settings = getPrinterSettings();

  // Try direct ESC/POS hardware print first
  if (settings.preferHardwareDirect && (printerType === "webusb" || printerType === "webserial")) {
    const buffer = buildReceiptBuffer(order, settings);
    const sent = await sendRawBuffer(buffer);
    if (sent) {
      console.log(`Receipt #${order.order_number} printed via hardware ${printerType}`);
      return "escpos";
    }
  }

  // Fallback to Universal Iframe Print
  const success = triggerUniversalPrint(order, settings);
  return success ? "browser" : "failed";
}

/** Print a test ticket to verify printer alignment & cutter */
export async function printTestReceipt(): Promise<boolean> {
  const dummyOrder: LocalOrder = {
    id: "test-" + Date.now(),
    order_number: "TEST-01",
    customer_id: undefined,
    customer_name: "Printer Test Customer",
    customer_phone: "0300-1234567",
    cashier_id: "test",
    cashier_name: "Manager",
    order_type: "DINE_IN",
    status: "PAID",
    table_number: "01",
    items: [
      {
        item_id: "test-1",
        item_name: "Caramel Macchiato",
        variant_name: "Large",
        unit_price: 680,
        quantity: 2,
        discount_amount: 0,
        total_price: 1360,
        station_type: "BAR",
        selected_modifiers: [{ modifier_name: "Oat Milk", price_add: 120 }],
      },
      {
        item_id: "test-2",
        item_name: "Butter Croissant",
        unit_price: 450,
        quantity: 1,
        discount_amount: 0,
        total_price: 450,
        station_type: "KITCHEN",
      },
    ],
    subtotal: 1810,
    discount_amount: 100,
    discount_reason: "Test Promo",
    tax_amount: 273.6,
    service_charge: 0,
    total_amount: 1983.6,
    payment_method: "CASH",
    amount_tendered: 2000,
    change_returned: 16.4,
    created_at: new Date().toISOString(),
    synced: 1,
  };

  const result = await autoPrintReceipt(dummyOrder);
  return result !== "failed";
}
