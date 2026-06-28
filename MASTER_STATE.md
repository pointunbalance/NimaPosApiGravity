# NimaPOS API - MASTER STATE (Final Acheivement)

## 📌 Project Overview

- **Name:** NimaPOS REST API (Enterprise Edition)
- **Version:** v2.32.0 (Egyptian Localization)
- **Status:** REST API Mastery (Phases 1-31 Complete)
- **Parity Status:** 100% ERP Parity vs Odoo/SAP Core + Regional Data.
- **Last Integrity Check:** 2026-03-01 12:45 (Antigravity Genie)
- **Pattern:** FastAPI + SQLite + JWT (Strict Repository → Router separation)
- **GUI Framework Compatibility:** Optimized for NimaPOS React Frontend v1.15
- **API Prefix:** `/api/v1`
- **DB:** SQLite (WAL Mode) at `data/pos_api.db` (25+ Tables)
- **Security:** JWT Auth, PBKDF2 Hashing, Internal Verification Layers
- **Theming:** central `.qss` logic (for GUI) / JSON-standard (for API)

## Features Catalog

### ✅ Phase 1: Core Essentials

- **Auth:** Login (PIN), JWT Authentication, Roles (Owner/Admin/Cashier)
- **Catalog:** Products, Categories, Barcode/Sticker Printing Templates
- **Sales:** POS Invoices (Dine-in/Takeaway), Quotations, Returns
- **People:** CRM (Customers) & SRM (Suppliers)
- **Inventory:** Basic stock adjustments and movements

### ✅ Phase 30: Webhooks & Integration Hub

Real-time event bus and dispatching.

### ✅ Phase 31: Egyptian Geography Integration

Seeding of 27 governorates and hierarchical city management.

### ✅ Phase 2: Advanced Operations

- **Orders:** Kitchen Display (KDS), Fulfillment Tracking, Partial Refunds
- **Finance:** Financial Center (Capital), Activity Logbook
- **HR:** Payroll Processing with accounting automation
- **Advanced:** Studio Scheduler, Camera Management, Waitlist

### ✅ Phase 3: Operational Parity (The Final 7)

- **Production:** Recipes & BOM (Automatic Ingredient Deduction)
- **Procurement:** Purchase Orders Workflow
- **Logistics:** Delivery Management & Driver Settlements
- **Maintenance:** Repair/Maintenance Order Lifecycle
- **Warehouse:** Inter-branch Transfers & Systematic Inventory Counts
- **Human Resources:** Attendance Tracking (Check-in/Out)

### ✅ Phase 4: Full Accounting

- **Core Ledger:** Chart of Accounts, Journal Entries, GL Reports
- **Banking:** Bank Check Management & Reconciliations
- **Assets:** Fixed Assets & Depreciation Logic
- **Reporting:** Aging Reports (Receivables/Payables), Tax/VAT Reports, Financial Statements

### ✅ Phase 5: Final Polish (100% Completed)

- **Loyalty:** Advanced Tiers (Gold/Silver/Bronze) with multipliers, Centralized Points Configuration.
- **HR:** Employee Document Repository (Contracts, ID Cards, Certifications metadata).
- **Studio Pro:** Advanced Conflict Checking, Portfolio Showcase, Team Assignment, Equipment Lifecycle (Status/Purchase), Dashboard Analytics, and Contract/Branding Settings.

### ✅ Phase 6: Retail & Financial Integrity (PRO Version)

- **Retail Ready:** Product variants (Color, Size, Material), SKU tracking, and specialized search.
- **Financial Persistence:** Automated return stock restoration, persistent invoice `refunded_amount` tracking.
- **Advanced Intelligence:** COGS calculation, Gross Profit, and Margin analysis via `/reports/profit-metrics`.

### ✅ Phase 8: Professional System Features

- **Multi-Level Pricing:** Support for 4-tier pricing (Wholesale, Half-Wholesale, Other, Consumer).
- **Supplier Returns:** Dedicated module for procurement returns with recursive stock deduction.
- **Smart Bundles:** Recursive component deduction for "Offer/Combo" products.
- **Master Data:** Centralized Return Reasons for standardized auditing.

### ✅ Phase 9: Accounting Excellence & Geographic Intelligence

- **Hierarchical Geography:** Master records for Governorates, Cities, and Sales Zones for granular location analytics.
- **Settlement Vouchers:** Professional "Discount Earned" and "Discount Allowed" vouchers for zeroing out fractional debts.
- **Financial Opening Balances:** Dedicated logic to initialize customer and supplier balances without fake invoices.
- **Procurement Bonus Logic:** Support for bonus quantities in purchases to increase stock without increasing payable debt.

### ✅ Phase 10: Enterprise Security & Financial Clearing

- **Granular Permissions:** 6-tier module-based access control (None, View, Add, Edit, Manage, Full).
- **Operational Guards:** Invoice Time-Lock (Max Edit Days) and Price Protection (Lock Price Changes).
- **Financial Clearing:** Sales/Returns clearing logic to settle invoices with return credits.
- **Audit Logs:** Enhanced tracking for permission violations and price overrides.

### ✅ Phase 11: Professional Analytics & Unified Statements

- **Unified Statement of Account:** Chronological ledger (كشف حساب موحد) for customers and suppliers aggregating all transactions.
- **Advanced Sales Reporting:** Deep revenue analytics by category and performance.
- **Preventive Validation:** Toggable Stock Lock (`prevent_negative_stock`) to enforce physical inventory integrity.

### ✅ Phase 13: Elite Enterprise Parity (God Mode - v1.40.0)

- **Production Pro**: Advanced batch manufacturing with wastage % calculation and movement history.
- **Arap Pro**: Financial Aging (0-60+ days) and PO/GRN matching variance reporting.
- **Commerce Pro**: Universal Webhook Dead Letter Queue (DLQ) and HMAC security infrastructure.

### ✅ Phase 14: v2.0 — Quality & New Modules

- **Security:** Persistent JWT_SECRET (survives restarts).
- **Held Orders:** Save/restore/delete held carts for cashiers (`/held-orders`).
- **Customer Payments:** Dedicated debt payment tracking and balance summaries (`/customer-payments`).
- **Global Search:** Unified cross-entity search (`/search`).
- **Enhanced Dashboard:** 15+ KPIs including expenses, profit, pending orders, maintenance, overdue installments, payment splits, top products, branch comparison.
- **Code Quality:** Unified `ApiResponse` in `orders.py`, supplier validation in `purchases.py`, dead code cleanup.

## UI Map (React Page → API Router)

| Frontend Page | API Endpoint Group | Status |
| :--- | :--- | :--- |
| `POS.tsx` | `/invoices`, `/orders` | ✅ Ready |
| `Customers.tsx` | `/customers` | ✅ Ready |
| `Suppliers.tsx` | `/suppliers` | ✅ Ready |
| `Products.tsx` | `/products` | ✅ Ready |
| `Payroll.tsx` | `/payroll` | ✅ Ready |
| `Attendance.tsx` | `/attendance` | ✅ Ready |
| `Maintainance.tsx` | `/maintenance` | ✅ Ready |
| `Recipes.tsx` | `/recipes` | ✅ Ready |
| `PurchaseOrders.tsx` | `/purchase-orders` | ✅ Ready |
| `BranchTransfers.tsx` | `/branch-transfers` | ✅ Ready |
| `InventoryCount.tsx` | `/inventory-count` | ✅ Ready |
| `Delivery.tsx` | `/delivery` | ✅ Ready |
| `Capital.tsx` | `/capital` | ✅ Ready |
| `Dashboard.tsx` | `/dashboard` | ✅ Ready |
| `Accounts/GL` | `/accounting` | ✅ Ready |
| `Loyalty Tiers` | `/advanced/loyalty/tiers` | ✅ Ready |
| `Employee Files` | `/users/files` | ✅ Ready |
| `Studio Pro` | `/studio/team`, `/studio/portfolio` | ✅ Ready |
| `Statements` | `/statements` | ✅ Ready |
| `SupplierReturns` | `/supplier-returns` | ✅ Ready |
| `Geography` | `/geography` | ✅ Ready |
| `Vouchers` | `/vouchers` | ✅ Ready |
| `Permissions` | `/permissions` | ✅ Ready |
| `Clearing` | `/credit-clearing` | ✅ Ready |
| `Master Data` | `/master-data` | ✅ Ready |
| `Safes/Transfers` | `/safes` | ✅ Ready |
| `Hospitality` | `/hospitality` | ✅ Ready |
| `Rentals Pro` | `/rentals-pro` | ✅ Ready |
| `Online Engine` | `/online` | ✅ Ready |
| `Notifications` | `/notifications` | ✅ Ready |
| `Held Orders` | `/held-orders` | ✅ Ready (v2.0) |
| `Customer Payments` | `/customer-payments` | ✅ Ready (v2.0) |
| `Global Search` | `/search` | ✅ Ready (v2.0) |
| `Subscriptions` | `/subscriptions` | ✅ Ready (v2.29) |
| `MRP & Planning` | `/mrp` | ✅ Ready (v2.29) |
| `Omnichannel` | `/omnichannel` | ✅ Ready (v2.29) |
| `Treasury` | `/treasury` | ✅ Ready (v2.29) |
| `LMS / Wiki` | `/lms` | ✅ Ready (v2.29) |

### ✅ Phase 15: Absolute Parity (v1.23)

- **Services Management:** Professional billing for non-inventory labor (Install, Shipping).
- **Inventory Intelligence:** Stagnant product reports and full movement ledgers.
- **Financial Integrity:** Opening balances and enhanced daily safe auditing (Returns/Transfers).
- **Service Recovery:** Invoice unblocking utility for system-level resilience.

## Project Milestones

- **v1.26.0 (God Mode):** Achieved absolute functional parity. Added Multi-Unit stock logic, Customer Exchange (Makassa), ZATCA QR codes, and Invoice Unlocking.
- **v1.27.0 (Maintenance God Mode):** Integrated advanced maintenance features from NimaMaintenance Desktop.
- **v1.35.0 (Platinum Plus Expansion):** Ported final high-value verticals (Hospitality, KDS, Rentals Pro, Online Commerce, Unified Notifications) from reference projects.
- **v2.0.0 (Quality & Modules):** Persistent JWT_SECRET, Held Orders, Customer Payments, Global Search, Enhanced Dashboard (15+ KPIs), unified response format.
- **v2.4.1 (Audit Remediation):** Fixed 17 logical/accounting bugs including non-atomic checkout, void-without-reversal, and aging report inaccuracies.

- **v2.16.0 (Advanced CRM Module):** Introduced dynamic segmentation, tiering, and interaction logic.
- **v2.17.0 (System Resiliency):** Enforced SQLite WAL hooks, synchronous tuning, monotonic TimeKeeping, and background Auto-Backups.
- **v2.18.0 (ZATCA Phase 2):** Cryptographic Chaining natively injected with UUIDs, Base64 TLV QRs, and canonical UBL hashing.
- **v2.19.0 (Project Costing & WBS):** Added atomic inventory allocation for raw project materials and native timesheet tracking for calculating actual margins against budget constraints.
- **v2.20.0 (HR Recruitment):** Integrated candidate tracking capabilities natively mapped sequential candidate pipelines.
- **v2.21.0 (Nima UI Kit Base):** Decoupled the visual architecture into a standalone PyQt6 module `nima_ui_kit` featuring buttons, cards, and inputs.
- **v2.22.0 (UI Kit Expansion):** Added Tabs, Sidebars, Toggles, and KPI cards to the frontend UI capability matrix.
- **v2.23.0 (UI Kit Templates):** Built logic-less screen shells (`NimaPosScreen`, `NimaDashboardScreen`, `NimaDataGridScreen`) inside `nima_ui_kit/screens/`.
- **v2.25.0 (Device Activation System):** Implemented hardware fingerprinting and HMAC signing for activation.
- **v2.27.0 (API Parity God Mode):** Achieved 100% functional parity across all modules. Implemented Reverse Journal Entry, Inventory Aging, Bulk Loyalty adjustments, and unified Statement of Account logic for all voucher types.
- **v2.26.0 (Premium Documentation):** Complete UI overhaul of Swagger/Scalar with bilingual support, custom CSS, and advanced search.

### ✅ Phase 17: God Mode API Parity (v2.27.0)

- **Accounting:** Reverse/Void Journal Entry logic with atomic contra-entries.
- **HR & Attendance:** Automated check-out logic with hour/overtime calculation.
- **Analytics:** Inventory Aging reports (0-90+ days) and enhanced Tax Summaries.
- **CRM/Marketing:** Bulk points adjustments for targeted loyalty campaigns.
- **Ledger Integrity:** Comprehensive Statement of Account covering Payments, Discounts, and Opening Balances.

### ✅ Phase 18: Enterprise POS & Accounting Powerhouse (v2.28.0)

- **POS Pro**: Split Payments support (Multi-method) with per-item VAT/Discount resolution.
- **Shift Pro**: Advanced Shift Reconciliation with `expected_cash` logic (Sales - Expenses - Returns).
- **Financial Pro**: Bank Transaction Matching (Reconciliation) and Automated VAT Period Closing.
- **Audit Pro**: Integrated `OpsLog` audit trailing for all manual/sensitive financial edits.

### ✅ Phase 19: Strategic Enterprise Expansion - Tier 2 (v2.29.0)

- **Phase 21: Subscription & Recurring Billing**: Professional recurring revenue management with automated next-invoice date calculation.
- **Phase 22: MRP & Demand Forecasting**: Proactive inventory intelligence using sales velocity (30-day window) and safety stock reorder thresholds.
- **Phase 23: Omnichannel Orchestrator**: Multi-platform stock synchronization engine (Shopify, Amazon) with audit-ready sync logs.
- **Phase 24: Treasury & Liquidity**: 30-day multi-source cash flow projections integrating Subscriptions, Checks, Payroll, and manual forecasts.
- **Phase 25: LMS & Internal Wiki**: Standard Operating Procedures (SOP) repository and employee training completion tracking.

### Last Known State

- **Version:** v2.31.0 (Tier 3 Achievement)
- **Status:** Phase 1-30 Complete.
- **Recent Changes:** Implemented Promotions, Wallets, Hardware Integration, Customer Portal, and Webhooks.
- **Current State**: The project is now a **Universal Enterprise Nexus**, providing all core engine logic for Retail, Hospitality, Industry, and E-commerce.

## 📄 Documentation & References

- **UI Reference Guide:** [docs/UI_REFERENCE.md](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/docs/UI_REFERENCE.md)
- **Local Reference Archive (v1.15):** [references/nima-pos-v1.15/](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/references/nima-pos-v1.15/)
- **Maintenance Reference:** [references/nima-maintenance-ref/](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/references/nima-maintenance-ref/)
- **Archive File:** [nima-pos v1.15.zip](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/references/nima-pos-v1.15/nima-pos%20v1.15.zip)
- **Archive Index:** [references/nima-pos-v1.15/ARCHIVE_INDEX.md](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/references/nima-pos-v1.15/ARCHIVE_INDEX.md)
- **Design Assets:** [docs/assets/](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/docs/assets/) (Includes Swagger and UI screenshots)
- **Parity Walkthrough:** [walkthroughs/FINAL_PARITY.md](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/walkthroughs/FINAL_PARITY.md)
- **Studio Pro Integration:** [walkthroughs/STUDIO_PRO_INTEGRATION.md](file:///e:/NimaTechVibeCoding/NimaPosApiGravity/walkthroughs/STUDIO_PRO_INTEGRATION.md)

## 🛠️ Mandatory Structure

- [x] `docs/`
- [x] `reports/`
- [x] `walkthroughs/`
- [x] `backups/`
- [x] `Source_Hub/`
- [x] `references/`

## 📦 Final Backups (Source Hub)

- **v2.31.0 Tier 3 Achievement:** `Source_Hub\v2.31.0_FinalTier3_Achievement_20260301.zip`
- **v2.30.0 Tier 3 Stage 1:** `Source_Hub\v2.30.0_Promotions_Wallets_20260301.zip`
- **Latest v2.29.0 Enterprise Pass:** `Source_Hub\v2.29.0_EnterpriseExpansionTier2_20260301.zip`
- **v2.4.2 Verification Archive:** `Source_Hub\V2.4.2_PostAuditRemediation_20260228.zip`
- **v2.4.1 Remediation Archive:** `Source_Hub\V2.4.1_AuditRemediation_PreFix_20260228.zip`
- **Latest God Mode Base:** `Source_Hub\V1.40.0_EliteEnterprise_GodMode_20260228.zip`
