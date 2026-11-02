Rewind Café POS — PRD \& Master Prompt

Nov 2, 2026 · @omny

1\. Product overview

Rewind POS is a web-based, offline-first point of sale and café management suite that a new cashier can use after a 10-minute walkthrough, and that the owner can run the whole business from: sales, kitchen, stock, suppliers, staff, money and customers.

Vision. One beautiful, calm app that replaces the register, the stock notebook, the attendance register and the accounting spreadsheet. If a feature needs a manual to understand, it is redesigned until it doesn't.

Goals

• Take an order and payment in under 15 seconds for a regular 2–3 item ticket.

• Keep selling with zero internet for a full day, then sync without losing or duplicating a single order.

• Give the owner a live picture of sales, profit, stock and staff from one dashboard, on phone or laptop.

• Make every screen usable by someone who has never used a computer POS (big tap targets, pictures, plain words, Urdu/English).

In scope (v1): POS \& billing, menu with images and modifiers, kitchen display, tables and order types, inventory with recipes, vendors and purchasing, HR (staff, shifts, attendance, payroll), accounting (cash, expenses, P\&L, tax), customers and loyalty, reports, roles and settings, offline sync, multi-device.

Out of scope (v1): multi-brand franchise management, third-party delivery app integrations (planned v2), native mobile apps (the web app is an installable PWA instead).

Success metrics

Metric

Target

Time to train a new cashier

≤ 10 minutes

Average order entry time

≤ 15 seconds

Orders lost or duplicated during offline sync

0

Stock variance (system vs counted)

≤ 2% weekly

Owner can see today's sales and profit

≤ 2 taps from login

Lighthouse performance / accessibility score

≥ 90 / ≥ 95

2\. Users and roles

Six roles cover the café; each sees only the screens it needs, so a cashier's app looks simple while the owner's app is complete.

Role

Who

Main screens

Key permissions

Owner / Admin

Café owner

Everything, dashboard first

All settings, delete, refunds, payroll, accounting

Manager

Shift or floor manager

Dashboard, POS, inventory, staff, reports

Discounts above limit, voids, approve purchases, close day

Cashier

Counter staff

POS, open orders, customer lookup

Take orders and payments; discounts up to set limit

Waiter

Floor staff (tablet/phone)

Tables, order taking

Open/transfer tables, send to kitchen, request bill

Barista / Kitchen

Bar and kitchen staff

Kitchen Display (KDS)

Mark items preparing/ready, mark out-of-stock

Accountant

Part-time or external

Accounting, reports, vendors

Read-only sales; record expenses and payments

Personas

• Ali, cashier, 19. First job, uses a smartphone daily, never used a POS. Needs pictures, big buttons, and no way to break anything.

• Sana, manager. Runs the morning shift, handles stock deliveries and staff issues. Needs quick approvals and low-stock alerts.

• Owner. Not always on site. Wants to check sales, cash and staff attendance from their phone, and trust the numbers.

Every staff member logs in with a 4–6 digit PIN on a shared device (fast switching between staff), plus email/password for owner and manager on the web dashboard. Custom roles can be created by ticking permissions.

3\. Design language and ease of use

The look is "warm retro café": cream paper, espresso brown and a single vintage-orange accent, with soft rounded cards and real food photography, so the POS feels like part of the café rather than office software.

Visual system

Token

Light theme

Dark theme

Use

Background

Cream #F7F1E8

Espresso #1E1714

App canvas

Surface

White #FFFFFF

\#2A211D

Cards, panels

Primary text

Espresso #2B1E18

Cream #F3EADF

Body and labels

Accent

Vintage orange #E07A3F

\#F08A4B

Main buttons, selected items

Secondary

Sage green #7C9A7E

\#8FB091

Success, ready, paid

Warning / danger

Mustard #D9A441 / Brick #C2453B

same, brighter

Low stock / void, delete

• Type: a friendly display serif for headings (e.g. Fraunces) and a clean sans for UI (e.g. Inter). Minimum 16 px body, 20 px on POS buttons.

• Shape: 16 px corner radius, soft shadows, generous spacing (8-point grid).

• Imagery: every menu item has a photo; empty states use small hand-drawn café illustrations; a subtle cassette/vinyl "Rewind" motif in the logo and loading spinner.

• Motion: 150–250 ms ease-out; item "drops" into the cart; a satisfying check animation on payment. Respect reduced-motion settings.

• Light and dark theme, switchable per device (dark for evening service).

Ease-of-use rules (non-negotiable)

1\. Tap targets ≥ 48 px, POS item tiles ≥ 120 px with picture, name and price.

2\. Any common task in ≤ 3 taps; the POS never needs a keyboard for a normal order.

3\. Plain words, no jargon: "Money in drawer", not "Cash float reconciliation".

4\. Icons always paired with a text label.

5\. Every destructive action has an undo (5-second toast) or a manager PIN, never a dead end.

6\. Guided first-run setup wizard (café name, logo, menu import, staff, tax) and interactive tooltips on first use of each screen.

7\. Bilingual English / Urdu with right-to-left support; currency PKR by default, configurable.

8\. Big, friendly empty states that tell you what to do next ("No vendors yet — add your milk supplier").

9\. Global search (Ctrl/⌘ K) across items, orders, customers, vendors and staff.

10\. Works on a 10-inch tablet, a laptop and a touchscreen monitor; dashboard also works on phone.

11\. WCAG 2.2 AA contrast and keyboard navigation.

4\. Feature modules

Twelve modules share one database; P1 = must ship in v1, P2 = v1.x, P3 = later.

4.1 POS and billing (P1)

• Picture-tile menu grid with category tabs (Hot Coffee, Cold Drinks, Tea, Bakery, Breakfast, Sandwiches, Desserts) and a "Favourites / Best sellers" tab.

• Order types: Dine-in (pick table), Takeaway, Delivery (customer + address + rider), Pre-order / scheduled.

• Modifiers and variants: size (S/M/L), milk type, sugar level, extra shot, syrups, toppings, with price add-ons; required vs optional modifier groups; item notes ("less ice").

• Combos and deals (e.g. "Breakfast Combo"), happy-hour pricing by time, buy-X-get-Y.

• Cart: edit quantity, swipe to remove, per-item and whole-order discount (% or amount, with reason), service charge, tax auto-calculated.

• Hold / park orders, recall, merge and split bills (by item, by seat, equal split).

• Payments: cash (with quick-cash buttons and change due), card (manual or integrated terminal), JazzCash / Easypaisa / bank transfer / QR, gift card, customer credit (tab), split payment across methods, tips.

• Receipts: thermal print (58/80 mm, ESC/POS), digital receipt by WhatsApp/SMS/email, QR on receipt for feedback; reprint any receipt.

• Refunds and voids with manager PIN and reason; full audit trail.

• Quick customer lookup by phone number to apply loyalty.

• FBR / PRA tax-invoice integration hook (invoice number and QR) — configurable per province.

• Cash drawer: open with float, cash in/out entries (e.g. "bought milk 500"), close with denomination count, expected vs actual, variance report (X/Z reports).

4.2 Menu management (P1)

• Add items with photo upload (auto crop/compress, or pick from a built-in stock-photo library), name, description, price, category, tax rate, colour tag, dietary tags (veg, contains nuts).

• Variants, modifier groups, combos; drag-and-drop to reorder.

• Availability: toggle "sold out" instantly; schedule items (breakfast till 12 pm); per-order-type pricing.

• Link each item to a recipe (see Inventory) to auto-calculate food cost and margin.

• Bulk import/export via Excel/CSV.

4.3 Kitchen and bar display — KDS (P1)

• Orders appear instantly on bar and kitchen screens, routed by station (coffee to bar, food to kitchen).

• Ticket cards colour-coded by waiting time (green < 5 min, amber 5–10, red > 10); sound alert on new order.

• Tap to mark item preparing → ready; "order ready" notifies the cashier/waiter and optional customer screen ("Order #42 ready").

• Kitchen printer fallback for cafés without a screen.

4.4 Tables and floor (P1)

• Visual floor plan editor (drag tables, sizes, areas: indoor, outdoor, rooftop).

• Table status at a glance: free, occupied (with time and amount), bill requested, reserved.

• Transfer, merge, split tables; guest count; assign waiter.

• Reservations with name, phone, time, party size (P2).

• QR table ordering: customer scans, browses menu with photos, orders to the POS (P2).

4.5 Inventory and recipes (P1)

• Stock items (raw materials) with units and conversions (kg ↔ g, litre ↔ ml, pack of 12).

• Recipes / bill of materials: e.g. Latte (M) = 18 g coffee + 200 ml milk + 1 cup + 1 lid; stock auto-deducts on every sale, including modifiers (oat milk replaces milk).

• Multiple storage locations (main store, bar fridge, kitchen).

• Low-stock alerts and reorder level; suggested purchase list.

• Stock count (full or spot check) on tablet, variance report, wastage logging with reason (expired, spilled, staff meal).

• Batch and expiry tracking for dairy and bakery; FIFO; "expiring in 2 days" alert.

• Prep items / semi-finished goods (e.g. cold brew batch, sugar syrup) produced from raw materials.

• Stock valuation (weighted average cost) and food-cost % per item.

4.6 Vendors and purchasing (P1)

• Vendor directory: name, contact, WhatsApp, items supplied, payment terms, notes, rating.

• Purchase orders: create from low-stock suggestions, send by WhatsApp/email/PDF.

• Goods received note (GRN): receive full/partial delivery, enter actual price and expiry, stock updates automatically.

• Vendor bills, partial payments, outstanding balance (payables) and ageing; vendor ledger.

• Price history per item to spot increases; compare vendors.

• Returns to vendor.

4.7 HR and staff (P1 basics, P2 payroll)

• Staff profiles: photo, CNIC, contact, role, salary type (monthly/hourly), joining date, documents.

• Clock in / clock out with PIN (optional selfie and device-location check); break tracking.

• Shift scheduling with drag-and-drop weekly roster; shift swap requests.

• Attendance calendar, late arrivals, overtime, leave requests and approvals.

• Payroll: auto-calculate salary from attendance, overtime, advances, deductions, bonuses and shared tips; payslips (PDF/WhatsApp); payroll posts to accounting.

• Staff performance: sales per cashier, average ticket, voids and discounts given.

4.8 Accounting and finance (P1 basics, P2 full)

• Automatic posting: every sale, refund, purchase, expense and payroll creates journal entries in the background — the owner never needs to know double-entry.

• Chart of accounts with café defaults (Cash, Bank, JazzCash, Sales, COGS, Rent, Utilities, Salaries…).

• Expenses with categories, receipt photo, recurring expenses (rent, internet).

• Cash book, bank book, accounts receivable (customer tabs/corporate), accounts payable (vendors).

• Daily closing summary; bank reconciliation (P2).

• Reports: Profit \& Loss, balance sheet, trial balance, cash flow, tax (sales tax collected), expense breakdown.

• Export to Excel/PDF; QuickBooks / Xero export (P3).

4.9 Customers, loyalty and marketing (P2)

• Customer profiles by phone: visits, spend, favourite items, birthday.

• Loyalty: points per PKR spent or stamp card ("10th coffee free"); tiers; points redemption at POS.

• Gift cards and store credit; customer tabs with credit limit.

• Promo codes and vouchers; birthday auto-offer.

• Feedback via receipt QR (1–5 stars + comment) feeding the dashboard.

• Campaigns by SMS/WhatsApp to segments ("not visited in 30 days").

4.10 Dashboard and reports (P1)

• Home dashboard: today's sales, orders, average ticket, profit estimate, top items, sales by hour, payment mix, live open orders, low-stock and alerts — with comparison to same day last week.

• Reports: sales by item/category/hour/day/staff/order type/payment, discounts and voids, item profitability (menu engineering: stars, puzzles, plowhorses, dogs), inventory usage and variance, purchases, attendance and payroll, P\&L.

• Date range picker, filters, charts plus tables, export to PDF/Excel, scheduled daily summary on WhatsApp/email to the owner.

4.11 Online ordering and integrations (P2–P3)

• Branded web ordering page and QR menu sharing the same menu and stock.

• Delivery app integrations (Foodpanda etc.) via aggregator API (P3).

• Hardware: thermal receipt printers (USB/LAN/Bluetooth), cash drawer, barcode scanner, customer-facing display, card terminals.

• Open REST API and webhooks (P3).

4.12 Settings, security and audit (P1)

• Café profile: name "Rewind", logo, address, tax numbers, receipt header/footer, currency, language, time zone.

• Taxes (inclusive/exclusive, per item), service charge, rounding rules.

• Roles and permissions matrix; discount limits per role.

• Devices: register terminals, assign printers and KDS stations.

• Full audit log (who did what, when, on which device) for voids, refunds, price changes, stock adjustments, cash drawer.

• Automatic daily cloud backup; one-click restore; data export.

• Multi-branch ready data model (single branch in v1).

5\. Offline-first and sync

Every device keeps a full local copy of what it needs and writes there first, so the café keeps selling through internet and power-backup outages; the cloud is where devices meet, not a requirement to sell.

How it works

1\. The app is a PWA: the app shell, menu, images, customers and open orders are cached on the device (Service Worker + IndexedDB).

2\. Every write (order, payment, stock movement, clock-in) is saved locally first with a client-generated UUID and timestamp, then placed in an outbox queue.

3\. When online, the outbox syncs to the server in order; the server acknowledges each record (idempotent — sending the same UUID twice never creates a duplicate).

4\. The server pushes changes from other devices in real time (WebSocket); devices pull missed changes using a "changes since" cursor.

5\. Local LAN mode (P2): when the internet is down, devices on the same Wi-Fi sync through a designated hub device, so the KDS still receives orders.

Rules that keep data correct

• Orders, payments and stock movements are append-only events — never overwritten — so merging is safe.

• Order numbers offline use a device prefix (e.g. T1-0042) to stay unique; a sequential tax-invoice number is issued on sync if FBR/PRA requires it.

• Conflicts on editable records (menu price, customer details) use last-write-wins per field, with the overwritten value kept in history; conflicts on stock never block a sale (stock may go negative and is flagged).

• Card/online payments that need the internet show a clear "offline — take cash or record as pending" path.

What the user sees: a small status pill — green "Online", amber "Offline · 12 orders waiting to sync", blue "Syncing…" — and nothing else changes. Manager can view the sync queue and retry failed items.

6\. Technical architecture and data model

Rewind POS is a TypeScript monorepo: a Next.js PWA on every device with its own local database, talking to a Node/PostgreSQL cloud that stores the truth and fans changes out in real time.

The POS terminal is the one device that must never stop; the cloud and external services make it richer but are never on the path of a cash sale.

Stack

Layer

Choice

Frontend

Next.js + React + TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Recharts

State and data

TanStack Query, Zustand, react-hook-form + zod

Offline

PWA service worker (Serwist/Workbox), Dexie.js on IndexedDB, outbox queue, UUIDv7 ids

Backend

Node.js with NestJS, REST API + Socket.IO, Redis (BullMQ) for jobs

Database

PostgreSQL with Prisma ORM

Storage

S3-compatible bucket for images and PDFs, CDN in front

Hosting

Vercel (frontend) + Railway/Render/AWS (API, DB, Redis)

Testing

Vitest, Playwright, GitHub Actions CI

Core data model (every table also has id, tenant\_id, branch\_id, created\_at, updated\_at, deleted\_at, version, device\_id)

Area

Main tables

Setup and access

tenants, branches, users, roles, permissions, devices, settings

Menu

categories, items, item\_variants, modifier\_groups, modifiers, combos, combo\_items, item\_images

Sales

orders, order\_items, order\_item\_modifiers, payments, refunds, discounts, receipts, tables, floor\_areas, reservations

Kitchen

kds\_stations, kds\_tickets, ticket\_events

Cash

cash\_sessions, cash\_movements, denomination\_counts

Inventory

stock\_items, units, unit\_conversions, locations, recipes, recipe\_lines, stock\_movements, stock\_batches, stock\_counts, wastage

Purchasing

vendors, vendor\_items, purchase\_orders, po\_lines, goods\_receipts, gr\_lines, vendor\_bills, vendor\_payments

HR

staff\_profiles, shifts, attendance\_events, leave\_requests, payroll\_runs, payslips, advances

Accounting

accounts, journal\_entries, journal\_lines, expenses, expense\_categories, bank\_accounts

Customers

customers, loyalty\_ledger, gift\_cards, promo\_codes, feedback

System

sync\_outbox (client), sync\_cursors, audit\_logs, notifications

7\. Non-functional requirements

Area

Requirement

Speed

POS screen interactive < 2 s on a mid-range tablet; add-to-cart < 100 ms; reports < 3 s for a year of data

Offline

Full POS, KDS (LAN mode) and clock-in work offline for ≥ 24 h; zero data loss on sync

Availability

Cloud API 99.9% monthly uptime

Security

HTTPS everywhere, hashed PINs/passwords, JWT with refresh, role-based access on every API call, row-level tenant isolation, rate limiting

Privacy

Customer and staff data encrypted at rest; staff CNIC visible to owner only; data export and delete on request

Audit

Immutable log for money, stock and permission changes, kept ≥ 2 years

Backup

Automated daily backups, 30-day retention, tested restore

Devices

Chrome/Edge latest 2 versions, Android tablets, iPad Safari, Windows touch PCs; 768 px and up for POS, 360 px for dashboard

Accessibility

WCAG 2.2 AA; full keyboard support on desktop

Localisation

English and Urdu (RTL), PKR default, configurable tax and date formats

Quality

≥ 80% unit-test coverage on billing, tax, stock and sync logic; end-to-end tests for order → payment → stock → report

Scalability

Supports 1 café with 10 devices in v1; schema ready for multi-branch

8\. Release phases

Build in four phases so a working, sellable POS exists after phase 1 and every later phase adds a full module rather than half of everything. Durations assume a small team (2–4 developers) and are estimates.

1\. Phase 1 — Core POS (≈ 4 weeks): auth + PIN login, roles, menu with images and modifiers, POS billing, cash/manual card payments, receipts, tables, KDS, cash drawer open/close, basic dashboard, offline queue + sync. Gate: a full café shift runs on it, including 1 hour with Wi-Fi off.

2\. Phase 2 — Back office (≈ 4 weeks): inventory with recipes and auto-deduction, stock counts and wastage, vendors, purchase orders, GRN, vendor payables, expenses, core reports. Gate: weekly stock variance ≤ 2%.

3\. Phase 3 — People and money (≈ 4 weeks): staff profiles, attendance, shifts, leave, payroll, automatic accounting entries, P\&L, cash/bank books, tax report. Gate: one month of payroll and P\&L matches manual records.

4\. Phase 4 — Growth (≈ 4 weeks): customers and loyalty, gift cards, QR table ordering, online ordering page, WhatsApp receipts and campaigns, menu engineering, LAN sync mode, FBR/PRA integration. Gate: loyalty and QR ordering used by real customers for 2 weeks.

For a university project timeline, Phase 1 + inventory from Phase 2 is a strong, demo-able scope; the rest can be shown as designed screens and roadmap.

9\. Master build prompt

Paste the prompt below into an AI coding tool (Claude Code, Cursor, Lovable, Bolt, v0) at the start of the project, then ask it to build one phase at a time — e.g. "Build Phase 1, module 4.1" — so it doesn't try everything at once.

\# ROLE

You are a senior full-stack engineer and product designer. Build "Rewind POS": a production-quality, web-based, offline-first POS and café management system for a café called \*\*Rewind\*\*. Follow this brief exactly. Ask me before changing scope.



\# PRODUCT PRINCIPLES

1\. A first-time cashier with no POS experience must take an order and payment in under 15 seconds after a 10-minute walkthrough.

2\. Beautiful, warm "retro café" aesthetic: cream #F7F1E8 background, espresso #2B1E18 text, vintage-orange #E07A3F accent, sage #7C9A7E for success, mustard #D9A441 warning, brick #C2453B danger. Dark theme (espresso #1E1714 base). Fonts: Fraunces (headings), Inter (UI). 16px radius, soft shadows, 8pt grid, 150–250ms ease-out animations, respect prefers-reduced-motion.

3\. Every menu item shows a photo. Tap targets >= 48px; POS tiles >= 120px. Icons always have text labels. Plain words, no jargon.

4\. Any common task in <= 3 taps. Every destructive action has undo or manager PIN.

5\. Offline-first: the POS, KDS and clock-in must work with no internet and sync later with zero lost or duplicated records.

6\. English + Urdu (RTL). Currency PKR (configurable). Time zone Asia/Karachi.

7\. WCAG 2.2 AA. Responsive: tablet/desktop POS (>= 768px), phone-friendly dashboard (>= 360px).



\# TECH STACK

\- Frontend: Next.js (App Router) + React + TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, Lucide icons, Recharts, TanStack Query, Zustand, react-hook-form + zod, next-intl.

\- Offline: PWA (Service Worker via Serwist/Workbox), IndexedDB via Dexie.js as local DB; outbox queue; client UUIDv7 ids.

\- Backend: Node.js (NestJS or Next.js route handlers) + TypeScript, PostgreSQL with Prisma, Redis for queues/cache, WebSockets (Socket.IO) for realtime.

\- Auth: email/password for owner/manager + 4–6 digit staff PIN on registered devices; JWT access + refresh; RBAC checked on every API call.

\- Files: S3-compatible storage for images with automatic resize/WebP.

\- Printing: ESC/POS thermal printing via WebUSB/WebSerial or local print bridge; PDF receipts fallback.

\- Testing: Vitest (unit), Playwright (e2e). CI with lint, type-check, tests.

\- Every table has: id (UUID), tenant\_id, branch\_id, created\_at, updated\_at, deleted\_at (soft delete), version, device\_id.



\# ROLES

Owner/Admin, Manager, Cashier, Waiter, Barista/Kitchen, Accountant, plus custom roles from a permission matrix. Discount limits per role. Cashier UI shows only POS, open orders and customer lookup.



\# MODULES (build in this order)

\## Phase 1 — Core POS

\- Setup wizard: café name, logo, address, tax, currency, language, first staff, menu import (CSV) or sample Rewind menu with photos.

\- Menu: categories, items with photo, price, tax, variants (S/M/L), modifier groups (milk, sugar, extra shot, syrups) with price add-ons, required/optional, combos, sold-out toggle, scheduled availability, drag to reorder.

\- POS: picture-tile grid, category tabs, favourites, search; order types Dine-in/Takeaway/Delivery; cart with qty, notes, item \& order discounts (with reason), service charge, tax; hold/recall; split \& merge bills; payments: cash with quick-cash buttons + change, card (manual), JazzCash/Easypaisa/bank/QR, split payment, tips; thermal + WhatsApp/SMS/email receipts; refunds/voids need manager PIN + reason.

\- Tables: drag-and-drop floor plan editor, live table status, transfer/merge/split, assign waiter.

\- KDS: realtime tickets routed by station (bar/kitchen), colour by wait time (green <5m, amber 5–10m, red >10m), sound on new order, tap preparing → ready, notify cashier; printer fallback.

\- Cash drawer: open with float, cash in/out, close with denomination count, expected vs actual, X/Z reports.

\- Dashboard: today's sales, orders, avg ticket, profit estimate, sales by hour, top items, payment mix, open orders, alerts; compare to same day last week.

\- Offline sync (see SYNC RULES).

\## Phase 2 — Back office

\- Inventory: stock items, units \& conversions, locations, recipes per item/variant/modifier with auto-deduction on sale, prep items, low-stock alerts \& reorder levels, stock counts with variance, wastage with reasons, batch/expiry with FIFO, weighted-average costing, food-cost % per item.

\- Vendors: directory, items supplied, terms; purchase orders (send via WhatsApp/email/PDF), GRN with partial receipts and actual prices, vendor bills, payments, payables ageing, price history, returns.

\- Expenses with categories, receipt photo, recurring expenses.

\- Reports: sales by item/category/hour/day/staff/type/payment, discounts \& voids, inventory usage \& variance, purchases. PDF/Excel export.

\## Phase 3 — People \& money

\- HR: staff profiles (photo, CNIC, role, salary type), PIN clock-in/out with optional selfie, breaks, drag-and-drop shift roster, swap requests, leave requests/approvals, attendance calendar, overtime.

\- Payroll: from attendance + overtime + advances + deductions + bonuses + tip share; payslips (PDF/WhatsApp); posts to accounting.

\- Accounting: café default chart of accounts; automatic double-entry journal for every sale, refund, purchase, expense, payroll (user never sees debits/credits unless they open the ledger); cash book, bank book, receivables, payables, daily closing; P\&L, balance sheet, trial balance, cash flow, sales-tax report.

\## Phase 4 — Growth

\- Customers by phone, visit history, favourites, birthdays; loyalty points or stamp card; tiers; gift cards; store credit/tabs with limits; promo codes; receipt-QR feedback; WhatsApp/SMS campaigns by segment.

\- QR table ordering and online ordering page sharing menu \& stock.

\- Menu engineering report (stars/plowhorses/puzzles/dogs), scheduled daily WhatsApp/email summary to owner.

\- LAN hub sync mode; FBR/PRA tax invoice integration hook.



\# SYNC RULES

\- Write locally first (IndexedDB), push via an ordered outbox; server endpoints are idempotent on client UUID.

\- Orders, payments, stock movements, attendance = append-only events. Never update in place; corrections are new events.

\- Offline order numbers use device prefix (T1-0042); sequential tax invoice numbers issued server-side on sync when required.

\- Editable master data (menu, customers): field-level last-write-wins with version history.

\- Stock may go negative offline; flag it, never block a sale.

\- Realtime push over WebSocket + "changes since cursor" pull for catch-up.

\- UI shows a sync pill: Online / Offline · N waiting / Syncing; manager can view and retry the queue.



\# SECURITY \& QUALITY

HTTPS, bcrypt/argon2 hashing, RBAC on every endpoint, tenant isolation, rate limiting, audit log for money/stock/permission changes, daily backups, encrypted sensitive fields. >= 80% unit coverage for billing, tax, stock and sync; Playwright e2e for order → KDS → payment → stock deduction → report. Seed the database with a realistic Rewind café menu (espresso, latte, cappuccino, iced caramel latte, chai, croissant, club sandwich, brownie, cheesecake…) with photos, 3 vendors, 6 staff and 30 days of sample sales.



\# HOW TO WORK

1\. First output: folder structure, Prisma schema for all modules, API route list, and a screen list with routes. Wait for my OK.

2\. Then build one phase at a time, module by module. After each module: run tests, list what was built, and show how to try it.

3\. Write clean, typed, commented code; reusable components; no placeholder "TODO" logic in shipped features.

4\. Every screen must have loading, empty, error and offline states designed in the Rewind style.

