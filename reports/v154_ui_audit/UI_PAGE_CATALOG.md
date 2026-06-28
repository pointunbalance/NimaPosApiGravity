# UI Page Catalog From v1.54

## Purpose

This file distills the `nima-pos v1.54` route map into a reusable page catalog for future Nima sales applications.

Primary sources:

- [App.tsx](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\extracted\App.tsx)
- [Layout.tsx](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\extracted\components\Layout.tsx)
- [app_paths_clean.txt](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\extracted\app_paths_clean.txt)

## Catalog Structure

Each page is tagged by:

- route
- domain
- likely business value
- recommended reuse level
- recommended app modes

Reuse levels:

- `Core`: should exist in most sales apps
- `Optional`: common but not universal
- `Enterprise`: only for large or advanced editions
- `Specialized`: vertical or industry-specific

## 1. Main Operation

| Route | Screen | Reuse | Recommended Modes | Notes |
|---|---|---:|---|---|
| `/` | Dashboard | Core | starter, standard, service, enterprise | Main landing screen |
| `/pos` | POS Terminal | Core | starter, standard, service, enterprise | Core sales screen |
| `/employee-portal` | Employee Portal | Optional | all | Internal user self-service |
| `/delivery` | Delivery Operations | Optional | standard, enterprise, service | Good for delivery-enabled apps |
| `/maintenance` | Maintenance Orders | Specialized | service, enterprise | Service/business vertical |
| `/preventive-maintenance` | Preventive Maintenance | Enterprise | enterprise | Asset/service-heavy businesses |
| `/rentals` | Rentals | Specialized | service, enterprise | Apparel/rental vertical |
| `/studio` | Studio Scheduler | Specialized | service, enterprise | Appointment/studio vertical |
| `/tables` | Table Management | Specialized | standard, enterprise | Restaurant only |
| `/kitchen` | Kitchen Screen | Specialized | standard, enterprise | Restaurant only |
| `/fleet` | Fleet Management | Optional | standard, enterprise | Logistics-enabled operations |
| `/legal` | Legal Documents | Enterprise | enterprise | Admin/legal area |
| `/legal/contracts` | Contract Management | Enterprise | enterprise | Legal workflow screen |

## 2. Sales

| Route | Screen | Reuse | Recommended Modes | Notes |
|---|---|---:|---|---|
| `/orders` | Sales Orders / History | Core | starter, standard, service, enterprise | Essential post-sale tracking |
| `/quotations` | Quotations | Optional | standard, service, enterprise | Very common in B2B/service |
| `/returns` | Returns | Core | standard, enterprise | Important for real POS workflows |
| `/shifts` | Shifts | Core | standard, service, enterprise | Cashier/session control |
| `/b2b-sales` | B2B Sales | Optional | standard, enterprise | Wholesale or account sales |
| `/ecommerce` | Ecommerce Orders | Optional | standard, enterprise | Omnichannel businesses |
| `/van-sales` | Van Sales | Specialized | enterprise | Field sales |
| `/sales-targets` | Sales Targets | Enterprise | enterprise | Performance management |
| `/fulfillment` | Fulfillment | Optional | enterprise | Useful when order prep/dispatch exists |

## 3. Customers, CRM, Loyalty

| Route | Screen | Reuse | Recommended Modes | Notes |
|---|---|---:|---|---|
| `/customers` | Customers | Core | standard, service, enterprise | Essential CRM-lite base |
| `/crm` | CRM Hub | Optional | enterprise | Umbrella CRM area |
| `/crm/leads` | Leads Pipeline | Enterprise | enterprise | Lead/opportunity management |
| `/crm/tickets` | Helpdesk / Tickets | Optional | standard, service, enterprise | Support workflows |
| `/crm/campaigns` | Marketing Campaigns | Enterprise | enterprise | Marketing automation |
| `/customer-portal` | Customer Portal | Enterprise | enterprise | Self-service customer area |
| `/loyalty` | Loyalty | Optional | standard, enterprise | Retail growth feature |
| `/gift-cards` | Gift Cards | Optional | standard, enterprise | Common in retail/service |
| `/subscriptions` | Subscriptions | Optional | service, enterprise | Recurring billing products |
| `/promotions` | Promotions | Optional | standard, enterprise | Discount campaign management |
| `/installments` | Installments | Optional | standard, enterprise | Financing/credit sales |

## 4. Products, Inventory, Supply

| Route | Screen | Reuse | Recommended Modes | Notes |
|---|---|---:|---|---|
| `/products` | Products | Core | all | Required master data |
| `/categories` | Categories | Core | all | Required organization layer |
| `/pricing-rules` | Pricing Rules | Optional | standard, enterprise | Useful for advanced pricing |
| `/currencies` | Currencies | Optional | standard, enterprise | Multi-currency setups |
| `/warehouse` | Warehouse | Optional | enterprise | For formal warehouse operations |
| `/advanced-wms` | Advanced WMS | Enterprise | enterprise | Larger inventory orgs only |
| `/branch-transfers` | Branch Transfers | Optional | enterprise | Multi-branch inventory |
| `/stock-adjustments` | Stock Adjustments | Core | enterprise or standard | Operational necessity |
| `/inventory-count` | Inventory Count | Core | enterprise or standard | Stock audits and cycle counts |
| `/purchases` | Purchases | Core | standard, enterprise | Procurement base |
| `/purchase-orders` | Purchase Orders | Optional | enterprise | More mature procurement |
| `/purchase-requests` | Purchase Requests | Enterprise | enterprise | Internal procurement flow |
| `/rfqs` | RFQs | Enterprise | enterprise | Supplier quotation flow |
| `/suppliers` | Suppliers | Core | standard, enterprise | Procurement master data |
| `/purchases/supplier-evaluation` | Supplier Evaluation | Enterprise | enterprise | Vendor quality/performance |
| `/vendor-portal` | Vendor Portal | Enterprise | enterprise | External supplier experience |
| `/barcodes` | Barcode Printing | Optional | standard, service, enterprise | Very practical module |
| `/sticker-printing` | Sticker Printing | Specialized | service, enterprise | Vertical-specific utility |

## 5. Manufacturing, Production, Advanced Inventory

| Route | Screen | Reuse | Recommended Modes | Notes |
|---|---|---:|---|---|
| `/recipes` | Recipes | Optional | standard, enterprise | Food/service manufacturing |
| `/bom` | Bill of Materials | Optional | standard, enterprise | Product assembly/manufacturing |
| `/work-centers` | Work Centers | Enterprise | standard, enterprise | Production planning layer |
| `/work-orders` | Work Orders | Enterprise | standard, enterprise | Shop floor control |
| `/quality-control` | Quality Control | Optional | standard, enterprise | Strong value in supply/manufacturing |
| `/manufacturing/tqm` | TQM | Enterprise | enterprise | Advanced quality |
| `/manufacturing/plm` | PLM | Enterprise | enterprise | Product lifecycle management |
| `/production-planning` | Production Planning | Enterprise | standard, enterprise | Manufacturing businesses |
| `/inventory/demand-forecasting` | Demand Forecasting | Enterprise | enterprise | AI/analytics planning |

## 6. Projects and Logistics

| Route | Screen | Reuse | Recommended Modes | Notes |
|---|---|---:|---|---|
| `/projects` | Projects | Optional | service, enterprise | Project-based businesses |
| `/tasks` | Tasks | Optional | service, enterprise | Internal execution layer |
| `/events` | Event Management | Specialized | service, enterprise | Event businesses |
| `/timesheets` | Timesheets | Optional | service, enterprise | Labor-based costing |
| `/shipping` | Shipping | Optional | standard, enterprise | Delivery/logistics-heavy businesses |
| `/logistics/import-export` | Import/Export | Enterprise | enterprise | Global supply workflows |

## 7. Finance and HR

| Route | Screen | Reuse | Recommended Modes | Notes |
|---|---|---:|---|---|
| `/expenses` | Expenses | Core | standard, service, enterprise | Common back-office need |
| `/payroll` | Payroll | Optional | standard, service, enterprise | HR-heavy businesses |
| `/employees` | Employees | Optional | standard, enterprise | Admin/HR base |
| `/attendance` | Attendance | Optional | standard, enterprise | Workforce tracking |
| `/leaves` | Leave Management | Optional | standard, enterprise | HR |
| `/loans` | Employee Loans | Optional | standard, enterprise | HR/finance policy feature |
| `/recruitment` | Recruitment | Enterprise | standard, enterprise | HR expansion |
| `/performance` | Performance | Enterprise | standard, enterprise | HR expansion |
| `/training` | Training | Enterprise | standard, enterprise | HR expansion |
| `/org-chart` | Org Chart | Enterprise | standard, enterprise | HR structure |
| `/benefits` | Benefits | Enterprise | standard, enterprise | HR compensation |
| `/disciplinary` | Disciplinary Actions | Enterprise | standard, enterprise | HR governance |
| `/onboarding` | Onboarding | Optional | standard, enterprise | New hire workflows |
| `/capital` | Capital | Enterprise | enterprise | Advanced finance |
| `/hr/commissions` | Commissions | Enterprise | enterprise | Sales payroll |
| `/hr/asset-custody` | Asset Custody | Enterprise | enterprise | Asset handover |
| `/hr/careers-portal` | Careers Portal | Enterprise | enterprise | External recruitment |
| `/hr/lms` | LMS | Enterprise | enterprise | Learning system |

## 8. Accounting

These screens should be treated as an accounting suite, not standard POS defaults.

| Route | Screen | Reuse | Recommended Modes | Notes |
|---|---|---:|---|---|
| `/accounting/coa` | Chart of Accounts | Enterprise | enterprise | Accounting foundation |
| `/accounting/journal` | Journal Entries | Enterprise | enterprise | Core bookkeeping |
| `/accounting/general-ledger` | General Ledger | Enterprise | enterprise | Core bookkeeping |
| `/accounting/checks` | Check Management | Enterprise | enterprise | Region/business specific |
| `/accounting/petty-cash` | Petty Cash | Enterprise | enterprise | Common finance ops |
| `/accounting/bank-reconciliation` | Bank Reconciliation | Enterprise | enterprise | Finance operations |
| `/accounting/assets` | Fixed Assets | Enterprise | enterprise | Asset accounting |
| `/accounting/budgeting` | Budgeting | Enterprise | enterprise | Planning/control |
| `/accounting/cost-centers` | Cost Centers | Enterprise | enterprise | Cost accounting |
| `/accounting/aging` | Aging Reports | Enterprise | enterprise | Receivable/payable analytics |
| `/accounting/tax` | Tax / VAT | Enterprise | enterprise | Compliance |
| `/accounting/e-invoicing` | E-Invoicing | Enterprise | enterprise | Jurisdictional compliance |
| `/accounting/closing` | Fiscal Closing | Enterprise | enterprise | Financial period close |
| `/accounting/reports` | Financial Reports | Enterprise | enterprise | Executive finance view |
| `/accounting/treasury` | Treasury | Enterprise | enterprise | Liquidity/cash management |

## 9. Admin and System

| Route | Screen | Reuse | Recommended Modes | Notes |
|---|---|---:|---|---|
| `/reports` | Reports | Core | standard, service, enterprise | Core management visibility |
| `/custom-reports` | Custom Reports | Enterprise | enterprise | Ad hoc reporting |
| `/reports/bi-dashboards` | BI Dashboards | Enterprise | enterprise | Executive analytics |
| `/market-monitor` | Market Monitor | Enterprise | enterprise | Strategic analytics |
| `/approval-workflows` | Approval Workflows | Enterprise | enterprise | Governance |
| `/dms` | Document Management | Enterprise | enterprise | Compliance/document-heavy orgs |
| `/internal-communication` | Internal Communication | Enterprise | enterprise | Collaboration |
| `/audit-logs` | Audit Logs | Enterprise | enterprise | Security/compliance |
| `/role-management` | Role Management | Enterprise | enterprise | Administration |
| `/system-backups` | System Backups | Enterprise | enterprise | Operations/admin |
| `/admin/risk-compliance` | Risk & Compliance | Enterprise | enterprise | Governance |
| `/users` | Users | Core for admin | enterprise | User admin |
| `/branches` | Branches | Optional | enterprise | Multi-branch |
| `/admin/pos-terminals` | POS Terminals | Enterprise | enterprise | Device management |
| `/logbook` | Operations Logbook | Optional | enterprise | Traceability |
| `/settings` | Settings | Core | all | Configuration |
| `/about` | About | Optional | all | Product/system info |
| `/property-management` | Property Management | Specialized | enterprise | Vertical-specific |
| `/website-cms` | Website CMS | Optional | standard, service, enterprise | Public web channel |

## 10. Standalone / External

| Route | Screen | Reuse | Recommended Modes | Notes |
|---|---|---:|---|---|
| `/customer-display` | Customer Display | Optional | retail/pos | Secondary POS-facing screen |
| `/website/*` | Public Website | Optional | standard, service, enterprise | Public-facing web presence |

## Recommended Baseline Templates

### Small Retail POS

- `/`
- `/pos`
- `/orders`
- `/products`
- `/categories`
- `/customers`
- `/returns`
- `/expenses`
- `/reports`
- `/settings`

### Standard Multi-Module Retail

Add:

- `/suppliers`
- `/purchases`
- `/shifts`
- `/gift-cards`
- `/promotions`
- `/barcodes`
- `/inventory-count`

### Service Business

Prefer:

- `/`
- `/pos`
- `/customers`
- `/quotations`
- `/orders`
- `/subscriptions`
- `/tasks`
- `/projects`
- `/employee-portal`
- `/maintenance`

### Enterprise Edition

Use the full modular shell, but only enable advanced accounting, BI, HR, and compliance when the business truly needs them.
