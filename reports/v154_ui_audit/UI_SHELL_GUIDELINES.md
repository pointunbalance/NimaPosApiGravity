# UI Shell Guidelines Derived From v1.54

## Purpose

This document captures the shell/navigation rules from the v1.54 reference so future Nima apps share a consistent interface architecture.

Primary source:

- [Layout.tsx](E:\NimaTechVibeCoding\NimaPosApiGravity\reports\v154_ui_audit\extracted\components\Layout.tsx)

## 1. Shell Structure

The shell is a three-part frame:

1. Left sidebar
2. Top header
3. Main content outlet

This should remain the default shell for desktop business apps.

## 2. Sidebar Rules

### Sidebar must contain

- brand block
- current app mode badge
- grouped navigation
- collapsible group sections
- current user panel

### Sidebar group model

Navigation is grouped by business domain, not by technical module.

Recommended top-level groups from v1.54:

- Main Operation
- Sales
- Customers
- Products
- Inventory / Supply
- Projects
- Logistics
- Finance / HR
- Accounting
- Admin / System

### Sidebar design rules

- use icons consistently for every route
- keep labels short and business-facing
- hide empty groups automatically
- allow groups to collapse
- highlight the active route strongly
- prefer domain grouping over alphabetic grouping

## 3. Top Header Rules

The header in v1.54 is not just decoration; it provides operational context.

Recommended header slots:

- current date
- available page count or context counters
- theme toggle
- notification center
- quick status chips

Optional additions for future apps:

- active branch
- active cashier/user
- shift status
- search/global command

## 4. Navigation Visibility Model

This is one of the strongest patterns in v1.54 and should become a standard.

Each nav item can be filtered by:

- user role
- explicit permissions
- business type
- app mode
- feature condition
- hidden pages setting

### Practical rules

- `starter` mode should show only the essential screens
- `standard` should expand operations and reporting
- `service` should prioritize appointments, subscriptions, delivery, projects, service workflows
- `enterprise` should unlock accounting, BI, governance, advanced supply, portals

## 5. Product Mode Packaging

Use mode-based packaging as a first-class product design rule.

### Recommended modes

- `starter`
  - small business
  - fast onboarding
  - minimum navigation
- `standard`
  - retail/POS with purchasing and reporting
- `service`
  - appointments, rentals, maintenance, subscriptions, projects
- `enterprise`
  - advanced finance, HR, BI, governance, portals, logistics

### Implementation rule

Do not clone the app shell per product.
Use one shell and filter modules by mode.

## 6. Business-Type Conditionality

v1.54 also shows a useful second filter: business type.

Examples:

- restaurant
  - tables
  - kitchen
- service
  - maintenance
  - studio
  - rentals
- retail
  - barcode printing
  - warehouse
  - gift cards

### Guideline

Use business type to expose vertical-specific screens without forking the whole app.

## 7. Notification Model

The shell includes notification handling for operational awareness.

Recommended notification sources:

- low stock
- expiring contracts
- overdue tasks
- open tickets
- failed sync/backup

### UI rules

- keep notifications in a dropdown, not a full page by default
- use color-coded notification types
- include timestamp and short action message
- keep severity visually obvious

## 8. Page Count and Discoverability

The shell computes total visible pages. This is useful for admin awareness, but more importantly it implies the shell knows the current app footprint.

Recommended extension:

- show enabled modules in settings
- allow admins to hide screens intentionally
- generate role-based navigation previews

## 9. Shell Styling Direction

Based on `Layout.tsx`, the visual direction is:

- dark high-contrast sidebar
- bright content area
- soft-glass/light surfaces in header and overlays
- rounded corners
- icon-rich navigation
- subtle gradients and glow on brand block

### Preserve

- clear contrast between navigation shell and work area
- premium, intentional business UI feel
- not overly flat
- not generic admin bootstrap look

### Avoid

- making every screen full-width and visually identical
- using ungrouped sidebars
- exposing enterprise navigation without filtering

## 10. Recommended Shell Standard For Nima References

Every future generated app should answer these shell questions before implementation:

1. What is the app mode?
2. What is the business type?
3. Which modules are enabled?
4. Which roles exist?
5. Which screens are hidden or visible?

If these are known, the sidebar and route structure should be derived automatically.

## 11. Minimal Shell Blueprint

For new apps, start with:

- Sidebar groups:
  - Main
  - Sales
  - Products
  - Customers
  - Reports
  - Admin
- Header:
  - date
  - notifications
  - branch/user chip
  - theme toggle
- Content:
  - page title
  - actions row
  - outlet

Then scale up by mode rather than redesigning from zero.
