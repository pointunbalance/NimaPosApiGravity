# UI Module Blueprints For Future Nima Apps

## Purpose

This file converts the v1.54 reference into practical screen blueprints that future generated Nima apps can inherit.

## Blueprint 1: Starter POS

### Goal

Fastest deployable retail sales app with the minimum useful screen set.

### Modules

- dashboard
- pos
- orders
- products
- categories
- customers
- returns
- expenses
- reports
- settings

### Navigation groups

- Main
- Sales
- Products
- Customers
- Admin

### UI characteristics

- smallest sidebar
- minimal configuration burden
- fast cashier workflow
- reports kept lightweight

## Blueprint 2: Standard Retail

### Goal

General-purpose retail or store management app.

### Modules

- everything in Starter
- suppliers
- purchases
- shifts
- gift cards
- promotions
- barcode printing
- stock adjustments
- inventory count

### Best for

- supermarkets
- fashion stores
- electronics shops
- multi-counter retail

### Design additions

- more inventory-focused views
- operational KPI blocks
- back-office purchasing screens

## Blueprint 3: Service Business

### Goal

A sales app for service-led businesses rather than pure item retail.

### Modules

- dashboard
- customers
- quotations
- orders
- subscriptions
- tasks
- projects
- employee portal
- delivery
- maintenance or bookings

### Optional vertical add-ons

- rentals
- studio scheduling
- appointments
- preventive maintenance

### Design emphasis

- timeline and schedule surfaces
- customer/project context
- quote-to-order flow
- recurring service handling

## Blueprint 4: Restaurant / Hospitality

### Goal

Restaurant-ready POS variant.

### Modules

- dashboard
- pos
- tables
- kitchen
- delivery
- orders
- customers
- shifts
- products
- categories
- reports

### Design emphasis

- fast state visibility
- board/ticket workflows
- low-friction service interactions
- table state and kitchen queue clarity

## Blueprint 5: Multi-Branch Retail

### Goal

Retail app for operators with more than one branch or warehouse.

### Modules

- standard retail set
- branches
- branch transfers
- warehouse
- purchase orders
- inventory count
- users
- role management

### Design emphasis

- branch switch context
- inventory visibility by location
- transfer and count workflows
- stricter admin navigation

## Blueprint 6: Enterprise Commerce

### Goal

Full enterprise suite where sales is part of a larger business platform.

### Modules

- standard retail set
- accounting suite
- HR suite
- BI dashboards
- approval workflows
- audit logs
- backups
- advanced WMS
- projects
- logistics
- portals

### Design emphasis

- domain grouping
- role-based complexity management
- compliance visibility
- modular enable/disable behavior

## Blueprint 7: Accounting-Enabled Commerce

### Goal

Sales system with serious finance depth.

### Modules

- dashboard
- sales and purchase core
- expenses
- currencies
- accounting/coa
- accounting/journal
- accounting/general-ledger
- accounting/reports
- accounting/tax
- accounting/petty-cash
- accounting/bank-reconciliation

### Design emphasis

- denser tables
- precise filters
- export and print actions
- strong traceability from operations to finance

## Blueprint 8: CRM-Heavy Sales

### Goal

Sales organization where customer pipeline and service matter as much as checkout.

### Modules

- customers
- crm
- crm/leads
- crm/tickets
- crm/campaigns
- quotations
- subscriptions
- loyalty
- promotions
- reports

### Design emphasis

- customer profile depth
- lead/ticket pipelines
- lifecycle marketing
- account-centric flows

## Feature Gating Rules

### Safe defaults for most apps

Enable by default:

- dashboard
- pos or orders
- products
- categories
- customers
- reports
- settings

### Enable only when needed

- accounting suite
- BI dashboards
- portals
- HR suite
- advanced WMS
- manufacturing
- legal/compliance
- market monitor

## Recommended Build Strategy

When creating a new sales app from the Nima source:

1. Pick a blueprint first
2. Pick mode second
3. Add vertical-specific pages third
4. Keep shell and page patterns shared

This keeps the product family unified while still allowing specialization.

## Final Rule

Do not start future apps by exposing every screen from v1.54.

Start from one blueprint, then expand intentionally.
