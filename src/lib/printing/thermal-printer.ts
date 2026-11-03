/**
 * ESC/POS Thermal Printer Engine for Rewind Café POS
 * ---------------------------------------------------
 * Generates ESC/POS binary command buffers for 80mm (or 58mm) thermal printers.
 * Supports WebUSB and WebSerial for direct browser-to-printer communication.
 * Falls back to window.print() for network/USB printers with system driver.
 *
 * ESC/POS Reference: Epson ESC/POS Application Programming Guide
 */

import { type LocalOrder } from "@/lib/db/dexie";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

// ─── ESC/POS Constants ───────────────────────────────────────────────
const ESC = 0x1b;
const GS = 0x1d;
const LF = 0x0a;

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
  UNDERLINE_ON: [ESC, 0x2d, 0x01],
  UNDERLINE_OFF: [ESC, 0x2d, 0x00],
  CUT_PAPER: [GS, 0x56, 0x00], // Full cut
  CUT_PARTIAL: [GS, 0x56, 0x01], // Partial cut
  FEED_LINES: (n: number) => [ESC, 0x64, n],
  OPEN_DRAWER: [ESC, 0x70, 0x00, 0x19, 0xfa], // Kick drawer pin 2
  BEEP: [ESC, 0x42, 0x03, 0x02], // Beep 3 times
};

// 80mm = 48 chars per line (monospace); 58mm = 32 chars
const LINE_WIDTH = 48;

// ─── Text Helpers ────────────────────────────────────────────────────

function textEncoder(text: string): Uint8Array {
  return new TextEncoder().encode(text);
}

function padLine(left: string, right: string, width = LINE_WIDTH): string {
  const gap = width - left.length - right.length;
  if (gap <= 0) return left.slice(0, width - right.length - 1) + " " + right;
  return left + " ".repeat(gap) + right;
}

function centerText(text: string, width = LINE_WIDTH): string {
  const pad = Math.max(0, Math.floor((width - text.length) / 2));
  return " ".repeat(pad) + text;
}

function dashedLine(width = LINE_WIDTH): string {
  return "-".repeat(width);
}

function doubleLine(width = LINE_WIDTH): string {
  return "=".repeat(width);
}

// ─── Build ESC/POS Receipt Buffer ────────────────────────────────────

export function buildReceiptBuffer(order: LocalOrder): Uint8Array {
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

  // Initialize
  cmd(CMD.INIT);

  // ── Header ──
  cmd(CMD.ALIGN_CENTER, CMD.DOUBLE_SIZE, CMD.BOLD_ON);
  line("REWIND CAFE");
  cmd(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
  line("Artisan Coffee & Bakery");
  line("DHA Phase 5, Karachi");
  line("Tel: 0300-REWIND1");
  line("STRN: 3277876123 | NTN: 8912440-1");
  cmd(CMD.ALIGN_LEFT);
  line(doubleLine());

  // ── Order Info ──
  cmd(CMD.BOLD_ON);
  line(padLine(`Order: #${order.order_number}`, order.order_type.replace("_", " ")));
  cmd(CMD.BOLD_OFF);
  line(padLine(`Date: ${formatDate(order.created_at)}`, formatTime(order.created_at)));
  line(padLine(`Cashier: ${(order.cashier_name || "Staff").split(" ")[0]}`, order.table_number ? `Table: ${order.table_number}` : "Counter"));
  if (order.customer_name || order.customer_phone) {
    line(`Customer: ${order.customer_name || ""} ${order.customer_phone ? `(${order.customer_phone})` : ""}`);
  }
  line(dashedLine());

  // ── Column Headers ──
  cmd(CMD.BOLD_ON);
  line(padLine("Item", "Amount"));
  cmd(CMD.BOLD_OFF);
  line(dashedLine());

  // ── Line Items ──
  for (const item of order.items) {
    const itemLine = `${item.quantity}x ${item.item_name}`;
    const priceLine = formatCurrency(item.total_price).replace("₨ ", "");
    line(padLine(itemLine, priceLine));

    if (item.variant_name) {
      line(`   Size: ${item.variant_name}`);
    }
    if (item.selected_modifiers && item.selected_modifiers.length > 0) {
      for (const mod of item.selected_modifiers) {
        if (mod.price_add > 0) {
          line(padLine(`   + ${mod.modifier_name}`, `+${formatCurrency(mod.price_add).replace("₨ ", "")}`));
        } else {
          line(`   + ${mod.modifier_name}`);
        }
      }
    }
    if (item.notes) {
      line(`   Note: ${item.notes}`);
    }
  }

  line(dashedLine());

  // ── Totals ──
  const subtotalStr = formatCurrency(order.subtotal).replace("₨ ", "");
  line(padLine("Subtotal:", subtotalStr));

  if (order.discount_amount > 0) {
    const discStr = `-${formatCurrency(order.discount_amount).replace("₨ ", "")}`;
    line(padLine(`Discount${order.discount_reason ? ` (${order.discount_reason})` : ""}:`, discStr));
  }

  if (order.service_charge && order.service_charge > 0) {
    line(padLine("Service Charge:", formatCurrency(order.service_charge).replace("₨ ", "")));
  }

  line(padLine("Sales Tax (16% PRA):", formatCurrency(order.tax_amount).replace("₨ ", "")));

  line(doubleLine());
  cmd(CMD.DOUBLE_WIDTH, CMD.BOLD_ON);
  line(padLine("TOTAL:", `Rs ${formatCurrency(order.total_amount).replace("₨ ", "")}`, Math.floor(LINE_WIDTH / 2)));
  cmd(CMD.NORMAL_SIZE, CMD.BOLD_OFF);
  line(doubleLine());

  // ── Payment Info ──
  if (order.payment_method) {
    line(padLine("Payment:", order.payment_method.replace("_", " ")));
  }
  if (order.amount_tendered && order.amount_tendered > 0) {
    line(padLine("Tendered:", formatCurrency(order.amount_tendered).replace("₨ ", "")));
    line(padLine("Change:", formatCurrency(order.change_returned || 0).replace("₨ ", "")));
  }

  line(dashedLine());

  // ── Footer ──
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

  // Feed and cut
  cmd(CMD.FEED_LINES(4));
  cmd(CMD.CUT_PARTIAL);

  // Open cash drawer on cash payments
  if (order.payment_method === "CASH") {
    cmd(CMD.OPEN_DRAWER);
  }

  // Merge all parts into single buffer
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

// ─── Printer Connection & Sending ────────────────────────────────────

interface PrinterConnection {
  type: "webusb" | "webserial" | "none";
  device?: any; // USBDevice (WebUSB API — not in default TS lib)
  port?: any;   // SerialPort (WebSerial API — not in default TS lib)
}

let activePrinter: PrinterConnection = { type: "none" };

/** Try to connect to a USB thermal printer via WebUSB */
export async function connectWebUSB(): Promise<boolean> {
  try {
    if (!("usb" in navigator)) return false;
    const device = await (navigator as any).usb.requestDevice({
      filters: [
        { classCode: 7 }, // Printer class
      ],
    });
    await device.open();
    if (device.configuration === null) {
      await device.selectConfiguration(1);
    }
    await device.claimInterface(0);
    activePrinter = { type: "webusb", device };
    console.log("WebUSB printer connected:", device.productName);
    return true;
  } catch (err) {
    console.log("WebUSB connection skipped:", err);
    return false;
  }
}

/** Try to connect to a serial thermal printer via WebSerial */
export async function connectWebSerial(): Promise<boolean> {
  try {
    if (!("serial" in navigator)) return false;
    const port = await (navigator as any).serial.requestPort();
    await port.open({ baudRate: 9600 });
    activePrinter = { type: "webserial", port };
    console.log("WebSerial printer connected");
    return true;
  } catch (err) {
    console.log("WebSerial connection skipped:", err);
    return false;
  }
}

/** Send raw ESC/POS buffer to connected printer */
async function sendToPrinter(data: Uint8Array): Promise<boolean> {
  try {
    if (activePrinter.type === "webusb" && activePrinter.device) {
      const endpoint = activePrinter.device.configuration?.interfaces[0]?.alternate?.endpoints.find(
        (e: any) => e.direction === "out"
      );
      if (endpoint) {
        await activePrinter.device.transferOut(endpoint.endpointNumber, data);
        return true;
      }
    }

    if (activePrinter.type === "webserial" && activePrinter.port) {
      const writer = activePrinter.port.writable?.getWriter();
      if (writer) {
        await writer.write(data);
        writer.releaseLock();
        return true;
      }
    }
  } catch (err) {
    console.error("Printer send error:", err);
  }
  return false;
}

/** Check if a direct hardware printer is connected */
export function isPrinterConnected(): boolean {
  return activePrinter.type !== "none";
}

/** Get printer connection type */
export function getPrinterType(): string {
  return activePrinter.type;
}

// ─── Public Auto-Print API ───────────────────────────────────────────

/**
 * Auto-print a receipt for a completed order.
 * Attempts ESC/POS direct print first, falls back to browser window.print().
 */
export async function autoPrintReceipt(order: LocalOrder): Promise<"escpos" | "browser" | "skipped"> {
  // 1. Try direct ESC/POS printing
  if (activePrinter.type !== "none") {
    const buffer = buildReceiptBuffer(order);
    const sent = await sendToPrinter(buffer);
    if (sent) {
      console.log(`Receipt ${order.order_number} sent to ${activePrinter.type} printer`);
      return "escpos";
    }
  }

  // 2. Fall back to browser print dialog with receipt-optimized CSS
  try {
    triggerBrowserPrint(order);
    return "browser";
  } catch {
    return "skipped";
  }
}

/**
 * Opens a clean thermal-receipt-sized print window.
 */
function triggerBrowserPrint(order: LocalOrder) {
  const itemsHtml = order.items
    .map((item) => {
      let html = `<tr><td>${item.quantity}x ${item.item_name}${item.variant_name ? ` (${item.variant_name})` : ""}</td><td class="r">${formatCurrency(item.total_price)}</td></tr>`;
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

  const paymentInfo = order.amount_tendered && order.amount_tendered > 0
    ? `<tr><td>Tendered:</td><td class="r">${formatCurrency(order.amount_tendered)}</td></tr>
       <tr><td>Change:</td><td class="r">${formatCurrency(order.change_returned || 0)}</td></tr>`
    : "";

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Receipt #${order.order_number}</title>
<style>
  @page { size: 80mm auto; margin: 2mm; }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Courier New', monospace; font-size: 11px; width: 76mm; color: #000; }
  .center { text-align: center; }
  .r { text-align: right; }
  .b { font-weight: bold; }
  .big { font-size: 16px; font-weight: 900; letter-spacing: 2px; }
  .sm { font-size: 9px; color: #555; }
  .dash { border-top: 1px dashed #000; margin: 4px 0; }
  .dbl { border-top: 2px solid #000; margin: 4px 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 1px 0; vertical-align: top; }
  .mod td { font-size: 9px; color: #555; }
  .total-row td { font-size: 14px; font-weight: 900; padding: 4px 0; }
  .footer { margin-top: 8px; font-size: 9px; text-align: center; color: #555; }
  .footer .thanks { font-size: 11px; font-weight: bold; color: #000; }
</style>
</head>
<body onload="window.print();window.close();">
  <div class="center">
    <div class="big">REWIND CAFÉ</div>
    <div class="sm">Artisan Coffee & Bakery</div>
    <div class="sm">DHA Phase 5, Karachi</div>
    <div class="sm">Tel: 0300-REWIND1</div>
    <div class="sm">STRN: 3277876123 | NTN: 8912440-1</div>
  </div>
  <div class="dbl"></div>
  <table>
    <tr class="b"><td>Order: #${order.order_number}</td><td class="r">${order.order_type.replace("_", " ")}</td></tr>
    <tr><td>Date: ${formatDate(order.created_at)}</td><td class="r">${formatTime(order.created_at)}</td></tr>
    <tr><td>Cashier: ${(order.cashier_name || "Staff").split(" ")[0]}</td><td class="r">${order.table_number ? `Table: ${order.table_number}` : "Counter"}</td></tr>
    ${order.customer_name ? `<tr><td colspan="2">Customer: ${order.customer_name} ${order.customer_phone ? `(${order.customer_phone})` : ""}</td></tr>` : ""}
  </table>
  <div class="dash"></div>
  <table>
    <tr class="b"><td>Item</td><td class="r">Amount</td></tr>
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
    <div class="thanks">Thank you for stopping by!</div>
    <div>"Good coffee takes time, but great memories last forever."</div>
    <br>
    <div>FBR / PRA POS Invoice</div>
    <div>Printed: ${new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" })}</div>
    <br>
    <div>--- Rewind Café ---</div>
  </div>
</body>
</html>`;

  const printWindow = window.open("", "_blank", "width=350,height=600");
  if (printWindow) {
    printWindow.document.write(html);
    printWindow.document.close();
  }
}
